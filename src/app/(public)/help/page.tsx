import Link from "next/link";

const FAQS = [
  { q: "How do I register?", a: "Choose your role (Landlord, Tenant/Buyer, Service Provider, or Advertiser) and follow the short verification steps for that role." },
  { q: "How do I verify my account?", a: "Landlords and Service Providers confirm phone, email, and upload a document for review. Tenants/Buyers and Advertisers only confirm phone and email." },
  { q: "How do I post a listing?", a: "Complete verification, subscribe (Landlords), then fill in your property details for admin review." },
  { q: "How do I search for a home?", a: "Use the Rent/Buy toggle and filter by state, price, and bedrooms — no account needed to browse." },
  { q: "How do I subscribe?", a: "From your Landlord dashboard, choose a plan and pay via card, Paystack, or bank transfer." },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">Help &amp; FAQ</h1>
      <div className="mt-8 divide-y divide-[var(--color-border-hairline)] rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] shadow-[var(--elevation-xs)]">
        {FAQS.map((item) => (
          <div key={item.q} className="p-5">
            <p className="font-bold text-[var(--color-text-primary)]">{item.q}</p>
            <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">{item.a}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-[var(--color-text-secondary)]">
        Still stuck?{" "}
        <Link href="/feedback" className="font-bold text-[var(--color-brand-primary)] hover:underline">
          Send feedback
        </Link>{" "}
        or{" "}
        <Link href="/complaints" className="font-bold text-[var(--color-brand-primary)] hover:underline">
          report a concern
        </Link>
        .
      </p>
    </div>
  );
}
