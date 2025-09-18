import { createClient } from '@/lib/supabase/client';

export interface DailyGoal {
  id: string;
  title: string;
  completed: boolean;
  targetValue: number;
  currentValue: number;
  unit: string;
  category: 'question' | 'subject' | 'time' | 'custom';
  isManual?: boolean;
  goalDate: string;
  manualApprovalRequired?: boolean;
  isManuallyApproved?: boolean;
  approvedAt?: string;
}

export interface DailyGoalStats {
  questionsToday: number;
  dailyGoal: number;
  completedGoals: number;
  totalGoals: number;
  completionRate: number;
  mainProgress: number;
}

// Günlük hedefleri getir
export async function getDailyGoals(userId: string, date: string = new Date().toISOString().split('T')[0]): Promise<DailyGoal[]> {
  const supabase = createClient();
  
  try {
    // Veritabanından günlük hedef verilerini getir
    const { data: dailyGoalData, error } = await supabase
      .from('daily_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('goal_date', date)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Daily goals fetch error:', error);
      return [];
    }

    // Eğer günlük hedef yoksa varsayılan hedefleri oluştur
    if (!dailyGoalData) {
      await createDefaultDailyGoals(userId, date);
      return getDailyGoals(userId, date); // Recursive call
    }

    // Veritabanı verilerini DailyGoal formatına çevir (sadece aktif hedefleri dahil et)
    const goals: DailyGoal[] = [];
    
    // Soru hedefi (target > 1 ise dahil et)
    if (dailyGoalData.target_questions > 1) {
      goals.push({
        id: 'questions',
        title: `${dailyGoalData.target_questions} soru çöz`,
        completed: dailyGoalData.achieved_questions >= dailyGoalData.target_questions,
        targetValue: dailyGoalData.target_questions,
        currentValue: dailyGoalData.achieved_questions || 0,
        unit: 'soru',
        category: 'question',
        goalDate: date,
        isManual: false
      });
    }
    
    // Ders hedefi (target > 1 ise dahil et)
    if (dailyGoalData.target_subjects > 1) {
      goals.push({
        id: 'subjects',
        title: `${dailyGoalData.target_subjects} ders çalış`,
        completed: dailyGoalData.achieved_subjects >= dailyGoalData.target_subjects,
        targetValue: dailyGoalData.target_subjects,
        currentValue: dailyGoalData.achieved_subjects || 0,
        unit: 'ders',
        category: 'subject',
        goalDate: date,
        isManual: false
      });
    }
    
    // Süre hedefi (target > 1 ise dahil et)
    if (dailyGoalData.target_duration > 1) {
      goals.push({
        id: 'duration',
        title: `${dailyGoalData.target_duration} dakika odaklan`,
        completed: dailyGoalData.achieved_duration >= dailyGoalData.target_duration,
        targetValue: dailyGoalData.target_duration,
        currentValue: dailyGoalData.achieved_duration || 0,
        unit: 'dakika',
        category: 'time',
        goalDate: date,
        isManual: false
      });
    }

    // Manuel hedefleri de getir
    const manualGoals = await getManualGoals(userId, date);
    
    return [...goals, ...manualGoals];
    
  } catch (error) {
    console.error('Error fetching daily goals:', error);
    return [];
  }
}

// Manuel hedefleri getir (user_goals tablosundan)
async function getManualGoals(userId: string, date: string): Promise<DailyGoal[]> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('goal_date', date)
      .eq('is_active', true);

    if (error) {
      console.error('Manual goals fetch error:', error);
      return [];
    }

    return (data || []).map(goal => ({
      id: goal.id,
      title: goal.goal_title,
      completed: goal.is_completed || false,
      targetValue: goal.target_value || 1,
      currentValue: goal.current_value || 0,
      unit: goal.unit || 'adet',
      category: 'custom',
      goalDate: date,
      isManual: true,
      manualApprovalRequired: goal.manual_approval_required,
      isManuallyApproved: goal.is_manually_approved,
      approvedAt: goal.approved_at
    }));
    
  } catch (error) {
    console.error('Error fetching manual goals:', error);
    return [];
  }
}

