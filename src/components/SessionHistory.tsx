/**
 * Earlier sessions of a workspace's folder (#1314), from the workspace row's ⋯ menu and from
 * /resume in the chat: one agent's sessions as its own store lists them (GET /api/sessions/history),
 * newest first, each with its title (else its first prompt), its first prompt and the time it was
 * last touched. Resume starts the row's verified argv as the agent of a new tab in the workspace,
 * one at a time (lib/sessionHistory.ts inFlightGuard), so a double click starts one agent; a
 * session a pane of the workspace already shows is reached by selecting that pane in the browser
 * (herdr's focus stays where it is), and so is one Resume started a moment ago whose pane herdr has
 * not reported on yet (App's RecentResume records, `recent`): the list reopened in that window
 * offers Open, not a second Resume, for as long as the pane is listed without a session. A row
 * whose resume syntax is not verified is listed with no button. A Claude row is the session in the
 * store of the pane the list was asked for from (`sourcePaneId`): its Resume goes to POST
 * /api/sessions/resume, which starts it in that store or names the pane already showing it there;
 * a store that changed since the list is read again with its rows held in place and the focus kept
 * on the row that asked, and a bridge that gives no source (an older
 * one, or a store it cannot choose again) offers no Resume rather than one in another store.
 * A Dialog (ui/dialog; a sheet on a phone): Escape, the scrim and Cancel close it, Tab stays inside,
 * arrows move along the rows, and focus returns to what opened it. A filter field over the rows
 * narrows them by their words. The design follows the resume pickers of Codex CLI (`/resume`)
 * and Claude Code (`claude --resume`): one session per row, newest first, the first prompt as its
 * text and the time it was last touched beside it, Enter resuming; here in the worktree dialog's
 * row anatomy, with the agent above the rows in the New workspace dialog's picker (each agent with
 * its mark, no Shell entry), whose open list takes its own Escape.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Search } from "../lib/icons.ts";
import "./SessionHistory.css";
import { AgentPicker } from "./AgentPicker.tsx";
import { Badge, Button, Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input } from "./ui/index.ts";
import type { AgentKind, HerdrPane, SessionHistoryAgent, SessionHistoryResponse, SessionHistoryRow, TabCreated, WorkspaceInfo } from "../../shared/protocol.ts";
import { ApiError, routeMissing } from "../lib/api.ts";
import { useLocale, useT } from "../lib/i18n.ts";
import { useMachineApi, useMachineId } from "../lib/machineContext.tsx";
import { claudeResumeRequest, inFlightGuard, paneShowingRow, resumeTabRequest, rowKey, rowStore, sessionHistoryAgent, sessionHistorySourcePane, sessionRowTime, standingResume, type RecentResume } from "../lib/sessionHistory.ts";
import { useSheetSwipe } from "../lib/sheets.ts";
import { usePhoneSheetBack } from "../lib/sheetHistory.ts";
import { useMediaQuery } from "../lib/useMediaQuery.ts";

interface Props {
  workspace: WorkspaceInfo;
  /** the PC's panes in tab order: the one already showing a listed session is selected instead of a new tab */
  panes: readonly HerdrPane[];
  /** the agent listed first: the pane's, or the workspace row's */
  agent: SessionHistoryAgent;
  /** the pane the list is asked for from: Claude's sessions are that pane's store's */
  sourcePaneId?: string | null;
  /** the original request and selection, kept when the Agent picker changes the list's source */
  askingPaneId?: string | null;
  selectedPaneId?: string | null;
  /** the Resumes of a moment ago whose panes have not reported their session yet (lib/useRecentResumes.ts) */
  recent?: readonly RecentResume[];
  onClose: () => void;
  /** browser selection only: herdr's focus stays where it is */
  onSelectPane: (paneId: string) => void;
  /** the tab herdr made for the row's session, which the caller records until herdr reports it */
  onResumed: (opened: TabCreated, session: { agent: SessionHistoryAgent; id: string; store: string }) => void;
}

const said = (reason: unknown): string => reason instanceof ApiError ? reason.detail : reason instanceof Error ? reason.message : String(reason);

const NO_RECENT: readonly RecentResume[] = [];

