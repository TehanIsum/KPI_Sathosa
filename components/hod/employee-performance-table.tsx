"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmployeePerformance } from "@/lib/actions/hod-performance";
import {
  Search,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Download,
} from "lucide-react";

interface EmployeePerformanceTableProps {
  employees: EmployeePerformance[];
  onViewDetails: (employeeId: string) => void;
  onExport?: () => void;
}

type SortField =
  | "employee_name"
  | "achievement_percentage"
  | "target_points"
  | "actual_points";
type SortOrder = "asc" | "desc";

export function EmployeePerformanceTable({
  employees,
  onViewDetails,
  onExport,
}: EmployeePerformanceTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [achievementFilter, setAchievementFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("achievement_percentage");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Filter and sort data
  const filteredEmployees = useMemo(() => {
    let filtered = employees;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          emp.employee_name.toLowerCase().includes(query) ||
          emp.email.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((emp) => emp.performance_status === statusFilter);
    }

    // Achievement filter
    if (achievementFilter !== "all") {
      filtered = filtered.filter((emp) => {
        const pct = emp.achievement_percentage;
        switch (achievementFilter) {
          case "high":
            return pct >= 91;
          case "good":
            return pct >= 71 && pct < 91;
          case "average":
            return pct >= 51 && pct < 71;
          case "low":
            return pct < 51;
          case "overachieved":
            return pct > 100;
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle string sorting
      if (typeof aVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }

      // Handle number sorting
      const diff = (aVal as number) - (bVal as number);
      return sortOrder === "asc" ? diff : -diff;
    });

    return filtered;
  }, [
    employees,
    searchQuery,
    statusFilter,
    achievementFilter,
    sortField,
    sortOrder,
  ]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Employee Performance</h3>
            <p className="text-sm text-muted-foreground">
              {filteredEmployees.length} of {employees.length} employees
            </p>
          </div>
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Overachieved">Overachieved</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Not Started">Not Started</SelectItem>
            </SelectContent>
          </Select>

          {/* Achievement Filter */}
          <Select value={achievementFilter} onValueChange={setAchievementFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Performance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Performance</SelectItem>
              <SelectItem value="overachieved">&gt;100% (Overachieved)</SelectItem>
              <SelectItem value="high">91-100% (High)</SelectItem>
              <SelectItem value="good">71-90% (Good)</SelectItem>
              <SelectItem value="average">51-70% (Average)</SelectItem>
              <SelectItem value="low">&lt;51% (Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">
                    <button
                      onClick={() => handleSort("employee_name")}
                      className="flex items-center gap-2 hover:text-primary"
                    >
                      Employee
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="text-left p-3 font-medium">Location</th>
                  <th className="text-right p-3 font-medium">
                    <button
                      onClick={() => handleSort("target_points")}
                      className="flex items-center gap-2 hover:text-primary ml-auto"
                    >
                      Target
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="text-right p-3 font-medium">
                    <button
                      onClick={() => handleSort("actual_points")}
                      className="flex items-center gap-2 hover:text-primary ml-auto"
                    >
                      Actual
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="text-right p-3 font-medium">
                    <button
                      onClick={() => handleSort("achievement_percentage")}
                      className="flex items-center gap-2 hover:text-primary ml-auto"
                    >
                      Achievement
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="text-center p-3 font-medium">Status</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No employees found matching your filters
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr
                      key={employee.employee_id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-3">
                        <div>
                          <div className="font-medium">
                            {employee.employee_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {employee.email}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-sm">
                        {employee.location_name || "-"}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {employee.target_points.toFixed(1)}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {employee.actual_points.toFixed(1)}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <PerformanceIcon
                            percentage={employee.achievement_percentage}
                          />
                          <span
                            className={`font-semibold ${
                              employee.achievement_percentage > 100
                                ? "text-blue-600"
                                : employee.achievement_percentage >= 91
                                ? "text-green-600"
                                : employee.achievement_percentage >= 71
                                ? "text-lime-600"
                                : employee.achievement_percentage >= 51
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {employee.achievement_percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <StatusBadge status={employee.performance_status} />
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetails(employee.employee_id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
          <div>
            Showing {filteredEmployees.length} of {employees.length} employees
          </div>
          <div className="flex items-center gap-4">
            <span>
              Avg Achievement:{" "}
              <span className="font-semibold text-foreground">
                {filteredEmployees.length > 0
                  ? (
                      filteredEmployees.reduce(
                        (sum, emp) => sum + emp.achievement_percentage,
                        0
                      ) / filteredEmployees.length
                    ).toFixed(1)
                  : 0}
                %
              </span>
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    { variant: "default" | "secondary" | "destructive" | "outline"; className: string }
  > = {
    Overachieved: {
      variant: "default",
      className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    },
    Completed: {
      variant: "default",
      className: "bg-green-100 text-green-800 hover:bg-green-100",
    },
    "In Progress": {
      variant: "secondary",
      className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    },
    Pending: {
      variant: "outline",
      className: "",
    },
    "Not Started": {
      variant: "destructive",
      className: "bg-red-100 text-red-800 hover:bg-red-100",
    },
  };

  const config = variants[status] || variants["Pending"];

  return (
    <Badge variant={config.variant} className={config.className}>
      {status}
    </Badge>
  );
}

function PerformanceIcon({ percentage }: { percentage: number }) {
  if (percentage > 100) {
    return <TrendingUp className="w-4 h-4 text-blue-600" />;
  } else if (percentage >= 90) {
    return <TrendingUp className="w-4 h-4 text-green-600" />;
  } else if (percentage >= 70) {
    return <Minus className="w-4 h-4 text-yellow-600" />;
  } else {
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  }
}
