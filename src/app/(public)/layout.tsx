import { Footer } from "@/components/shared/Footer";

// Public product area: fully browsable without authentication
// (PRODUCT_DECISIONS.md §2). Footer only appears here, not in the
// task-focused dashboard shell (DESIGN_SYSTEM.md §12).
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
