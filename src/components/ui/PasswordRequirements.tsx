import { IconCheck } from "@/components/ui/icons";
import { PASSWORD_RULES } from "@/lib/password-rules";
import { cn } from "@/lib/utils";

// Live checklist shown under a "new password" field. Each requirement flips
// to met as the user types. Status is never colour alone: a check mark vs. an
// empty circle, plus a screen-reader "met" / "not met" suffix.
export function PasswordRequirements({ password, id }: { password: string; id?: string }) {
  return (
    <ul id={id} aria-label="Password requirements" className="mt-2 flex flex-col gap-1">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <li
            key={rule.id}
            className={cn(
              "flex items-center gap-2 text-sm transition-colors duration-[var(--motion-duration-short)]",
              met ? "font-medium text-[var(--color-status-verified)]" : "text-[var(--color-text-secondary)]",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                met ? "border-current bg-current/10" : "border-[var(--color-border-default)]",
              )}
            >
              {met && <IconCheck className="h-2.5 w-2.5" />}
            </span>
            {rule.label}
            <span className="sr-only">{met ? " — met" : " — not met"}</span>
          </li>
        );
      })}
    </ul>
  );
}
