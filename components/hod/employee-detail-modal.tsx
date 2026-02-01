"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  getEmployeeKPIDetails,
  EmployeeKPIDetail,
  EmployeePerformance,
} from "@/lib/actions/hod-performance";
import {
  Target,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
} from "lucide-react";

interface EmployeeDetailModalProps {
  employeeId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EmployeeDetailModal({
  employeeId,
  isOpen,
  onClose,
}: EmployeeDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState<EmployeeKPIDetail[]>([]);
  const [summary, setSummary] = useState<EmployeePerformance | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employeeId && isOpen) {
      loadEmployeeDetails();
    }
  }, [employeeId, isOpen]);

  const loadEmployeeDetails = async () => {
    if (!employeeId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getEmployeeKPIDetails(employeeId);

      if (result.success && result.data) {
        setGoals(result.data.goals);
        setSummary(result.data.summary);
      } else {
        setError(result.error || "Failed to load details");
      }
    } catch (err) {
      setError("An error occurred while loading details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Employee KPI Details</DialogTitle>
          <DialogDescription>
            Detailed KPI performance breakdown and goal progress
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Loading details...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </div>
        ) : summary ? (
          <div className="space-y-6">
            {/* Employee Summary */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    {summary.employee_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {summary.email}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {summary.location_name}
                  </p>
                </div>
                <Badge
                  variant={
                    summary.performance_status === "Overachieved"
                      ? "default"
                      : summary.performance_status === "Completed"
                      ? "default"
                      : "secondary"
                  }
                  className={
                    summary.performance_status === "Overachieved"
                      ? "bg-blue-100 text-blue-800"
                      : summary.performance_status === "Completed"
                      ? "bg-green-100 text-green-800"
                      : ""
                  }
                >
                  {summary.performance_status}
                </Badge>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">
                    {summary.target_points.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Target Points
                  </div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {summary.actual_points.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Actual Points
                  </div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div
                    className={`text-2xl font-bold ${
                      summary.achievement_percentage > 100
                        ? "text-blue-600"
                        : summary.achievement_percentage >= 90
                        ? "text-green-600"
                        : summary.achievement_percentage >= 70
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {summary.achievement_percentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Achievement
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Overall Progress
                  </span>
                  <span className="font-medium">
                    {summary.completed_goals} / {summary.total_goals} goals
                  </span>
                </div>
                <Progress
                  value={
                    summary.total_goals > 0
                      ? (summary.completed_goals / summary.total_goals) * 100
                      : 0
                  }
                />
              </div>
            </Card>

            {/* KPI Goals List */}
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">
                KPI Goals ({goals.length})
              </h4>

              {goals.length === 0 ? (
                <Card className="p-8 text-center">
                  <Circle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No KPI goals set for this month
                  </p>
                </Card>
              ) : (
                goals.map((goal, index) => (
                  <Card key={goal.goal_id} className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Goal Number */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                        {index + 1}
                      </div>

                      <div className="flex-1 space-y-3">
                        {/* Description */}
                        <div>
                          <p className="font-medium">{goal.goal_description}</p>
                        </div>

                        {/* Target & Progress */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Target className="w-4 h-4" />
                              <span>Target</span>
                            </div>
                            {goal.target_type === "quantity" ? (
                              <div className="font-medium">
                                {goal.target_quantity?.toFixed(1)} units
                              </div>
                            ) : (
                              <div className="font-medium flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {goal.target_deadline
                                  ? new Date(
                                      goal.target_deadline
                                    ).toLocaleDateString()
                                  : "No deadline"}
                              </div>
                            )}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <TrendingUp className="w-4 h-4" />
                              <span>Actual</span>
                            </div>
                            {goal.target_type === "quantity" ? (
                              <div className="font-medium">
                                {goal.actual_quantity?.toFixed(1) || "0"} units
                              </div>
                            ) : (
                              <div className="font-medium">
                                {goal.deadline_completed ? (
                                  <span className="flex items-center gap-1 text-green-600">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Completed
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-yellow-600">
                                    <Clock className="w-4 h-4" />
                                    Pending
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Achievement */}
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div>
                              <div className="text-xs text-muted-foreground">
                                Allocated
                              </div>
                              <div className="text-sm font-semibold">
                                {goal.allocated_points.toFixed(1)} pts
                              </div>
                            </div>
                            <Separator orientation="vertical" className="h-8" />
                            <div>
                              <div className="text-xs text-muted-foreground">
                                Achieved
                              </div>
                              <div className="text-sm font-semibold text-primary">
                                {goal.achieved_points.toFixed(1)} pts
                              </div>
                            </div>
                            <Separator orientation="vertical" className="h-8" />
                            <div>
                              <div className="text-xs text-muted-foreground">
                                Achievement
                              </div>
                              <div
                                className={`text-sm font-semibold ${
                                  goal.achievement_percentage > 100
                                    ? "text-blue-600"
                                    : goal.achievement_percentage >= 90
                                    ? "text-green-600"
                                    : goal.achievement_percentage >= 70
                                    ? "text-yellow-600"
                                    : "text-red-600"
                                }`}
                              >
                                {goal.achievement_percentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>

                          {goal.is_locked && (
                            <Badge variant="outline" className="text-xs">
                              Locked
                            </Badge>
                          )}
                        </div>

                        {/* HOD Remarks */}
                        {goal.hod_remarks && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="text-xs font-medium text-blue-900 mb-1">
                              HOD Remarks
                            </div>
                            <p className="text-sm text-blue-800">
                              {goal.hod_remarks}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
