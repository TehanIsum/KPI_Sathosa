"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MonthlySubmissionChart } from "@/components/hod/monthly-submission-chart";
import { AchievementPieChart } from "@/components/hod/achievement-pie-chart";
import { EmployeePerformanceTable } from "@/components/hod/employee-performance-table";
import { EmployeeDetailModal } from "@/components/hod/employee-detail-modal";
import {
  getHODPerformanceDashboard,
  exportPerformanceData,
  EmployeePerformance,
  MonthlySubmission,
  AchievementDistribution,
} from "@/lib/actions/hod-performance";
import { RefreshCw, AlertCircle, Download } from "lucide-react";

export function PerformanceDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeePerformance[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlySubmission[]>([]);
  const [distributionData, setDistributionData] = useState<
    AchievementDistribution[]
  >([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();

    // Auto-refresh every 5 minutes for real-time updates
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const result = await getHODPerformanceDashboard();

      if (result.success && result.data) {
        setEmployees(result.data.employees);
        setMonthlyData(result.data.monthlySubmissions);
        setDistributionData(result.data.achievementDistribution);
      } else {
        setError(result.error || "Failed to load dashboard data");
      }
    } catch (err) {
      setError("An error occurred while loading the dashboard");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleViewDetails = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setIsDetailModalOpen(true);
  };

  const handleExport = async () => {
    try {
      const result = await exportPerformanceData();

      if (result.success && result.data) {
        // Convert to CSV
        const headers = [
          "Employee Name",
          "Email",
          "Location",
          "Target Points",
          "Actual Points",
          "Achievement %",
          "Status",
          "Total Goals",
          "Completed Goals",
        ];

        const rows = result.data.map((emp) => [
          emp.employee_name,
          emp.email,
          emp.location_name || "",
          emp.target_points.toFixed(1),
          emp.actual_points.toFixed(1),
          emp.achievement_percentage.toFixed(1),
          emp.performance_status,
          emp.total_goals,
          emp.completed_goals,
        ]);

        const csvContent = [
          headers.join(","),
          ...rows.map((row) =>
            row.map((cell) => `"${cell}"`).join(",")
          ),
        ].join("\n");

        // Download
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `employee-performance-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Loading performance data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDashboardData()}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDashboardData()}
            disabled={refreshing}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          {refreshing && (
            <span className="text-xs text-muted-foreground">
              Auto-refresh active (every 5 min)
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Employees</p>
            <p className="text-2xl font-bold">{employees.length}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">High Performers</p>
            <p className="text-2xl font-bold text-green-600">
              {employees.filter((e) => e.achievement_percentage >= 91).length}
            </p>
            <p className="text-xs text-muted-foreground">≥91% achievement</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Avg Achievement</p>
            <p className="text-2xl font-bold">
              {employees.length > 0
                ? (
                    employees.reduce(
                      (sum, e) => sum + e.achievement_percentage,
                      0
                    ) / employees.length
                  ).toFixed(1)
                : 0}
              %
            </p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Needs Attention</p>
            <p className="text-2xl font-bold text-red-600">
              {employees.filter((e) => e.achievement_percentage < 51).length}
            </p>
            <p className="text-xs text-muted-foreground">&lt;51% achievement</p>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlySubmissionChart data={monthlyData} />
        <AchievementPieChart data={distributionData} />
      </div>

      {/* Employee Performance Table */}
      <EmployeePerformanceTable
        employees={employees}
        onViewDetails={handleViewDetails}
        onExport={handleExport}
      />

      {/* Employee Detail Modal */}
      <EmployeeDetailModal
        employeeId={selectedEmployeeId}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEmployeeId(null);
        }}
      />
    </div>
  );
}
