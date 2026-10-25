import { useState, type ReactNode } from "react";
import { ExternalLink, Globe, RotateCw, X } from "../lib/icons.ts";
import { useT } from "../lib/i18n.ts";
import { IconButton, TooltipProvider } from "./ui/index.ts";
import "./FileViewer.css";

export interface WebPanelProps {
  url: string;
  onClose: () => void;
  panelStart?: ReactNode;
}

/**
 * A page served by this PC beside the pane, in the file panel's place and chrome. The frame is a
 * cross-origin page (another port), so its scripts and storage are its own; the sandbox still
 * keeps it from navigating this window.
 */
export function WebPanel({ url, onClose, panelStart }: WebPanelProps) {
  const t = useT();
  const [loads, setLoads] = useState(0);
  const { host, pathname, search } = new URL(url);
  const label = `${host}${pathname === "/" ? "" : pathname}${search}`;
  return (
    <TooltipProvider>
      <aside className="file-panel web-panel" aria-label={label}>
        {panelStart}
        <section className="file-viewer file-viewer-docked">
          <header className="file-viewer-header file-viewer-header-docked flex min-h-[calc(var(--control-h)+var(--space-2))] items-center gap-2 pr-2 pl-3 divider-b">
            <Globe aria-hidden="true" className="file-viewer-glyph size-4 shrink-0 text-dim" />
            <h2 className="file-viewer-name m-0 flex min-w-0 flex-1 text-sm leading-tight font-medium whitespace-nowrap text-strong" title={url}><span className="file-viewer-stem min-w-0 truncate">{label}</span></h2>
            <div className="file-viewer-actions flex shrink-0 items-center gap-1">
              <IconButton label={t("Reload page")} className="file-viewer-action" onClick={() => setLoads((count) => count + 1)}><RotateCw aria-hidden="true" /></IconButton>
              <IconButton asChild label={t("Open in a new tab")} className="file-viewer-action"><a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink aria-hidden="true" /></a></IconButton>
            </div>
            <IconButton label={t("Close page")} className="file-viewer-action file-viewer-close" onClick={onClose}><X aria-hidden="true" /></IconButton>
          </header>
          <div className="file-viewer-body">
            <iframe key={`${url}#${loads}`} className="file-viewer-page" src={url} title={label}
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-downloads" />
          </div>
        </section>
      </aside>
    </TooltipProvider>
  );
}
