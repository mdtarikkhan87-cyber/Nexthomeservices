import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <p className="u-label text-[var(--color-brand-primary)]">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Page not found</h1>
      <p className="mt-3 text-[var(--color-text-secondary)]">
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Link
          href="/"
          className="rounded-[var(--radius-control)] bg-[var(--color-brand-primary)] px-5 py-2.5 font-bold text-white hover:bg-[var(--color-brand-primary-hover)]"
        >
          Go to the homepage
        </Link>
        <Link href="/listings" className="font-bold text-[var(--color-brand-primary)] hover:underline">
          Browse listings
        </Link>
      </div>
    </div>
  );
}
