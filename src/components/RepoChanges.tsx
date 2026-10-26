import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Folder, FolderOpen, GitBranch, GitMerge, RefreshCw } from "../lib/icons.ts";

import "./RepoChanges.css";
import { FileGlyph } from "./FileGlyph.tsx";
import { Skeleton } from "./Skeleton.tsx";
import { Badge, Button, Field, IconButton, Input, Label, menuItem, menuSurface, ToggleGroup, ToggleGroupItem, TooltipProvider } from "./ui/index.ts";

import type { RepoDiffFile, RepoDiffFileList, RepoDiffRefs, RepoDiffScope, RepoDiffStatus } from "../../shared/protocol.ts";
import { changeTree, changeTreeFolders, type ChangeTreeEntry } from "../lib/changeTree.ts";
import { cn } from "../lib/cn.ts";
import { useLocale, useT } from "../lib/i18n.ts";
import { useMachineApi } from "../lib/machineContext.tsx";
import { diffErrorMessage, nothingChangedWord, refName, shortHash, STATUS_MARK, statusWord, type RepoComparison } from "../lib/repoDiff.ts";
import { skeletonRows } from "../lib/skeleton.ts";

export interface RepoChangesProps {
  paneId: string;
  /** the pane's folder, read when the pane is gone */
  directory: string;
  onOpenDiff: (comparison: RepoComparison, file: RepoDiffFile) => void;
}

type Load = { status: "pending" } | { status: "failed"; error: unknown } | { status: "ready"; listing: RepoDiffFileList };
const PENDING: Load = { status: "pending" };

/** The branches offered as a base: read when the picker opens, never before. */
type Refs = { status: "idle" } | { status: "pending" } | { status: "failed"; error: unknown } | { status: "ready"; listing: RepoDiffRefs };
const NO_REFS: Refs = { status: "idle" };

/** a file's status as a tag's tone: added reads as done, deleted as blocked, modified as the accent */
export function statusTone(status: RepoDiffStatus): "done" | "blocked" | "accent" | "neutral" {
  switch (status) {
    case "added": case "untracked": return "done";
    case "deleted": case "unmerged": return "blocked";
    case "modified": return "accent";
    default: return "neutral";
  }
}

/** a row of the list, a file's or a folder's: it moves one indent in per level (`--depth`), the fill stays as wide as the list */
const changeRow = "group flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-md pr-2 pl-[calc(var(--space-2)+var(--depth,0)*var(--repo-change-indent))] text-left text-sm text-text outline-none transition-[background-color,color] duration-150 ease-in-out hover:bg-fill-2 hover:text-strong focus-visible:bg-fill-2 focus-visible:ring-2 focus-visible:ring-accent/60 disabled:pointer-events-none disabled:opacity-50 coarse:min-h-touch";

const note = "m-0 px-3 py-2 text-sm text-dim";

/**
 * What changed in the repository the pane sits in: the working tree, the index, two commits, or
 * the branch against a base of the reader's choosing (the working tree against the merge base of
 * that base and HEAD, as Codex's review pane compares a branch), one file per row with its status
 * and counts, each opened as its diff, under the folders they sit in (lib/changeTree.ts): every
 * folder starts open, and what the reader folds stays folded across refreshes and comparisons.
 * The list is read on each choice and on Refresh, never polled; while it is read, the last list's
 * repository line stays and placeholder rows hold its height. A base is never guessed: the
 * Branch scope starts empty, offers the repository's branches when its picker opens, and compares
 * on Compare alone; the identity a branch list answers with (HEAD, base, merge base) is what each
 * of its files is read from, so a base that moves on changes nothing until Refresh. Another PC,
 * pane or folder starts the Branch scope over (no base, nothing compared until Compare), and an
 * answer read for a target or comparison no longer shown is dropped.
 */
