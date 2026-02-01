import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Auth error:", userError);
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 });
    }

    // Get HOD's profile
    const { data: hodProfile, error: profileError } = await supabase
      .from("users")
      .select("role, division_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile error:", profileError);
      return NextResponse.json({
        success: false,
        error: "Failed to fetch user profile"
      }, { status: 500 });
    }

    if (!hodProfile || hodProfile.role !== "hod") {
      return NextResponse.json(
        { 
          success: false,
          error: "Only HODs can access this page" 
        },
        { status: 403 }
      );
    }

    // Get all employees in the HOD's division with their latest cycles
    const { data: employees, error: employeesError } = await supabase
      .from("users")
      .select(
        `
        id,
        full_name,
        email,
        division_id,
        location_id,
        divisions:division_id (
          name
        ),
        locations:location_id (
          name
        )
      `
      )
      .eq("division_id", hodProfile.division_id)
      .eq("is_active", true)
      .in("role", ["employee", "hod"]);

    if (employeesError) {
      console.error("Error fetching employees:", employeesError);
      return NextResponse.json(
        { 
          success: false,
          error: "Failed to fetch employees",
          details: employeesError.message 
        },
        { status: 500 }
      );
    }

    if (!employees || employees.length === 0) {
      console.log("No employees found in division:", hodProfile.division_id);
      return NextResponse.json({
        success: true,
        performances: [],
        message: "No employees found in your division"
      });
    }

    console.log(`Found ${employees.length} employees in division`);

    // For each employee, get their KPI cycles with goals
    const performances = await Promise.all(
      employees.map(async (employee) => {
        // Get all cycles for this employee (latest first)
        const { data: cycles, error: cyclesError } = await supabase
          .from("kpi_cycles")
          .select("*")
          .eq("user_id", employee.id)
          .order("year", { ascending: false })
          .order("month", { ascending: false })
          .limit(1);

        if (cyclesError) {
          console.error(`Error fetching cycles for ${employee.email}:`, cyclesError);
        }

        if (!cycles || cycles.length === 0) {
          console.log(`No cycles found for employee: ${employee.email}`);
          // Return employee even without cycle data
          return {
            employee: {
              id: employee.id,
              full_name: employee.full_name,
              email: employee.email,
              division_name: (employee.divisions as any)?.name || "N/A",
              location_name: (employee.locations as any)?.name || "N/A",
            },
            cycle: null,
            goals: [],
            achievement_percentage: 0,
          };
        }

        const cycle = cycles[0];

        // Get all goals for this cycle
        const { data: goals, error: goalsError } = await supabase
          .from("kpi_goals")
          .select("*")
          .eq("kpi_cycle_id", cycle.id)
          .order("created_at", { ascending: true });

        if (goalsError) {
          console.error(`Error fetching goals for cycle ${cycle.id}:`, goalsError);
        }

        // Calculate achievement percentage
        const achievementPercentage =
          cycle.total_allocated_points > 0
            ? (cycle.total_achieved_points / cycle.total_allocated_points) * 100
            : 0;

        return {
          employee: {
            id: employee.id,
            full_name: employee.full_name,
            email: employee.email,
            division_name: (employee.divisions as any)?.name || "N/A",
            location_name: (employee.locations as any)?.name || "N/A",
          },
          cycle: {
            id: cycle.id,
            month: cycle.month,
            year: cycle.year,
            status: cycle.status,
            total_allocated_points: cycle.total_allocated_points,
            total_achieved_points: cycle.total_achieved_points,
            submitted_at: cycle.submitted_at,
            frozen_at: cycle.frozen_at,
          },
          goals: goals || [],
          achievement_percentage: achievementPercentage,
        };
      })
    );

    console.log(`Returning ${performances.length} performance records`);

    console.log(`Returning ${performances.length} performance records`);

    return NextResponse.json({
      success: true,
      performances: performances,
    });
  } catch (error) {
    console.error("Error in performance API:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
