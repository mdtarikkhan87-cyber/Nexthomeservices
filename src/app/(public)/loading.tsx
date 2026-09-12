import { Loader } from "@/components/ui/Loader";

// DESIGN_SYSTEM.md §14: explicit loading indicator on any network-dependent
// action — never a silently unresponsive UI. Every page under (public) is
// `force-dynamic` (or otherwise fetches live backend data per request:
// listings, search, rent, buy, listing/[id]), so a slow backend response —
// under load, or just Railway's own network latency — currently renders
// nothing at all until the whole page is ready. That reads as a dead link,
// not a loading one: clicking the logo or the header's back arrow (both
// plain <Link href="/">) looked completely broken with no visible cause,
// when the click was actually working the whole time and just landed 4-5
// silent seconds later.
//
// One file here covers this for the whole (public) route group — Next.js
// App Router uses a segment's loading.tsx as the Suspense fallback for that
// segment's page AND every nested route beneath it that doesn't define a
// more specific loading.tsx of its own.
export default function PublicLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader label="Loading…" />
    </div>
  );
}
