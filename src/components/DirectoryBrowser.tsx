import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { ArrowUp, ChevronRight, FolderPlus, House } from "../lib/icons.ts";

import "./DirectoryBrowser.css";
import { FileGlyph } from "./FileGlyph.tsx";
import { Button, Checkbox, Field, IconButton, Input, Label, TooltipProvider } from "./ui/index.ts";

import type { DirectoryListing } from "../../shared/protocol.ts";
import { ApiError } from "../lib/api.ts";
import { formatBytes } from "../lib/bridgeProgress.ts";
import { cn } from "../lib/cn.ts";
import { useMachineApi } from "../lib/machineContext.tsx";
import { useT } from "../lib/i18n.ts";
import { resolveWorkspaceRoot, workspaceRelativePath } from "../lib/workspacePath.ts";
import { homeRelative, subscribeFilesFolder, takeFilesFolder } from "../lib/paletteFolders.ts";

export { homeRelative };

export interface DirectoryBrowserProps {
  /** where to open: the path typed so far (absolute, `~` or `~/…`); empty or unreadable opens home */
  start: string;
  /** the folder chosen, in the dialog's own syntax (`~/…` inside home); without it there is no "Use this folder" */
  onPick?: (path: string) => void;
  /** lists files too, and opens the one clicked (its absolute path) */
  onOpenFile?: (path: string) => void;
  /** told the folder shown (its absolute path, and the PC's home) each time one opens; New workspace drafts Directory from it */
  onFolder?: (path: string, home: string) => void;
}

function childPath(parent: string, name: string): string {
  return parent.endsWith("/") ? `${parent}${name}` : `${parent}/${name}`;
}

/** a row of the listing: a glyph, a name, and what trails it (a folder's chevron, a file's size) */
const row = "group flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-left text-sm text-text outline-none transition-[background-color,color] duration-150 ease-in-out hover:bg-fill-2 hover:text-strong focus-visible:bg-fill-2 focus-visible:ring-2 focus-visible:ring-accent/60 disabled:pointer-events-none disabled:opacity-50 coarse:min-h-touch [&>svg]:size-icon [&>svg]:shrink-0";

const note = "m-0 px-3 py-2 text-sm text-dim";

/**
 * The folder shown, as the path bar says it (`~/…` inside home, the workspace's part in Files),
 * one crumb per folder on the way: each opens its folder. The absolute path's last segments are
 * the shown path's, so a crumb's folder is read off the absolute path by its place from the end;
 * a shown path the absolute one does not end with (another separator) is drawn, not offered.
 */
export function pathCrumbs(shown: string, absolute: string): { label: string; path: string | null }[] {
  const parts = shown.split("/");
  const whole = absolute.replace(/\/+$/u, "").split("/");
  const offered = whole.length >= parts.length && whole.slice(whole.length - parts.length + 1).join("/") === parts.slice(1).join("/");
  return parts.map((part, index) => ({
    label: part === "" ? "/" : part,
    path: offered ? whole.slice(0, whole.length - parts.length + index + 1).join("/") || "/" : null,
  }));
}

/**
 * A folder browser for the new-session dialog: one directory at a time, fetched from the
 * PC the session starts on. Nothing is kept but the folder shown now.
 */
