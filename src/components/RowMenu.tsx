/**
 * The ⋯ menu of a sidebar row. On a desktop it is a Radix dropdown (components/ui/dropdown-menu)
 * placed by a trigger nobody sees: a fixed box standing where the button is, or at the pointer
 * for a right-click, since the roster scrolls and a menu inside it would be cut off at the list's
 * edge. At phone width it is the modal primitive, which is already a bottom sheet there, with the
 * swipe-down and the drop of lib/sheets.ts. The system Back closes the sheet (lib/sheetHistory.ts).
 * Escape, a press outside, focus leaving it (the palette opening over it, a Tab out) and, on a
 * desktop, a scroll of what holds the button or a resize close it. Focus goes back to the button
 * when the menu goes, unless what an item mounted (a rename field, a confirm) takes it first: the
 * button is focused in a layout cleanup, before a new field's autoFocus and a dialog's own focus,
 * and Radix's own return of focus is waved off.
 */
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type FocusEvent, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, type IconComponent } from "../lib/icons.ts";

import "./RowMenu.css";

import { cn } from "../lib/cn.ts";
import { useT } from "../lib/i18n.ts";
import { useMediaQuery } from "../lib/useMediaQuery.ts";
import { SHEET_QUERY, useSheetSwipe } from "../lib/sheets.ts";
import { useSheetHistory } from "../lib/sheetHistory.ts";
import { Button } from "./ui/button.tsx";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu.tsx";

export interface RowMenuItem {
  id: string;
  label: string;
  /** a state in words, after the label: "On in the app" */
  hint?: string;
  /** the item's tooltip, when it has more to say than its label */
  title?: string;
  icon: IconComponent;
  /** drawn in the icon's place when given: an agent's mark, which is not a lucide icon */
  glyph?: ReactNode;
  /** a hairline above this item */
  divider?: boolean;
  danger?: boolean;
  /** the item that stands for what is open now (a pane picker's current pane) */
  current?: boolean;
  /** a switch's state, when the item is one: it is then a checkbox item (a pressed button in the sheet), not a plain item */
  checked?: boolean;
  /** shown with its state but not runnable here (a watching device and a shared switch): it keeps its place in the keyboard order, and a press on it leaves the menu open */
  disabled?: boolean;
  run: () => void;
}

interface Props {
  anchor: HTMLElement;
  /** A native context menu opens at the pointer, without focusing its target first. */
  point?: { x: number; y: number };
  restoreFocusTo?: HTMLElement | null;
  /** the menu's accessible name, and the sheet's title */
  title: string;
  subtitle?: string;
  /** a phone's sheet only, under the subtitle and wrapped, not cut: text a row cuts (a hover tooltip says it on a desktop) */
  detail?: string;
  /** drawn above the items, and in the sheet's head in the title's place: what the menu is about, when that is more than a name */
  header?: ReactNode;
  items: RowMenuItem[];
  /** which edge of the button the popover lines up with: its right one (a row's ⋯), or its left one (a tab) */
  align?: "start" | "end";
  onClose: () => void;
  /** `paths`: each hint is a path; the menu is wider and a long path gives way before its label */
  variant?: "paths";
}

const GAP = 4;
const EDGE = 8;
const POPOVER_ITEMS = '[role="menuitem"], [role="menuitemcheckbox"]';
// the sheet is modal: its Cancel is one of the stops
const SHEET_ITEMS = '.row-sheet-item, .row-sheet-cancel';

