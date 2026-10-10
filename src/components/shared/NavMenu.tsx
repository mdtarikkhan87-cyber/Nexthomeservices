"use client";

import Link from "next/link";
import {
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { FOCUS_RING } from "@/components/ui/SelectField";

const EXIT_MS = 160;

// Open/closed state with a short exit, so a panel can fade out instead of
// vanishing. The exit is a plain timeout that unmounts the panel — it does not
// wait on an animation finishing. That is deliberate: menus here navigate, and
// a route change that interrupts a frame-driven exit leaves the panel stranded
// open over the next page (Header.tsx and Overlay.tsx have both been bitten).
// With a timeout, the worst case is a 160ms fade over the new page.
export function useMenuState() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const openRef = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const show = useCallback(() => {
    clearTimeout(timer.current);
    openRef.current = true;
    setClosing(false);
    setOpen(true);
  }, []);

  const hide = useCallback(() => {
    if (!openRef.current) return;
    openRef.current = false;
    setOpen(false);
    setClosing(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setClosing(false), EXIT_MS);
  }, []);

  return { open, rendered: open || closing, show, hide };
}

interface NavMenuProps {
  /** What the button shows. */
  trigger: (state: { open: boolean }) => ReactNode;
  triggerClassName?: string;
  triggerAriaLabel?: string;
  panelClassName?: string;
  /** Shown above and below the list, outside role="menu" (plain text is not a menu item). */
  header?: ReactNode;
  footer?: ReactNode;
  align?: "left" | "right";
  /** Open on pointer hover (mouse only), as well as on click and keyboard. */
  openOnHover?: boolean;
  children: ReactNode;
}

