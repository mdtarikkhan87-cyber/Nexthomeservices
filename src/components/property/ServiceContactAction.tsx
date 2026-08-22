"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuthGate } from "@/components/shared/AuthGate";

export function ServiceContactAction({ providerName }: { providerName: string }) {
  const { requireAuth } = useAuthGate();
  const [sent, setSent] = useState(false);

  const contact = () =>
    requireAuth({
      actionLabel: `Log in to message ${providerName}`,
      onResume: () => setSent(true),
    });

  if (sent) {
    return <p className="font-bold text-[var(--color-status-verified)]">Message sent — {providerName} will reply in your Messages.</p>;
  }

  return <Button onClick={contact}>Message {providerName}</Button>;
}
