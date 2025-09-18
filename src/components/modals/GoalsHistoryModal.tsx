import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, CheckCircle, XCircle, Clock, Target, TrendingUp, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { getHistoricalGoals, type DailyGoal } from '@/lib/database/goals-api';
import { useAuth } from '@/contexts/AuthContext';

interface GoalsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GoalsHistoryModal: React.FC<GoalsHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [historicalGoals, setHistoricalGoals] = useState<DailyGoal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Haftalık hedefleri yükle
  useEffect(() => {
    if (isOpen && user?.id) {
      loadWeeklyGoals();
    }
  }, [isOpen, user?.id, currentWeek]);

  const loadWeeklyGoals = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const weekStart = getWeekStart(currentWeek);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const startDate = formatDate(weekStart);
      const endDate = formatDate(weekEnd);

      const goals = await getHistoricalGoals(user.id, startDate, endDate);
      setHistoricalGoals(goals);
    } catch (error) {
      console.error('Error loading historical goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Haftalık takvim fonksiyonları
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
    return new Date(d.setDate(diff));
  };

  const getWeekDays = (weekStart: Date) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDateDisplay = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (formatDate(date) === formatDate(today)) return 'Bugün';
    if (formatDate(date) === formatDate(yesterday)) return 'Dün';
    
    return date.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'long'
    });
  };

  const weekStart = getWeekStart(currentWeek);
  const weekDays = getWeekDays(weekStart);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'question': return <Target className="w-4 h-4 text-pink-500" />;
      case 'subject': return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'time': return <Clock className="w-4 h-4 text-green-500" />;
      default: return <Target className="w-4 h-4 text-gray-500" />;
    }
  };

  // Seçilen günün hedeflerini getir
  const selectedDateGoals = historicalGoals.filter(goal => goal.goalDate === selectedDate);
  
  // Hafta navigasyonu
  const goToPreviousWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() - 7);
    setCurrentWeek(newWeek);
  };

  const goToNextWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(newWeek);
  };

  // Günün istatistiklerini hesapla
  const getDayStats = (date: string) => {
    const dayGoals = historicalGoals.filter(goal => goal.goalDate === date);
    const completed = dayGoals.filter(g => g.completed).length;
    const total = dayGoals.length;
    return { completed, total, hasGoals: total > 0 };
  };

  // Hafta başlığı
  const getWeekTitle = () => {
    const endDate = new Date(weekStart);
    endDate.setDate(weekStart.getDate() + 6);
    
    return `${weekStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}`;
  };

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Geçmiş Hedefler</h2>
              <p className="text-sm text-gray-600">Önceki günlerdeki hedef performansın</p>
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full"></div>
              <span className="ml-3 text-gray-500">Geçmiş hedefler yükleniyor...</span>
            </div>
          ) : (
            <>
              {/* Week Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={goToPreviousWeek}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                
                <h3 className="text-lg font-semibold text-gray-800">
                  {getWeekTitle()}
                </h3>
                
                <button
                  onClick={goToNextWeek}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>

          {/* Weekly Calendar */}
          <div className="grid grid-cols-7 gap-2 mb-6">
            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((dayName, index) => (
              <div key={dayName} className="text-center">
                <div className="text-xs font-medium text-gray-500 mb-2">{dayName}</div>
                {(() => {
                  const day = weekDays[index];
                  const dayStr = formatDate(day);
                  const stats = getDayStats(dayStr);
                  const isSelected = dayStr === selectedDate;
                  const isToday = formatDate(day) === formatDate(new Date());
                  
                  return (
                    <button
                      onClick={() => setSelectedDate(dayStr)}
                      className={`w-full h-16 rounded-xl border-2 transition-all relative ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : stats.hasGoals
                            ? 'border-gray-200 bg-white hover:border-gray-300'
                            : 'border-gray-100 bg-gray-50'
                      } ${isToday ? 'ring-2 ring-blue-200' : ''}`}
                    >
                      <div className="text-sm font-medium text-gray-800">
                        {day.getDate()}
                      </div>
                      
                      {stats.hasGoals && (
                        <div className="absolute bottom-1 left-1 right-1">
                          <div className="flex justify-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${
                              stats.completed === stats.total ? 'bg-green-400' : 
                              stats.completed > 0 ? 'bg-yellow-400' : 'bg-red-400'
                            }`} />
                            <div className="text-xs text-gray-600">
                              {stats.completed}/{stats.total}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {!stats.hasGoals && (
                        <div className="absolute bottom-1 left-1 right-1">
                          <div className="text-xs text-gray-400">-</div>
                        </div>
                      )}
                    </button>
                  );
                })()}
              </div>
            ))}
          </div>

          {/* Selected Date Goals */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-800">
                {formatDateDisplay(new Date(selectedDate + 'T00:00:00'))}
              </h4>
              {selectedDateGoals.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                    selectedDateGoals.filter(g => g.completed).length === selectedDateGoals.length
                      ? 'bg-green-100 text-green-700'
                      : selectedDateGoals.filter(g => g.completed).length > 0
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedDateGoals.filter(g => g.completed).length}/{selectedDateGoals.length} tamamlandı
                  </span>
                </div>
              )}
            </div>

            {/* Goals List */}
            {selectedDateGoals.length > 0 ? (
              <div className="space-y-3">
                {selectedDateGoals.map((goal) => (
                  <div 
                    key={goal.id}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      goal.completed 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    {/* Status Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      goal.completed ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {goal.completed ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </div>

                    {/* Category Icon */}
                    <div className="flex-shrink-0">
                      {getCategoryIcon(goal.category || 'custom')}
                    </div>

                    {/* Goal Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-base font-medium ${
                        goal.completed ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {goal.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {goal.currentValue}/{goal.targetValue} {goal.unit}
                        {goal.targetValue > 0 && (
                          <span className="ml-2 font-medium">
                            (%{Math.round((goal.currentValue / goal.targetValue) * 100)})
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-20">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            goal.completed ? 'bg-green-400' : 'bg-red-400'
                          }`}
                          style={{ 
                            width: `${Math.min((goal.currentValue / goal.targetValue) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">Bu Günde Hedef Yok</h3>
                <p className="text-gray-500">Seçilen günde henüz hedef belirlenmemiş</p>
              </div>
            )}
          </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Haftalık hedef geçmişi</span>
          </div>
          <button
            onClick={onClose}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default GoalsHistoryModal;
