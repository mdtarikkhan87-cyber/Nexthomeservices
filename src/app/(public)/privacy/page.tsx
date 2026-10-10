import type { Metadata } from "next";
import { LegalDocument, LegalItem, LegalList, LegalP, LegalSection, Pending } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Privacy Policy | NextHome",
  description: "How NextHome handles your information.",
};

// Draft text supplied by the client. Every "[CLIENT TO CONFIRM: ...]" marker is
// an answer still owed by the business — keep it (wrapped in <Pending>) until
// the real value is supplied; do not guess at it or remove it.
export default function PrivacyPage() {
  return (
    <LegalDocument title="Privacy Policy">
      <LegalSection heading="1. Introduction and data we collect">
        <LegalP>
          This Privacy Policy explains how NextHome collects, uses, shares, and protects your personal data, in line
          with Nigeria’s Data Protection Act 2023 (NDPA). By using the Platform you consent to this Policy.
        </LegalP>
        <LegalP>We collect:</LegalP>
        <LegalList>
          <LegalItem lead="Account data:">name, email, phone number, password (stored hashed, never in plain text).</LegalItem>
          <LegalItem lead="Verification data:">
            identity documents, proof of ownership, and other documents you upload for role verification. These are
            stored privately and are not publicly accessible.
          </LegalItem>
          <LegalItem lead="Listing and content data:">
            property details, photos, ad content, and service descriptions you submit.
          </LegalItem>
          <LegalItem lead="Usage data:">
            pages viewed, searches made, device and browser information, collected automatically to keep the Platform
            working and secure.
          </LegalItem>
          <LegalItem lead="Communications:">
            messages sent through the Platform between users, and support requests you send us.
          </LegalItem>
        </LegalList>
        <LegalP>We do not knowingly collect data from anyone under 18.</LegalP>
      </LegalSection>

      <LegalSection heading="2. How we use and share your data, and cookies">
        <LegalP lead="Why we process your data.">
          To create and secure your account, verify your identity or role, show your listings to the right people, let
          users contact each other, send OTP codes and account notifications, prevent fraud and abuse, and improve the
          Platform.
        </LegalP>
        <LegalP lead="Who we share it with.">We share data with:</LegalP>
        <LegalList>
          <LegalItem>
            Other users, limited to what a listing, profile, or message naturally shows them (we do not share your
            verification documents with other users — only NextHome admins review those).
          </LegalItem>
          <LegalItem>
            Service providers who process data on our behalf: cloud hosting (Railway), file storage (Amazon Web
            Services, for photos and documents), and SMS/OTP delivery (Twilio and/or Termii) — each bound to use your
            data only to provide that service.
          </LegalItem>
          <LegalItem>Law enforcement or regulators, only where required by Nigerian law.</LegalItem>
        </LegalList>
        <LegalP>We do not sell your personal data.</LegalP>
        <LegalP lead="Cookies.">
          We use essential cookies to keep you logged in securely (an httpOnly refresh-token cookie).{" "}
          <Pending>
            [CLIENT TO CONFIRM: if any analytics or marketing cookies are added later, this section and a
            cookie-consent banner will need updating — NDPA requires explicit consent for non-essential cookies]
          </Pending>
          .
        </LegalP>
      </LegalSection>

      <LegalSection heading="3. Security, retention and your rights">
        <LegalP lead="Security.">
          We use encryption in transit (HTTPS), hashed passwords, httpOnly cookies for session tokens, and access
          controls restricting document access to the account owner and authorised admins. No system is perfectly
          secure, and we encourage you to use a strong, unique password.
        </LegalP>
        <LegalP lead="Retention.">
          We keep your data for as long as your account is active, plus a reasonable period afterward for legal,
          dispute, and fraud-prevention purposes.{" "}
          <Pending>
            [CLIENT TO CONFIRM: a specific retention period, e.g. account data deleted/anonymised 12 months after
            closure, verification documents retained for N years]
          </Pending>
          .
        </LegalP>
        <LegalP lead="Your rights under the NDPA.">You have the right to:</LegalP>
        <LegalList>
          <LegalItem>Access a copy of the personal data we hold about you.</LegalItem>
          <LegalItem>Correct inaccurate data.</LegalItem>
          <LegalItem>Request deletion of your data, subject to legal retention needs.</LegalItem>
          <LegalItem>Object to certain processing.</LegalItem>
          <LegalItem>Receive your data in a portable format.</LegalItem>
        </LegalList>
        <LegalP>To exercise any of these rights, contact us using the details in Section 4 below.</LegalP>
        <LegalP lead="Data breaches.">
          If a breach affecting your personal data occurs, we will notify the Nigeria Data Protection Commission
          within 72 hours as required by the NDPA, and notify affected users where there is a real risk to their
          rights.
        </LegalP>
      </LegalSection>

      <LegalSection heading="4. Contact and changes to this policy">
        <LegalP>
          If you have questions about this Privacy Policy, or want to exercise any of your rights above, contact us at:
        </LegalP>
        <LegalP>
          <Pending>
            [CLIENT TO CONFIRM: support email, e.g. privacy@nexthomeservices.com, and/or a physical address]
          </Pending>
        </LegalP>
        <LegalP>
          If NextHome is classified as an organisation of major importance under the NDPA, a Data Protection Officer
          will be appointed, and their contact details added here.
        </LegalP>
        <LegalP>
          We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated
          effective date. Continued use of the Platform after a change constitutes acceptance of the revised Policy.
        </LegalP>
        <LegalP>
          Effective date: <Pending>[CLIENT TO CONFIRM]</Pending>
        </LegalP>
      </LegalSection>
    </LegalDocument>
  );
}
