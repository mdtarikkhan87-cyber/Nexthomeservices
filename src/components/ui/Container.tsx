import { ReactNode } from "react";
import { cn } from "@/lib/utils";

// The one shared inner container for the landing page: header, hero, search
// bar and every section line up on it. Capped at 1280px, so on a very wide or
// zoomed-out screen the content stays a readable width instead of stretching.
export const CONTAINER_CLASS = "mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8";

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(CONTAINER_CLASS, className)}>{children}</div>;
}