// A menu button + panel, built to the ARIA menu-button pattern:
//   button  aria-haspopup="menu", aria-expanded, aria-controls
//   panel   role="menu" holding role="menuitem" links/buttons
// Keys: Enter/Space/ArrowDown open (ArrowDown/ArrowUp also enter the list),
// arrows/Home/End move between items, Enter activates, Escape closes and
// returns focus to the button, Tab closes and moves on. Outside click closes.
// Hover opens it for mouse users; clicking while it is open from hover "pins"
// it, so a click is never a surprise close.
export function NavMenu({
  trigger,
  triggerClassName = "",
  triggerAriaLabel,
  panelClassName = "",
  header,
  footer,
  align = "left",
  openOnHover = false,
  children,
}: NavMenuProps) {
  const uid = useId();
  const triggerId = `${uid}-trigger`;
  const panelId = `${uid}-panel`;
  const { open, rendered, show, hide } = useMenuState();

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pinned = useRef(false);
  const enterFocus = useRef<"first" | "last" | null>(null);

  const items = useCallback(
    () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"],[role="menuitemradio"]') ?? []
      ),
    []
  );

  const close = useCallback(
    (returnFocus: boolean) => {
      clearTimeout(hoverTimer.current);
      pinned.current = false;
      hide();
      if (returnFocus) triggerRef.current?.focus();
    },
    [hide]
  );

  // Keyboard-opened menus move focus onto the first (or last) item.
  useEffect(() => {
    if (!open || !enterFocus.current) return;
    const list = items();
    (enterFocus.current === "last" ? list[list.length - 1] : list[0])?.focus();
    enterFocus.current = null;
  }, [open, items]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, close]);

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (open) {
        const list = items();
        (e.key === "ArrowUp" ? list[list.length - 1] : list[0])?.focus();
      } else {
        enterFocus.current = e.key === "ArrowUp" ? "last" : "first";
        pinned.current = true;
        show();
      }
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      close(true);
    }
  };

  const onPanelKeyDown = (e: React.KeyboardEvent) => {
    const list = items();
    const i = list.indexOf(document.activeElement as HTMLElement);
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        list[(i + 1) % list.length]?.focus();
        return;
      case "ArrowUp":
        e.preventDefault();
        list[(i - 1 + list.length) % list.length]?.focus();
        return;
      case "Home":
        e.preventDefault();
        list[0]?.focus();
        return;
      case "End":
        e.preventDefault();
        list[list.length - 1]?.focus();
        return;
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        close(true);
        return;
      case "Tab":
        // Hand focus back to the button first, so the browser's own Tab moves
        // on from there rather than from a panel that is about to unmount.
        close(true);
        return;
    }
  };

  const onPointerEnter = (e: React.PointerEvent) => {
    if (!openOnHover || e.pointerType !== "mouse") return;
    clearTimeout(hoverTimer.current);
    if (!open) hoverTimer.current = setTimeout(show, 70);
  };
  const onPointerLeave = (e: React.PointerEvent) => {
    if (!openOnHover || e.pointerType !== "mouse") return;
    clearTimeout(hoverTimer.current);
    if (open && !pinned.current) hoverTimer.current = setTimeout(() => close(false), 180);
  };

  const onTriggerClick = () => {
    clearTimeout(hoverTimer.current);
    if (!open) {
      pinned.current = true;
      show();
    } else if (openOnHover && !pinned.current) {
      // It opened under the pointer; a click means "keep it".
      pinned.current = true;
    } else {
      close(false);
    }
  };

  return (
    <>
      <div ref={rootRef} className="relative" onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={rendered ? panelId : undefined}
          aria-label={triggerAriaLabel}
          onClick={onTriggerClick}
          onKeyDown={onTriggerKeyDown}
          className={`rounded-xl! ${FOCUS_RING} ${triggerClassName}`}
        >
          {trigger({ open })}
        </button>

        {rendered && (
          <div
            ref={panelRef}
            id={panelId}
            data-state={open ? "open" : "closed"}
            onKeyDown={onPanelKeyDown}
            onClick={(e) => {
              // Any link or action inside closes the menu (the link still
              // navigates; this only dismisses the panel).
              if ((e.target as HTMLElement).closest('[role="menuitem"],[role="menuitemradio"]')) close(false);
            }}
            className={`u-menu-panel absolute top-full z-50 mt-2 max-w-[calc(100vw-2rem)] rounded-2xl border border-[color-mix(in_srgb,var(--color-dark-blue)_8%,transparent)] bg-[var(--color-surface-raised)] shadow-[0_24px_60px_-16px_rgba(23,42,58,0.32),0_2px_8px_rgba(23,42,58,0.06)] before:absolute before:inset-x-0 before:-top-2 before:h-2 before:content-[''] ${
              align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left"
            } ${panelClassName}`}
          >
            {header}
            <div role="menu" aria-labelledby={triggerId}>
              {children}
            </div>
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Items. All carry role="menuitem" and tabIndex -1 (arrow keys move between
// them, Tab leaves the menu), the Off-white hover, and the Blue focus ring.
// The current page is marked with aria-current and a Blue bar — the bar is
// the Blue; the text stays Deep Blue, because Blue (#0492C2) at 14–15px is
// 3.6:1 on white, under the 4.5:1 AA floor.
// ---------------------------------------------------------------------------

const itemBase = `flex w-full min-h-12 items-center gap-3 rounded-xl border-l-[3px] px-3 py-2.5 text-left transition-colors duration-150 hover:bg-[var(--color-surface-base)] focus-visible:bg-[var(--color-surface-base)] ${FOCUS_RING}`;

function itemState(active?: boolean) {
  return active
    ? "border-[var(--color-brand-primary)] bg-[color-mix(in_srgb,var(--color-light-blue)_20%,transparent)]"
    : "border-transparent";
}

export function MenuLink({
  href,
  label,
  description,
  meta,
  active,
  icon,
  inMenu = true,
}: {
  href: string;
  label: string;
  description?: string;
  /** Small right-aligned text, e.g. a count. */
  meta?: string;
  active?: boolean;
  icon?: ReactNode;
  /** False inside the mobile sheet, which is a plain list of links, not a role="menu". */
  inMenu?: boolean;
}) {
  return (
    <Link
      href={href}
      role={inMenu ? "menuitem" : undefined}
      tabIndex={inMenu ? -1 : undefined}
      aria-current={active ? "page" : undefined}
      className={`${itemBase} ${itemState(active)}`}
    >
      {icon && <span className="shrink-0 text-[var(--color-deep-blue)]">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold leading-snug text-[var(--color-dark-blue)]">
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-[13px] font-medium leading-snug text-[var(--color-text-body)]">
            {description}
          </span>
        )}
      </span>
      {meta && <span className="u-numeric shrink-0 text-[13px] font-medium text-[var(--color-text-body)]">{meta}</span>}
    </Link>
  );
}

export function MenuButton({
  onSelect,
  children,
  tone = "default",
  checked,
  inMenu = true,
}: {
  onSelect: () => void;
  children: ReactNode;
  tone?: "default" | "danger";
  /** Makes this a radio-style item (the current role). */
  checked?: boolean;
  inMenu?: boolean;
}) {
  return (
    <button
      type="button"
      role={inMenu ? (checked === undefined ? "menuitem" : "menuitemradio") : undefined}
      aria-checked={inMenu ? checked : undefined}
      aria-pressed={!inMenu && checked !== undefined ? checked : undefined}
      tabIndex={inMenu ? -1 : undefined}
      onClick={onSelect}
      className={`${itemBase} ${itemState(checked)} ${
        tone === "danger" ? "text-[var(--color-status-rejected)]" : "text-[var(--color-dark-blue)]"
      } text-[15px] font-bold`}
    >
      {children}
    </button>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <p className="u-label px-3 pb-1.5 pt-1 text-[var(--color-text-body)]">{children}</p>;
}

export function MenuDivider() {
  return <div role="separator" className="my-1.5 border-t border-[var(--color-border-hairline)]" />;
}
