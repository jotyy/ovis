/**
 * shadcn Card as the editor's section card: a surface a step above its panel with a ring and
 * an inner edge of light; its header a shade lighter with an icon badge, parted by an etched
 * divider (settings-section.tsx of the editor).
 */
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn.ts";

export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section data-slot="card" className={cn("relative min-w-0 overflow-clip rounded-xl bg-[color-mix(in_srgb,var(--bg)_40%,var(--bg-elevated))] text-text shadow-panel", className)} {...props} />;
}

export function CardHeader({ className, icon, title, description, action, ...props }: ComponentProps<"div"> & { icon?: ReactNode; title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <div data-slot="card-header" className={cn("flex items-center justify-between gap-4 bg-elevated px-[18px] py-3.5 divider-b", className)} {...props}>
      <div className="flex min-w-0 items-center gap-3.5">
        {icon && <IconBadge>{icon}</IconBadge>}
        <div className="flex min-w-0 flex-col">
          <span className="text-lg font-medium text-strong text-engraved">{title}</span>
          {description && <span className="truncate text-sm font-regular text-dim">{description}</span>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("flex flex-col gap-5 p-5", className)} {...props} />;
}

/** a row of a card: a title and its sentence, the control at the end, on a field's own surface */
export function CardRow({ className, title, description, htmlFor, children, ...props }: ComponentProps<"div"> & { title: ReactNode; description?: ReactNode; htmlFor?: string }) {
  return (
    <div data-slot="card-row" className={cn("flex items-center justify-between gap-6 rounded-lg bg-fill-1 px-4 py-3 shadow-[0_0_0_1px_var(--ink-1),inset_0_0_0_1px_var(--edge-light)]", className)} {...props}>
      <label htmlFor={htmlFor} className={cn("flex min-w-0 flex-col", htmlFor && "cursor-pointer")}>
        <span className="text-sm font-medium text-strong">{title}</span>
        {description && <span className="text-sm font-regular text-dim">{description}</span>}
      </label>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

/** the editor's icon badge: a glyph on a small raised, rounded tile */
export function IconBadge({ className, children }: { className?: string; children: ReactNode }) {
  return <span aria-hidden="true" className={cn("relative flex size-10 shrink-0 items-center justify-center rounded-[11px] bg-elevated bg-raised text-strong shadow-raised [&_svg]:size-[22px] [&_svg]:drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]", className)}>{children}</span>;
}
