// Dashboard API Functions for Sara Dashboard
// Handles all database operations for dashboard features

import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/auth-helpers-nextjs';

const supabase = createClient();

// Types
export interface QuestionEntry {
  id?: string;
  user_id: string;
  subject: string;
  topic?: string;
  question_count: number;
  correct_count: number;
  success_rate?: number;
  entry_date?: string;
  created_at?: string;
}

export interface ExamEntry {
  id?: string;
  user_id: string;
  exam_type: 'tyt' | 'ayt' | 'mixed';
  exam_date: string;
  subjects: Record<string, { total: number; correct: number }>;
  total_questions?: number;
  total_correct?: number;
  success_rate?: number;
  created_at?: string;
}

export interface UserStats {
  questionsToday: number;
  questionsTotal: number;
  currentStreak: number;
  longestStreak: number;
  currentLevel: number;
  totalXP: number;
  xpToNextLevel: number;
  dailyGoal: number;
  weeklyGoal: number;
  monthlyGoal: number;
  activeDays: number;
  avgQuestionsPerDay: number;
}

export interface SubjectProgress {
  subject: string;
  questionsToday: number;
  icon: string;
}

export interface Friend {
  id: string;
  name: string;
  questionsToday: number;
  isActive: boolean;
  totalXP: number;
}

export interface WeeklyData {
  day: string;
  questions: number;
}

export interface DailyGoal {
  id?: string;
  user_id: string;
  goal_date: string;
  target_questions: number;
  target_duration: number;
  target_subjects: number;
  achieved_questions: number;
  achieved_duration: number;
  achieved_subjects: number;
  is_completed: boolean;
  manual_approval_required: boolean;
  is_manually_approved: boolean;
  approved_at?: string | null;
  approval_note?: string | null;
}

// =============================================================================
// QUESTION ENTRIES API
// =============================================================================

export async function saveQuestionEntry(
  entry: Omit<QuestionEntry, 'id' | 'success_rate' | 'created_at'>,
) {
  try {
    // Calculate net score using YKS system: 4 wrong = 1 correct
    const wrong_count = entry.question_count - entry.correct_count;
    const net_score = Math.max(0, entry.correct_count - (wrong_count / 4));
    const success_rate = entry.question_count > 0 ? (net_score / entry.question_count) * 100 : 0;

    // Add missing fields
    const entryData = {
      ...entry,
      entry_date: new Date().toISOString().split('T')[0], // Today's date
      success_rate,
    };

    console.log('📝 Attempting to save question entry:', entryData);

    // Insert question entry
    const { data, error } = await supabase
      .from('question_entries')
      .insert([entryData])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      throw error;
    }

    console.log('✅ Question entry saved successfully:', data);

    return { data, error: null };
  } catch (error) {
    console.error('❌ Error saving question entry:', {
      error: error,
      message: error?.message || 'Unknown error',
      stack: error?.stack,
    });
    return { data: null, error };
  }
}

export async function getQuestionEntries(userId: string, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('question_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching question entries:', error);
    return { data: null, error };
  }
}

export async function getTodayQuestionEntries(userId: string) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('question_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('entry_date', today);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching today question entries:', error);
    return { data: null, error };
  }
}

// =============================================================================
// EXAM ENTRIES API
// =============================================================================

