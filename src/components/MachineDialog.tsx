import { useEffect, useRef, useState } from "react";
import { ChevronDown, Monitor } from "../lib/icons.ts";
import type { Machine, SetupAction, SetupJob } from "../../shared/machines.ts";
import { answerMachineSetup, fetchMachineSetup, startMachineSetup } from "../lib/api.ts";
import { hostKeyFingerprints } from "../lib/hostKey.ts";
import { sshOutputParts } from "../lib/sshOutput.ts";
import { useAnnouncedText } from "../lib/useAnnouncedText.ts";
import { useMediaQuery } from "../lib/useMediaQuery.ts";
import { SHEET_QUERY } from "../lib/sheets.ts";
import { machineErrorText } from "../lib/userError.ts";
import { BridgeUpdateProgress } from "./MachineSidebar.tsx";
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger, Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle, Field, Input } from "./ui/index.ts";
import "./Machines.css";
import { useT } from "../lib/i18n.ts";

/**
 * Add PC, and a saved PC's reconnect, setup and bridge update: the SSH form, then the job's steps,
 * questions (a host key, a password) and approvals as the server asks them.
 */
export function MachineDialog({ machine, updateRemote = false, onClose, onConnected }: { machine?: Machine; updateRemote?: boolean; onClose(): void; onConnected(id: string): void }) {
  const t = useT();
  const narrow = useMediaQuery(SHEET_QUERY);
  const destinationField = useRef<HTMLInputElement>(null);
  const [destination, setDestination] = useState(machine?.target?.destination ?? "");
  const [name, setName] = useState(machine?.name ?? "");
  const [port, setPort] = useState(String(machine?.target?.port ?? ""));
  const [key, setKey] = useState(machine?.target?.identity_file ?? "");
  const [session, setSession] = useState(machine?.target?.session ?? "");
  const [job, setJob] = useState<SetupJob | null>(null);
  const mounted = useRef(true);
  const jobRef = useRef(job); jobRef.current = job;
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const finished = !!job && ["failed", "cancelled", "connected"].includes(job.phase);
  const secretAllowed = window.isSecureContext;
  const needsBridgeUpdate = job?.phase === "failed" && job.action_required === "update_bridge";

  // closing cancels a job that still waits on this dialog (a question, an approval); an
  // approved install keeps going on the server and shows in the sidebar
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; const current = jobRef.current; if (current && !["connected", "failed", "cancelled", "installing", "starting"].includes(current.phase)) void answerMachineSetup(current.id, { action: "cancel" }).catch(() => {}); }; }, []);
  const running = !!job && ["installing", "starting"].includes(job.phase);
  useEffect(() => {
    if (!job || finished) return;
    let cancelled = false;
    let timer = 0;
    const poll = async () => {
      try { const next = await fetchMachineSetup(job.id); if (!cancelled) { setJob(next); setError(null); } }
      catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : String(e)); }
      if (!cancelled) timer = window.setTimeout(poll, 750);
    };
    timer = window.setTimeout(poll, 750);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [job?.id, finished]);
  useEffect(() => setSecret(""), [job?.challenge?.id]);

  const begin = async () => {
    if (pending) return;
    setError(null); setPending(true);
    // a PC saved in herdr keeps its catalog name, which the server does not read from here
    try { const next = await startMachineSetup({ destination: destination.trim(), ...(name.trim() && !machine?.herdr_profile_id ? { name: name.trim() } : {}), ...(port ? { port: Number(port) } : {}), ...(key.trim() ? { identity_file: key.trim() } : {}), ...(session.trim() ? { session: session.trim() } : {}), ...(machine ? { machine_id: machine.id } : {}), ...(needsBridgeUpdate || updateRemote ? { update_remote: true } : {}) });
      if (mounted.current) setJob(next);
      else if (!["connected", "failed", "cancelled", "installing", "starting"].includes(next.phase)) await answerMachineSetup(next.id, { action: "cancel" });
    }
    catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : String(e)); }
    finally { if (mounted.current) setPending(false); }
  };
  const inheritedStarted = useRef(false);
  useEffect(() => {
    if (!machine?.herdr_profile_id || inheritedStarted.current) return;
    inheritedStarted.current = true;
    void begin();
  }, []);
  const act = async (action: SetupAction) => {
    if (!job || pending) return;
    setPending(true); setError(null); setSecret("");
    try { setJob(await answerMachineSetup(job.id, action)); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setPending(false); }
  };
  const title = t(updateRemote ? "Update remote bridge" : machine?.action_required === "connect" ? "Connect" : machine?.action_required === "setup" ? "Set up web access" : machine ? "Reconnect PC" : "Add PC");
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent variant={narrow ? "sheet" : "modal"} className="machine-dialog" aria-modal="true" aria-labelledby="machine-dialog-title" aria-describedby={undefined} closeLabel={t("Close PC setup")}
      // the field to fill comes first, when the form is up; a job's steps start on the dialog itself
      onOpenAutoFocus={(event) => { event.preventDefault(); (destinationField.current ?? (event.currentTarget as HTMLElement | null))?.focus(); }}>
      <DialogHeader>
        <DialogTitle id="machine-dialog-title" className="flex items-center gap-2"><Monitor className="size-[18px] text-dim" /> {title}</DialogTitle>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        {(!job || finished && job.phase !== "connected") && <form id="machine-connect-form" className="machine-form" onSubmit={(e) => { e.preventDefault(); void begin(); }}>
          {machine?.herdr_profile_id ? <p className="field-hint">{machine.name} — {destination} / {session}</p> : <>
          <Field label={t("SSH alias or user@address")} htmlFor="machine-destination"><Input ref={destinationField} id="machine-destination" required autoComplete="off" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="devbox or user@192.168.1.20" /></Field>
          <Field label={t("PC name")} htmlFor="machine-name"><Input id="machine-name" maxLength={100} value={name} placeholder={destination || t("Filled from the SSH address")} onChange={(e) => setName(e.target.value)} /></Field>
          <Collapsible>
            <CollapsibleTrigger asChild><Button variant="ghost" size="sm" className="group/fold -ml-2 text-dim">{t("Advanced settings")}<ChevronDown className="transition-transform duration-200 ease-in-out group-data-[state=open]/fold:-rotate-180" /></Button></CollapsibleTrigger>
            <CollapsibleContent className="machine-advanced">
              <Field label={t("SSH port")} htmlFor="machine-port"><Input id="machine-port" type="number" min="1" max="65535" placeholder={t("From SSH config (default 22)")} value={port} onChange={(e) => setPort(e.target.value)} /></Field>
              <Field label={t("Private key path on this web server")} htmlFor="machine-key"><Input id="machine-key" value={key} placeholder="~/.ssh/id_ed25519" onChange={(e) => setKey(e.target.value)} /></Field>
              <Field label={t("herdr session name")} htmlFor="machine-session"><Input id="machine-session" value={session} placeholder={t("Default session")} onChange={(e) => setSession(e.target.value)} /></Field>
            </CollapsibleContent>
          </Collapsible>
          <p className="field-hint">{t("Uses the web server account’s SSH config and ssh-agent. Agent CLI tools and logins use the environment on the target PC.")}</p>
          </>}
        </form>}
        {job && job.challenge?.kind !== "host_key" && <div className="machine-progress" role="status">{running && job.progress ? <BridgeUpdateProgress update={{ job_id: job.id, step: job.step, progress: job.progress }} /> : <strong>{job.step}</strong>}{job.error && <p>{machineErrorText(job.error, t)}</p>}{job.ssh_output && <SshOutput text={job.ssh_output} />}</div>}
        {needsBridgeUpdate && <p className="field-hint">{t("This PC runs a bridge from a different version of Ovis. Update it to reconnect; herdr sessions keep running.")}</p>}
        {running && <p className="field-hint">{t("You can close this; the install keeps going and the sidebar shows it.")}</p>}
        {job?.phase === "approval" && <><ul className="machine-install-list">{job.installations.map((item) => <li key={item}>{item}</li>)}</ul><p className="field-hint">{t("Installs into your home directory. Existing herdr sessions keep running.")}</p></>}
        {job?.challenge && <div className="machine-challenge">{job.challenge.kind === "host_key" ? <HostKeyQuestion prompt={job.challenge.prompt} host={job.target.destination} sshOutput={job.ssh_output} /> : <><pre>{job.challenge.prompt}</pre><form className="machine-form" onSubmit={(e) => { e.preventDefault(); void act({ action: "answer", challenge_id: job.challenge!.id, answer: secret }); }}>
          <Field label={t("Password or key passphrase")} htmlFor="machine-secret"><Input id="machine-secret" autoFocus type="password" autoComplete="off" value={secret} disabled={!secretAllowed || pending} onChange={(e) => setSecret(e.target.value)} /></Field>
          {!secretAllowed && <p className="field-hint">{t("Open this app over HTTPS or localhost to enter a password.")}</p>}
          <Button type="submit" variant="accent" className="self-start" disabled={!secretAllowed || pending || !secret}>{t("Continue")}</Button>
        </form></>}</div>}
        {error && <p className="machine-error" role="alert">{error}</p>}
      </DialogBody>
      <DialogFooter className="flex-wrap">
        {job && !finished && <Button variant="field" disabled={pending} onClick={() => void act({ action: "cancel" })}>{t(running ? "Cancel install" : "Cancel connection")}</Button>}
        {running && <Button variant="accent" onClick={onClose}>{t("Continue in background")}</Button>}
        {job?.challenge?.kind === "host_key" && <><Button variant="field" disabled={pending} onClick={() => void act({ action: "answer", challenge_id: job.challenge!.id, answer: "no" })}>{t("Reject")}</Button><Button variant="accent" disabled={pending} onClick={() => void act({ action: "answer", challenge_id: job.challenge!.id, answer: "yes" })}>{t("Trust fingerprint")}</Button></>}
        {job?.phase === "approval" && <Button variant="accent" disabled={pending} onClick={() => void act({ action: "approve" })}>{t("Install and connect")}</Button>}
        {job?.phase === "connected" ? <Button variant="accent" onClick={() => onConnected(job.machine_id)}>{t("Open PC")}</Button> : (!job || finished) && <Button variant="accent" form="machine-connect-form" type="submit" disabled={pending}>{t(pending ? "Connecting…" : needsBridgeUpdate ? "Update bridge and connect" : job ? "Retry connection" : "Connect")}</Button>}
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}

