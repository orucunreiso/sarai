'use client';

import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { approveGoalManually } from '@/lib/database/dashboard-api';

interface GoalApprovalModalProps {
  onClose: () => void;
  userId: string;
  currentStats: any;
  onApproved: () => void;
  showNotification: any;
}

export function GoalApprovalModal({
  onClose,
  userId,
  currentStats,
  onApproved,
  showNotification,
}: GoalApprovalModalProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');

  const handleApproval = async () => {
    setIsApproving(true);
    try {
      const { error } = await approveGoalManually(userId, undefined, approvalNote);

      if (error) {
        showNotification.showError('❌ Hata', 'Hedef onaylanırken bir hata oluştu.');
        return;
      }

      // Calculate XP reward for manual approval
      const xpBonus = 50; // Bonus XP for manual goal approval

      showNotification.showSuccess('🎉 Tebrikler!', 'Günlük hedefin onaylandı!');
      showNotification.showXP(`+${xpBonus} XP`, 'Hedef Onayı Bonusu');

      onApproved(); // Refresh dashboard
      onClose();
    } catch (error) {
      console.error('Approval error:', error);
      showNotification.showError('❌ Hata', 'Beklenmeyen bir hata oluştu.');
    } finally {
      setIsApproving(false);
    }
  };

  const todayProgress = Math.min((currentStats.questionsToday / currentStats.dailyGoal) * 100, 100);

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-pink-200/50"
        style={{ background: 'linear-gradient(145deg, #FFFFFF 0%, #FFF5F7 100%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-pink-200/50">
          <h3 className="text-2xl font-bold text-gray-800">
            🎯 Hedef Onayı
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Achievement Summary */}
          <div className="bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl p-6 text-white text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4" />
            <h4 className="text-xl font-bold mb-2">Günlük Hedef Tamamlandı! 🎉</h4>
            <p className="text-sm opacity-90 mb-4">
              Bugün {currentStats.questionsToday} soru çözerek hedefine ulaştın!
            </p>
            <div className="bg-white/20 rounded-lg p-3">
              <div className="text-3xl font-bold">{Math.round(todayProgress)}%</div>
              <div className="text-sm opacity-80">
                {currentStats.questionsToday}/{currentStats.dailyGoal} soru
              </div>
            </div>
          </div>

          {/* Approval Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bugün nasıl geçti? (İsteğe bağlı)
            </label>
            <textarea
              value={approvalNote}
              onChange={(e) => setApprovalNote(e.target.value)}
              placeholder="Bugünkü çalışman hakkında notlarını yazabilirsin..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* Rewards Preview */}
          <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg p-4">
            <h5 className="font-semibold text-gray-800 mb-2">🎁 Ödüller</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Hedef Bonusu</span>
                <span className="font-bold text-amber-600">+50 XP</span>
              </div>
              <div className="flex justify-between">
                <span>Başarı Puanı</span>
                <span className="font-bold text-green-600">+{Math.round(todayProgress)} Puan</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleApproval}
              disabled={isApproving}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApproving ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Onaylanıyor...
                </div>
              ) : (
                '🎉 Hedefe Ulaştım!'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}