export async function saveExamEntry(entry: Omit<ExamEntry, 'id' | 'success_rate' | 'created_at'>) {
  try {
    // Calculate totals from subjects
    const total_questions = Object.values(entry.subjects).reduce(
      (sum, subject) => sum + subject.total,
      0,
    );
    const total_correct = Object.values(entry.subjects).reduce(
      (sum, subject) => sum + subject.correct,
      0,
    );

    // Calculate net score using YKS system: 4 wrong = 1 correct
    const total_wrong = total_questions - total_correct;
    const net_score = Math.max(0, total_correct - (total_wrong / 4));
    const success_rate = total_questions > 0 ? (net_score / total_questions) * 100 : 0;

    const examData = {
      ...entry,
      total_questions,
      total_correct,
      success_rate,
    };

    console.log('📝 Attempting to save exam entry:', examData);

    // Insert exam entry
    const { data: examResult, error: examError } = await supabase
      .from('exam_entries')
      .insert([examData])
      .select()
      .single();

    if (examError) {
      console.error('❌ Supabase exam error details:', {
        message: examError.message,
        details: examError.details,
        hint: examError.hint,
        code: examError.code,
      });
      throw examError;
    }

    // Calculate XP based on net score performance
    const xp_gained = Math.floor(net_score * 2 + (success_rate / 100) * 50); // Bonus for high success rate

    // Get current user stats to check for level up
    const { data: currentStats } = await supabase
      .from('user_stats')
      .select('total_xp, current_level')
      .eq('user_id', entry.user_id)
      .single();

    const current_xp = currentStats?.total_xp || 0;
    const current_level = currentStats?.current_level || 1;
    const new_total_xp = current_xp + xp_gained;

    // Level calculation: level = floor(sqrt(total_xp / 100)) + 1
    const new_level = Math.floor(Math.sqrt(new_total_xp / 100)) + 1;
    const level_up = new_level > current_level;

    // Update user stats with XP
    const { error: statsError } = await supabase
      .from('user_stats')
      .upsert({
        user_id: entry.user_id,
        total_xp: new_total_xp,
        current_level: new_level,
        updated_at: new Date().toISOString()
      });

    if (statsError) {
      console.warn('Stats update error (non-critical):', statsError);
    }

    console.log('✅ Exam entry saved successfully:', examResult);
    console.log(`🎯 XP gained: ${xp_gained}, Level up: ${level_up ? 'Yes' : 'No'}`);

    return {
      data: {
        ...examResult,
        xp_gained,
        level_up,
        new_level: level_up ? new_level : null,
        achievements: [] // We can expand this later
      },
      error: null
    };
  } catch (error) {
    console.error('❌ Error saving exam entry:', {
      error: error,
      message: error?.message || 'Unknown error',
      stack: error?.stack,
    });
    return { data: null, error };
  }
}

export async function getExamEntries(userId: string, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('exam_entries')
      .select('*')
      .eq('user_id', userId)
      .order('exam_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching exam entries:', error);
    return { data: null, error };
  }
}

// =============================================================================
// USER STATS API
// =============================================================================

export async function getUserStats(
  userId: string,
): Promise<{ data: UserStats | null; error: any }> {
  try {
    // Get user XP data
    const { data: xpData, error: xpError } = await supabase
      .from('user_xp')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (xpError && xpError.code !== 'PGRST116') throw xpError;

    // Get today's question count
    const { data: todayQuestions, error: todayError } = await getTodayQuestionEntries(userId);
    if (todayError) throw todayError;

    const questionsToday =
      todayQuestions?.reduce((sum, entry) => sum + entry.question_count, 0) || 0;

    // Get total questions from all entries
    const { data: allQuestions, error: allError } = await getQuestionEntries(userId, 1000);
    if (allError) throw allError;

    const questionsTotal = allQuestions?.reduce((sum, entry) => sum + entry.question_count, 0) || 0;

    // Get daily goal
    const { data: goalData, error: goalError } = await getTodayDailyGoal(userId);
    if (goalError) throw goalError;

    // Calculate stats
    const totalXP = xpData?.total_xp || 0;
    const currentLevel = xpData?.current_level || 1;
    const xpToNextLevel = 100 - (totalXP % 100);
    const currentStreak = xpData?.study_streak || 0;
    const dailyGoal = goalData?.target_questions || 5;

    const stats: UserStats = {
      questionsToday,
      questionsTotal,
      currentStreak,
      longestStreak: Math.max(currentStreak, 12), // We'll track this properly later
      currentLevel,
      totalXP,
      xpToNextLevel,
      dailyGoal,
      weeklyGoal: dailyGoal * 7,
      monthlyGoal: dailyGoal * 30,
      activeDays: 28, // We'll calculate this properly later
      avgQuestionsPerDay:
        questionsTotal > 0 ? Math.round((questionsTotal / Math.max(1, 30)) * 10) / 10 : 0,
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return { data: null, error };
  }
}

// =============================================================================
// SUBJECT PROGRESS API
// =============================================================================

export async function getSubjectProgress(
  userId: string,
): Promise<{ data: SubjectProgress[] | null; error: any }> {
  try {
    // Get subjects from database with their icons and colors
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('name, display_name, icon, color')
      .eq('is_active', true)
      .order('sort_order');

    if (subjectsError) throw subjectsError;

    // Get today's question entries
    const { data: todayQuestions, error } = await getTodayQuestionEntries(userId);
    if (error) throw error;

    // Calculate progress for each subject
    const subjectProgress: SubjectProgress[] =
      subjects?.map((subject) => {
        const questionsToday =
          todayQuestions
            ?.filter((entry) => entry.subject === subject.name)
            .reduce((sum, entry) => sum + entry.question_count, 0) || 0;

        return {
          subject: subject.display_name,
          questionsToday,
          icon: subject.icon,
        };
      }) || [];

    return { data: subjectProgress, error: null };
  } catch (error) {
    console.error('Error fetching subject progress:', error);
    return { data: null, error };
  }
}

// =============================================================================
// DAILY GOALS API
// =============================================================================

export async function getTodayDailyGoal(
  userId: string,
): Promise<{ data: DailyGoal | null; error: any }> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('goal_date', today)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // If no goal exists for today, create one
    if (!data) {
      const newGoal = {
        user_id: userId,
        goal_date: today,
        target_questions: 5,
        target_duration: 45,
        target_subjects: 2,
        achieved_questions: 0,
        achieved_duration: 0,
        achieved_subjects: 0,
      };

      const { data: createdGoal, error: createError } = await supabase
        .from('daily_goals')
        .insert([newGoal])
        .select()
        .single();

      if (createError) throw createError;
      return { data: createdGoal, error: null };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching/creating daily goal:', error);
    return { data: null, error };
  }
}