function SshOutput({ text }: { text: string }) {
  const t = useT();
  return <pre className="machine-ssh-output" aria-label={t("SSH output")}>{sshOutputParts(text).map((part, i) => part.type === "link" ? <a key={i} href={part.href} target="_blank" rel="noopener noreferrer">{part.value}</a> : part.value)}</pre>;
}

/**
 * The host-key decision: the fingerprint to compare and one sentence; ssh's own words wait behind
 * a fold. No status box above it: the question is the state. The sentence is the announcement of
 * that state, so its words land a frame after the box (lib/useAnnouncedText.ts).
 */
function HostKeyQuestion({ prompt, host, sshOutput }: { prompt: string; host: string; sshOutput: string | null }) {
  const t = useT();
  const fingerprints = hostKeyFingerprints(prompt);
  const sentence = useAnnouncedText(t("Trust it only if it matches the fingerprint shown on the PC."));
  return <>
    {fingerprints.length > 0 ? <>
      <p className="machine-fingerprint-label">{t("Fingerprint of {host}", { host })}</p>
      {fingerprints.map((fingerprint) => <p key={fingerprint} className="machine-fingerprint">{fingerprint}</p>)}
    </> : <pre>{prompt}</pre>}
    <p className="field-hint" role="status">{sentence}</p>
    {(fingerprints.length > 0 || sshOutput !== null) && <details className="machine-ssh-fold">
      <summary>{t("Show SSH output")}</summary>
      {fingerprints.length > 0 && <pre>{prompt}</pre>}
      {sshOutput !== null && <SshOutput text={sshOutput} />}
    </details>}
  </>;
}
