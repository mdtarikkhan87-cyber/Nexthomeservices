"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { useAuthGate } from "@/components/shared/AuthGate";

// PRD §8.2: feedback is scoped to "any logged-in user."
export default function FeedbackPage() {
  const { requireAuth } = useAuthGate();
  const [submitted, setSubmitted] = useState(false);

  const submit = () =>
    requireAuth({
      actionLabel: "Log in to send feedback",
      onResume: () => setSubmitted(true),
    });

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">Feedback</h1>
      <p className="mt-1 text-[var(--color-text-secondary)]">General suggestions or issues not tied to a specific listing.</p>
      {submitted ? (
        <p className="mt-6 font-bold text-[var(--color-status-verified)]">Thanks — your feedback has been sent to our team.</p>
      ) : (
        <div className="mt-6">
          <Textarea placeholder="What's on your mind?" rows={5} />
          <Button className="mt-3" onClick={submit}>
            Submit Feedback
          </Button>
        </div>
      )}
    </div>
  );
}
