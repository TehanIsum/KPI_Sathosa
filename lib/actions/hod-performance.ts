"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// ============================================================================
// TYPES
// ============================================================================

export interface EmployeePerformance {
  employee_id: string;
  email: string;
  employee_name: string;
  division_name: string;
  division_id: string;
  location_name: string;
  current_cycle_id: string | null;
  current_month: number | null;
  current_year: number | null;
  kpi_status: string | null;
  submitted_at: string | null;
  last_updated: string | null;
  target_points: number;
  actual_points: number;
  achievement_percentage: number;
  total_goals: number;
  completed_goals: number;
  performance_status: string;
}

export interface MonthlySubmission {
  month_year: string;
  month_num: number;
  year_num: number;
  submission_count: number;
  employee_count: number;
}

export interface AchievementDistribution {
  percentage_range: string;
  range_start: number;
  range_end: number;
  employee_count: number;
  percentage_of_total: number;
}

export interface EmployeeKPIDetail {
  cycle_id: string;
  month: number;
  year: number;
  status: string;
  goal_id: string;
  goal_description: string;
  target_type: string;
  target_quantity: number | null;
  target_deadline: string | null;
  allocated_points: number;
  actual_quantity: number | null;
  deadline_completed: boolean | null;
  achieved_points: number;
  achievement_percentage: number;
  hod_remarks: string | null;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface PerformanceFilters {
  searchQuery?: string;
  achievementMin?: number;
  achievementMax?: number;
  status?: string;
  divisionId?: string;
}

// ============================================================================
// HELPER: Verify HOD Access
// ============================================================================

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
    .select("id, role, division_id, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "hod") {
    redirect("/employee/dashboard");
  }

  return profile;
}

// ============================================================================
// ACTION: Get HOD Performance Dashboard Data
// ============================================================================

export async function getHODPerformanceDashboard() {
  try {
    const profile = await verifyHODAccess();
    const supabase = await createClient();

    // Get employee performance data
    let query = supabase
      .from("hod_employee_performance_summary")
      .select("*")
      .eq("division_id", profile.division_id);

    const { data: employees, error: empError } = await query;

    if (empError) {
      console.error("Error fetching employees:", empError);
      return { success: false, error: empError.message };
    }

    // Get monthly submission counts
    const { data: monthlyData, error: monthError } = await supabase.rpc(
      "get_monthly_submission_counts",
      { hod_division_id: profile.division_id }
    );

    if (monthError) {
      console.error("Error fetching monthly data:", monthError);
    }

    // Get achievement distribution
    const { data: distributionData, error: distError } = await supabase.rpc(
      "get_achievement_percentage_distribution",
      { hod_division_id: profile.division_id }
    );

    if (distError) {
      console.error("Error fetching distribution:", distError);
    }

    return {
      success: true,
      data: {
        employees: (employees || []) as EmployeePerformance[],
        monthlySubmissions: (monthlyData || []) as MonthlySubmission[],
        achievementDistribution: (distributionData ||
          []) as AchievementDistribution[],
        hodInfo: {
          name: profile.full_name,
          divisionId: profile.division_id,
        },
      },
    };
  } catch (error) {
    console.error("Error in getHODPerformanceDashboard:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// ACTION: Get Filtered Employee Performance
// ============================================================================

export async function getFilteredEmployeePerformance(
  filters: PerformanceFilters
) {
  try {
    const profile = await verifyHODAccess();
    const supabase = await createClient();

    let query = supabase
      .from("hod_employee_performance_summary")
      .select("*")
      .eq("division_id", profile.division_id);

    // Apply search filter
    if (filters.searchQuery) {
      query = query.or(
        `employee_name.ilike.%${filters.searchQuery}%,email.ilike.%${filters.searchQuery}%`
      );
    }

    // Apply achievement range filter
    if (filters.achievementMin !== undefined) {
      query = query.gte("achievement_percentage", filters.achievementMin);
    }
    if (filters.achievementMax !== undefined) {
      query = query.lte("achievement_percentage", filters.achievementMax);
    }

    // Apply status filter
    if (filters.status) {
      query = query.eq("performance_status", filters.status);
    }

    const { data, error } = await query.order("achievement_percentage", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching filtered employees:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: (data || []) as EmployeePerformance[],
    };
  } catch (error) {
    console.error("Error in getFilteredEmployeePerformance:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// ACTION: Get Employee KPI Details
// ============================================================================

export async function getEmployeeKPIDetails(
  employeeId: string,
  month?: number,
  year?: number
) {
  try {
    const profile = await verifyHODAccess();
    const supabase = await createClient();

    // Verify employee is in HOD's division
    const { data: employee } = await supabase
      .from("users")
      .select("division_id")
      .eq("id", employeeId)
      .single();

    if (!employee || employee.division_id !== profile.division_id) {
      return {
        success: false,
        error: "Employee not found or not in your division",
      };
    }

    // Get KPI details
    const { data, error } = await supabase.rpc("get_employee_kpi_details", {
      employee_user_id: employeeId,
      target_month: month || null,
      target_year: year || null,
    });

    if (error) {
      console.error("Error fetching employee KPI details:", error);
      return { success: false, error: error.message };
    }

    // Get employee summary from view
    const { data: summary } = await supabase
      .from("hod_employee_performance_summary")
      .select("*")
      .eq("employee_id", employeeId)
      .single();

    return {
      success: true,
      data: {
        goals: (data || []) as EmployeeKPIDetail[],
        summary: summary as EmployeePerformance,
      },
    };
  } catch (error) {
    console.error("Error in getEmployeeKPIDetails:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// ACTION: Get Monthly Comparison Data
// ============================================================================

export async function getMonthlyComparison(employeeId: string) {
  try {
    const profile = await verifyHODAccess();
    const supabase = await createClient();

    // Verify employee is in HOD's division
    const { data: employee } = await supabase
      .from("users")
      .select("division_id")
      .eq("id", employeeId)
      .single();

    if (!employee || employee.division_id !== profile.division_id) {
      return {
        success: false,
        error: "Employee not found or not in your division",
      };
    }

    // Get last 12 months of performance
    const { data, error } = await supabase
      .from("kpi_cycles")
      .select(
        `
        id,
        month,
        year,
        status,
        total_allocated_points,
        total_achieved_points,
        submitted_at,
        frozen_at
      `
      )
      .eq("user_id", employeeId)
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .limit(12);

    if (error) {
      console.error("Error fetching monthly comparison:", error);
      return { success: false, error: error.message };
    }

    const monthlyData = (data || []).map((cycle) => ({
      ...cycle,
      achievement_percentage:
        cycle.total_allocated_points > 0
          ? (cycle.total_achieved_points / cycle.total_allocated_points) * 100
          : 0,
    }));

    return {
      success: true,
      data: monthlyData,
    };
  } catch (error) {
    console.error("Error in getMonthlyComparison:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// ACTION: Export Performance Data (for CSV/Excel)
// ============================================================================

export async function exportPerformanceData() {
  try {
    const profile = await verifyHODAccess();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("hod_employee_performance_summary")
      .select("*")
      .eq("division_id", profile.division_id)
      .order("achievement_percentage", { ascending: false });

    if (error) {
      console.error("Error exporting data:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: (data || []) as EmployeePerformance[],
    };
  } catch (error) {
    console.error("Error in exportPerformanceData:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
