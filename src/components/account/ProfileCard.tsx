"use client";

import { useState } from "react";
import { isValidPhoneNumber } from "react-phone-number-input";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { PhoneNumberField } from "@/components/ui/PhoneNumberField";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/lib/auth-context";
import { apiSendPhoneOtp, apiUpdateProfile, apiVerifyPhoneOtp } from "@/lib/backend-client";

// Account-level identity — who this person is, independent of any role.
// Role-level verification (documents, subscriptions) lives in the "Your
// roles" section of the account page and is deliberately kept separate
// (PRODUCT_DECISIONS.md §6): never merge the two into one list.
const memberSince = (iso?: string) =>
  iso ? new Intl.DateTimeFormat("en-NG", { dateStyle: "long" }).format(new Date(iso)) : null;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:gap-6">
      <p className="w-32 shrink-0 text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)] sm:pt-1">{label}</p>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function ProfileCard() {
  const { user, refreshUser } = useAuth();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Inline phone verification — same endpoints the role verification uses.
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  if (!user) return null;

  const startEdit = () => {
    setName(user.name);
    setPhone(user.phone);
    setError(null);
    setNotice(null);
    setEditing(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) return setError("Enter your full name.");
    if (!phone || !isValidPhoneNumber(phone)) return setError("Enter a valid phone number.");

    const patch: { name?: string; phone?: string } = {};
    if (trimmed !== user.name) patch.name = trimmed;
    if (phone !== user.phone) patch.phone = phone;
    if (Object.keys(patch).length === 0) {
      setEditing(false);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await apiUpdateProfile(patch);
      await refreshUser();
      setOtpSent(false);
      setOtpCode("");
      setOtpError(null);
      setNotice(patch.phone ? "Phone number updated. Verify the new number below." : "Profile updated.");
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your changes. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const sendCode = async () => {
    setOtpError(null);
    setOtpBusy(true);
    try {
      await apiSendPhoneOtp();
      setOtpSent(true);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Couldn't send a code. Try again.");
    } finally {
      setOtpBusy(false);
    }
  };

  const verifyCode = async () => {
    setOtpError(null);
    setOtpBusy(true);
    try {
      await apiVerifyPhoneOtp(otpCode);
      await refreshUser();
      setOtpSent(false);
      setOtpCode("");
      setNotice("Phone number verified.");
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Incorrect code.");
    } finally {
      setOtpBusy(false);
    }
  };

  const since = memberSince(user.createdAt);

  return (
    <section
      aria-labelledby="profile-heading"
      className="rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--elevation-xs)]"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="profile-heading" className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
          Profile
        </h2>
        {!editing && (
          <Button variant="secondary" size="dense" onClick={startEdit}>
            Edit profile
          </Button>
        )}
      </div>

      {notice && !editing && (
        <p role="status" className="mt-3 text-sm font-bold text-[var(--color-status-verified)]">
          {notice}
        </p>
      )}

      {editing ? (
        <form onSubmit={save} className="mt-4 flex flex-col gap-4">
          <div>
            <Label htmlFor="profile-name">Full name</Label>
            <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
          <PhoneNumberField
            id="profile-phone"
            label="Phone number"
            value={phone}
            onChange={setPhone}
            hint="Changing your number means verifying the new one again."
          />
          <div>
            <p className="text-sm font-bold text-[var(--color-text-primary)]">Email</p>
            <p className="mt-1 text-[var(--color-text-secondary)]">{user.email}</p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Your email is your login and is tied to verification, so it can&rsquo;t be edited here.
            </p>
          </div>
          {error && (
            <p role="alert" className="text-sm font-bold text-[var(--color-status-rejected)]">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <Button type="submit" size="dense" loading={saving}>
              Save changes
            </Button>
            <Button type="button" variant="secondary" size="dense" disabled={saving} onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-2 divide-y divide-[var(--color-border-hairline)]">
          <Row label="Name">
            <p className="font-bold text-[var(--color-text-primary)]">{user.name}</p>
          </Row>
          <Row label="Email">
            <div className="flex flex-wrap items-center gap-2">
              <p className="break-all font-bold text-[var(--color-text-primary)]">{user.email}</p>
              <StatusBadge
                kind={user.emailVerified ? "verified" : "pending"}
                dense
                label={user.emailVerified ? "Verified" : "Not verified"}
              />
            </div>
            {!user.emailVerified && (
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Open the link in your welcome email to verify it.
              </p>
            )}
          </Row>
          <Row label="Phone">
            {user.phone ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-[var(--color-text-primary)]">{user.phone}</p>
                  <StatusBadge
                    kind={user.phoneVerified ? "verified" : "pending"}
                    dense
                    label={user.phoneVerified ? "Verified" : "Not verified"}
                  />
                </div>
                {!user.phoneVerified && (
                  <div className="mt-2">
                    {!otpSent ? (
                      <Button size="dense" variant="secondary" loading={otpBusy} onClick={sendCode}>
                        Send verification code
                      </Button>
                    ) : (
                      <div className="flex flex-wrap items-start gap-2">
                        <div className="w-40">
                          <Input
                            aria-label="6-digit verification code"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="6-digit code"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                          />
                        </div>
                        <Button size="dense" loading={otpBusy} disabled={otpCode.length !== 6} onClick={verifyCode}>
                          Verify
                        </Button>
                      </div>
                    )}
                    {otpError && (
                      <p role="alert" className="mt-2 text-sm font-bold text-[var(--color-status-rejected)]">
                        {otpError}
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-[var(--color-text-secondary)]">No phone number on file.</p>
            )}
          </Row>
          {since && (
            <Row label="Member since">
              <p className="text-[var(--color-text-primary)]">{since}</p>
            </Row>
          )}
        </div>
      )}
    </section>
  );
}
