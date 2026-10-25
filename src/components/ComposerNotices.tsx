import { X } from "../lib/icons.ts";
import type { ReactNode } from "react";

import "./ComposerNotices.css";

import { isDismissible, type ComposerNotice } from "../lib/composerNotices.ts";
import { useT } from "../lib/i18n.ts";
import { Alert, IconButton, TooltipProvider } from "./ui/index.ts";

export interface ComposerNoticeRow extends ComposerNotice {
  /** another app holds the pane, the output stream failed: the notice tone */
  warning: boolean;
  mark: ReactNode;
  text: ReactNode;
  actions?: ReactNode;
}

interface ComposerNoticesProps {
  /** as arranged by lib/composerNotices.ts: the top row first */
  notices: readonly ComposerNoticeRow[];
  onDismiss: (notice: ComposerNoticeRow) => void;
  /** what the group is, for assistive tech; the pane's notices by default */
  label?: string;
}

/** The notices over the input card: an Alert row per notice, its own way on at its end, then its dismiss (an activity has none). */
export function ComposerNotices({ notices, onDismiss, label }: ComposerNoticesProps) {
  const t = useT();
  return (
    <TooltipProvider>
    <section className="composer-notices" aria-label={label ?? t("Notices")}>
      {notices.map((notice) => (
        <Alert key={notice.id} tone={notice.warning ? "notice" : "neutral"} role="status" className={`composer-notice${notice.warning ? " is-warning" : ""}`}>
          <span className="composer-notice-mark" aria-hidden="true">{notice.mark}</span>
          <span className="composer-notice-text">{notice.text}</span>
          <span className="composer-notice-actions">
            {notice.actions}
            {isDismissible(notice) && (
              <IconButton className="composer-notice-dismiss" label={t("Dismiss notice")} onClick={() => onDismiss(notice)}>
                <X aria-hidden="true" />
              </IconButton>
            )}
          </span>
        </Alert>
      ))}
    </section>
    </TooltipProvider>
  );
}
