import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Plus, X } from "../lib/icons.ts";

import "./KeyBarSettings.css";

import { DEFAULT_KEY_BAR_ITEMS, KEY_BAR_ITEMS_MAX, KEY_BAR_KEYS, keyBarInputSequence, keyBarItemId, keyBarItemLabel, type KeyBarItem } from "../lib/keyBar.ts";
import { NO_STICKY_MODIFIERS, type StickyModifiers } from "../lib/keys.ts";
import { useSettings } from "../lib/settings.ts";
import { useT } from "../lib/i18n.ts";
import { SettingsCardRow, SettingsGroup, SettingsSelect } from "./SettingsControls.tsx";
import { Button, Field, Input, Kbd, ToggleGroup, ToggleGroupItem } from "./ui/index.ts";

const MODIFIERS: readonly (keyof StickyModifiers)[] = ["ctrl", "alt", "shift"];
const MODIFIER_CAPS: Record<keyof StickyModifiers, string> = { ctrl: "Ctrl", alt: "Alt", shift: "Shift" };
const CHARACTER_KEY = "character";

/** The modifiers chosen among the three, as a segmented group that takes several at once. */
function ModifierPicks({ label, value, disabledWhenOff, onToggle }: { label: string; value: readonly (keyof StickyModifiers)[]; disabledWhenOff?: boolean; onToggle: (modifier: keyof StickyModifiers, on: boolean) => void }) {
  return (
    <ToggleGroup type="multiple" aria-label={label} value={[...value]} onValueChange={(next) => {
      for (const modifier of MODIFIERS) {
        const on = next.includes(modifier);
        if (on !== value.includes(modifier)) onToggle(modifier, on);
      }
    }}>
      {MODIFIERS.map((modifier) => <ToggleGroupItem key={modifier} value={modifier} className="font-mono" disabled={disabledWhenOff && !value.includes(modifier)}>{MODIFIER_CAPS[modifier]}</ToggleGroupItem>)}
    </ToggleGroup>
  );
}