export async function updateDailyGoalProgress(
  userId: string,
  achieved: Partial<
    Pick<DailyGoal, 'achieved_questions' | 'achieved_duration' | 'achieved_subjects'>
  >,
) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get current daily goal to apply 100% limits
    const { data: currentGoal } = await getTodayDailyGoal(userId);

    // Apply 100% limits: achieved values cannot exceed targets
    const limitedAchieved = {
      ...(achieved.achieved_questions !== undefined && {
        achieved_questions: Math.min(achieved.achieved_questions, currentGoal?.data?.target_questions || achieved.achieved_questions)
      }),
      ...(achieved.achieved_duration !== undefined && {
        achieved_duration: Math.min(achieved.achieved_duration, currentGoal?.data?.target_duration || achieved.achieved_duration)
      }),
      ...(achieved.achieved_subjects !== undefined && {
        achieved_subjects: Math.min(achieved.achieved_subjects, currentGoal?.data?.target_subjects || achieved.achieved_subjects)
      }),
    };

    const { data, error } = await supabase
      .from('daily_goals')
      .update(limitedAchieved)
      .eq('user_id', userId)
      .eq('goal_date', today)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating daily goal:', error);
    return { data: null, error };
  }
}

// =============================================================================
// MANUAL GOAL APPROVAL API
// =============================================================================

export async function approveGoalManually(
  userId: string,
  goalDate?: string,
  approvalNote?: string,
) {
  try {
    const targetDate = goalDate || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_goals')
      .update({
        is_manually_approved: true,
        approved_at: new Date().toISOString(),
        approval_note: approvalNote || null,
      })
      .eq('user_id', userId)
      .eq('goal_date', targetDate)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error approving goal manually:', error);
    return { data: null, error };
  }
}

export async function revokeGoalApproval(
  userId: string,
  goalDate?: string,
) {
  try {
    const targetDate = goalDate || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_goals')
      .update({
        is_manually_approved: false,
        approved_at: null,
        approval_note: null,
      })
      .eq('user_id', userId)
      .eq('goal_date', targetDate)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error revoking goal approval:', error);
    return { data: null, error };
  }
}

