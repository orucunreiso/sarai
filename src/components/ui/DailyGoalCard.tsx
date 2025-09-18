import React from 'react';
import { Target, Check, X, Circle } from 'lucide-react';
import CollapsibleCard from './CollapsibleCard';

type DailyGoalStatus = 'pending' | 'approved' | 'rejected';

interface DailyGoalTask {
  id: string;
  title: string;
  description?: string;
  status: DailyGoalStatus;
  metricType: string;
  targetValue?: number;
  actualValue?: number;
  unit?: string;
  requiresApproval?: boolean;
  lastUpdated?: string;
}

interface DailyGoalCardProps {
  tasks: DailyGoalTask[];
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  completionRate: number;
  onTaskUpdate: (taskId: string, status: DailyGoalStatus) => void;
  onResetTask: (taskId: string) => void;
  onViewHistory: () => void;
  onEditPlan: () => void;
}

const DAILY_GOAL_STATUS_STYLES: Record<DailyGoalStatus, { badge: string; indicator: string }> = {
  pending: {
    badge: 'bg-gray-100 text-gray-600',
    indicator: 'bg-gray-200 text-gray-500',
  },
  approved: {
    badge: 'bg-emerald-100 text-emerald-700',
    indicator: 'bg-emerald-500 text-white',
  },
  rejected: {
    badge: 'bg-red-100 text-red-600',
    indicator: 'bg-red-500 text-white',
  },
};

const DAILY_GOAL_STATUS_LABELS: Record<DailyGoalStatus, string> = {
  pending: 'Beklemede',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
};

export const DailyGoalCard: React.FC<DailyGoalCardProps> = ({
  tasks,
  approvedCount,
  pendingCount,
  rejectedCount,
  completionRate,
  onTaskUpdate,
  onResetTask,
  onViewHistory,
  onEditPlan,
}) => {
  const getTaskProgressText = (task: DailyGoalTask) => {
    if (task.metricType === 'questions' && task.targetValue !== undefined) {
      return `${task.actualValue ?? 0}/${task.targetValue} ${task.unit || 'soru'}`;
    }
    if (task.metricType === 'subjects' && task.targetValue !== undefined) {
      return `${task.actualValue ?? 0}/${task.targetValue} ${task.unit || 'ders'}`;
    }
    if (task.metricType === 'duration' && task.targetValue !== undefined) {
      return `${task.targetValue} ${task.unit || 'dk'} hedef · manuel takip`;
    }
    if (task.metricType === 'checklist' || task.metricType === 'custom') {
      return task.requiresApproval ? 'Manuel onay gerektirir' : 'Manuel takip';
    }
    return undefined;
  };

  const headerContent = (
    <div className="rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50 via-white to-white p-3 mt-2">
      <div className="flex items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full bg-pink-100" />
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(#ec4899 ${completionRate}%, #ffe4e6 ${completionRate}% 100%)`,
            }}
          />
          <div className="absolute inset-[4px] rounded-full bg-white flex flex-col items-center justify-center">
            <span className="text-sm font-semibold text-pink-600">
              {completionRate}%
            </span>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
            <span>{approvedCount} onaylı</span>
            <span>{pendingCount} bekliyor</span>
            <span>{rejectedCount} reddedildi</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-pink-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-coral-500 transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const actions = (
    <div className="flex items-center gap-2">
      <button
        onClick={onViewHistory}
        className="text-xs px-2 py-1 rounded-lg border border-pink-200 text-pink-600 hover:bg-pink-50 transition-colors"
      >
        Geçmiş
      </button>
      <button
        onClick={onEditPlan}
        className="text-xs px-2 py-1 rounded-lg bg-gradient-to-r from-pink-500 to-coral-500 text-white shadow-sm hover:shadow-md transition-all"
      >
        Düzenle
      </button>
    </div>
  );

  return (
    <CollapsibleCard
      title="Günlük Hedef Planı"
      subtitle={`${approvedCount}/${tasks.length} hedef tamamlandı · %${completionRate}`}
      headerContent={headerContent}
      actions={actions}
      defaultOpen={false}
      className="mb-6"
    >
      <div className="space-y-3">
        {tasks.length > 0 ? (
          tasks.map((task) => {
            const progressText = getTaskProgressText(task);
            const statusStyles = DAILY_GOAL_STATUS_STYLES[task.status];

            return (
              <div
                key={task.id}
                className="group rounded-xl border border-pink-100 bg-white/90 p-3 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 w-6 h-6 flex items-center justify-center rounded-full ${statusStyles.indicator}`}
                    >
                      {task.status === 'approved' && <Check className="w-3 h-3" />}
                      {task.status === 'rejected' && <X className="w-3 h-3" />}
                      {task.status === 'pending' && <Circle className="w-3 h-3" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-800">{task.title}</h4>
                      {task.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
                      )}
                      {progressText && (
                        <p className="text-xs text-pink-600 mt-1 font-medium">
                          {progressText}
                        </p>
                      )}
                      {task.requiresApproval && (
                        <p className="text-[10px] text-amber-600 mt-1">
                          Manuel onay gerektirir
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyles.badge}`}
                  >
                    {DAILY_GOAL_STATUS_LABELS[task.status]}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => onTaskUpdate(task.id, 'approved')}
                    className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg border transition-colors ${
                      task.status === 'approved'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    <Check className="w-3 h-3" /> Onayla
                  </button>
                  <button
                    onClick={() => onTaskUpdate(task.id, 'rejected')}
                    className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg border transition-colors ${
                      task.status === 'rejected'
                        ? 'border-red-500 bg-red-50 text-red-600'
                        : 'border-red-200 text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <X className="w-3 h-3" /> Reddet
                  </button>
                  {task.status !== 'pending' && (
                    <button
                      onClick={() => onResetTask(task.id)}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <Circle className="w-3 h-3" /> Sıfırla
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border-2 border-dashed border-pink-200 bg-pink-50/40 p-4 text-center text-xs text-gray-500">
            Günlük hedef planı henüz hazır değil.{' '}
            <button
              onClick={onEditPlan}
              className="text-pink-600 font-medium hover:underline"
            >
              Planı düzenle
            </button>{' '}
            diyerek hedeflerini oluşturabilirsin.
          </div>
        )}
      </div>
    </CollapsibleCard>
  );
};

export default DailyGoalCard;
