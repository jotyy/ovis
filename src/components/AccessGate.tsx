import "./AccessGate.css";

import { type FormEvent, useEffect, useRef, useState } from "react";

import { ApiError, authenticate, pairDevice } from "../lib/api.ts";
import { deviceLabel } from "../lib/phone.ts";
import type { AccessRefusal } from "../../shared/protocol.ts";
import { ChevronDown } from "../lib/icons.ts";
import { useT } from "../lib/i18n.ts";
import { changePc, inNativeApp } from "../lib/nativeApp.ts";
import { userErrorMessage, type UserError } from "../lib/userError.ts";
import { Alert, AlertDescription, Button, Card, CardContent, Collapsible, CollapsibleContent, CollapsibleTrigger, Field, Input } from "./ui/index.ts";


export interface AccessGateProps {
  /** why the server refused this browser, when it said */
  reason: AccessRefusal | null;
  /** the code a scanned QR code brought along: submitted at once */
  initialCode: string;
  /** Fires once the server set a cookie: the shell can mount, and every later fetch and the WebSocket carry it. */
  onUnlocked: () => void;
}

/**
 * Sign-in screen rendered instead of the shell while the server does not know this
 * browser. Pairing is the usual way in: a six-digit code the owner started on the PC
 * (Settings → Devices), typed once, or carried by the QR code's address. The shared
 * token stays as the other way. Nothing is stored here: the server answers with an
 * HttpOnly cookie either way.
 */
export function AccessGate({ reason, initialCode, onUnlocked }: AccessGateProps) {
  const t = useT();
  const codeRef = useRef<HTMLInputElement | null>(null);
  const tokenRef = useRef<HTMLInputElement | null>(null);
  const [code, setCode] = useState(initialCode);
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState<"code" | "token" | null>(null);
  const [error, setError] = useState<UserError | null>(null);
  const [codeShort, setCodeShort] = useState(false);
  const scanned = useRef(code.length === 6);

  const pair = async (value: string): Promise<void> => {
    if (submitting) return;
    setSubmitting("code");
    setError(null);
    try {
      await pairDevice(value, deviceLabel(navigator.userAgent, navigator.maxTouchPoints ?? 0));
      onUnlocked();
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? { message: t("That code is wrong, used up or expired. Start a new pairing on the PC."), detail: null } : userErrorMessage(err));
      setSubmitting(null);
      codeRef.current?.select();
    }
  };

  // a scanned QR code brings the code along: no typing on the phone
  useEffect(() => { if (scanned.current) { scanned.current = false; void pair(code); } }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submitCode = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (code.length !== 6) { setCodeShort(true); codeRef.current?.focus(); return; }
    void pair(code);
  };

  const submitToken = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (submitting) return;
    if (token === "") { tokenRef.current?.focus(); return; }
    setSubmitting("token");
    setError(null);
    try {
      await authenticate(token);
      onUnlocked();
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? { message: t("Token does not match."), detail: null } : userErrorMessage(err));
      setSubmitting(null);
      tokenRef.current?.select();
    }
  };

  return (
    <main className="access-gate-screen">
      {/* one card centred on the base surface, its column one sidebar wide, so the field and the
          button sit at a width the rest of the UI already uses; nothing moves but on a state change */}
      <Card className="access-gate w-[min(100%,calc(var(--sidebar-w)+2*var(--space-6)))] bg-elevated" data-testid="token-gate">
        <CardContent className="gap-4 p-6">
          <div className="flex flex-col gap-1">
            <img src="/icons/icon-192.png?v=sheep1" alt="" width="44" height="44" className="mb-3 block size-11" />
            <h1 id="access-gate-title" className="m-0 text-xl leading-tight font-semibold tracking-[var(--tracking-tight)] text-strong text-engraved">
              Ovis
            </h1>
            {reason === "other_user" && (
              <Alert tone="notice" role="status" className="mt-2"><AlertDescription className="text-text">{t("Tailscale says this device belongs to someone other than this PC's owner. The owner can still let it in with a pairing code.")}</AlertDescription></Alert>
            )}
            <p className="m-0 text-md text-dim">
              {t(reason === "token_required" ? "This server requires an access token or a pairing code." : "Pair this device with a code from the PC: Settings → Devices there, or the pair command in its terminal.")}
            </p>
          </div>
          <form aria-labelledby="access-gate-title" className="flex flex-col gap-3" onSubmit={submitCode}>
            <Field label={t("Pairing code")} htmlFor="access-gate-code">
              {/* the six digits: wide, spaced, in the display cut, no autocomplete look */}
              <Input
                ref={codeRef}
                id="access-gate-code"
                className="h-12 text-center font-display text-xl tracking-[0.25em] coarse:h-touch"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={7}
                placeholder="000 000"
                autoFocus
                aria-invalid={codeShort || (error !== null && submitting !== "token")}
                aria-describedby={codeShort ? "access-gate-code-error" : error !== null ? "access-gate-error" : undefined}
                value={code}
                onChange={(event) => { setCodeShort(false); setCode(event.target.value.replace(/\D/g, "").slice(0, 6)); }}
              />
            </Field>
            {codeShort && <Alert tone="danger" id="access-gate-code-error"><AlertDescription className="text-danger-text">{t("Enter all 6 digits of the pairing code.")}</AlertDescription></Alert>}
            <Button type="submit" variant="accent" size="md" className="w-full coarse:h-touch" disabled={submitting !== null}>
              {t(submitting === "code" ? "Pairing…" : "Pair this device")}
            </Button>
          </form>
          <Collapsible className="flex flex-col gap-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="group/alt -mx-2 justify-start self-start text-dim hover:text-text">
                <ChevronDown aria-hidden="true" className="transition-transform duration-150 ease-in-out group-data-[state=open]/alt:rotate-180" />
                {t("Have an access token instead?")}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <form className="flex flex-col gap-3" onSubmit={(event) => void submitToken(event)}>
                <Field label={t("Access token")} htmlFor="access-gate-token">
                  <Input
                    ref={tokenRef}
                    id="access-gate-token"
                    className="coarse:h-touch"
                    type="password"
                    name="token"
                    autoComplete="current-password"
                    inputMode="text"
                    value={token}
                    onChange={(event) => setToken(event.target.value)}
                  />
                </Field>
                <Button type="submit" variant="accent" size="md" className="w-full coarse:h-touch" disabled={submitting !== null}>
                  {t(submitting === "token" ? "Unlocking…" : "Unlock")}
                </Button>
              </form>
            </CollapsibleContent>
          </Collapsible>
          {error !== null && (
            <Alert tone="danger" id="access-gate-error" className="[overflow-wrap:anywhere]"><AlertDescription className="text-danger-text">{error.message}{error.detail !== null && <><br /><code className="font-mono text-xs">{error.detail}</code></>}</AlertDescription></Alert>
          )}
          {/* in the iOS app (app/) this page is all there is: the way back to its list of PCs */}
          {inNativeApp() && (
            <p className="m-0"><Button variant="field" size="sm" onClick={() => void changePc()}>{t("Change PC")}</Button></p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
