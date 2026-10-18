import { ReactNode } from "react";
import { cn } from "@/lib/utils";

// The one shared inner container for the landing page: header, hero, search
// bar and every section line up on it. 1280px on laptops (as it always was),
// growing smoothly on a large monitor up to a readable cap — see --width-home
// in globals.css.
export const CONTAINER_CLASS = "mx-auto w-full max-w-[var(--width-home)] px-4 sm:px-6 lg:px-8";

// The same idea for every other page: 1152px on laptops (the old max-w-6xl),
// fluid above that — see --width-page in globals.css. Pages that are
// deliberately narrow for reading (help, legal, advertise, account) keep their
// own small max-w-2xl/3xl and do not use this.
export const PAGE_CONTAINER_CLASS = "mx-auto w-full max-w-[var(--width-page)] px-4 sm:px-6";

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(CONTAINER_CLASS, className)}>{children}</div>;
}
