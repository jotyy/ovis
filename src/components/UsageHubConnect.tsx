import { useRef, useState } from "react";
import { Eye, EyeOff } from "../lib/icons.ts";
import type { CLIProxyStatus } from "../../shared/protocol.ts";
import { cliProxyRequest, fetchUsage } from "../lib/api.ts";
import { useT } from "../lib/i18n.ts";
import { useSettings } from "../lib/settings.ts";
import { Button, Field, Input } from "./ui/index.ts";

export function UsageHubConnect({ hub, onConnected, onDone }: {
  readonly hub: CLIProxyStatus | null;
  readonly onConnected: (status: CLIProxyStatus) => void;
  readonly onDone: () => void;
}) {
  const t = useT();
  const { settings } = useSettings();
  const [url, setUrl] = useState(hub?.url ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyShown, setKeyShown] = useState(false);
  const [connected, setConnected] = useState<{ readonly count: number | null } | null>(null);
  const key = useRef<HTMLInputElement>(null);
  if (connected) return <div className="account-auth-form">
    <p className="settings-label" role="status">{connected.count === null ? t("Connected") : t("Connected · {count} accounts", { count: connected.count })}</p>
    <Button variant="accent" size="md" className="self-start" onClick={onDone}>{t("Done")}</Button>
  </div>;
  return <form className="account-auth-form" onSubmit={(event) => {
    event.preventDefault();
    const secret = key.current?.value.trim() ?? "";
    if (key.current) key.current.value = "";
    setBusy(true); setError(null);
    void cliProxyRequest<CLIProxyStatus>("", {
      method: "PUT", headers: { "content-type": "application/json" },
      body: JSON.stringify({ url, ...(secret ? { management_key: secret } : {}) }),
    }).then(async (status) => {
      onConnected(status);
      if (!status.ok) { setError(status.problem ?? t("Check the hub connection")); return; }
      if (!settings.showUsage) { setConnected({ count: null }); return; }
      const report = await fetchUsage(true);
      setConnected({ count: report.providers.filter((usage) => usage.key.startsWith(`${usage.id}:cliproxy:`)).length });
    }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : t("Hub request failed")))
      .finally(() => setBusy(false));
  }}>
    <p className="settings-hint">{t("The key stays on this PC.")}</p>
    <Field label={t("Hub URL")} htmlFor="usage-hub-url">
      <Input id="usage-hub-url" type="url" placeholder="http://localhost:8317" value={url} onChange={(event) => setUrl(event.target.value)} required disabled={busy} />
    </Field>
    <Field label={t("Management key")} htmlFor="usage-hub-key" hint={hub?.configured ? t("Blank keeps the saved key") : undefined}>
      <div className="usage-hub-key">
        {/* the secret stays in the field alone: never state, never a draft (src/AGENTS.md) */}
        <Input ref={key} id="usage-hub-key" type={keyShown ? "text" : "password"} autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} disabled={busy} />
        <Button variant="ghost" size="icon" className="text-dim" aria-pressed={keyShown} aria-controls="usage-hub-key" aria-label={t("Show key")} title={t("Show key")} onClick={() => setKeyShown(!keyShown)}>
          {keyShown ? <EyeOff /> : <Eye />}
        </Button>
      </div>
    </Field>
    {error && <p className="settings-hint account-error" role="alert">{error}</p>}
    <Button type="submit" variant="accent" size="md" className="self-start" disabled={busy || !url}>{busy ? t("Connecting…") : t("Connect")}</Button>
  </form>;
}
