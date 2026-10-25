/**
 * A yes-or-no question before something that cannot be undone. Cancel takes the focus, so Enter
 * answers no; Escape and the scrim answer no as well, and Tab stays between the two buttons. A
 * no gives the focus back to what opened the dialog; after a yes the owner decides, since the
 * row that opened it is usually gone. The action runs here, so its failure shows in the dialog.
 * A refusal the owner named (git refusing a dirty checkout) turns the action into its escalation
 * (Delete anyway), with the refusal's own words above it. The dialog is the shadcn one on Radix,
 * which holds the focus, stacks under another Radix dialog (Settings) and takes the scrim's click.
 */
import { useEffect, useId, useRef, useState } from "react";

import "./ConfirmDialog.css";

import { ApiError } from "../lib/api.ts";
import { useT } from "../lib/i18n.ts";
import { useSheetSwipe } from "../lib/sheets.ts";
import { usePhoneSheetBack } from "../lib/sheetHistory.ts";
import { Button } from "./ui/button.tsx";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog.tsx";

interface Props {
  title: string;
  body: string;
  confirmLabel: string;
  /** resolves once the deed is done; the owner then takes the dialog down */
  onConfirm: () => Promise<void>;
  /** when the deed is refused with this error code, the action becomes this one */
  escalation?: { label: string; code: string; run: () => Promise<void> };
  onClose: () => void;
}

const SHEET_QUERY = "(max-width: 640px)";

export function ConfirmDialog({ title, body, confirmLabel, onConfirm, escalation, onClose }: Props) {
  const t = useT();
  const id = useId();
  const cancel = useRef<HTMLButtonElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  const [pending, setPending] = useState(false);
  useSheetSwipe(surface, pending ? null : onClose);
  usePhoneSheetBack(() => { if (pending) return false; onClose(); });
  const [error, setError] = useState<string | null>(null);
  const [escalated, setEscalated] = useState(false);
  const sheet = typeof window !== "undefined" && window.matchMedia?.(SHEET_QUERY).matches === true;

  // both buttons disable while the deed runs, which would drop the focus into the page: the
  // dialog itself holds it, and Tab stays put until the dialog goes
  useEffect(() => { if (pending) surface.current?.focus(); }, [pending]);

  const confirm = async (): Promise<void> => {
    setPending(true);
    setError(null);
    const deed = escalated && escalation ? escalation.run : onConfirm;
    try { await deed(); done.current = true; }
    catch (reason: unknown) {
      setError(reason instanceof ApiError ? reason.detail : reason instanceof Error ? reason.message : String(reason));
      if (!escalated && escalation && reason instanceof ApiError && reason.code === escalation.code) setEscalated(true);
      setPending(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
      <DialogContent
        ref={surface}
        role="alertdialog"
        variant={sheet ? "sheet" : "modal"}
        className="confirm-dialog"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-body`}
        closeLabel={t("Cancel")}
        onOpenAutoFocus={(event) => { event.preventDefault(); cancel.current?.focus(); }}
        // after a yes the row that opened the dialog is usually gone: the owner places the focus
        onCloseAutoFocus={(event) => { if (done.current) event.preventDefault(); }}
        // Escape is this dialog's while it is up, even while the deed runs and cannot be undone
        onEscapeKeyDown={(event) => { if (pending) event.preventDefault(); }}
        onInteractOutside={(event) => { if (pending) event.preventDefault(); }}
      >
        <DialogHeader><DialogTitle id={`${id}-title`}>{title}</DialogTitle></DialogHeader>
        <div className="modal-body">
          <DialogDescription asChild><p className="confirm-body" id={`${id}-body`}>{body}</p></DialogDescription>
          {error && <p className="confirm-error" role="alert">{error}</p>}
        </div>
        <DialogFooter>
          <Button ref={cancel} variant="field" disabled={pending} onClick={onClose}>{t("Cancel")}</Button>
          <Button variant="danger" disabled={pending} onClick={() => void confirm()}>{escalated && escalation ? escalation.label : confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
