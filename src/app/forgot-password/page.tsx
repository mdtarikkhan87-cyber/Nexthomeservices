"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { apiForgotPassword } from "@/lib/backend-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiForgotPassword(email);
      // Same confirmation regardless of whether the email is registered —
      // the backend never reveals that either (see apiForgotPassword).
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:min-h-[640px] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <Image
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=70"
          alt=""
          fill
          sizes="50vw"
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(0deg, color-mix(in srgb, var(--color-dark-blue) 95%, transparent) 0%, color-mix(in srgb, var(--color-dark-blue) 55%, transparent) 60%, color-mix(in srgb, var(--color-dark-blue) 30%, transparent) 100%)",
          }}
        />
        <div className="relative flex h-full flex-col justify-end p-12">
          <h2 className="max-w-sm text-3xl font-bold tracking-tight text-white">
            Get back into your account.
          </h2>
        </div>
      </div>

      <div className="flex flex-col justify-center px-4 py-16 sm:px-6 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          {submitted ? (
            <>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Check your email</h1>
              <p className="mt-3 text-[var(--color-text-secondary)]">
                If an account exists for <span className="font-bold text-[var(--color-text-primary)]">{email}</span>,
                we&apos;ve sent a link to reset your password. It expires in 1 hour.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-block font-bold text-[var(--color-brand-primary)] hover:underline"
              >
                Back to log in
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Forgot your password?</h1>
              <p className="mt-1.5 text-[var(--color-text-secondary)]">
                Enter the email on your account and we&apos;ll send you a link to set a new password.
              </p>

              <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
                <div>
                  <Label htmlFor="fp-email">Email</Label>
                  <Input
                    id="fp-email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm font-bold text-red-600">{error}</p>}
                <Button type="submit" loading={submitting} className="mt-2">
                  Send reset link
                </Button>
              </form>

              <p className="mt-6 text-sm text-[var(--color-text-secondary)]">
                Remembered it?{" "}
                <Link href="/login" className="font-bold text-[var(--color-brand-primary)] hover:underline">
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
