import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Network, SquareTerminal } from "../lib/icons.ts";
import type { CLIProxyStatus } from "../../shared/protocol.ts";
import type { UsageLoginProvider } from "../../shared/usage-login.ts";
import { fetchUsageLoginProviders } from "../lib/api.ts";
import { useT } from "../lib/i18n.ts";
import { useMediaQuery } from "../lib/useMediaQuery.ts";
import { SHEET_QUERY } from "../lib/sheets.ts";
import { PROVIDER_MARK, PROVIDER_NAME } from "../lib/usage.ts";
import { AgentMark } from "./AgentMark.tsx";
import { CLIProxyAccountLogin } from "./CLIProxyLogin.tsx";
import { UsageHubConnect } from "./UsageHubConnect.tsx";
import { UsageLocalLogin } from "./UsageLocalLogin.tsx";
import { Button, Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, type ButtonProps } from "./ui/index.ts";
import "./UsageAccountDialog.css";

type Step = { readonly kind: "provider" } | { readonly kind: "hub"; readonly returnTo: UsageLoginProvider | null }
  | { readonly kind: "account"; readonly provider: UsageLoginProvider; readonly method: "choose" | "local" | "hub" };

/** One way in, as a card: a mark, its name and a sentence (UsageAccountDialog, CLIProxyLogin). */
export function AccountChoice({ icon, title, description, className, ...props }: ButtonProps & { icon: ReactNode; title: ReactNode; description?: ReactNode }) {
  return (
    <Button variant="field" size="bare" className={`account-choice h-auto min-h-touch w-full justify-start gap-3 p-4 text-left whitespace-normal ${className ?? ""}`} {...props}>
      <span className="flex shrink-0 items-center justify-center text-dim [&_svg]:size-6">{icon}</span>
      <span className="flex min-w-0 flex-col gap-0.5"><strong className="text-sm font-medium text-strong">{title}</strong>{description && <span className="text-sm font-regular text-dim">{description}</span>}</span>
    </Button>
  );
}