export function DirectoryBrowser({ start, onPick, onOpenFile, onFolder }: DirectoryBrowserProps) {
  const t = useT();
  const { fetchDirectories, createDirectory } = useMachineApi();
  const [listing, setListing] = useState<DirectoryListing | null>(null);
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // New folder: the name being typed (null: no field), and why the last try failed
  const [naming, setNaming] = useState<string | null>(null);
  const [namingError, setNamingError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const request = useRef(0);
  const listRef = useRef<HTMLUListElement>(null);
  const crumbsRef = useRef<HTMLSpanElement>(null);
  const filterId = useId();
  const hiddenId = useId();
  const shownPath = listing?.path;
  // home shown in place of a path that does not open was not opened by the user: the typed path stays
  const fellBack = useRef(false);
  // counts moves to another folder; a refresh of the one shown (Show hidden) is not one
  const moves = useRef(0);
  // Show hidden as it is when a made folder opens, not as it was when making it began
  const hiddenRef = useRef(hidden);
  hiddenRef.current = hidden;
  const shownByFallback = useRef(false);
  useEffect(() => { if (listing && !shownByFallback.current) onFolder?.(listing.path, listing.home); }, [shownPath]);
  // a long path keeps its end in view, the part that says where you are
  useLayoutEffect(() => {
    const crumbs = crumbsRef.current;
    if (crumbs !== null) crumbs.scrollLeft = crumbs.scrollWidth;
  }, [shownPath]);

  const open = useCallback(async (path: string, showHidden: boolean, fallbackHome: boolean) => {
    const id = ++request.current;
    if (path !== listing?.path) moves.current++;
    const fallback = fellBack.current;
    fellBack.current = false;
    setLoading(true);
    try {
      const next = await fetchDirectories(path, showHidden, onOpenFile !== undefined);
      if (id !== request.current) return;
      if (listing !== null && next.path !== listing.path) setQuery("");
      shownByFallback.current = fallback;
      setListing(next);
      setError(null);
      listRef.current?.scrollTo({ top: 0 });
    } catch (reason: unknown) {
      if (id !== request.current) return;
      // a path typed half-way opens home instead of an error
      if (fallbackHome && reason instanceof ApiError && reason.code === "invalid_cwd") {
        fellBack.current = true;
        return void open("", showHidden, false);
      }
      setError(reason instanceof ApiError && reason.status === 404
        ? t("This PC's bridge cannot browse folders yet. Type the path instead.")
        : reason instanceof ApiError && reason.code === "invalid_cwd" ? t("This folder cannot be opened.") : t("Folders could not be loaded."));
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, [fetchDirectories, listing, onOpenFile, t]);

  // Files opens on a folder the palette picked (lib/paletteFolders.ts) instead of the pane's own,
  // also when it is open already
  const openRef = useRef(open);
  openRef.current = open;
  useEffect(() => {
    const requested = onOpenFile ? takeFilesFolder() : null;
    void open(requested ?? start, false, requested === null);
    if (!onOpenFile) return;
    return subscribeFilesFolder(() => {
      const next = takeFilesFolder();
      if (next === null) return;
      setHidden(false);
      void openRef.current(next, false, false);
    });
  }, []);

  // makes the folder inside the one shown and opens it, so New workspace's Directory follows
  const makeFolder = async () => {
    if (listing === null || naming === null || naming.trim() === "" || creating) return;
    setCreating(true);
    // the user may open another folder while the folder is made: then the made one is not opened
    const asked = moves.current;
    try {
      const made = await createDirectory(listing.path, naming);
      setNaming(null);
      setNamingError(null);
      if (moves.current === asked) void open(made.path, hiddenRef.current, false);
    } catch (reason: unknown) {
      const code = reason instanceof ApiError ? reason.code : null;
      setNamingError(code === "folder_exists" ? t("Something with that name is already here.")
        : code === "invalid_name" ? t("That name cannot be a folder name.")
        : code === "permission_denied" ? t("No permission to make a folder here.")
        // a PC on an older version answers the listing's own GET-only refusal
        : code === "method_not_allowed" || (reason instanceof ApiError && reason.status === 404) ? t("This PC's bridge cannot make folders yet.")
        : t("The folder could not be made."));
    } finally {
      setCreating(false);
    }
  };

  const path = listing?.path ?? "";
  const homeShown = listing ? homeRelative(listing.path, listing.home) : start || "~";
  // browsing files reads from the folder opened on; picking a folder keeps the `~/…` form it hands back
  const shown = listing && onPick === undefined ? workspaceRelativePath(listing.path, resolveWorkspaceRoot(start, listing.home), homeShown) : homeShown;
  const crumbs = pathCrumbs(shown, path);
  const normalizedQuery = query.trim().toLowerCase();
  const directories = listing === null || onPick === undefined || normalizedQuery === ""
    ? listing?.directories
    : listing.directories.filter((name) => name.toLowerCase().includes(normalizedQuery));

  return (
    <TooltipProvider>
      <div className="dir-browser flex flex-col overflow-clip rounded-lg bg-[color-mix(in_srgb,var(--bg)_40%,var(--bg-elevated))] shadow-panel" role="group" aria-label={t("Choose a folder")} aria-busy={loading}>
        <div className="dir-browser-bar flex items-center gap-1 p-1 divider-b">
          <IconButton label={t("Parent folder")} className="coarse:size-touch" disabled={!listing?.parent || loading} onClick={() => listing?.parent && void open(listing.parent, hidden, false)}>
            <ArrowUp aria-hidden="true" />
          </IconButton>
          <IconButton label={t("Home folder")} className="coarse:size-touch" disabled={loading || (listing !== null && listing.path === listing.home)} onClick={() => void open("", hidden, false)}>
            <House aria-hidden="true" />
          </IconButton>
          {/* the path as crumbs, each a quiet word that opens its folder; the title is the whole path */}
          <span ref={crumbsRef} className="dir-browser-path flex min-w-0 flex-1 items-center overflow-x-auto px-1 font-mono text-xs whitespace-nowrap" title={path}>
            <span dir="ltr" className="flex items-center">
              {crumbs.map((crumb, index) => {
                const last = index === crumbs.length - 1;
                const separated = index > 0 && !(index === 1 && crumbs[0]!.label === "/");
                return <span key={index} className="flex items-center">
                  {separated && <span aria-hidden="true" className="text-dim">/</span>}
                  <Button variant="crumb" size="bare" className={cn("h-6 px-0.5 font-mono text-xs", last && "text-strong")} aria-current={last ? "location" : undefined}
                    disabled={loading || crumb.path === null || last} onClick={() => crumb.path !== null && void open(crumb.path, hidden, false)}>{crumb.label}</Button>
                </span>;
              })}
            </span>
          </span>
          {onPick !== undefined && (
            <IconButton label={t("New folder")} className="coarse:size-touch" aria-expanded={naming !== null} disabled={listing === null || loading || error !== null} onClick={() => setNaming((current) => current ?? "")}>
              <FolderPlus aria-hidden="true" />
            </IconButton>
          )}
        </div>
        {naming !== null && (
          <div className="dir-browser-new flex flex-col gap-1 p-2 divider-b">
            {/* inside New workspace's form: Enter makes the folder rather than starting the workspace,
                Escape closes this field rather than the dialog, and an IME keeps its own keys */}
            <Input aria-label={t("New folder name")} placeholder={t("New folder name")} autoFocus value={naming} readOnly={creating}
              autoComplete="off" autoCapitalize="off" spellCheck={false} aria-invalid={namingError !== null}
              onChange={(event) => { setNaming(event.target.value); setNamingError(null); }}
              onBlur={() => { if (naming.trim() === "") setNaming(null); }}
              onKeyDown={(event) => {
                if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) {
                  event.stopPropagation();
                  return;
                }
                if (event.key === "Enter") {
                  event.preventDefault();
                  void makeFolder();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  event.stopPropagation();
                  setNaming(null);
                  setNamingError(null);
                }
              }} />
            {namingError !== null && <p className="dir-browser-note dir-browser-error m-0 text-xs text-blocked" role="alert">{namingError}</p>}
          </div>
        )}
        {onPick !== undefined && (
          <Field label={t("Filter folders")} htmlFor={filterId} className="dir-browser-search w-auto p-2">
            {/* a touch screen would raise its keyboard over the list just opened; Escape clears the
                filter before it reaches the dialog's own Escape, which closes the dialog */}
            <Input id={filterId} type="search" value={query} autoFocus={window.matchMedia?.("(pointer: coarse)").matches !== true}
              autoComplete="off" spellCheck={false}
              onChange={(event) => { setQuery(event.target.value); listRef.current?.scrollTo({ top: 0 }); }}
              onKeyDown={(event) => {
                // Enter confirms an IME candidate; Escape dismisses it, not this dialog.
                if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) {
                  event.stopPropagation();
                  return;
                }
                if (event.key === "Enter") event.preventDefault();
                if (event.key === "Escape" && query !== "") {
                  event.preventDefault();
                  event.stopPropagation();
                  setQuery("");
                }
              }} />
          </Field>
        )}
        {error !== null ? <p className={cn(note, "dir-browser-note dir-browser-error text-blocked")} role="alert">{error}</p> : (
          <ul className="dir-browser-list m-0 list-none overflow-y-auto p-1 [overscroll-behavior:contain]" ref={listRef}>
            {listing === null && <li className={cn(note, "dir-browser-note")} role="status">{t("Loading…")}</li>}
            {directories?.map((name) => (
              <li key={name}>
                <button type="button" data-slot="button" className={cn(row, "dir-browser-item [&>svg]:text-accent")} disabled={loading} onClick={() => void open(childPath(path, name), hidden, false)}>
                  <FileGlyph name={name} kind="directory" />
                  <span className="min-w-0 flex-1 truncate">{name}</span>
                  <ChevronRight aria-hidden="true" className="ml-auto size-4! text-dim opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 coarse:opacity-100" />
                </button>
              </li>
            ))}
            {onOpenFile !== undefined && listing?.files?.map((file) => (
              <li key={`file:${file.name}`}>
                <button type="button" data-slot="button" className={cn(row, "dir-browser-item is-file [&>svg]:text-dim")} disabled={loading} onClick={() => onOpenFile(childPath(path, file.name))}>
                  <FileGlyph name={file.name} />
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  <span className="dir-browser-size ml-auto shrink-0 text-2xs text-dim tabular-nums">{formatBytes(file.size)}</span>
                </button>
              </li>
            ))}
            {listing !== null && onPick !== undefined && normalizedQuery !== "" && directories?.length === 0 && <li className={cn(note, "dir-browser-note")} role="status">{t("No matching folders")}</li>}
            {listing !== null && normalizedQuery === "" && listing.directories.length === 0 && (listing.files ?? []).length === 0 && <li className={cn(note, "dir-browser-note")}>{t(onOpenFile ? "Nothing here" : "No folders here")}</li>}
            {listing?.truncated && <li className={cn(note, "dir-browser-note")}>{t("Showing the first {n} folders; type the rest of the path to go further.", { n: listing.directories.length })}</li>}
            {listing?.truncated && onPick !== undefined && <li className={cn(note, "dir-browser-note")}>{t("Search is limited to the {n} loaded folders.", { n: listing.directories.length })}</li>}
          </ul>
        )}
        <div className="dir-browser-footer flex items-center justify-between gap-2 p-2 divider-t">
          <span className="flex items-center gap-2 pl-1">
            <Checkbox id={hiddenId} checked={hidden} disabled={loading && listing === null} onCheckedChange={(checked) => { const next = checked === true; setHidden(next); if (listing) void open(listing.path, next, false); }} />
            <Label htmlFor={hiddenId} className="cursor-pointer text-sm font-regular text-dim">{t("Show hidden")}</Label>
          </span>
          {onPick && <Button variant="accent" size="sm" disabled={listing === null || loading} onClick={() => listing && onPick(homeRelative(listing.path, listing.home))}>
            {t("Use this folder")}
          </Button>}
        </div>
      </div>
    </TooltipProvider>
  );
}