// Varsayılan günlük hedefleri oluştur
async function createDefaultDailyGoals(userId: string, date: string) {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('daily_goals')
      .insert({
        user_id: userId,
        goal_date: date,
        target_questions: 5,
        target_subjects: 2,
        target_duration: 30,
        achieved_questions: 0,
        achieved_subjects: 0,
        achieved_duration: 0
      });

    if (error) {
      console.error('Error creating default daily goals:', error);
    }
  } catch (error) {
    console.error('Error creating default daily goals:', error);
  }
}

// Günlük hedef istatistiklerini hesapla
export function calculateDailyGoalStats(goals: DailyGoal[]): DailyGoalStats {
  const completedGoals = goals.filter(goal => goal.completed).length;
  const totalGoals = goals.length;
  const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
  
  // Ana hedef ilerlemen = tüm hedeflerin ortalama ilerlemesi
  const mainProgress = totalGoals > 0 
    ? goals.reduce((sum, goal) => {
        const goalProgress = Math.min((goal.currentValue / goal.targetValue) * 100, 100);
        return sum + goalProgress;
      }, 0) / totalGoals
    : 0;

  // Soru hedefini bul
  const questionGoal = goals.find(goal => goal.category === 'question');
  
  return {
    questionsToday: questionGoal?.currentValue || 0,
    dailyGoal: questionGoal?.targetValue || 5,
    completedGoals,
    totalGoals,
    completionRate,
    mainProgress
  };
}

// Manuel hedef ekle
export async function addManualGoal(
  userId: string,
  title: string,
  targetValue: number,
  unit: string,
  date: string = new Date().toISOString().split('T')[0]
): Promise<boolean> {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('user_goals')
      .insert({
        user_id: userId,
        goal_title: title,
        target_value: targetValue,
        current_value: 0,
        unit: unit,
        goal_date: date,
        is_completed: false,
        is_active: true,
        manual_approval_required: true
      });

    if (error) {
      console.error('Error adding manual goal:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error adding manual goal:', error);
    return false;
  }
}

