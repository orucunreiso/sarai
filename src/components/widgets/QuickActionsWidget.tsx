import React, { useState } from 'react';
import {
  Zap,
  PlusCircle,
  NotebookPen,
  Timer,
  BookOpen,
  BarChart3,
  Clock,
  TrendingUp,
  Keyboard
} from 'lucide-react';
import BaseWidget from './BaseWidget';
import { Button } from '../ui/Button';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant: 'primary' | 'secondary' | 'accent' | 'gradient';
  shortcut?: string;
  onClick: () => void;
  usageCount?: number;
  lastUsed?: Date;
}

interface QuickActionsWidgetProps {
  className?: string;
  onAddQuestion?: () => void;
  onAddMockExam?: () => void;
  onStartFocusSession?: () => void;
  onStartStudy?: () => void;
}

const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({
  className = '',
  onAddQuestion,
  onAddMockExam,
  onStartFocusSession,
  onStartStudy,
}) => {
  const [actionStats, setActionStats] = useState<Record<string, number>>({
    addQuestion: 0,
    mockExam: 0,
    focusSession: 0,
    startStudy: 0,
  });

  const handleAction = (actionId: string, callback?: () => void) => {
    // İstatistikleri güncelle
    setActionStats(prev => ({
      ...prev,
      [actionId]: (prev[actionId] || 0) + 1
    }));

    // Callback'i çalıştır
    if (callback) {
      callback();
    } else {
      console.log(`${actionId} aksiyonu çalıştırılıyor...`);
    }
  };

  const actions: QuickAction[] = [
    {
      id: 'addQuestion',
      label: 'Soru Ekle',
      icon: <PlusCircle size={18} />,
      variant: 'gradient',
      shortcut: 'Ctrl+N',
      onClick: () => handleAction('addQuestion', onAddQuestion),
      usageCount: actionStats.addQuestion,
    },
    {
      id: 'mockExam',
      label: 'Deneme Oluştur',
      icon: <NotebookPen size={18} />,
      variant: 'accent',
      shortcut: 'Ctrl+E',
      onClick: () => handleAction('mockExam', onAddMockExam),
      usageCount: actionStats.mockExam,
    },
    {
      id: 'focusSession',
      label: 'Odak Seansı',
      icon: <Timer size={18} />,
      variant: 'secondary',
      shortcut: 'Ctrl+F',
      onClick: () => handleAction('focusSession', onStartFocusSession),
      usageCount: actionStats.focusSession,
    },
    {
      id: 'startStudy',
      label: 'Çalışmaya Başla',
      icon: <BookOpen size={18} />,
      variant: 'primary',
      shortcut: 'Ctrl+S',
      onClick: () => handleAction('startStudy', onStartStudy),
      usageCount: actionStats.startStudy,
    },
  ];

  // En çok kullanılan aksiyonları bul
  const getMostUsedActions = () => {
    return actions
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 2);
  };

  // Toplam kullanım sayısı
  const totalUsage = Object.values(actionStats).reduce((sum, count) => sum + count, 0);

  // Collapsed view - En çok kullanılan 2 aksiyon
  const collapsedView = (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">Hızlı Erişim</p>
            <p className="text-xs text-gray-500">{totalUsage} toplam kullanım</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Keyboard size={12} />
          <span>Kısayol</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {getMostUsedActions().map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className="flex items-center gap-2 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:from-amber-50 hover:to-orange-50 hover:border-amber-200 transition-all duration-200 group"
          >
            <div className="text-gray-600 group-hover:text-amber-600 transition-colors">
              {action.icon}
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-gray-700 group-hover:text-amber-700 truncate">
                {action.label}
              </p>
              <p className="text-xs text-gray-400 group-hover:text-amber-500">
                {action.shortcut}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <BaseWidget
      title="Hızlı Eylemler"
      icon={<Zap className="text-amber-500" />}
      isExpandable={true}
      defaultExpanded={false}
      showActions={true}
      className={className}
      widgetId="quick-actions"
      collapsedContent={collapsedView}
      onAction={() => alert('Hızlı eylem ayarları açılacak! ⚡')}
    >
      <div className="space-y-6">
        {/* Ana Aksiyonlar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700">Ana Aksiyonlar</h4>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Keyboard size={12} />
              <span>Kısayollar aktif</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {actions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant}
                size="md"
                leftIcon={action.icon}
                onClick={action.onClick}
                className="justify-start relative group"
              >
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span>{action.label}</span>
                    {action.shortcut && (
                      <span className="text-xs opacity-70 ml-2 bg-black/10 px-1.5 py-0.5 rounded text-[10px]">
                        {action.shortcut}
                      </span>
                    )}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Kullanım İstatistikleri */}
        {totalUsage > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <h4 className="text-sm font-semibold text-gray-700">Kullanım İstatistikleri</h4>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-medium text-blue-700">Toplam Kullanım</span>
                </div>
                <p className="text-lg font-bold text-blue-600">{totalUsage}</p>
                <p className="text-xs text-blue-500">aksiyon gerçekleştirildi</p>
              </div>

              <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-medium text-green-700">En Popüler</span>
                </div>
                <p className="text-sm font-bold text-green-600 truncate">
                  {getMostUsedActions()[0]?.label || 'Henüz yok'}
                </p>
                <p className="text-xs text-green-500">
                  {getMostUsedActions()[0]?.usageCount || 0} kez kullanıldı
                </p>
              </div>
            </div>

            {/* En çok kullanılan aksiyonların progress barları */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600">Aksiyon Dağılımı</p>
              {actions.map((action) => {
                const percentage = totalUsage > 0 ? (action.usageCount || 0) / totalUsage * 100 : 0;
                return (
                  <div key={action.id} className="flex items-center gap-3">
                    <div className="w-4 h-4 text-gray-500">
                      {action.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">{action.label}</span>
                        <span className="text-gray-500">{action.usageCount || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-gradient-to-r from-amber-400 to-orange-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* İlk kullanım durumu */}
        {totalUsage === 0 && (
          <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
            <div className="text-3xl mb-3">🚀</div>
            <h4 className="text-sm font-semibold text-amber-800 mb-2">
              Hızlı Eylemler'e Hoş Geldin!
            </h4>
            <p className="text-xs text-amber-700 mb-3 max-w-xs mx-auto">
              Üstteki butonları kullanarak hızlıca çalışmaya başla.
              Klavye kısayollarını da deneyebilirsin!
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-amber-600">
              <Keyboard size={12} />
              <span>Ctrl+N, Ctrl+E, Ctrl+F, Ctrl+S</span>
            </div>
          </div>
        )}
      </div>
    </BaseWidget>
  );
};

export default QuickActionsWidget;
