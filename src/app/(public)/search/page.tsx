import { redirect } from "next/navigation";

// COMPATIBILITY SHIM — this route used to be the combined Rent/Buy page
// (`/search?mode=rent|sale`). Rent and Buy are now dedicated routes, so
// nothing renders here anymore; any existing link, bookmark, or shared URL
// is forwarded to the right one with its filters intact rather than
// 404-ing. `mode=sale` maps to /buy, everything else to /rent (which was
// already this page's default when `mode` was absent).
export default async function SearchRedirectPage({ searchParams }: PageProps<"/search">) {
  const params = await searchParams;

  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const destination = first(params.mode) === "sale" ? "/buy" : "/rent";

  const forwarded = new URLSearchParams();
  for (const key of ["state", "price", "bedrooms", "duration"] as const) {
    const value = first(params[key]);
    if (value) forwarded.set(key, value);
  }

  const qs = forwarded.toString();
  redirect(qs ? `${destination}?${qs}` : destination);
}
