"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { IconCheck } from "@/components/ui/icons";
import { useAuth } from "@/lib/auth-context";

// WIREFRAME_PLAN.md — Login: minimal, focused flow. Credential mechanism
// (password vs OTP) is unspecified in source docs (flagged in the Final
// Implementation Readiness Check) — email + password is used here as a
// reasonable, common default, not a silent product decision.
//
// REDESIGN PASS: split-panel shell (brand imagery + trust points on the
// left at desktop, the actual form on the right) instead of a small
// centered card — the flow, fields, and submit behavior are unchanged.
// The image panel collapses away below `lg` so the mobile flow stays fast
// and single-column, per RESPONSIVE_STRATEGY.md.
const REASSURANCE_POINTS = ["Verified listings only", "In-app messaging, on record", "No spam, ever"];

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  // GUEST-ACCESS PASS: this route used to always land on /dashboard,
  // discarding wherever the user came from. It now honors a `?next=` path
  // so the standalone login route preserves context the same way the
  // in-place AuthGate prompt does. Only same-origin relative paths are
  // accepted, so `next` can't be used as an open redirect.
  const next = searchParams.get("next");
  const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      login();
      router.push(destination);
    }, 400);
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
              <Label htmlFor="email">Email or phone</Label>
              <Input id="email" type="text" required placeholder="you@example.com" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required placeholder="••••••••" />
            </div>
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