export function RepoChanges({ paneId, directory, onOpenDiff }: RepoChangesProps) {
  const t = useT();
  const locale = useLocale();
  const { fetchRepoDiffFiles, fetchRepoDiffRefs } = useMachineApi();
  const [scope, setScope] = useState<RepoDiffScope>("workspace");
  const [base, setBase] = useState("");
  const [head, setHead] = useState("");
  // the comparison read last: a commit or branch comparison waits for Compare, the others read on choice
  const [asked, setAsked] = useState<RepoComparison | null>({ scope: "workspace", base: null, head: null, comparison: null });
  const [load, setLoad] = useState<Load>(PENDING);
  // the last listing, kept while the next is read: its repository line stays and its rows size the placeholders
  const [last, setLast] = useState<RepoDiffFileList | null>(null);
  const request = useRef(0);

  // the base picker: the typed text, the row picked from the list (while the text still reads as it), and the list itself
  const [baseRef, setBaseRef] = useState("");
  const [picked, setPicked] = useState<RepoDiffRefs["refs"][number] | null>(null);
  const [refs, setRefs] = useState<Refs>(NO_REFS);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [active, setActive] = useState(0);
  const refsRequest = useRef(0);
  const pickerRef = useRef<HTMLDivElement>(null);
  const refsRef = useRef<HTMLDivElement>(null);
  const baseInputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const baseLabelId = useId();
  const fromId = useId();
  const toId = useId();

  // another PC, pane or folder: nothing read or chosen for the last one is an answer for this one.
  // Reset while rendering, so the read below never starts the last target's branch comparison here.
  const target = useMemo(() => ({ paneId, directory }), [fetchRepoDiffFiles, fetchRepoDiffRefs, paneId, directory]);
  const [shownTarget, setShownTarget] = useState(target);
  if (shownTarget !== target) {
    setShownTarget(target);
    setLast(null);
    setRefs(NO_REFS);
    setPickerOpen(false);
    setBaseRef("");
    setPicked(null);
    setLoad(PENDING);
    if (scope === "branch") setAsked(null);
  }
  // and what is still on its way for the last target (or for a closed view) is dropped when it lands
  useEffect(() => () => { request.current += 1; refsRequest.current += 1; }, [target]);

  const read = useCallback((comparison: RepoComparison) => {
    const id = ++request.current;
    setLoad(PENDING);
    fetchRepoDiffFiles({ paneId, directory, ...comparison }).then(
      (listing) => {
        if (id !== request.current) return;
        setLoad({ status: "ready", listing });
        setLast(listing);
      },
      (error: unknown) => { if (id === request.current) setLoad({ status: "failed", error }); },
    );
  }, [fetchRepoDiffFiles, paneId, directory]);

  useEffect(() => { if (asked !== null) read(asked); }, [asked, read]);

  const loadRefs = useCallback(() => {
    const id = ++refsRequest.current;
    setRefs({ status: "pending" });
    fetchRepoDiffRefs({ paneId, directory }).then(
      (listing) => { if (id === refsRequest.current) setRefs({ status: "ready", listing }); },
      (error: unknown) => { if (id === refsRequest.current) setRefs({ status: "failed", error }); },
    );
  }, [fetchRepoDiffRefs, paneId, directory]);

  const openPicker = (): void => {
    setActive(0);
    setPickerOpen(true);
    loadRefs();
  };

  useEffect(() => {
    if (!pickerOpen) return;
    // the list sits in the form, under the field and Compare, so it moves with them and covers neither;
    // a click anywhere else closes it once the click is done: closing on the press would move Compare
    // (and what is under it) away from the pointer before it is released
    const onClick = (event: MouseEvent): void => {
      const target = event.target as Node;
      if (!pickerRef.current?.contains(target) && !refsRef.current?.contains(target)) setPickerOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pickerOpen]);

  const refsListing = refs.status === "ready" ? refs.listing : null;
  const typed = baseRef.trim();
  const query = typed.toLowerCase();
  const options = useMemo(() => refsListing === null ? [] : refsListing.refs.filter((ref) => query === "" || refName(ref.name).toLowerCase().includes(query)), [refsListing, query]);
  const activeOption = options[Math.min(active, options.length - 1)];

  useEffect(() => {
    if (!pickerOpen || activeOption === undefined) return;
    const option = document.getElementById(`${listId}-${activeOption.name}`);
    const menu = option?.parentElement;
    if (!option || !menu) return;
    const optionBounds = option.getBoundingClientRect();
    const menuBounds = menu.getBoundingClientRect();
    if (optionBounds.top < menuBounds.top) menu.scrollTop -= menuBounds.top - optionBounds.top;
    else if (optionBounds.bottom > menuBounds.bottom) menu.scrollTop += optionBounds.bottom - menuBounds.bottom;
  }, [pickerOpen, activeOption, listId]);

  const pick = (ref: RepoDiffRefs["refs"][number]): void => {
    setBaseRef(refName(ref.name));
    setPicked(ref);
    setPickerOpen(false);
    baseInputRef.current?.focus();
  };

  const onBaseKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!pickerOpen) { openPicker(); return; }
      const last = Math.max(0, options.length - 1);
      setActive((index) => (event.key === "ArrowDown" ? Math.min(last, index + 1) : Math.max(0, index - 1)));
    } else if (event.key === "Escape" && pickerOpen) {
      // cancel: close the list only, not the dialog around it
      event.preventDefault();
      event.stopPropagation();
      setPickerOpen(false);
    } else if (event.key === "Enter" && pickerOpen && activeOption !== undefined) {
      // a row on the list is taken; with none, Enter submits the typed name
      event.preventDefault();
      pick(activeOption);
    } else if (event.key === "Tab") {
      setPickerOpen(false);
    }
  };

  const choose = (next: RepoDiffScope): void => {
    setScope(next);
    setPickerOpen(false);
    // a list still on its way is no answer for a scope that waits for Compare
    if (next === "commit" || next === "branch") { request.current += 1; setAsked(null); setLoad(PENDING); return; }
    setAsked({ scope: next, base: null, head: null, comparison: null });
  };
  const compare = (event: FormEvent): void => {
    event.preventDefault();
    const from = base.trim();
    if (from === "") return;
    setAsked({ scope: "commit", base: from, head: head.trim() || null, comparison: null });
  };
  const compareBranch = (event: FormEvent): void => {
    event.preventDefault();
    if (typed === "") return;
    setPickerOpen(false);
    // a row picked from the list goes by its full refname, so `main` is the branch and never a tag of that name
    setAsked({ scope: "branch", base: picked !== null && refName(picked.name) === typed ? picked.name : typed, head: null, comparison: null });
  };

  const listing = load.status === "ready" ? load.listing : null;
  // the Branch scope before its first Compare: nothing is read, so nothing is shown as loading
  const awaitingBase = scope === "branch" && asked === null;
  // a file is read from the comparison the list answered for: a commit comparison's hashes, a branch comparison's identity
  const answered: RepoComparison | null = listing === null ? null
    : listing.scope === "branch" ? { scope: "branch", base: refName(asked?.base ?? ""), head: null, comparison: listing.comparison ?? null }
    : { scope: listing.scope, base: listing.base, head: listing.head, comparison: null };
  const repository = listing?.repository ?? last?.repository ?? null;
  const branch = repository === null ? null : repository.branch ?? (repository.unborn ? t("No commits yet") : t("Detached HEAD"));
  // the last list's folders keep the fold-all control steady while the next list is read
  const shown = listing ?? last;
  const tree = useMemo(() => changeTree(shown === null ? [] : shown.files.map((file) => file.path)), [shown]);
  const folders = useMemo(() => changeTreeFolders(tree), [tree]);
  const [folded, setFolded] = useState<ReadonlySet<string>>(() => new Set());
  const allOpen = folders.every((path) => !folded.has(path));
  const toggle = (path: string): void => setFolded((current) => {
    const next = new Set(current);
    if (!next.delete(path)) next.add(path);
    return next;
  });

  const rows = (entries: readonly ChangeTreeEntry[], files: readonly RepoDiffFile[], comparison: RepoComparison): ReactNode[] => entries.map((entry) => {
    const indent = { "--depth": entry.depth } as CSSProperties;
    if (entry.kind === "folder") {
      const open = !folded.has(entry.path);
      return <li key={`folder:${entry.path}`}>
        <button type="button" data-slot="button" className={cn(changeRow, "repo-change-folder")} style={indent} aria-expanded={open} onClick={() => toggle(entry.path)}>
          {/* the fold, in the cell a file's status tag takes, so the folder's glyph lines up with the files' */}
          <span className="repo-change-caret inline-flex w-6 shrink-0 items-center justify-center text-dim [&>svg]:size-3.5" aria-hidden="true">{open ? <ChevronDown /> : <ChevronRight />}</span>
          {open ? <FolderOpen className="repo-change-glyph size-icon shrink-0 text-accent" aria-hidden="true" /> : <Folder className="repo-change-glyph size-icon shrink-0 text-accent" aria-hidden="true" />}
          <span className="repo-change-folder-name min-w-0 flex-1 truncate font-mono text-xs font-medium">{entry.name}</span>
          <span className="repo-change-folder-count ml-auto shrink-0 font-mono text-2xs text-dim tabular-nums" aria-hidden="true">{entry.files.toLocaleString(locale)}</span>
        </button>
        {open && <ul className="repo-change-children m-0 list-none p-0">{rows(entry.entries, files, comparison)}</ul>}
      </li>;
    }
    const file = files[entry.index]!;
    const word = statusWord(t, file.status);
    // the folder is said, not shown: the row sits under it, and assistive tech (and the browser scripts) read the whole path
    const folder = file.path.slice(0, file.path.length - entry.name.length);
    // a rename within the folder names only the old file; one from elsewhere says where from
    const sameFolder = file.old_path !== null && file.old_path.slice(0, file.old_path.lastIndexOf("/") + 1) === folder;
    return <li key={file.path}>
      <button type="button" data-slot="button" className={cn(changeRow, "repo-change")} style={indent} onClick={() => onOpenDiff(comparison, file)}>
        {/* git's letter for the status, in the tone the rows of that kind take in the diff */}
        <Badge tone={statusTone(file.status)} className={cn("repo-change-mark w-6 justify-center px-0 font-mono font-bold", file.status === "untracked" && "bg-transparent shadow-[0_0_0_1px_var(--ink-2)]")} data-status={file.status} aria-hidden="true">{STATUS_MARK[file.status]}</Badge>
        <span className="visually-hidden">{word}</span>
        <FileGlyph name={file.path} className="repo-change-glyph size-icon shrink-0 text-dim" />
        <span className="repo-change-path min-w-0 flex-1 truncate font-mono text-xs" title={file.old_path === null ? file.path : t("Renamed from {path}", { path: file.old_path })}>
          {file.old_path !== null && <span className="repo-change-old text-dim">{sameFolder && folder !== "" && <span className="visually-hidden">{folder}</span>}{sameFolder ? file.old_path.slice(folder.length) : file.old_path} → </span>}{folder !== "" && <span className="visually-hidden">{folder}</span>}{entry.name}
        </span>
        {file.binary === true
          ? <span className="repo-change-counts ml-auto shrink-0 font-mono text-2xs text-dim">{t("Binary")}</span>
          : file.additions !== null && file.deletions !== null && <span className="repo-change-counts ml-auto inline-flex shrink-0 gap-1 font-mono text-2xs text-dim tabular-nums">
            <span className="repo-change-added text-done">+{file.additions.toLocaleString(locale)}</span>
            <span className="repo-change-deleted text-blocked">−{file.deletions.toLocaleString(locale)}</span>
          </span>}
      </button>
    </li>;
  });

  return (
    <TooltipProvider>
      <div className="repo-changes flex flex-col overflow-clip rounded-lg border border-border bg-[color-mix(in_srgb,var(--bg)_40%,var(--bg-elevated))] shadow-lift" role="group" aria-label={t("Changes")} aria-busy={load.status === "pending" && !awaitingBase}>
        <div className="repo-changes-bar flex items-center justify-between gap-2 p-1 divider-b">
          <ToggleGroup type="single" className="repo-changes-scopes" value={scope} aria-label={t("Compare")} onValueChange={(value) => { if (value) choose(value as RepoDiffScope); }}>
            <ToggleGroupItem value="workspace">{t("Working tree")}</ToggleGroupItem>
            <ToggleGroupItem value="staged">{t("Staged")}</ToggleGroupItem>
            <ToggleGroupItem value="commit">{t("Commits")}</ToggleGroupItem>
            <ToggleGroupItem value="branch">{t("Branch")}</ToggleGroupItem>
          </ToggleGroup>
          <div className="repo-changes-tools flex shrink-0 items-center gap-1">
            <IconButton label={allOpen ? t("Collapse all folders") : t("Expand all folders")} className="coarse:size-touch" disabled={folders.length === 0} onClick={() => setFolded(allOpen ? new Set(folders) : new Set())}>
              {allOpen ? <ChevronsDownUp aria-hidden="true" /> : <ChevronsUpDown aria-hidden="true" />}
            </IconButton>
            <IconButton label={t("Refresh changes")} className="coarse:size-touch" disabled={asked === null || load.status === "pending"} onClick={() => asked !== null && read(asked)}>
              <RefreshCw aria-hidden="true" />
            </IconButton>
          </div>
        </div>
        {scope === "commit" && (
          <form className="repo-changes-commits divider-b" onSubmit={compare}>
            <Field label={t("From commit")} htmlFor={fromId} className="min-w-0">
              <Input id={fromId} className="font-mono coarse:h-touch" value={base} onChange={(event) => setBase(event.target.value)} placeholder="HEAD~1" autoComplete="off" spellCheck={false} required />
            </Field>
            <Field label={t("To commit")} htmlFor={toId} className="min-w-0">
              <Input id={toId} className="font-mono coarse:h-touch" value={head} onChange={(event) => setHead(event.target.value)} placeholder="HEAD" autoComplete="off" spellCheck={false} />
            </Field>
            <Button type="submit" variant="accent" size="md" className="coarse:h-touch" disabled={base.trim() === ""}>{t("Compare")}</Button>
          </form>
        )}
        {scope === "branch" && (
          <form className="repo-changes-commits repo-changes-base-form divider-b" onSubmit={compareBranch}>
            <div className="flex min-w-0 flex-col gap-1">
              <Label className="flex h-6 items-center" id={baseLabelId}>{t("Base branch")}</Label>
              {/* the base field with its picker's toggle at its end, as a select's chevron sits */}
              <div className="repo-changes-base relative flex items-center" ref={pickerRef}>
                <Input ref={baseInputRef} className="repo-changes-base-input min-w-0 flex-1 pr-10 font-mono coarse:h-touch coarse:pr-12" role="combobox" aria-labelledby={baseLabelId} aria-autocomplete="list" aria-expanded={pickerOpen} aria-controls={listId}
                  aria-activedescendant={pickerOpen && activeOption !== undefined ? `${listId}-${activeOption.name}` : undefined}
                  value={baseRef} placeholder={t("Branch or commit")} autoComplete="off" spellCheck={false} required
                  onChange={(event) => { setBaseRef(event.target.value); setActive(0); if (!pickerOpen) openPicker(); }}
                  onClick={() => { if (!pickerOpen) openPicker(); }}
                  onKeyDown={onBaseKeyDown} />
                {/* the toggle is a glyph inside the field: the field's edge shows the focus, the glyph's colour the open list */}
                <IconButton label={t("Choose a branch")} className="repo-changes-base-toggle absolute right-0.5 aria-expanded:bg-transparent coarse:size-touch" aria-expanded={pickerOpen} aria-controls={listId}
                  onClick={() => { if (pickerOpen) setPickerOpen(false); else { openPicker(); baseInputRef.current?.focus(); } }}>
                  <ChevronDown aria-hidden="true" />
                </IconButton>
              </div>
            </div>
            <Button type="submit" variant="accent" size="md" className="coarse:h-touch" disabled={typed === ""}>{t("Compare")}</Button>
            {/* a row is made active by a pointer moving over it, not by the list opening under a resting one */}
            {pickerOpen && (
              <div id={listId} ref={refsRef} className={cn(menuSurface, "repo-changes-refs col-span-full max-h-80 animate-none bg-fill-1 shadow-[0_0_0_1px_var(--ink-1),inset_0_0_0_1px_var(--edge-light)] backdrop-filter-none [overscroll-behavior:contain]")} role="listbox" aria-labelledby={baseLabelId} aria-busy={refs.status === "pending"}>
                {refs.status === "pending" && <div className="repo-changes-refs-note p-2 text-sm text-dim" role="status">{t("Loading…")}</div>}
                {refs.status === "failed" && <div className="repo-changes-refs-note repo-changes-error p-2 text-sm text-blocked" role="alert">{diffErrorMessage(t, refs.error)}</div>}
                {refsListing !== null && refsListing.refs.length === 0 && <div className="repo-changes-refs-note p-2 text-sm text-dim">{t("This repository has no branches yet; a commit can still be typed.")}</div>}
                {refsListing !== null && refsListing.refs.length > 0 && options.length === 0 && <div className="repo-changes-refs-note p-2 text-sm text-dim">{t("No branch matches; Compare takes the name as typed.")}</div>}
                {options.map((ref) => (
                  <div key={ref.name} id={`${listId}-${ref.name}`} className={cn(menuItem, "repo-changes-ref aria-selected:bg-fill-3 aria-selected:text-strong coarse:min-h-touch")} role="option" aria-selected={ref === activeOption} title={ref.name}
                    onPointerMove={() => setActive(options.indexOf(ref))} onMouseDown={(event) => event.preventDefault()} onClick={() => pick(ref)}>
                    <GitBranch aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate font-mono text-md">{refName(ref.name)}</span>
                    <span className="shrink-0 font-mono text-xs text-dim">{shortHash(ref.oid)}</span>
                  </div>
                ))}
                {refsListing?.truncated && <div className="repo-changes-refs-note p-2 text-sm text-dim" role="status">{t("Only the first {count} branches are listed; another can be typed by name.", { count: refsListing.limits.max_refs.toLocaleString(locale) })}</div>}
              </div>
            )}
          </form>
        )}
        {repository !== null && (
          <p className="repo-changes-repo m-0 flex items-center gap-2 px-2 py-1 font-mono text-2xs whitespace-nowrap text-dim divider-b" title={repository.root}>
            <span className="repo-changes-branch inline-flex shrink-0 items-center gap-1 text-strong [&>svg]:size-[1.1em] [&>svg]:text-accent"><GitBranch aria-hidden="true" />{branch}</span>
            <span className="repo-changes-root min-w-0 flex-1 overflow-hidden text-left text-ellipsis [direction:rtl]"><span dir="ltr">{repository.root}</span></span>
          </p>
        )}
        {listing?.comparison && answered?.scope === "branch" && (
          <p className="repo-changes-repo repo-changes-identity m-0 flex items-center gap-2 px-2 py-1 font-mono text-2xs text-dim divider-b" title={`${listing.comparison.base_oid}\n${listing.comparison.merge_base_oid}`}>
            <span className="repo-changes-branch inline-flex min-w-0 flex-1 items-start gap-1 [&>svg]:mt-[0.15em] [&>svg]:size-[1.1em] [&>svg]:shrink-0 [&>svg]:text-accent"><GitMerge aria-hidden="true" />{t("Compared from {hash}, the merge base with {base}", { hash: shortHash(listing.comparison.merge_base_oid), base: answered.base ?? "" })}</span>
          </p>
        )}
        {load.status === "failed"
          ? <p className={cn(note, "repo-changes-note repo-changes-error text-blocked")} role="alert">{diffErrorMessage(t, load.error)}</p>
          : <ul className="repo-changes-list m-0 list-none overflow-y-auto p-1 [overscroll-behavior:contain]" aria-label={t("Changed files")} data-scope={listing?.scope} data-merge-base={listing?.comparison?.merge_base_oid}>
            {awaitingBase && <li className={cn(note, "repo-changes-note")}>{t("Choose a base, then Compare.")}</li>}
            {load.status === "pending" && !awaitingBase && <li className="repo-changes-loading" role="status">
              <span className="visually-hidden">{t("Loading…")}</span>
              {skeletonRows(last === null ? null : last.files.length).map((width, index) => <span key={index} className="repo-change-skeleton flex min-h-9 items-center gap-2 px-2 coarse:min-h-touch" aria-hidden="true">
                <Skeleton className="repo-change-skeleton-mark h-chip w-6 rounded-sm" />
                <Skeleton className="repo-change-skeleton-glyph size-icon rounded-sm" />
                <Skeleton width={width} />
                <Skeleton className="repo-change-skeleton-counts ml-auto w-[3em]" />
              </span>)}
            </li>}
            {listing !== null && answered !== null && rows(tree, listing.files, answered)}
            {listing !== null && listing.files.length === 0 && <li className={cn(note, "repo-changes-note")}>{nothingChangedWord(t, listing.scope)}</li>}
            {listing?.truncated && <li className={cn(note, "repo-changes-note")} role="status">
              {listing.total === null
                ? t("The list was cut short; only the first {count} files are shown.", { count: listing.files.length.toLocaleString(locale) })
                : t("Showing the first {count} of {total} changed files.", { count: listing.files.length.toLocaleString(locale), total: listing.total.toLocaleString(locale) })}
            </li>}
          </ul>}
      </div>
    </TooltipProvider>
  );
}
