import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ServiceContactAction } from "@/components/property/ServiceContactAction";
import { mockServices } from "@/lib/mock-data";
import { coverageAreas, coversWholeState } from "@/lib/nigeria-locations";

export default async function ServiceDetailPage({ params }: PageProps<"/services/[id]">) {
  const { id } = await params;
  const service = mockServices.find((s) => s.id === id);
  if (!service) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex items-start gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/10 text-2xl font-bold text-[var(--color-brand-primary)]">
          {service.category[0]}
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-brand-primary)]">{service.category}</span>
            {service.verified && <StatusBadge kind="verified" dense />}
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
            {service.providerName}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {coversWholeState(service.lgas)
              ? `Covers all of ${service.state}`
              : `Covers ${service.lgas.length} LGA${service.lgas.length === 1 ? "" : "s"} in ${service.state}`}
          </p>
        </div>
      </div>
      <p className="mt-5 leading-relaxed text-[var(--color-text-secondary)]">{service.description}</p>

      {/* Areas served, named in full. The card had to abbreviate to stay one
          line; this is the page where a customer checks whether their own LGA
          is on the list, so abbreviating here would defeat the point. */}
      <section className="mt-7">
        <h2 className="u-label text-[var(--color-brand-primary-text)]">Areas served</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {coverageAreas(service.state, service.lgas).map((lga) => (
            <li
              key={lga}
              className="u-ui rounded-full border border-[var(--color-border-hairline)] bg-[var(--color-surface-dense)] px-3 py-1.5 text-[13px] text-[var(--color-text-secondary)]"
            >
              {lga}
            </li>
          ))}
        </ul>
        <p className="u-ui mt-3 text-[12px] text-[var(--color-text-secondary)]">
          {coversWholeState(service.lgas)
            ? `This provider takes work anywhere in ${service.state}.`
            : `All within ${service.state}.`}
        </p>
      </section>

      <div className="mt-7 rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--elevation-sm)]">
        <ServiceContactAction providerName={service.providerName} />
      </div>
    </div>
  );
}
