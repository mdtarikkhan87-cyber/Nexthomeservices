"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Loader } from "@/components/ui/Loader";
import { useAuth } from "@/lib/auth-context";
import { ApiError, apiSendEmailVerification, apiVerifyEmail } from "@/lib/backend-client";

// Landing page for the link in the verification email
// (`${FRONTEND_URL}/verify-email?token=...`, sent by auth.routes.js on signup
// and trust.routes.js on resend). The link itself is the credential, so this
// works whether or not the visitor is signed in on this device.
type Status = "verifying" | "success" | "invalid" | "error";

function VerifyEmailContent() {
  const token = useSearchParams().get("token");
  const { isAuthenticated } = useAuth();

  const [status, setStatus] = useState<Status>("verifying");
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  // The token is single-use: a second call (React StrictMode's dev double
  // effect, or a re-render) would be rejected as "already used" and turn a
  // successful verification into an error screen. Guard so it runs once.
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;
    apiVerifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        // 400 = the backend rejected the token (invalid, expired or already
        // used). Anything else (network, 5xx) is not the link's fault.
        setStatus(err instanceof ApiError && err.status === 400 ? "invalid" : "error");
      });
  }, [token]);

  const resend = async () => {
    setResendState("sending");
    try {
      await apiSendEmailVerification();
      setResendState("sent");
    } catch (err) {
      // "Email is already verified." comes back as a 400 — which is the
      // outcome the visitor wanted, so say so rather than showing a failure.
      if (err instanceof ApiError && err.status === 400) setStatus("success");
      else setResendState("failed");
    }
  };

  const effective: Status | "missing" = !token ? "missing" : status;

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      {effective === "verifying" && (
        <Loader label="Verifying your email…" className="justify-center" />
      )}

      {effective === "success" && (
        <>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Email verified</h1>
          <p className="mt-3 text-[var(--color-text-secondary)]">
            Thanks — your email address is confirmed.
          </p>
          <Link href={isAuthenticated ? "/dashboard" : "/login"} className="mt-6 inline-block">
            <Button>{isAuthenticated ? "Go to your dashboard" : "Log in"}</Button>
          </Link>
        </>
      )}

      {(effective === "invalid" || effective === "missing") && (
        <>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            This link isn&rsquo;t valid
          </h1>
          <p className="mt-3 text-[var(--color-text-secondary)]">
            {effective === "missing"
              ? "The verification link is missing its token."
              : "It may have expired (links last 24 hours) or already been used."}{" "}
            {isAuthenticated ? "We can send you a fresh one." : "Log in to request a new verification email."}
          </p>
          {isAuthenticated ? (
            <div className="mt-6">
              <Button onClick={resend} loading={resendState === "sending"} disabled={resendState === "sent"}>
                {resendState === "sent" ? "Email sent — check your inbox" : "Send a new link"}
              </Button>
              {resendState === "failed" && (
                <p role="alert" className="mt-3 text-sm text-[var(--color-status-rejected)]">
                  Couldn&rsquo;t send the email. Please try again in a moment.
                </p>
              )}
            </div>
          ) : (
            <Link href="/login" className="mt-6 inline-block">
              <Button>Log in</Button>
            </Link>
          )}
        </>
      )}

      {effective === "error" && (
        <>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            We couldn&rsquo;t verify your email
          </h1>
          <p className="mt-3 text-[var(--color-text-secondary)]">
            Something went wrong on our side. Your link is still good — please try again in a moment.
          </p>
          <Button className="mt-6" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
