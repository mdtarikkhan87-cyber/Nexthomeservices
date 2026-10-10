"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Label, Select, Textarea } from "@/components/ui/Input";
import { IconStar } from "@/components/ui/icons";
import { useAuth } from "@/lib/auth-context";
import { useAuthGate } from "@/components/shared/AuthGate";
import { apiFetchRatingsForUser, apiSubmitRating, Rating } from "@/lib/ratings-client";

function Stars({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${score} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <IconStar key={n} filled={n <= score} className="h-3.5 w-3.5 text-[var(--color-brand-primary)]" />
      ))}
    </span>
  );
}

/**
 * Ratings received by one user (a landlord or service provider) — average +
 * list, plus a gated "Rate this ___" action for anyone else logged in.
 * Reused on both the listing detail page (rating a landlord) and the
 * service detail page (rating a provider) — same backend Rating model,
 * PRD §8.1, no role restriction on who may rate whom.
 */
export function UserRatings({ userId, label }: { userId: string; label: string }) {
  const { user } = useAuth();
  const { requireAuth } = useAuthGate();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [score, setScore] = useState("5");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Written as a promise callback (not synchronous code in the effect body)
  // to satisfy React's "no setState directly in an effect" guidance — same
  // pattern as listings-context.tsx's refetchMyListings effect.
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      try {
        const result = await apiFetchRatingsForUser(userId);
        if (!cancelled) setRatings(result);
      } catch {
        if (!cancelled) setRatings([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const average = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length : 0;
  const isSelf = user?.id === userId;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await apiSubmitRating({ rateeId: userId, score: Number(score), comment: comment.trim() || undefined });
      const refreshed = await apiFetchRatingsForUser(userId);
      setRatings(refreshed);
      setShowForm(false);
      setComment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit your rating. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mt-7">
      <div className="flex items-center justify-between gap-3">
        <h2 className="u-label text-[var(--color-brand-primary-text)]">Ratings</h2>
        {/* Hidden for the rated user themself — matches the backend's own
            "You can't rate yourself" rule (POST /ratings). */}
        {!isSelf && !showForm && (
          <Button
            size="dense"
            variant="secondary"
            onClick={() =>
              requireAuth({
                actionLabel: `Rate this ${label}`,
                onResume: () => setShowForm(true),
              })
            }
          >
            Rate this {label}
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Loading ratings…</p>
      ) : ratings.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">No ratings yet.</p>
      ) : (
        <div className="mt-2 flex items-center gap-2">
          <Stars score={Math.round(average)} />
          <span className="u-ui text-[13px] font-semibold text-[var(--color-text-primary)]">
            {average.toFixed(1)} ({ratings.length} rating{ratings.length !== 1 ? "s" : ""})
          </span>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={submit}
          className="mt-4 flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-4"
        >
          {error && (
            <p className="text-sm font-medium text-[var(--color-status-rejected)]" role="alert">
              {error}
            </p>
          )}
          <div>
            <Label htmlFor="rating-score">Score</Label>
            <Select id="rating-score" value={score} onChange={(e) => setScore(e.target.value)}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} star{n !== 1 ? "s" : ""}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="rating-comment">Comment (optional)</Label>
            <Textarea id="rating-comment" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="dense" disabled={isSubmitting}>
              {isSubmitting ? "Submitting…" : "Submit rating"}
            </Button>
            <Button type="button" size="dense" variant="text" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {ratings.length > 0 && (
        <ul className="mt-4 flex flex-col gap-3">
          {ratings.map((r) => (
            <li
              key={r.id}
              className="rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-[var(--color-text-primary)]">{r.raterName || "NextHome user"}</p>
                <Stars score={r.score} />
              </div>
              {r.comment && <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
