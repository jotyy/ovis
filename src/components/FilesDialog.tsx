import { useEffect, useRef, useState } from "react";
import { FolderSearch, X } from "../lib/icons.ts";

import "./FilesDialog.css";
import { DirectoryBrowser } from "./DirectoryBrowser.tsx";
import { RepoChanges } from "./RepoChanges.tsx";
import { Button, DialogBody, DialogHeader, IconButton, Tabs, TabsContent, TabsList, TabsTrigger, TooltipProvider } from "./ui/index.ts";
import type { RepoDiffFile } from "../../shared/protocol.ts";
import { useT } from "../lib/i18n.ts";
import type { RepoComparison } from "../lib/repoDiff.ts";
import { nativeModalOver, useFocusTrap } from "../lib/useFocusTrap.ts";
import { useSheetSwipe } from "../lib/sheets.ts";
import { usePhoneSheetBack } from "../lib/sheetHistory.ts";
import { useMediaQuery } from "../lib/useMediaQuery.ts";

export interface FilesDialogProps {
  /** the folder to open at: the pane's own */
  start: string;
  /** the pane whose repository's changes are listed */
  paneId: string;
  /** a file or a diff is open above this dialog: Escape belongs to it, which closes first */
  viewing: boolean;
  onOpenFile: (path: string) => void;
  onOpenDiff: (comparison: RepoComparison, file: RepoDiffFile) => void;
  /** the command palette, already browsing this folder (it opens above this dialog) */
  onBrowseFolders: (path: string) => void;
  onClose: () => void;
}

type Tab = "browse" | "changes";

/** The files of the pane's folder (and any other), each opened in the file viewer, and the changes of its repository, each opened as a diff. */
export function FilesDialog({ start, paneId, viewing, onOpenFile, onOpenDiff, onBrowseFolders, onClose }: FilesDialogProps) {
  const t = useT();
  const phone = useMediaQuery("(max-width: 480px)");
  const surface = useFocusTrap<HTMLElement>(true);
  const [tab, setTab] = useState<Tab>("browse");
  // the changes are read with the first visit and kept, as the browser keeps its folder
  const [changesVisited, setChangesVisited] = useState(false);
  useSheetSwipe(surface, onClose);
  // a file opened from the list is drawn over it with an entry of its own: Back closes the file first
  usePhoneSheetBack(onClose, !viewing);
  useEffect(() => {
    if (viewing) return;
    // a native modal over it (Add PC, from the palette) takes its own Escape
    const onKey = (event: KeyboardEvent): void => { if (event.key === "Escape" && !nativeModalOver(surface.current)) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, viewing]);
  const show = (next: Tab): void => {
    setTab(next);
    if (next === "changes") setChangesVisited(true);
  };
  // the folder the browser shows now (it tells each one it opens), for the pane it showed it for;
  // else the one the dialog opened at
  const folder = useRef<{ pane: string; path: string } | null>(null);
  const browseFolders = (): void => onBrowseFolders(folder.current?.pane === paneId ? folder.current.path : (start || "~"));
  return (
    <div className="modal-scrim" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={surface} className="modal files-dialog relative" role="dialog" aria-modal="true" aria-labelledby="files-dialog-title" tabIndex={-1}>
        <TooltipProvider>
          <Tabs value={tab} onValueChange={(value) => show(value as Tab)} className="flex min-h-0 flex-1 flex-col">
            <DialogHeader className="flex-row items-center gap-3 pr-24">
              <h2 className="min-w-0 flex-1 truncate text-lg font-medium text-strong text-engraved" id="files-dialog-title">{t("Files")}</h2>
              <TabsList className="files-dialog-tabs shrink-0" aria-label={t("Show")}>
                <TabsTrigger value="browse">{t("Browse")}</TabsTrigger>
                <TabsTrigger value="changes">{t("Changes")}</TabsTrigger>
              </TabsList>
              <span className="absolute top-3 right-3 flex items-center gap-1">
                {!phone && <IconButton label={t("Browse folders in the palette")} onClick={browseFolders}><FolderSearch aria-hidden="true" /></IconButton>}
                <Button variant="ghost" size="icon" className="text-dim" aria-label={t("Close files")} onClick={onClose}><X aria-hidden="true" /></Button>
              </span>
            </DialogHeader>
            <DialogBody>
              {/* the dialog stays open across a pane switch (Next pane): the browser starts over on the new
                  pane's folder, as Changes reads the new pane, instead of listing the pane it was opened on */}
              <TabsContent value="browse" forceMount hidden={tab !== "browse"}><DirectoryBrowser key={paneId} start={start} onOpenFile={onOpenFile} onFolder={(path) => { folder.current = { pane: paneId, path }; }} /></TabsContent>
              <TabsContent value="changes" forceMount hidden={tab !== "changes"}>{changesVisited && <RepoChanges paneId={paneId} directory={start} onOpenDiff={onOpenDiff} />}</TabsContent>
            </DialogBody>
          </Tabs>
        </TooltipProvider>
      </section>
    </div>
  );
}
