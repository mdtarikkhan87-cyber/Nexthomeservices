"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { IconCheck } from "@/components/ui/icons";
import {
  apiSendPhoneOtp,
  apiVerifyPhoneOtp,
  apiGetPresignedUpload,
  apiSubmitTrustDocument,
} from "@/lib/backend-client";
import { ROLE_LABELS } from "@/lib/roles";
import { RoleName } from "@/lib/types";

/**
 * Phone OTP + identity document upload — the actual trust-layer step,
 * shared by every place a role that needs review is added to an account:
 * registration (all roles now need this) and "Add a role" from /account.
 * One real implementation, not a second copy — the two call sites differ
 * only in what happens once `onComplete` fires.
 */
export function TrustLayerVerification({
  reviewRoles,
  instantRoles = [],
  onComplete,
}: {
  /** Roles this submission covers — usually one (adding a role later) or
      several (registering with more than one role that needs review at once). */
  reviewRoles: RoleName[];
  /** Roles on this same account that DON'T need review, shown only for
      context ("your X access already works"). Registration-only. */
  instantRoles?: RoleName[];
  onComplete: () => void;
}) {
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSubmitting, setOtpSubmitting] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentSubmitting, setDocumentSubmitting] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);

  const sendOtp = async () => {
    setOtpError(null);
    setOtpSubmitting(true);
    try {
      await apiSendPhoneOtp();
      setOtpSent(true);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Couldn't send a code. Try again.");
    } finally {
      setOtpSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    setOtpError(null);
    setOtpSubmitting(true);
    try {
      await apiVerifyPhoneOtp(otpCode);
      setPhoneVerified(true);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Incorrect code.");
    } finally {
      setOtpSubmitting(false);
    }
  };

  // Uploads the file directly to storage (S3, or the dev-mode fake
  // endpoint), then tells the backend where it landed for EACH role that
  // needs review — a user can be reviewing more than one role at once
  // (registering with two at a time), and both need this same document.
  const submitDocument = async () => {
    if (!selectedFile) return;
    setDocumentError(null);
    setDocumentSubmitting(true);
    try {
      const presigned = await apiGetPresignedUpload({
        purpose: "trust-document",
        fileName: selectedFile.name,
        fileType: selectedFile.type,
      });

      await fetch(presigned.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      const documentReference = presigned.publicUrl || presigned.key;
      for (const role of reviewRoles) {
        await apiSubmitTrustDocument(role, documentReference);
      }

      onComplete();
    } catch (err) {
      setDocumentError(err instanceof Error ? err.message : "Upload failed. Try again.");
    } finally {
      setDocumentSubmitting(false);
    }
  };

  return (
    <>
      <h1 className="u-heading text-2xl text-[var(--color-text-primary)]">A bit more verification</h1>
      <p className="mt-1 text-[var(--color-text-secondary)]">
        Because {reviewRoles.map((r) => ROLE_LABELS[r]).join(" and ")}
        {reviewRoles.length > 1 ? " roles" : "s"} list things others pay for and contact, we ask for
        phone verification and one identity document before you can publish. Document review is done
        by our team, not automatic.
      </p>
      {instantRoles.length > 0 && (
        <p className="u-ui mt-3 text-sm text-[var(--color-text-secondary)]">
          Your {instantRoles.map((r) => ROLE_LABELS[r]).join(" and ")} access is not affected and
          works already.
        </p>
      )}

      <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] p-4">
        <p className="font-bold text-[var(--color-text-primary)]">Phone verification</p>
        {phoneVerified ? (
          <p className="mt-2 flex items-center gap-2 text-sm font-bold text-[var(--color-brand-primary-text)]">
            <IconCheck className="h-4 w-4" /> Verified
          </p>
        ) : !otpSent ? (
          <Button variant="secondary" size="dense" className="mt-3" loading={otpSubmitting} onClick={sendOtp}>
            Send verification code
          </Button>
        ) : (
          <div className="mt-3 flex flex-col gap-2.5">
            <Input
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
            />
            <Button variant="secondary" size="dense" loading={otpSubmitting} onClick={verifyOtp}>
              Verify code
            </Button>
          </div>
        )}
        {otpError && <p className="mt-2 text-sm font-bold text-red-600">{otpError}</p>}
      </div>

      <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] p-4">
        <p className="font-bold text-[var(--color-text-primary)]">Identity document</p>
        <Label htmlFor="doc" className="mt-3 block">
          Upload ID or utility bill
        </Label>
        <input
          id="doc"
          type="file"
          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          className="block w-full rounded-[var(--radius-control)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-3 text-sm"
        />
        {documentError && <p className="mt-2 text-sm font-bold text-red-600">{documentError}</p>}
      </div>

      {!phoneVerified && (
        <p className="mt-4 text-sm font-medium text-[var(--color-text-secondary)]">
          Verify your phone number above before submitting.
        </p>
      )}
      <Button
        className="mt-2"
        disabled={!selectedFile || !phoneVerified}
        loading={documentSubmitting}
        onClick={submitDocument}
      >
        Submit for review
      </Button>
    </>
  );
}
