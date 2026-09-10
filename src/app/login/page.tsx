"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { IconCheck } from "@/components/ui/icons";
import { useAuth } from "@/lib/auth-context";
import { roleLandingHref } from "@/lib/roles";

const REASSURANCE_POINTS = ["Verified listings only", "In-app messaging, on record", "No spam, ever"];

function LoginForm() {
  const { user, login, isAuthenticated, activeRole, needsRoleChoice } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = searchParams.get("next");
  const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : null;

  // POST-LOGIN LANDING, rule 3. Deliberately an effect on the resolved auth
  // state rather than a push() next to the login() call: which role a sign-in
  // resolves to is decided in one place (auth-context), and only that decision
  // knows whether a saved preference was restored or a choice is still owed.
  useEffect(() => {
    if (!isAuthenticated) return;

    // ADMIN, checked first and unconditionally: an admin session has no
    // activeRole (it never will — admin is orthogonal to the role system),
    // so the role-based branch below can never redirect it away on its own.
    // Without this, an already-authenticated admin who lands back on /login
    // (back button, typing the URL) sees the regular login form with
    // nothing stopping a mistaken second sign-in. `next` is deliberately
    // ignored here — admin has its own section, not a resumable destination.
    if (user?.isAdmin) {
      router.replace("/admin");
      return;
    }

    if (needsRoleChoice || !activeRole) return;
    router.replace(destination ?? roleLandingHref(activeRole));
  }, [isAuthenticated, user, needsRoleChoice, activeRole, destination, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      // Navigation happens via the effect above once auth state resolves.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password.");
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
            Welcome back to a trustworthy way to find your next home.
          </h2>
          <ul className="mt-6 flex flex-col gap-2.5">
            {REASSURANCE_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2.5 text-sm font-bold text-white/85">
                <IconCheck className="h-4 w-4 shrink-0 text-[var(--color-light-blue)]" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col justify-center px-4 py-16 sm:px-6 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Log in</h1>
          <p className="mt-1.5 text-[var(--color-text-secondary)]">Welcome back to NextHome.</p>

          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="mb-1.5 text-xs font-bold text-[var(--color-brand-primary)] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm font-bold text-red-600">{error}</p>}
            <Button type="submit" loading={submitting} className="mt-2">
              Log in
            </Button>
          </form>

          <p className="mt-6 text-sm text-[var(--color-text-secondary)]">
            New to NextHome?{" "}
            <Link href="/register" className="font-bold text-[var(--color-brand-primary)] hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// useSearchParams requires a Suspense boundary in the App Router.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}