export function UsageAccountDialog({ editHub, hub, onHubChanged, onAccountsChanged, onLocalLogin, onClose }: {
  readonly editHub: boolean;
  readonly hub: CLIProxyStatus | null;
  readonly onHubChanged: (status: CLIProxyStatus) => void;
  readonly onAccountsChanged: () => void;
  readonly onLocalLogin: (paneId: string) => void;
  readonly onClose: () => void;
}) {
  const t = useT();
  const narrow = useMediaQuery(SHEET_QUERY);
  const [step, setStep] = useState<Step>(editHub ? { kind: "hub", returnTo: null } : { kind: "provider" });
  const [providers, setProviders] = useState<readonly UsageLoginProvider[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void fetchUsageLoginProviders(controller.signal).then((result) => setProviders(result.providers))
      .catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : t("Could not load sign-in options")); });
    return () => controller.abort();
  }, [t]);
  const surface = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  // each step starts on its first control; Radix keeps Tab inside and hands the focus back on close
  useLayoutEffect(() => {
    (content.current?.querySelector<HTMLElement>("input, button") ?? surface.current)?.focus();
  }, [step, providers, surface]);
  const done = () => { onAccountsChanged(); onClose(); };
  let title: string;
  let body: ReactNode;
  let current: number;
  let steps = [t("Provider"), t("Method"), t("Sign in")];
  let back = () => setStep({ kind: "provider" });
  switch (step.kind) {
    case "provider":
      title = t("Choose a provider"); current = 0;
      body = <div className="account-choices account-provider-grid">
        {error && <p className="settings-hint account-error" role="alert">{error}</p>}
        {!providers && !error && <p className="settings-hint" role="status">{t("Loading…")}</p>}
        {providers?.map((provider) => <AccountChoice key={provider.id} aria-label={PROVIDER_NAME[provider.id]} aria-describedby={`usage-provider-desc-${provider.id}`} onClick={() => setStep({ kind: "account", provider, method: "choose" })}
          icon={<AgentMark agent={PROVIDER_MARK[provider.id]} size={24} />} title={PROVIDER_NAME[provider.id]} description={<span id={`usage-provider-desc-${provider.id}`}>{provider.id === "claude" || provider.id === "codex" ? t("On this PC or through the hub") : t("On the server PC")}</span>} />)}
        <AccountChoice aria-label={t("Hub")} onClick={() => setStep({ kind: "hub", returnTo: null })} icon={<Network />} title={t("Hub")} description={t("Import accounts from CLIProxyAPI")} />
      </div>;
      break;
    case "hub":
      title = t("Connect a hub"); current = 1; steps = [t("Provider"), t("Connection")];
      body = <UsageHubConnect hub={hub} onConnected={onHubChanged} onDone={() => {
        onAccountsChanged();
        if (step.returnTo) setStep({ kind: "account", provider: step.returnTo, method: "choose" });
        else onClose();
      }} />;
      if (step.returnTo) back = () => { if (step.returnTo) setStep({ kind: "account", provider: step.returnTo, method: "choose" }); };
      break;
    case "account": {
      const hubProvider = step.provider.id === "claude" || step.provider.id === "codex" ? step.provider.id : null;
      let local: ReactNode = null;
      let showHub = hubProvider !== null;
      let active = false;
      switch (step.method) {
        case "choose":
          title = t("How do you want to sign in?"); current = 1;
          local = !step.provider.installed
            ? <p className="settings-hint">{t("Install {cli} on the server PC first.", { cli: step.provider.cli })}</p>
            : step.provider.local
              ? <AccountChoice onClick={() => setStep({ ...step, method: "local" })} icon={<SquareTerminal />} title={t("On this PC")} description={t("Official CLI in a new tab")} />
              : <p className="settings-hint">{t("Sign in from the Antigravity app on the server PC.")}</p>;
          break;
        case "local":
          title = t("Sign in to {provider}", { provider: PROVIDER_NAME[step.provider.id] }); current = 2;
          local = <UsageLocalLogin provider={step.provider} onStarted={onLocalLogin} />; showHub = false;
          back = () => setStep({ ...step, method: "choose" });
          break;
        case "hub":
          title = t("Sign in to {provider}", { provider: PROVIDER_NAME[step.provider.id] }); current = 2; active = true;
          back = () => setStep({ ...step, method: "choose" });
          break;
        default: { const unexpected: never = step.method; throw new Error(String(unexpected)); }
      }
      body = <div className="account-choices">
        {local}
        {showHub && hubProvider !== null && (hub?.ok
          ? <CLIProxyAccountLogin provider={hubProvider} active={active} onStarted={() => setStep({ ...step, method: "hub" })} onAccountsChanged={done} />
          : <><AccountChoice disabled icon={<Network />} title={t("Through the hub")} /><Button variant="ghost" className="self-start" onClick={() => setStep({ kind: "hub", returnTo: step.provider })}>{t("Connect a hub first")}</Button></>)}
      </div>;
      break;
    }
    default: { const unexpected: never = step; throw new Error(String(unexpected)); }
  }
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent ref={surface} variant={narrow ? "sheet" : "modal"} className="usage-account-dialog" aria-modal="true" aria-labelledby="usage-account-title" aria-describedby={undefined} closeLabel={t("Close")} tabIndex={-1}
        onOpenAutoFocus={(event) => event.preventDefault()}>
        <DialogHeader className="flex-row items-center gap-2">
          {current > 0 && <Button variant="ghost" size="icon" className="-ml-2 text-dim" aria-label={t("Back")} onClick={back}><ArrowLeft /></Button>}
          <DialogTitle id="usage-account-title" className="min-w-0 flex-1 truncate">{title}</DialogTitle>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <ol className="account-steps" aria-label={t("Account setup")}>{steps.map((label, index) => <li key={label} aria-current={index === current ? "step" : undefined}>{label}</li>)}</ol>
          <div ref={content} className="account-step-content">{body}</div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
