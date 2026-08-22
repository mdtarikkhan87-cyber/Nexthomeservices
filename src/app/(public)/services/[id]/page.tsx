import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ServiceContactAction } from "@/components/property/ServiceContactAction";
import { mockServices } from "@/lib/mock-data";

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
        </div>
      </div>
      <p className="mt-5 leading-relaxed text-[var(--color-text-secondary)]">{service.description}</p>

      <div className="mt-7 rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--elevation-sm)]">
        <ServiceContactAction providerName={service.providerName} />
      </div>
    </div>
  );
}
