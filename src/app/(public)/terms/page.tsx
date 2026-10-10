import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument, LegalP, LegalSection, Pending } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Terms of Service | NextHome",
  description: "NextHome's Terms of Service.",
};

// Draft text supplied by the client. Every "[CLIENT TO CONFIRM: ...]" marker is
// an answer still owed by the business — keep it (wrapped in <Pending>) until
// the real value is supplied; do not guess at it or remove it.
export default function TermsPage() {
  return (
    <LegalDocument title="Terms of Service">
      <LegalSection heading="1. Introduction and acceptance">
        <LegalP>
          These Terms of Service (“Terms”) govern your access to and use of NextHome (the “Platform”), operated by{" "}
          <Pending>[CLIENT TO CONFIRM: company legal name, registered address, RC number]</Pending> (“NextHome”,
          “we”, “us”). By creating an account or otherwise using the Platform, you agree to be bound by these Terms
          and by our{" "}
          <Link href="/privacy" className="font-bold text-[var(--color-brand-primary)] hover:underline">
            Privacy Policy
          </Link>
          , linked on this page.
        </LegalP>
        <LegalP>
          NextHome is a marketplace that connects people looking to rent, buy, advertise or offer services related to
          real estate in Nigeria with landlords, sellers, service providers and advertisers. NextHome is not a party
          to any tenancy, sale, service or advertising agreement formed between users, and does not itself own,
          manage, broker or guarantee any property, service or transaction listed on the Platform.
        </LegalP>
        <LegalP>
          You must be at least 18 years old and capable of entering a binding contract under Nigerian law to use
          NextHome. If you use the Platform on behalf of a company or other entity, you confirm you have authority to
          bind that entity to these Terms.
        </LegalP>
      </LegalSection>

      <LegalSection heading="2. Accounts, roles and verification">
        <LegalP lead="Account accuracy.">
          You must provide accurate, current information when registering, and keep your phone number, email and
          password confidential. You are responsible for all activity under your account.
        </LegalP>
        <LegalP lead="Roles.">
          NextHome lets a single account hold one or more roles: landlord, tenant/buyer, service provider, and
          advertiser. Each role may require phone verification, email verification, and review of identity or
          supporting documents before you can act in that role (for example, before a landlord’s listing goes live, or
          a service provider appears in search).
        </LegalP>
        <LegalP lead="Document review.">
          Documents you upload for verification (identity documents, proof of ownership, business documents) are
          reviewed by NextHome staff or automated checks. We may approve, reject, or request different documents at
          our discretion. Submitting a document does not guarantee verification.
        </LegalP>
        <LegalP lead="One person, one account.">
          You may not create multiple accounts to evade a suspension, manipulate listings, or circumvent these Terms.
        </LegalP>
        <LegalP lead="Account security.">
          Notify us immediately if you suspect unauthorised access to your account. We are not liable for losses
          caused by your failure to keep your login credentials secure.
        </LegalP>
      </LegalSection>

      <LegalSection heading="3. Listings, content and acceptable use">
        <LegalP lead="Accuracy of listings.">
          If you post a listing (property, service, or ad), you confirm the information, price, photos and
          availability are accurate and that you have the right to offer the property or service described. Listings
          go through a review step before appearing publicly; approval does not mean NextHome has independently
          verified every detail.
        </LegalP>
        <LegalP lead="Listing status.">
          A listing may be marked rented, sold, or unpublished by its owner. NextHome does not guarantee a listing’s
          continued availability and is not responsible for a listing becoming unavailable after you make contact.
        </LegalP>
        <LegalP lead="Content you upload.">
          You keep ownership of content (photos, descriptions, documents) you upload, but you grant NextHome a licence
          to host, display, and process it as needed to operate the Platform. You are responsible for having the
          rights to anything you upload.
        </LegalP>
        <LegalP lead="Prohibited conduct.">
          You may not: post false, misleading, or discriminatory listings; impersonate another person or business;
          upload malware or attempt to breach the Platform’s security; scrape or bulk-extract data without permission;
          use the Platform to harass, defraud, or solicit payment outside legitimate transactions; or upload a
          document, image, or file you do not have the right to share.
        </LegalP>
        <LegalP lead="Enforcement.">
          We may remove content, reject or unpublish listings, suspend verification, or suspend or terminate accounts
          that violate this section, with or without notice, depending on severity.
        </LegalP>
      </LegalSection>

      <LegalSection heading="4. Fees, liability, termination and governing law">
        <LegalP lead="Fees and subscriptions.">
          Certain features (such as a landlord subscription) may require payment.{" "}
          <Pending>[CLIENT TO CONFIRM: pricing, billing cycle, refund policy]</Pending>. Fees are stated in the
          currency shown on the Platform and are non-refundable except where required by law or stated otherwise.
        </LegalP>
        <LegalP lead="No warranty.">
          The Platform is provided “as is”. We do not guarantee that listings are accurate, that users will complete
          transactions in good faith, or that the Platform will be uninterrupted or error-free. You deal with other
          users at your own risk — NextHome strongly recommends verifying a property, landlord, tenant or service
          provider independently before paying any money or signing any agreement.
        </LegalP>
        <LegalP lead="Limitation of liability.">
          To the maximum extent permitted by Nigerian law, NextHome is not liable for indirect, incidental, or
          consequential losses arising from your use of the Platform, including losses from a transaction with another
          user, inaccurate listing information, or service interruption.{" "}
          <Pending>[CLIENT TO CONFIRM: whether a liability cap in Naira terms should be added here]</Pending>.
        </LegalP>
        <LegalP lead="Termination.">
          You may request closure of your account at any time by contacting support; this is currently handled
          manually rather than through a self-serve control. We may suspend or terminate an account that violates these Terms,
          poses a security risk, or where required by law.
        </LegalP>
        <LegalP lead="Governing law.">
          These Terms are governed by the laws of the Federal Republic of Nigeria. Disputes arising under these Terms
          are subject to the exclusive jurisdiction of the courts of{" "}
          <Pending>[CLIENT TO CONFIRM: state, e.g. Lagos State]</Pending>, Nigeria.
        </LegalP>
        <LegalP lead="Changes to these Terms.">
          We may update these Terms from time to time. Continued use of the Platform after an update constitutes
          acceptance of the revised Terms. Material changes will be flagged on the Platform.
        </LegalP>
      </LegalSection>
    </LegalDocument>
  );
}
