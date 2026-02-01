import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PerformanceDashboardClient } from "./performance-dashboard-client";

export const metadata = {
  title: "Employee Performance | HOD",
  description: "Employee performance analytics and KPI tracking for HOD",
};

async function verifyHODAccess() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, role, full_name, division_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "hod") {
    redirect("/employee/dashboard");
  }

  return profile;
}

export default async function PerformanceDashboardPage() {
  // Verify HOD access on server side
  const profile = await verifyHODAccess();

  return (
    <DashboardLayout userRole={profile.role} userName={profile.full_name}>
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Employee Performance
          </h1>
          <p className="text-muted-foreground">
            Real-time analytics and employee KPI performance tracking
          </p>
        </div>

        {/* Client Component with Suspense */}
        <Suspense
          fallback={
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-[400px] bg-muted animate-pulse rounded-lg" />
                <div className="h-[400px] bg-muted animate-pulse rounded-lg" />
              </div>
              <div className="h-[600px] bg-muted animate-pulse rounded-lg" />
            </div>
          }
        >
          <PerformanceDashboardClient />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