export function RowMenu({ anchor, point, restoreFocusTo, title, subtitle, detail, header, items, align = "end", onClose, variant }: Props) {
  const t = useT();
  const sheet = useMediaQuery(SHEET_QUERY);
  const surface = useRef<HTMLDivElement>(null);
  useSheetSwipe(surface, sheet ? onClose : null);
  // Back closes the sheet, not the pane under it
  useSheetHistory(sheet, onClose);
  // where the button was when the menu opened: the trigger stands there, and a scroll that moves
  // the button away from it closes the menu rather than having it follow
  const [box] = useState(() => {
    const rect = anchor.getBoundingClientRect();
    return point ? { top: point.y, left: point.x, width: 0, height: 0 } : { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
  });
  const placedAt = useRef<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => () => {
    const target = restoreFocusTo === undefined ? anchor : restoreFocusTo;
    if (target?.isConnected) target.focus({ preventScroll: true });
  }, [anchor, restoreFocusTo]);

  useLayoutEffect(() => {
    if (sheet) return;
    if (!anchor.isConnected) { onClose(); return; }
    const rect = anchor.getBoundingClientRect();
    placedAt.current = { top: rect.top, left: rect.left };
  }, [anchor, onClose, sheet]);

  useEffect(() => {
    const first = surface.current?.querySelector<HTMLElement>(sheet ? SHEET_ITEMS : POPOVER_ITEMS);
    window.requestAnimationFrame(() => first?.focus());
  }, [sheet]);

  useEffect(() => {
    // before Radix's own document listener, and stopped there: the dialog or drawer under the
    // menu must not close with it
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      event.preventDefault();
      onClose();
    };
    // only a scroll that moves the button out from under the menu: a terminal printing in the
    // pane scrolls too, and the click that opened the menu can scroll the roster a little
    // (the browser brings a focused button into view) without the button going anywhere
    const onScroll = (): void => {
      const was = placedAt.current;
      const rect = anchor.getBoundingClientRect();
      if (was && Math.abs(rect.top - was.top) < 1 && Math.abs(rect.left - was.left) < 1) return;
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    if (!sheet) {
      window.addEventListener("scroll", onScroll, true);
      window.addEventListener("resize", onClose);
    }
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onClose);
    };
  }, [anchor, onClose, sheet]);

  // the sheet's own keyboard: arrows and Home/End over its stops, Tab kept inside, since it is modal
  const onSheetKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    const buttons = [...(surface.current?.querySelectorAll<HTMLElement>(SHEET_ITEMS) ?? [])];
    const index = buttons.indexOf(document.activeElement as HTMLElement);
    const move = (next: number): void => {
      event.preventDefault();
      buttons[(next + buttons.length) % buttons.length]?.focus();
    };
    if (event.key === "ArrowDown") move(index + 1);
    else if (event.key === "ArrowUp") move(index - 1);
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(buttons.length - 1);
    else if (event.key === "Tab") move(index + (event.shiftKey ? -1 : 1));
  };

  const onSheetBlur = (event: FocusEvent<HTMLDivElement>): void => {
    const next = event.relatedTarget as Node | null;
    if (next && (surface.current?.contains(next) || anchor.contains(next))) return;
    onClose();
  };
  // Safari on a Mac does not focus a clicked button, so the press would blur the focused item
  // with no relatedTarget, close the sheet, and the click would land on nothing: the press keeps
  // the focus where it is, and the click still comes
  const keepFocus = (event: ReactMouseEvent<HTMLButtonElement>): void => event.preventDefault();

  const run = (item: RowMenuItem): void => {
    if (item.disabled) return;
    onClose();
    item.run();
  };

  if (sheet) {
    return createPortal(
      <div className="modal-scrim">
        <div ref={surface} className="modal row-sheet" role="dialog" aria-modal="true" aria-label={title} onKeyDown={onSheetKeyDown} onBlur={onSheetBlur}>
          <span className="row-sheet-grip" aria-hidden="true" />
          {header ? <div className="row-sheet-head">{header}</div> : (
            <div className="row-sheet-head">
              <span className="row-sheet-title">{title}</span>
              {subtitle && <span className="row-sheet-subtitle">{subtitle}</span>}
              {detail && <span className="row-sheet-detail">{detail}</span>}
            </div>
          )}
          {/* the items scroll between the head and Cancel: a tab's menu is taller than a short phone, and `.modal` hides its overflow */}
          <div className="row-sheet-items">
            {items.map((item) => (
              <button key={item.id} type="button" className={`row-sheet-item${item.danger ? " is-danger" : ""}${item.divider ? " has-divider" : ""}${item.disabled ? " is-disabled" : ""}`} aria-current={item.current ? "true" : undefined} aria-pressed={item.checked} aria-disabled={item.disabled || undefined} title={item.title} onMouseDown={keepFocus} onClick={() => run(item)}>
                {item.glyph ?? <item.icon aria-hidden="true" />}
                <span className="row-sheet-label">{item.label}</span>
                {item.hint && <span className="row-sheet-hint">{item.hint}</span>}
                {item.checked && <Check className="row-sheet-check" aria-hidden="true" />}
              </button>
            ))}
          </div>
          <Button variant="field" size="md" className="row-sheet-cancel" onMouseDown={keepFocus} onClick={onClose}>{t("Cancel")}</Button>
        </div>
      </div>,
      document.body,
    );
  }

  // a disabled item is not Radix-disabled: it stays in the arrow order, and its press is waved off
  const select = (event: Event, item: RowMenuItem): void => {
    if (item.disabled) { event.preventDefault(); return; }
    run(item);
  };
  // not styles.css's .menu-item: that primitive's colour would paint over the destructive variant's
  const itemClass = (item: RowMenuItem): string => cn(item.disabled && "is-disabled", item.current && "font-semibold text-strong");
  const body = (item: RowMenuItem) => <>
    {item.glyph ?? <item.icon aria-hidden="true" />}
    <span className="menu-item-main">{item.label}</span>
    {item.hint && <span className="menu-item-hint">{item.hint}</span>}
  </>;

  return (
    <DropdownMenu open modal={false} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DropdownMenuTrigger asChild>
        <span aria-hidden="true" tabIndex={-1} style={{ position: "fixed", top: box.top, left: box.left, width: box.width, height: box.height, pointerEvents: "none" }} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        ref={surface}
        className={cn("row-menu", anchor.closest('[aria-modal="true"]') && "is-over-modal", variant === "paths" && "row-menu-paths")}
        aria-label={title}
        side="bottom"
        align={point ? "start" : align}
        sideOffset={GAP}
        collisionPadding={EDGE}
        loop={!point}
        // the button's own click toggles the menu, so a press on it is not "outside"
        onPointerDownOutside={(event) => { if (!point && anchor.contains(event.target as Node)) event.preventDefault(); }}
        // Tab leaves the popover, which then goes (the sheet keeps it inside, above)
        onKeyDown={(event) => { if (event.key === "Tab") { event.preventDefault(); onClose(); } }}
        // the layout cleanup above hands the focus back, before anything an item mounts takes it
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        {header && <div className="row-menu-header" role="presentation">{header}</div>}
        {items.map((item) => (
          <Fragment key={item.id}>
            {item.divider && <DropdownMenuSeparator />}
            {item.checked === undefined ? (
              <DropdownMenuItem variant={item.danger ? "destructive" : "default"} className={itemClass(item)} aria-current={item.current ? "true" : undefined} aria-disabled={item.disabled || undefined} title={item.title} onSelect={(event) => select(event, item)}>
                {body(item)}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuCheckboxItem checked={item.checked} className={itemClass(item)} aria-current={item.current ? "true" : undefined} aria-disabled={item.disabled || undefined} title={item.title} onSelect={(event) => select(event, item)}>
                {body(item)}
              </DropdownMenuCheckboxItem>
            )}
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