export async function toggleManualApprovalMode(
  userId: string,
  goalDate?: string,
  requireManualApproval: boolean = true,
) {
  try {
    const targetDate = goalDate || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_goals')
      .update({
        manual_approval_required: requireManualApproval,
        // Reset approval state when changing mode
        is_manually_approved: false,
        approved_at: null,
        approval_note: null,
      })
      .eq('user_id', userId)
      .eq('goal_date', targetDate)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error toggling manual approval mode:', error);
    return { data: null, error };
  }
}

export async function getPendingApprovalGoals(
  userId: string,
): Promise<{ data: DailyGoal[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('daily_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('manual_approval_required', true)
      .eq('is_manually_approved', false)
      .gte('achieved_questions', supabase.raw('target_questions'))
      .gte('achieved_duration', supabase.raw('target_duration'))
      .gte('achieved_subjects', supabase.raw('target_subjects'))
      .order('goal_date', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching pending approval goals:', error);
    return { data: null, error };
  }
}

// =============================================================================
// FRIENDS API (Basic Implementation)
// =============================================================================

export async function getActiveFriends(
  userId: string,
): Promise<{ data: Friend[] | null; error: any }> {
  try {
    // Friends system not implemented yet - return empty array
    // TODO: Implement real friend relationships using user_friends table

    return { data: [], error: null };
  } catch (error) {
    console.error('Error fetching active friends:', error);
    return { data: null, error };
  }
}

// =============================================================================
// WEEKLY PERFORMANCE API
// =============================================================================

export async function getWeeklyPerformance(
  userId: string,
): Promise<{ data: WeeklyData[] | null; error: any }> {
  try {
    const today = new Date();
    const weekDays = [];

    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      weekDays.push(date.toISOString().split('T')[0]);
    }

    // Get questions for each day
    const weeklyData: WeeklyData[] = [];
    const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

    for (const date of weekDays) {
      const { data: dayQuestions, error } = await supabase
        .from('question_entries')
        .select('question_count')
        .eq('user_id', userId)
        .eq('entry_date', date);

      if (error) throw error;

      const questions = dayQuestions?.reduce((sum, entry) => sum + entry.question_count, 0) || 0;
      const dayOfWeek = new Date(date).getDay();

      weeklyData.push({
        day: dayNames[dayOfWeek],
        questions,
      });
    }

    return { data: weeklyData, error: null };
  } catch (error) {
    console.error('Error fetching weekly performance:', error);
    return { data: null, error };
  }
}

// Get user achievements count
export async function getUserAchievementsCount(
  userId: string,
): Promise<{ data: number | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId);

    if (error) throw error;

    return { data: data?.length || 0, error: null };
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    return { data: null, error };
  }
}

// =============================================================================
// REAL-TIME DASHBOARD DATA API (Using Database Function)
// =============================================================================

export interface DashboardData {
  userStats: {
    totalXp: number;
    currentLevel: number;
    questionsSolved: number;
    studyStreak: number;
    achievementsCount: number;
  };
  subjectProgress: Array<{
    subject: string;
    displayName: string;
    icon: string;
    color: string;
    todayQuestions: number;
    weekQuestions: number;
    successRate: number;
  }>;
  weeklyPerformance: Array<{
    date: string;
    questions: number;
    studyTime: number;
    goalAchieved: boolean;
  }>;
  friendsData: Array<{
    id: string;
    name: string;
    avatar: string;
    weeklyXp: number;
    rank: number;
  }>;
  recentExams: Array<{
    type: string;
    date: string;
    totalQuestions: number;
    successRate: number;
  }>;
  dailyGoals: {
    targetQuestions: number;
    targetDuration: number;
    targetSubjects: number;
    achievedQuestions: number;
    achievedDuration: number;
    achievedSubjects: number;
    isCompleted: boolean;
  };
}

