"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { apiResetPassword } from "@/lib/backend-client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (!token) return;
    setError(null);
    setSubmitting(true);
    try {
      await apiResetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't reset your password. Try again.");
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
          <h2 className="max-w-sm text-3xl font-bold tracking-tight text-white">Set a new password.</h2>
        </div>
      </div>

      <div className="flex flex-col justify-center px-4 py-16 sm:px-6 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          {!token ? (
            <>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
                This link is missing its token
              </h1>
              <p className="mt-3 text-[var(--color-text-secondary)]">
                Open the reset link from your email again, or request a new one.
              </p>
              <Link
                href="/forgot-password"
                className="mt-6 inline-block font-bold text-[var(--color-brand-primary)] hover:underline"
              >
                Request a new link
              </Link>
            </>
          ) : done ? (
            <>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Password reset</h1>
              <p className="mt-3 text-[var(--color-text-secondary)]">
                You can now log in with your new password.
              </p>
              <Button className="mt-6" onClick={() => router.push("/login")}>
                Go to log in
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Set a new password</h1>
              <p className="mt-1.5 text-[var(--color-text-secondary)]">Choose a new password for your account.</p>

              <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
                <div>
                  <Label htmlFor="rp-password">New password</Label>
                  <Input
                    id="rp-password"
                    type="password"
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="rp-confirm">Confirm new password</Label>
                  <Input
                    id="rp-confirm"
                    type="password"
                    required
                    minLength={8}
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm font-bold text-red-600">{error}</p>}
                <Button type="submit" loading={submitting} className="mt-2">
                  Reset password
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// useSearchParams requires a Suspense boundary in the App Router.
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
