import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { Minus, Plus } from "../lib/icons.ts";
import { cn } from "../lib/cn.ts";
import { Button, Card, CardContent, CardHeader, CardRow, Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue, Switch, ToggleGroup, ToggleGroupItem } from "./ui/index.ts";

import "./SettingsControls.css";

/**
 * The parts every Settings page is built from, on the shadcn set: a group is a Card (its header
 * an icon badge, a title and a sentence), a row is a CardRow with its one control at the end of
 * the line, and the controls are Switch, Select, ToggleGroup and an Input with its two steps.
 * The `settings-*` class names stay as hooks for the regression scripts and the pages other
 * components still write by hand (PushTestControls, PortalPanel).
 */
/** `section`: the group's name in a link to it (`?settings=<page>&section=<name>`, lib/deepLink.ts) */
export function SettingsGroup({ title, description, icon, action, note, className, section, children, ...rest }: Omit<ComponentProps<"section">, "title"> & { title?: string; description?: ReactNode; icon?: ReactNode; action?: ReactNode; note?: ReactNode; section?: string }) {
  return (
    <Card className={cn("settings-section settings-card", className)} data-section={section} tabIndex={section ? -1 : undefined} {...rest}>
      {title !== undefined && <CardHeader icon={icon} title={title} description={description} action={action} />}
      <CardContent className="gap-3 p-4">
        {note !== undefined && <p className="settings-description settings-note">{note}</p>}
        {children}
      </CardContent>
    </Card>
  );
}

/**
 * One setting. `wide` marks a control that needs the whole line on a phone (three or more
 * segments, a text field): the row stacks there, and stays one line everywhere else.
 */
export function SettingsRow({ label, description, htmlFor, wide = false, className, children }: { label: string; description?: ReactNode; htmlFor?: string; wide?: boolean; className?: string; children: ReactNode }) {
  return (
    <CardRow className={cn("settings-row", wide && "is-wide", className)} htmlFor={htmlFor} title={<span className="settings-label">{label}</span>} description={description !== undefined ? <span className="settings-description">{description}</span> : undefined}>
      {children}
    </CardRow>
  );
}

export function Toggle({ checked, label, onChange, disabled, id }: { checked: boolean; label: string; onChange: (checked: boolean) => void; disabled?: boolean; id?: string }) {
  return <Switch id={id} checked={checked} aria-label={label} disabled={disabled} onCheckedChange={onChange} />;
}

export interface SelectOption { value: string; label: string; disabled?: boolean; /** a word for the pointer that rests on the option */ title?: string }

/** A choice among many (themes, languages, modes): a field that opens the menu surface. Groups part the list under their labels. */
export function SettingsSelect({ id, value, onChange, options, groups, className, disabled, "aria-label": ariaLabel }: { id?: string; value: string; onChange: (value: string) => void; options?: readonly SelectOption[]; groups?: readonly { label: string; options: readonly SelectOption[] }[]; className?: string; disabled?: boolean; "aria-label"?: string }) {
  const items = (list: readonly SelectOption[]) => list.map((option) => <SelectItem key={option.value} value={option.value} disabled={option.disabled} title={option.title}>{option.label}</SelectItem>);
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} aria-label={ariaLabel} className={cn("settings-select-trigger w-[13rem]", className)}><SelectValue /></SelectTrigger>
      <SelectContent>
        {groups ? groups.map((group) => <SelectGroup key={group.label}><SelectLabel>{group.label}</SelectLabel>{items(group.options)}</SelectGroup>) : items(options ?? [])}
      </SelectContent>
    </Select>
  );
}

export interface SegmentedOption<T extends string> { value: T; label: string }

/** One of a few short choices, all in sight. Five or more go in a select instead. */
export function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly SegmentedOption<T>[]; onChange: (value: T) => void }) {
  // a press on the chosen option would clear the group: a choice stays until another is made
  return (
    <ToggleGroup type="single" value={value} aria-label={label} className="settings-segmented" onValueChange={(next) => { if (next) onChange(next as T); }}>
      {options.map((option) => <ToggleGroupItem key={option.value} value={option.value}>{option.label}</ToggleGroupItem>)}
    </ToggleGroup>
  );
}

/**
 * A number moved one step at a time between its limits, or typed: the field commits when it is
 * left or on Enter, clamped to the limits, and a value that is no number keeps the last one.
 */
export function Stepper({ label, value, unit, min, max, decreaseLabel, increaseLabel, onChange }: { label: string; value: number; unit?: string; min: number; max: number; decreaseLabel: string; increaseLabel: string; onChange: (value: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = (): void => {
    const typed = Number.parseInt(draft, 10);
    if (Number.isNaN(typed)) { setDraft(String(value)); return; }
    const next = Math.min(max, Math.max(min, typed));
    setDraft(String(next));
    if (next !== value) onChange(next);
  };
  return (
    <div className="settings-stepper inline-flex h-input items-center gap-0.5 rounded-md bg-input px-1 shadow-surface transition-[box-shadow] duration-150 ease-in-out focus-within:shadow-focus" role="group" aria-label={label}>
      <Button variant="ghost" size="icon-sm" aria-label={decreaseLabel} disabled={value <= min} onClick={() => onChange(value - 1)}><Minus /></Button>
      <input
        className="w-9 min-w-0 bg-transparent text-center text-sm font-medium text-strong tabular-nums outline-none"
        type="text"
        inputMode="numeric"
        value={draft}
        aria-label={label}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing) { event.preventDefault(); commit(); } }}
      />
      {unit !== undefined && <span className="-ml-1 pr-1 text-xs text-dim" aria-hidden="true">{unit}</span>}
      <Button variant="ghost" size="icon-sm" aria-label={increaseLabel} disabled={value >= max} onClick={() => onChange(value + 1)}><Plus /></Button>
      {/* the number after a step, read out, since the focus stays on the button that moved it */}
      <output className="sr-only" aria-live="polite">{value}{unit}</output>
    </div>
  );
}