export async function getDashboardData(
  userId: string,
): Promise<{ data: DashboardData | null; error: any }> {
  try {
    console.log('📊 Loading dashboard data for user:', userId);
    console.log('🔄 Using direct API implementation without database function...');

    // Get actual data using our existing API functions
    const [
      userStatsResult,
      subjectProgressResult,
      weeklyPerformanceResult,
      friendsResult,
      examEntriesResult,
      achievementsResult,
    ] = await Promise.all([
      getUserStats(userId),
      getSubjectProgress(userId),
      getWeeklyPerformance(userId),
      getActiveFriends(userId),
      getExamEntries(userId, 5),
      getUserAchievementsCount(userId),
    ]);

    // Transform data to match DashboardData interface
    const dashboardData: DashboardData = {
      userStats: {
        totalXp: userStatsResult.data?.totalXP || 0,
        currentLevel: userStatsResult.data?.currentLevel || 1,
        questionsSolved: userStatsResult.data?.questionsTotal || 0,
        studyStreak: userStatsResult.data?.currentStreak || 0,
        achievementsCount: achievementsResult.data || 0,
      },
      subjectProgress: (subjectProgressResult.data || []).map((subject) => ({
        subject: subject.subject,
        displayName: subject.subject,
        icon: subject.icon,
        color: '#3B82F6', // Default color
        todayQuestions: subject.questionsToday,
        weekQuestions: 0, // We'll calculate this later
        successRate: 0, // We'll calculate this later
      })),
      weeklyPerformance: (weeklyPerformanceResult.data || []).map((day) => ({
        date: day.day,
        questions: day.questions,
        studyTime: 0, // We don't track this yet
        goalAchieved: day.questions >= 5, // Basic goal check
      })),
      friendsData: (friendsResult.data || []).map((friend) => ({
        id: friend.id,
        name: friend.name,
        avatar: '', // We don't have avatars yet
        weeklyXp: friend.totalXP,
        rank: 1, // We'll calculate ranks later
      })),
      recentExams: (examEntriesResult.data || []).slice(0, 3).map((exam) => ({
        type: exam.exam_type || 'tyt',
        date: exam.exam_date,
        totalQuestions: exam.total_questions || 0,
        successRate: exam.total_questions
          ? Math.round(((exam.total_correct || 0) / exam.total_questions) * 100)
          : 0,
      })),
      dailyGoals: {
        targetQuestions: userStatsResult.data?.dailyGoal || 5,
        targetDuration: 45,
        targetSubjects: 2,
        achievedQuestions: userStatsResult.data?.questionsToday || 0,
        achievedDuration: 0,
        achievedSubjects: 0,
        isCompleted:
          (userStatsResult.data?.questionsToday || 0) >= (userStatsResult.data?.dailyGoal || 5),
      },
    };

    console.log('✅ Dashboard data loaded successfully using direct API');
    console.log('📈 User Stats:', dashboardData.userStats);
    console.log('📚 Subject Progress:', dashboardData.subjectProgress.length, 'subjects');
    console.log('👥 Friends:', dashboardData.friendsData.length, 'friends');
    console.log('📝 Recent Exams:', dashboardData.recentExams.length, 'exams');

    return { data: dashboardData, error: null };
  } catch (error) {
    console.error('❌ Error loading dashboard data:', error);

    // Return minimal fallback data if everything fails
    const fallbackData: DashboardData = {
      userStats: {
        totalXp: 0,
        currentLevel: 1,
        questionsSolved: 0,
        studyStreak: 0,
        achievementsCount: 0,
      },
      subjectProgress: [],
      weeklyPerformance: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        questions: 0,
        studyTime: 0,
        goalAchieved: false,
      })),
      friendsData: [],
      recentExams: [],
      dailyGoals: {
        targetQuestions: 5,
        targetDuration: 45,
        targetSubjects: 2,
        achievedQuestions: 0,
        achievedDuration: 0,
        achievedSubjects: 0,
        isCompleted: false,
      },
    };

    console.log('⚠️ Using minimal fallback data');
    return { data: fallbackData, error: null };
  }
}

// =============================================================================
// SUBJECT MANAGEMENT API
// =============================================================================

export async function getAllSubjects(): Promise<{ data: any[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('name, display_name, icon, color, exam_type, sort_order')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;

    console.log('✅ Subjects fetched:', data?.length || 0);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error fetching subjects:', error);
    return { data: null, error };
  }
}

export async function getSubjectTopics(
  subjectName: string,
): Promise<{ data: any[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('topics')
      .select('name, display_name, description, difficulty_level')
      .eq('subject_id', supabase.from('subjects').select('id').eq('name', subjectName).single())
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('❌ Error fetching topics:', error);
    return { data: null, error };
  }
}
