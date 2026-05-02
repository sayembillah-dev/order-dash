import { requireAuth } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-safe-x py-6 pb-safe-b sm:px-6">
        {children}
      </div>
    </div>
  );
}