/** The phone's key row, edited in its display order without requiring a drag gesture. */
export function KeyBarSettings() {
  const t = useT();
  const { settings, update } = useSettings();
  const items = settings.keyBarItems;
  const ids = new Set(items.map(keyBarItemId));
  const available = KEY_BAR_KEYS.filter((key) => !ids.has(keyBarItemId({ type: "key", key })));
  const [chosenKey, setChosenKey] = useState<string>(available[0] ?? "");
  // The combo editor names a base key; shortcuts such as ^C already include a modifier.
  const comboKeys = KEY_BAR_KEYS.filter((key) => !key.startsWith("ctrl-") && key !== "BackTab" && !["pipe", "tilde", "slash"].includes(key));
  const [comboKey, setComboKey] = useState<string>("ArrowLeft");
  const [character, setCharacter] = useState("");
  const [comboModifiers, setComboModifiers] = useState<StickyModifiers>(NO_STICKY_MODIFIERS);
  const full = items.length >= KEY_BAR_ITEMS_MAX;

  useEffect(() => {
    if (!available.includes(chosenKey)) setChosenKey(available[0] ?? "");
  }, [chosenKey, items]);

  const remove = (index: number): void => update({ keyBarItems: items.filter((_, at) => at !== index) });
  const move = (index: number, by: -1 | 1): void => {
    const target = index + by;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target]!, next[index]!];
    update({ keyBarItems: next });
  };
  const add = (item: KeyBarItem): void => {
    if (full || ids.has(keyBarItemId(item))) return;
    update({ keyBarItems: [...items, item] });
  };

  const base = comboKey === CHARACTER_KEY ? character : comboKey;
  const characterValid = comboKey !== CHARACTER_KEY || ([...character].length === 1 && keyBarInputSequence(character, false) !== null);
  const combo: KeyBarItem = { type: "key", key: base, modifiers: comboModifiers };
  const comboExists = characterValid && ids.has(keyBarItemId(combo));
  const heldModifiers = MODIFIERS.filter((modifier) => ids.has(keyBarItemId({ type: "modifier", modifier })));

  return (
    <div className="key-bar-settings">
      <SettingsGroup note={t("Choose the keys and their order under the terminal. The keyboard mode button stays first.")}>
        <ol className="key-bar-settings-list" aria-label={t("Key bar keys")}>
          {items.map((item, index) => {
            const name = keyBarItemLabel(item);
            return (
              <li key={keyBarItemId(item)}>
                <SettingsCardRow className="key-bar-settings-row" title={<Kbd className="h-6 px-2 text-xs text-strong" title={name}>{name}</Kbd>} description={item.type === "modifier" ? t("Held modifier") : item.modifiers ? t("Saved combination") : undefined}>
                  <span className="key-bar-settings-actions">
                    <Button variant="ghost" size="icon" className="text-dim" disabled={index === 0} aria-label={t("Move {name} up", { name })} title={t("Move {name} up", { name })} onClick={() => move(index, -1)}><ChevronUp /></Button>
                    <Button variant="ghost" size="icon" className="text-dim" disabled={index === items.length - 1} aria-label={t("Move {name} down", { name })} title={t("Move {name} down", { name })} onClick={() => move(index, 1)}><ChevronDown /></Button>
                    <Button variant="ghost" size="icon" className="text-dim" aria-label={t("Remove {name}", { name })} title={t("Remove {name}", { name })} onClick={() => remove(index)}><X /></Button>
                  </span>
                </SettingsCardRow>
              </li>
            );
          })}
        </ol>
        {items.length === 0 && <p className="settings-hint">{t("No keys selected.")}</p>}
        <div className="key-bar-settings-add">
          <Field label={t("Add key")} htmlFor="key-bar-add-key" className="key-bar-settings-field">
            <SettingsSelect id="key-bar-add-key" className="w-full" value={chosenKey === "" ? "none" : chosenKey} disabled={full || available.length === 0} onChange={setChosenKey} options={available.length === 0 ? [{ value: "none", label: t("All keys added") }] : available.map((key) => ({ value: key, label: keyBarItemLabel({ type: "key", key }) }))} />
          </Field>
          <Button variant="field" size="md" disabled={full || chosenKey === ""} onClick={() => add({ type: "key", key: chosenKey })}><Plus />{t("Add key")}</Button>
        </div>
        <Field label={t("Held modifiers")}>
          <ModifierPicks label={t("Held modifiers")} value={heldModifiers} disabledWhenOff={full} onToggle={(modifier, on) => {
            const item: KeyBarItem = { type: "modifier", modifier };
            if (on) add(item);
            else update({ keyBarItems: items.filter((current) => keyBarItemId(current) !== keyBarItemId(item)) });
          }} />
        </Field>
      </SettingsGroup>
      <SettingsGroup title={t("Custom combination")} note={t("Saved combinations use only the selected modifiers. Other keys use held modifiers.")} className="key-bar-settings-combo">
        <div className="key-bar-settings-combo-key">
          <Field label={t("Base key")} htmlFor="key-bar-combo-key" className="key-bar-settings-field">
            <SettingsSelect id="key-bar-combo-key" className="w-full" value={comboKey} onChange={setComboKey} options={[...comboKeys.map((key) => ({ value: key, label: keyBarItemLabel({ type: "key", key }) })), { value: CHARACTER_KEY, label: t("Single character") }]} />
          </Field>
          {comboKey === CHARACTER_KEY && <Field label={t("Character")} htmlFor="key-bar-combo-character" className="key-bar-settings-field">
            <Input id="key-bar-combo-character" value={character} maxLength={2} autoCapitalize="off" autoCorrect="off" spellCheck={false} onChange={(event) => setCharacter(event.target.value)} />
          </Field>}
        </div>
        <Field label={t("Combination modifiers")}>
          <ModifierPicks label={t("Combination modifiers")} value={MODIFIERS.filter((modifier) => comboModifiers[modifier])} onToggle={(modifier, on) => setComboModifiers((current) => ({ ...current, [modifier]: on }))} />
        </Field>
        <div className="key-bar-settings-combo-actions">
          <span className="key-bar-settings-preview" aria-live="polite">{characterValid ? <Kbd className="h-6 px-2 text-xs text-strong">{keyBarItemLabel(combo)}</Kbd> : t("Enter one character.")}</span>
          <Button variant="field" size="md" disabled={full || !characterValid || base === "" || comboExists} onClick={() => add(combo)}><Plus />{t("Add combination")}</Button>
        </div>
        {comboExists && <p className="settings-hint">{t("Already added")}</p>}
      </SettingsGroup>
      <Button variant="ghost" className="key-bar-settings-restore" onClick={() => update({ keyBarItems: [...DEFAULT_KEY_BAR_ITEMS] })}>{t("Restore defaults")}</Button>
    </div>
  );
}
