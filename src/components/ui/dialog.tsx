/**
 * shadcn Dialog on Radix: a card centred under a blurred scrim from 641px, a sheet up from the
 * bottom edge on a phone (variant="sheet", or auto under the width). Title at 16/550, set into
 * the surface; the zones part on etched dividers (DialogHeader / DialogFooter).
 */
import { Dialog as DialogPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn.ts";
import { X } from "../../lib/icons.ts";
import { Button } from "./button.tsx";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;

const contentVariants = {
  modal: "top-1/2 left-1/2 max-h-[calc(100dvh-64px)] w-[calc(100%-32px)] max-w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-dialog duration-200 data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out",
  sheet: "inset-x-0 bottom-0 max-h-[92dvh] w-full rounded-t-2xl pb-[env(safe-area-inset-bottom,0px)] shadow-dialog data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out",
} as const;

export function DialogOverlay({ className, ...props }: ComponentProps<typeof DialogPrimitive.Overlay>) {
  return <DialogPrimitive.Overlay data-slot="dialog-overlay" className={cn("fixed inset-0 z-30 bg-scrim backdrop-scrim data-[state=open]:animate-fade-in", className)} {...props} />;
}

export function DialogContent({ className, children, variant = "modal", closeLabel = "Close", ...props }: ComponentProps<typeof DialogPrimitive.Content> & { variant?: keyof typeof contentVariants; closeLabel?: string }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content data-slot="dialog-content" className={cn("fixed z-30 flex flex-col overflow-clip bg-elevated text-text outline-none", contentVariants[variant], className)} {...props}>
        {children}
        <DialogPrimitive.Close asChild>
          <Button variant="ghost" size="icon" aria-label={closeLabel} className="absolute top-3 right-3 text-dim"><X /></Button>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

export function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="dialog-header" className={cn("flex shrink-0 flex-col gap-0.5 px-5 py-4 pr-14 divider-b", className)} {...props} />;
}

export function DialogBody({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="dialog-body" className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-4", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="dialog-footer" className={cn("flex shrink-0 justify-end gap-2 px-5 py-3 divider-t", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title data-slot="dialog-title" className={cn("text-lg font-medium text-strong text-engraved text-balance", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description data-slot="dialog-description" className={cn("text-sm text-dim", className)} {...props} />;
}
