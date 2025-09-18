import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Edit2, Check, Trash2, Clock, BookOpen, Target } from 'lucide-react';
import { 
  getDailyGoals,
  addManualGoal, 
  updateManualGoal, 
  deleteManualGoal,
  updateDailyGoalTargets,
  updateDailyGoalProgress,
  updateDailyGoalApproval,
  deleteDailyGoalCategory,
  type DailyGoal 
} from '@/lib/database/goals-api';
import { useAuth } from '@/contexts/AuthContext';
import { useToastNotification } from '@/hooks/useToastNotification';
import { ToastContainer } from '@/components/ui/ToastNotification';
import ConfirmationToast from '@/components/ui/ConfirmationToast';

interface GoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoalsUpdate?: () => void; // Widget'ı yenilemek için callback
}

const GoalsModal: React.FC<GoalsModalProps> = ({
  isOpen,
  onClose,
  onGoalsUpdate,
}) => {
  const { user } = useAuth();
  const { 
    toasts, 
    confirmation, 
    removeToast, 
    showSuccess, 
    showError, 
    showWarning, 
    showConfirmation, 
    handleConfirmationResult 
  } = useToastNotification();
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    targetValue: 1,
    unit: 'adet',
    category: 'custom' as const,
  });

  // Modal açıldığında verileri yükle
  useEffect(() => {
    if (isOpen && user?.id) {
      loadGoals();
    }
  }, [isOpen, user?.id]);

  const loadGoals = async () => {
    if (!user?.id) return;
    
    setIsDataLoading(true);
    try {
      const dailyGoals = await getDailyGoals(user.id);
      setGoals(dailyGoals);
    } catch (error) {
      console.error('Error loading goals in modal:', error);
    } finally {
      setIsDataLoading(false);
    }
  };

  if (!isOpen) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'question': return <Target className="w-4 h-4 text-pink-500" />;
      case 'subject': return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'time': return <Clock className="w-4 h-4 text-green-500" />;
      default: return <Target className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleAddGoal = async () => {
    if (!newGoal.title.trim() || !user?.id) return;

    setIsLoading(true);
    try {
      const success = await addManualGoal(
        user.id,
        newGoal.title,
        newGoal.targetValue,
        newGoal.unit
      );

      if (success) {
        setNewGoal({ title: '', targetValue: 1, unit: 'adet', category: 'custom' });
        setShowAddForm(false);
        await loadGoals(); // Modal'daki veriyi yenile
        onGoalsUpdate?.(); // Widget'ı yenile
        showSuccess('Hedef eklendi!', `"${newGoal.title}" başarıyla eklendi.`);
      } else {
        showError('Hata!', 'Hedef eklenirken bir sorun oluştu.');
      }
    } catch (error) {
      console.error('Error adding goal:', error);
      showError('Hata!', 'Hedef eklenirken beklenmedik bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!user?.id) return;

    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    // Onay mesajı göster
    const confirmOptions = goal.isManual 
      ? {
          title: 'Hedefi Sil',
          message: `"${goal.title}" hedefini silmek istediğinizden emin misiniz?`,
          confirmText: 'Sil',
          cancelText: 'İptal',
          type: 'warning' as const
        }
      : {
          title: 'Sistem Hedefini Sil',
          message: `"${goal.title}" sistem hedefini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
          confirmText: 'Sil',
          cancelText: 'İptal',
          type: 'danger' as const
        };
    
    const confirmed = await showConfirmation(confirmOptions);
    if (!confirmed) return;

    setIsLoading(true);
    try {
      let success = false;
      
      if (goal.isManual) {
        // Manuel hedef silme
        success = await deleteManualGoal(goalId);
      } else {
        // Sistem hedefi silme
        let category: 'questions' | 'subjects' | 'duration';
        
        if (goal.category === 'question') {
          category = 'questions';
        } else if (goal.category === 'subject') {
          category = 'subjects';
        } else if (goal.category === 'time') {
          category = 'duration';
        } else {
          showError('Hata!', 'Bilinmeyen hedef kategorisi.');
          return;
        }
        
        success = await deleteDailyGoalCategory(user.id, goal.goalDate, category);
      }
      
      if (success) {
        await loadGoals(); // Modal'daki veriyi yenile
        onGoalsUpdate?.(); // Widget'ı yenile
        showSuccess('Hedef silindi!', `"${goal.title}" başarıyla silindi.`);
      } else {
        showError('Hata!', 'Hedef silinirken bir sorun oluştu.');
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      showError('Hata!', 'Hedef silinirken beklenmedik bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (goalId: string) => {
    if (!user?.id) return;

    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    setIsLoading(true);
    try {
      let success = false;
      
      if (goal.isManual) {
        // Manuel hedef onaylama/kaldırma
        const newCompleted = !goal.completed;
        const newCurrentValue = newCompleted ? goal.targetValue : 0;
        success = await updateManualGoal(goalId, newCurrentValue, newCompleted);
      } else {
        // Sistem hedefi onaylama/kaldırma
        const newApproved = !goal.completed;
        success = await updateDailyGoalApproval(user.id, goal.goalDate, newApproved);
      }
      
      if (success) {
        await loadGoals(); // Modal'daki veriyi yenile
        onGoalsUpdate?.(); // Widget'ı yenile
        const action = goal.completed ? 'iptal edildi' : 'onaylandı';
        showSuccess('Hedef güncellendi!', `"${goal.title}" ${action}.`);
      } else {
        showError('Hata!', 'Hedef güncellenirken bir sorun oluştu.');
      }
    } catch (error) {
      console.error('Error updating goal completion:', error);
      showError('Hata!', 'Hedef güncellenirken beklenmedik bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProgress = async (goalId: string, newValue: number) => {
    if (!user?.id) return;

    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    setIsLoading(true);
    try {
      let success = false;
      
      if (goal.isManual) {
        // Manuel hedef güncelleme
        const clampedValue = Math.max(0, Math.min(newValue, goal.targetValue));
        const isCompleted = clampedValue >= goal.targetValue;
        success = await updateManualGoal(goalId, clampedValue, isCompleted);
      } else {
        // Sistem hedefi güncelleme
        const clampedValue = Math.max(0, newValue);
        const updates: any = {};
        
        if (goal.category === 'question') {
          updates.achievedQuestions = clampedValue;
        } else if (goal.category === 'subject') {
          updates.achievedSubjects = clampedValue;
        } else if (goal.category === 'time') {
          updates.achievedDuration = clampedValue;
        }
        
        success = await updateDailyGoalProgress(user.id, goal.goalDate, updates);
      }
      
      if (success) {
        await loadGoals(); // Modal'daki veriyi yenile
        onGoalsUpdate?.(); // Widget'ı yenile
        showSuccess('İlerleme güncellendi!', `"${goal.title}" ilerlemesi güncellendi.`);
      } else {
        showError('Hata!', 'İlerleme güncellenirken bir sorun oluştu.');
      }
    } catch (error) {
      console.error('Error updating goal progress:', error);
      showError('Hata!', 'İlerleme güncellenirken beklenmedik bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
              <Target className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Günlük Hedefler</h2>
              <p className="text-sm text-gray-600">Hedeflerini yönet ve ilerleme kaydet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Loading State */}
          {isDataLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-pink-300 border-t-pink-600 rounded-full"></div>
              <span className="ml-3 text-gray-500">Hedefler yükleniyor...</span>
            </div>
          ) : (
            <>
              {/* Existing Goals */}
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  Mevcut Hedefler ({goals.length})
                </h3>
            
            {goals.map((goal) => (
              <div key={goal.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(goal.category || 'custom')}
                    <div>
                      <h4 className="font-medium text-gray-800">{goal.title}</h4>
                      <p className="text-sm text-gray-600">
                        {goal.currentValue}/{goal.targetValue} {goal.unit}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleComplete(goal.id)}
                      disabled={isLoading}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        goal.completed 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                      title={goal.completed ? 'Onayı kaldır' : 'Onayla'}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      disabled={isLoading}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        goal.isManual 
                          ? 'text-red-500 hover:bg-red-50' 
                          : 'text-orange-500 hover:bg-orange-50'
                      }`}
                      title={goal.isManual ? 'Manuel hedefi sil' : 'Sistem hedefini sil'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>İlerleme</span>
                    <span>{Math.round((goal.currentValue / goal.targetValue) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        goal.completed ? 'bg-green-400' : 'bg-gradient-to-r from-pink-400 to-purple-500'
                      }`}
                      style={{ width: `${Math.min((goal.currentValue / goal.targetValue) * 100, 100)}%` }}
                    />
                  </div>
                  
                  {/* Progress Update - Hem manuel hem sistem hedefleri için */}
                  {!goal.completed && (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => handleUpdateProgress(goal.id, goal.currentValue - 1)}
                        className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={goal.currentValue <= 0 || isLoading}
                      >
                        -
                      </button>
                      <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-center">
                        {goal.currentValue}
                      </span>
                      <button
                        onClick={() => handleUpdateProgress(goal.id, goal.currentValue + 1)}
                        className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={(goal.isManual && goal.currentValue >= goal.targetValue) || isLoading}
                      >
                        +
                      </button>
                      {!goal.isManual && (
                        <span className="text-xs text-blue-600 ml-2">Sistem Hedefi</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add New Goal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-500" />
              Yeni Hedef Ekle
            </h3>
            
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors group"
              >
                <div className="flex items-center justify-center gap-2 text-gray-600 group-hover:text-blue-600">
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Manuel Hedef Ekle</span>
                </div>
              </button>
            ) : (
              <div className="bg-white rounded-xl p-4 border-2 border-blue-200 shadow-sm">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hedef Başlığı
                    </label>
                    <input
                      type="text"
                      value={newGoal.title}
                      onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                      placeholder="Örn: 10 sayfa kitap oku"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hedef Sayısı
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newGoal.targetValue}
                        onChange={(e) => setNewGoal({...newGoal, targetValue: parseInt(e.target.value) || 1})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Birim
                      </label>
                      <select
                        value={newGoal.unit}
                        onChange={(e) => setNewGoal({...newGoal, unit: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      >
                        <option value="adet">adet</option>
                        <option value="sayfa">sayfa</option>
                        <option value="dakika">dakika</option>
                        <option value="saat">saat</option>
                        <option value="kez">kez</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddGoal}
                      disabled={isLoading}
                      className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Ekleniyor...' : 'Hedef Ekle'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setNewGoal({ title: '', targetValue: 1, unit: 'adet', category: 'custom' });
                      }}
                      disabled={isLoading}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              </div>
            )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            {goals.filter(g => g.completed).length}/{goals.length} hedef tamamlandı
          </p>
          <button
            onClick={onClose}
            className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors font-medium"
          >
            Tamamla
          </button>
        </div>
      </div>
    </div>
  );

  // Portal ile body'e render et
  return (
    <>
      {createPortal(modalContent, document.body)}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {confirmation && (
        <ConfirmationToast
          options={confirmation.options}
          onConfirm={() => handleConfirmationResult(true)}
          onCancel={() => handleConfirmationResult(false)}
        />
      )}
    </>
  );
};

export default GoalsModal;