export function SessionHistory({ workspace, panes, agent: firstAgent, sourcePaneId: firstSourcePaneId = null, askingPaneId = firstSourcePaneId, selectedPaneId = null, recent = NO_RECENT, onClose, onSelectPane, onResumed }: Props) {
  const t = useT();
  const locale = useLocale();
  const id = useId();
  const machineId = useMachineId();
  const { createTab, fetchAgentKinds, fetchSessionHistory, resumeSession } = useMachineApi();
  const [agent, setAgent] = useState<SessionHistoryAgent>(firstAgent);
  // Re-pick on an Agent change or a closed source, using the current roster rather than a stale pane.
  const sourcePaneId = sessionHistorySourcePane(agent, panes, { workspaceId: workspace.workspace_id, askingPaneId, selectedPaneId });
  const [kinds, setKinds] = useState<AgentKind[]>([]);
  const [answer, setAnswer] = useState<SessionHistoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** the key (rowKey) of the row whose Resume is in flight */
  const [pending, setPending] = useState<string | null>(null);
  /** bumped to read the list again: a Claude store that changed since it was read */
  const [reload, setReload] = useState(0);
  const [relisted, setRelisted] = useState(false);
  /** the list being read again after a changed store: its rows stay, without their buttons, until the new ones come */
  const [relisting, setRelisting] = useState(false);
  /** the words the rows are narrowed by */
  const [filter, setFilter] = useState("");
  const keepRows = useRef(false);
  /** the session whose Resume found the store changed: its row takes the focus back once the list is read again */
  const refocus = useRef<string | null>(null);
  const guard = useRef(inFlightGuard());
  /** known refusals in the user's words; other errors as the bridge says them */
  const refusal = useCallback((reason: unknown): string => {
    if (routeMissing(reason)) return t("This PC's bridge does not offer this yet");
    if (reason instanceof ApiError && reason.code === "claude_store_unknown") return t("Which Claude store this pane uses can't be told, so its sessions aren't listed. Check that one Claude runs in this pane and its store folder exists, then open the list again.");
    if (reason instanceof ApiError && reason.code === "launch_unsupported") return t("This PC can't start this session in the store it was listed from");
    if (reason instanceof ApiError && reason.code === "stale_source") return t("The source pane or its Claude store changed. Open the list again.");
    if (reason instanceof ApiError && reason.code === "launch_store_changed") return t("A shell startup file set another Claude store, so the new tab was closed.");
    if (reason instanceof ApiError && reason.code === "launch_store_unknown") return t("The new tab's Claude store couldn't be confirmed, so the tab was closed.");
    if (reason instanceof ApiError && reason.code === "resume_timed_out") return t("Resuming took too long, so it was stopped. A tab it started will be closed. Try again.");
    if (reason instanceof ApiError && reason.code === "resume_in_progress") return t("This session is still being resumed. Try again in a moment.");
    return said(reason);
  }, [t]);
  const surface = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const picker = useRef<HTMLButtonElement>(null);
  const placed = useRef<HTMLElement | null>(null);
  const phone = useMediaQuery("(max-width: 640px)");
  useSheetSwipe(surface, pending ? null : onClose);
  usePhoneSheetBack(() => { if (pending) return false; onClose(); });
  // the first row's button takes the focus once the rows are in; until then the agent field. Focus
  // the user moved meanwhile (Tab to Cancel, the field opened, the filter typed in) stays where they put it
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const again = refocus.current;
      refocus.current = null;
      const row = again === null ? null : list.current?.querySelector<HTMLElement>(`[data-session-id="${CSS.escape(again)}"] button:not(:disabled)`);
      if (row) { row.focus(); placed.current = row; return; }
      const active = document.activeElement;
      if (surface.current?.contains(active) && active !== placed.current) return;
      // an open agent list keeps the focus: its keys and Escape still belong to the list
      if (picker.current?.getAttribute("aria-expanded") === "true") return;
      const target = list.current?.querySelector<HTMLElement>("button:not(:disabled)") ?? picker.current;
      target?.focus();
      placed.current = target ?? null;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [answer]);
  useEffect(() => {
    let cancelled = false;
    fetchAgentKinds().then((next) => { if (!cancelled) setKinds(next); }, () => { /* the first agent alone is offered */ });
    return () => { cancelled = true; };
  }, [fetchAgentKinds]);
  useEffect(() => {
    let cancelled = false;
    // a list read again after a changed store keeps its rows until the new ones come: nothing moves under the pointer
    if (!keepRows.current) setAnswer(null);
    keepRows.current = false;
    setError(null);
    fetchSessionHistory(workspace.workspace_id, agent, sourcePaneId).then(
      (listing) => { if (!cancelled) { setAnswer(listing); setRelisting(false); } },
      (reason: unknown) => { if (!cancelled) { setAnswer(null); setError(refusal(reason)); setRelisting(false); } },
    );
    return () => { cancelled = true; };
  }, [agent, fetchSessionHistory, reload, sourcePaneId, refusal, workspace.workspace_id]);
  useEffect(() => { setRelisted(false); }, [agent]);
  const options = useMemo(() => {
    const listed = kinds.flatMap((kind) => { const named = sessionHistoryAgent(kind.kind); return named === null ? [] : [{ kind: named, label: kind.label }]; });
    return listed.some((option) => option.kind === firstAgent) ? listed : [{ kind: firstAgent, label: firstAgent }, ...listed];
  }, [firstAgent, kinds]);
  const agentLabel = options.find((option) => option.kind === agent)?.label ?? agent;
  const now = useMemo(() => Date.now(), [answer]);
  const failed = (row: SessionHistoryRow, reason: unknown): void => {
    setPending(null);
    // the pane's Claude is on another store now, or gone: its rows are read again, never resumed elsewhere
    if (reason instanceof ApiError && reason.status === 409 && reason.code === "stale_source") {
      keepRows.current = true;
      refocus.current = row.id;
      setRelisting(true);
      setRelisted(true);
      setReload((count) => count + 1);
      return;
    }
    setError(refusal(reason));
  };
  const resume = (row: SessionHistoryRow): void => {
    const store = rowStore(row);
    let started: Promise<TabCreated | { opened: string }> | null;
    if (agent === "claude") {
      const request = claudeResumeRequest(row, workspace.workspace_id);
      if (request === null) return;
      started = guard.current.run(() => resumeSession(request).then((answer) => answer.action === "opened" ? { opened: answer.pane_id } : { workspace_id: answer.workspace_id, pane_id: answer.pane_id, agent_started: answer.agent_started, ...(answer.error ? { error: answer.error } : {}) }));
    } else {
      const request = resumeTabRequest(row, workspace.workspace_id, answer?.cwd ?? null);
      if (request === null) return;
      started = guard.current.run(() => createTab(request));
    }
    if (started === null) return;
    setPending(rowKey(row));
    setError(null);
    setRelisted(false);
    started.then(
      (opened) => {
        // the pane already showing the session in this store: selected, as Open does
        if ("opened" in opened) { setPending(null); onSelectPane(opened.opened); return; }
        if (opened.agent_started === false && opened.error) { setPending(null); setError(opened.error.message); return; }
        onResumed(opened, { agent, id: row.id, store });
      },
      (reason: unknown) => failed(row, reason),
    );
  };
  const moveAlongRows = (event: ReactKeyboardEvent<HTMLUListElement>): void => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key) || !list.current) return;
    const buttons = [...list.current.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
    if (buttons.length === 0) return;
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1
      : event.key === "ArrowDown" ? Math.min(buttons.length - 1, index + 1) : Math.max(0, index - 1);
    event.preventDefault();
    buttons[next]?.focus();
  };
  const all = answer?.sessions ?? null;
  // the filter reads the words a row shows: its title, its first prompt and its id
  const words = filter.trim().toLowerCase();
  const rows = useMemo(() => all === null || words === "" ? all : all.filter((row) => [row.title, row.firstMessage, row.id].some((text) => text !== null && text.toLowerCase().includes(words))), [all, words]);
  const momentAgo = Date.now();
  return (
    <Dialog open onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
      <DialogContent ref={surface} variant={phone ? "sheet" : "modal"} className="session-dialog" aria-labelledby={`${id}-title`} closeLabel={t("Close session list")}
        // the dialog holds the focus from its first paint, on the agent field: an Escape pressed at
        // once closes it rather than going to the message box it was opened from
        onOpenAutoFocus={(event) => { event.preventDefault(); picker.current?.focus({ preventScroll: true }); placed.current = picker.current; }}
        // the agent picker's open list takes its Escape: it closes the list, not the dialog; a Resume on its way holds the dialog
        onEscapeKeyDown={(event) => { if (pending || document.activeElement?.getAttribute("aria-expanded") === "true") event.preventDefault(); }}
        onPointerDownOutside={(event) => { if (pending) event.preventDefault(); }}
        onInteractOutside={(event) => { if (pending) event.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle id={`${id}-title`}>{t("Earlier sessions · {name}", { name: workspace.label })}</DialogTitle>
        </DialogHeader>
        <DialogBody className="session-body">
          <div className="field session-agent">
            <span className="field-label" id={`${id}-agent`}>{t("Agent")}</span>
            <AgentPicker ref={picker} agents={options} value={agent} shell={false} disabled={pending !== null || relisting} labelledBy={`${id}-agent`} onChange={(kind) => setAgent(kind as SessionHistoryAgent)} />
            {answer && <span className="field-hint session-folder">{t("Sessions started in {folder}", { folder: "\u0000" }).split("\u0000").map((part, index) => index === 0 ? <span key="before">{part}</span> : <span key="after"><code>{answer.cwd}</code>{part}</span>)}</span>}
          </div>
          {all !== null && all.length > 0 && <div className="session-filter">
            <Search aria-hidden="true" className="session-filter-glyph" />
            <Input type="search" className="session-filter-input" value={filter} placeholder={t("Filter sessions")} aria-label={t("Filter sessions")} onChange={(event) => setFilter(event.currentTarget.value)} />
          </div>}
          {all === null && !error ? (
            <p className="field-hint" role="status">{t("Reading sessions…")}</p>
          ) : all && all.length === 0 ? (
            <p className="field-hint session-empty">{t("No earlier {agent} sessions in this folder.", { agent: agentLabel })}</p>
          ) : rows && rows.length === 0 ? (
            <p className="field-hint session-empty" role="status">{t("No session matches the filter.")}</p>
          ) : rows && (
            <ul ref={list} className="session-list" aria-label={t("Earlier sessions")} onKeyDown={moveAlongRows}>
              {rows.map((row) => {
                const key = rowKey(row);
                const title = row.title ?? row.firstMessage ?? row.id;
                const detail = row.title !== null ? row.firstMessage : null;
                const when = sessionRowTime(row, now, locale, t);
                // a pane that reports the session, else the pane of a Resume a moment ago; a record whose pane
                // the roster has not listed yet withholds Resume and offers nothing to open until it does
                const resumed = standingResume(recent, panes, machineId, workspace.workspace_id, agent, row.id, momentAgo, rowStore(row));
                const shown = paneShowingRow(panes, workspace.workspace_id, agent, row) ?? (resumed === undefined ? undefined : panes.find((pane) => pane.pane_id === resumed.paneId && pane.workspace_id === workspace.workspace_id));
                const withheld = resumed !== undefined && shown === undefined;
                const resumable = row.resume !== null && row.resume.argv.length > 0;
                // a Claude row its bridge bound to no store: no Resume that could start it in another
                const unbound = resumable && agent === "claude" && claudeResumeRequest(row, workspace.workspace_id) === null;
                return (
                  <li key={key} data-session-id={row.id} className={`session-row${pending === key ? " is-pending" : ""}`} aria-label={when ? `${title} · ${when.label}` : title}>
                    <span className="session-copy">
                      <span className={`session-title${row.title === null && row.firstMessage === null ? " session-id" : ""}`}>{title}</span>
                      {detail !== null && <span className="session-detail">{detail}</span>}
                    </span>
                    <span className="session-meta">
                      {when && <time className="session-time" dateTime={row.updatedAt} title={when.title}>{when.label}</time>}
                      {shown || withheld ? (
                        <span className="session-actions">
                          <Badge tone="accent" className="session-pill">{t("Already open")}</Badge>
                          <Button variant="field" size="xs" className="session-action" disabled={pending !== null || relisting || shown === undefined} aria-label={t("Open the pane showing {title}", { title })} onClick={() => { if (shown) onSelectPane(shown.pane_id); }}>{t("Open")}</Button>
                        </span>
                      ) : unbound ? (
                        <Badge tone="idle" className="session-pill" title={t("This PC can't start this session in the store it was listed from")}>{t("Resume unavailable")}</Badge>
                      ) : resumable && (
                        <Button variant="field" size="xs" className="session-action" disabled={pending !== null || relisting} aria-label={t("Resume {title}", { title })} onClick={() => resume(row)}>{t("Resume")}</Button>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          {/* one line kept under the rows, so none of them moves when it speaks: Resuming, Reading again, why it was read again */}
          {rows && rows.length > 0 && <p className="field-hint session-status" role="status">{pending !== null ? t("Resuming…") : relisting ? t("Reading sessions…") : relisted ? t("Claude's store changed; the list was read again.") : null}</p>}
          {error && <p className="field-hint session-error" role="alert">{error}</p>}
        </DialogBody>
        <DialogFooter>
          <Button variant="field" size="sm" disabled={pending !== null} onClick={onClose}>{t("Cancel")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