// Manuel hedef güncelle
export async function updateManualGoal(
  goalId: string,
  currentValue: number,
  isCompleted?: boolean
): Promise<boolean> {
  const supabase = createClient();
  
  try {
    const updateData: any = {
      current_value: currentValue,
      updated_at: new Date().toISOString()
    };
    
    if (isCompleted !== undefined) {
      updateData.is_completed = isCompleted;
      if (isCompleted) {
        updateData.is_manually_approved = true;
        updateData.approved_at = new Date().toISOString();
      }
    }
    
    const { error } = await supabase
      .from('user_goals')
      .update(updateData)
      .eq('id', goalId);

    if (error) {
      console.error('Error updating manual goal:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating manual goal:', error);
    return false;
  }
}

// Manuel hedef sil
export async function deleteManualGoal(goalId: string): Promise<boolean> {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('user_goals')
      .update({ is_active: false })
      .eq('id', goalId);

    if (error) {
      console.error('Error deleting manual goal:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting manual goal:', error);
    return false;
  }
}

// Geçmiş hedefleri getir (belirli bir tarih aralığında)
export async function getHistoricalGoals(
  userId: string, 
  startDate: string, 
  endDate: string
): Promise<DailyGoal[]> {
  const supabase = createClient();
  
  try {
    // Önce daily_goals tablosundan ana hedefleri getir
    const { data: dailyGoalsData, error: dailyError } = await supabase
      .from('daily_goals')
      .select('*')
      .eq('user_id', userId)
      .gte('goal_date', startDate)
      .lte('goal_date', endDate)
      .order('goal_date', { ascending: false });

    if (dailyError) {
      console.error('Historical daily goals fetch error:', dailyError);
    }

    // Manuel hedefleri getir
    const { data: manualGoalsData, error: manualError } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .gte('goal_date', startDate)
      .lte('goal_date', endDate)
      .eq('is_active', true)
      .order('goal_date', { ascending: false });

    if (manualError) {
      console.error('Historical manual goals fetch error:', manualError);
    }

    const allGoals: DailyGoal[] = [];

    // Daily goals'ları dönüştür (sadece aktif hedefleri dahil et)
    (dailyGoalsData || []).forEach(dailyGoal => {
      // Soru hedefi (target > 1 ise dahil et)
      if (dailyGoal.target_questions > 1) {
        allGoals.push({
          id: `${dailyGoal.goal_date}-questions`,
          title: `${dailyGoal.target_questions} soru çöz`,
          completed: dailyGoal.achieved_questions >= dailyGoal.target_questions,
          targetValue: dailyGoal.target_questions,
          currentValue: dailyGoal.achieved_questions || 0,
          unit: 'soru',
          category: 'question',
          goalDate: dailyGoal.goal_date,
          isManual: false
        });
      }
      
      // Ders hedefi (target > 1 ise dahil et)
      if (dailyGoal.target_subjects > 1) {
        allGoals.push({
          id: `${dailyGoal.goal_date}-subjects`,
          title: `${dailyGoal.target_subjects} ders çalış`,
          completed: dailyGoal.achieved_subjects >= dailyGoal.target_subjects,
          targetValue: dailyGoal.target_subjects,
          currentValue: dailyGoal.achieved_subjects || 0,
          unit: 'ders',
          category: 'subject',
          goalDate: dailyGoal.goal_date,
          isManual: false
        });
      }
      
      // Süre hedefi (target > 1 ise dahil et)
      if (dailyGoal.target_duration > 1) {
        allGoals.push({
          id: `${dailyGoal.goal_date}-duration`,
          title: `${dailyGoal.target_duration} dakika odaklan`,
          completed: dailyGoal.achieved_duration >= dailyGoal.target_duration,
          targetValue: dailyGoal.target_duration,
          currentValue: dailyGoal.achieved_duration || 0,
          unit: 'dakika',
          category: 'time',
          goalDate: dailyGoal.goal_date,
          isManual: false
        });
      }
    });

    // Manuel hedefleri dönüştür
    (manualGoalsData || []).forEach(goal => {
      allGoals.push({
        id: goal.id,
        title: goal.goal_title,
        completed: goal.is_completed || false,
        targetValue: goal.target_value || 1,
        currentValue: goal.current_value || 0,
        unit: goal.unit || 'adet',
        category: 'custom',
        goalDate: goal.goal_date,
        isManual: true,
        manualApprovalRequired: goal.manual_approval_required,
        isManuallyApproved: goal.is_manually_approved,
        approvedAt: goal.approved_at
      });
    });

    return allGoals;
    
  } catch (error) {
    console.error('Error fetching historical goals:', error);
    return [];
  }
}

// Belirli bir tarih için hedefleri getir
export async function getGoalsForDate(userId: string, date: string): Promise<DailyGoal[]> {
  return getHistoricalGoals(userId, date, date);
}

// Sistem hedeflerini (daily_goals) güncelle
export async function updateDailyGoalTargets(
  userId: string,
  date: string,
  updates: {
    targetQuestions?: number;
    targetSubjects?: number;
    targetDuration?: number;
  }
): Promise<boolean> {
  const supabase = createClient();
  
  try {
    const updateData: any = {};
    
    if (updates.targetQuestions !== undefined) {
      updateData.target_questions = updates.targetQuestions;
    }
    if (updates.targetSubjects !== undefined) {
      updateData.target_subjects = updates.targetSubjects;
    }
    if (updates.targetDuration !== undefined) {
      updateData.target_duration = updates.targetDuration;
    }
    
    updateData.updated_at = new Date().toISOString();
    
    const { error } = await supabase
      .from('daily_goals')
      .update(updateData)
      .eq('user_id', userId)
      .eq('goal_date', date);

    if (error) {
      console.error('Error updating daily goal targets:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating daily goal targets:', error);
    return false;
  }
}

// Sistem hedefini manuel olarak onaylama/iptal etme
export async function updateDailyGoalApproval(
  userId: string,
  date: string,
  isApproved: boolean
): Promise<boolean> {
  const supabase = createClient();
  
  try {
    const updateData: any = {
      is_manually_approved: isApproved,
      updated_at: new Date().toISOString()
    };
    
    if (isApproved) {
      updateData.approved_at = new Date().toISOString();
    } else {
      updateData.approved_at = null;
    }
    
    const { error } = await supabase
      .from('daily_goals')
      .update(updateData)
      .eq('user_id', userId)
      .eq('goal_date', date);

    if (error) {
      console.error('Error updating daily goal approval:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating daily goal approval:', error);
    return false;
  }
}

// Sistem hedefinin mevcut ilerlemesini güncelle
export async function updateDailyGoalProgress(
  userId: string,
  date: string,
  updates: {
    achievedQuestions?: number;
    achievedSubjects?: number;
    achievedDuration?: number;
  }
): Promise<boolean> {
  const supabase = createClient();
  
  try {
    const updateData: any = {};
    
    if (updates.achievedQuestions !== undefined) {
      updateData.achieved_questions = Math.max(0, updates.achievedQuestions);
    }
    if (updates.achievedSubjects !== undefined) {
      updateData.achieved_subjects = Math.max(0, updates.achievedSubjects);
    }
    if (updates.achievedDuration !== undefined) {
      updateData.achieved_duration = Math.max(0, updates.achievedDuration);
    }
    
    updateData.updated_at = new Date().toISOString();
    
    const { error } = await supabase
      .from('daily_goals')
      .update(updateData)
      .eq('user_id', userId)
      .eq('goal_date', date);

    if (error) {
      console.error('Error updating daily goal progress:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating daily goal progress:', error);
    return false;
  }
}

// Sistem hedefini tamamen sil (daily_goals kaydını sil)
export async function deleteDailyGoal(userId: string, date: string): Promise<boolean> {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('daily_goals')
      .delete()
      .eq('user_id', userId)
      .eq('goal_date', date);

    if (error) {
      console.error('Error deleting daily goal:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting daily goal:', error);
    return false;
  }
}

// Belirli bir sistem hedefini sil (sadece o kategoriyi sıfırla)
export async function deleteDailyGoalCategory(
  userId: string,
  date: string,
  category: 'questions' | 'subjects' | 'duration'
): Promise<boolean> {
  const supabase = createClient();
  
  try {
    // Önce kayıt var mı kontrol et
    const { data: existingGoal, error: selectError } = await supabase
      .from('daily_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('goal_date', date)
      .single();

    if (selectError) {
      console.error('Error finding daily goal:', selectError);
      // Eğer kayıt yoksa, başarılı say (zaten silinmiş)
      if (selectError.code === 'PGRST116') {
        return true;
      }
      return false;
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    // Belirli kategoriyi minimum değere çek (constraint'ler nedeniyle 0 yapamıyoruz)
    switch (category) {
      case 'questions':
        updateData.target_questions = 1;
        updateData.achieved_questions = 1; // Tamamlanmış gibi göster
        break;
      case 'subjects':
        updateData.target_subjects = 1;
        updateData.achieved_subjects = 1; // Tamamlanmış gibi göster
        break;
      case 'duration':
        updateData.target_duration = 1;
        updateData.achieved_duration = 1; // Tamamlanmış gibi göster
        break;
    }
    
    const { error } = await supabase
      .from('daily_goals')
      .update(updateData)
      .eq('user_id', userId)
      .eq('goal_date', date);

    if (error) {
      console.error('Error deleting daily goal category:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting daily goal category:', error);
    return false;
  }
}
