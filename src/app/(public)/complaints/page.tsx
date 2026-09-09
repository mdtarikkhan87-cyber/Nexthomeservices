"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { apiSubmitComplaint } from "@/lib/complaints-client";

// IMPLEMENTATION NOTE (unresolved, not silently decided): the PRD (§8.3)
// does not state whether complaint submission requires authentication,
// unlike Feedback which is explicitly scoped to logged-in users (§8.2).
// This form is left OPEN/unauthenticated as a conservative default — a
// safety-reporting form arguably should not be gated — but this is a
// placeholder pending an explicit product decision, carried forward from
// SCREEN_BLUEPRINTS.md's Readiness Check item 2. Do not treat this as final.
// Now wired to the real backend, which implements exactly this design:
// POST /complaints accepts no auth header at all, and links the ticket to
// an account only if one happens to be present (optionalAuthenticate).
export default function ComplaintsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await apiSubmitComplaint({ subject, body });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit your report. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">Report a Concern</h1>
      <p className="mt-1 text-[var(--color-text-secondary)]">
        Report a bad-actor landlord, a suspicious listing, or a scam attempt.
      </p>
      {submitted ? (
        <p className="mt-6 font-bold text-[var(--color-status-verified)]">
          Your report has been logged as a ticket. Our team will review it.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          {error && (
            <p className="text-sm font-medium text-[var(--color-status-rejected)]" role="alert">
              {error}
            </p>
          )}
          <Input
            required
            minLength={3}
            placeholder="What/who is this about? (e.g. listing title, user name)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <Textarea
            required
            minLength={10}
            placeholder="Describe what happened"
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <Button type="submit" className="self-start" disabled={isSubmitting}>
            {isSubmitting ? "Submitting…" : "Submit Report"}
          </Button>
        </form>
      )}
    </div>
  );
}
