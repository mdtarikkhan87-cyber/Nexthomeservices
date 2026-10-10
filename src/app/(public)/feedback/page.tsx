"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { useAuthGate } from "@/components/shared/AuthGate";
import { apiSubmitFeedback } from "@/lib/feedback-client";

// PRD §8.2: feedback is scoped to "any logged-in user."
export default function FeedbackPage() {
  const { requireAuth } = useAuthGate();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const submit = () =>
    requireAuth({
      actionLabel: "Log in to send feedback",
      onResume: async () => {
        if (!message.trim()) return;
        setError(null);
        setSubmitting(true);
        try {
          await apiSubmitFeedback(message.trim());
          setSubmitted(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Couldn't send your feedback. Try again.");
        } finally {
          setSubmitting(false);
        }
      },
    });

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">Feedback</h1>
      <p className="mt-1 text-[var(--color-text-secondary)]">General suggestions or issues not tied to a specific listing.</p>
      {submitted ? (
        <p className="mt-6 font-bold text-[var(--color-status-verified)]">Thanks — your feedback has been sent to our team.</p>
      ) : (
        <div className="mt-6">
          {error && (
            <p className="mb-3 text-sm font-medium text-[var(--color-status-rejected)]" role="alert">
              {error}
            </p>
          )}
          <Textarea
            placeholder="What's on your mind?"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button className="mt-3" onClick={submit} disabled={submitting || !message.trim()}>
            {submitting ? "Submitting…" : "Submit Feedback"}
          </Button>
        </div>
      )}
    </div>
  );
}
