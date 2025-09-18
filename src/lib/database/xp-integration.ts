// XP Integration Helper for Dashboard
// Handles XP calculations and achievement triggers when questions are saved

import { createClient } from '@/lib/supabase/client';
import { AchievementEngine } from '@/lib/gamification/achievement-engine';

const supabase = createClient();

// XP Calculation Rules
const XP_RULES = {
  QUESTION_SOLVED: 5, // 5 XP per question
  CORRECT_BONUS: 2, // +2 XP per correct answer
  DAILY_GOAL_BONUS: 25, // +25 XP for completing daily goal
  STREAK_MULTIPLIER: 1.1, // 10% bonus for active streaks
  EXAM_COMPLETED: 50, // 50 XP for completing an exam entry
} as const;

// Calculate XP for question entry
export function calculateQuestionXP(
  questionCount: number,
  correctCount: number,
  hasStreak: boolean = false,
): number {
  let xp = 0;

  // Base XP for questions
  xp += questionCount * XP_RULES.QUESTION_SOLVED;

  // Bonus XP for correct answers
  xp += correctCount * XP_RULES.CORRECT_BONUS;

  // Streak multiplier
  if (hasStreak) {
    xp = Math.round(xp * XP_RULES.STREAK_MULTIPLIER);
  }

  return xp;
}

// Calculate XP for exam entry
export function calculateExamXP(totalQuestions: number, totalCorrect: number): number {
  let xp = XP_RULES.EXAM_COMPLETED;

  // Additional XP based on performance
  if (totalQuestions > 0) {
    const successRate = (totalCorrect / totalQuestions) * 100;
    if (successRate >= 80)
      xp += 30; // High performance bonus
    else if (successRate >= 60) xp += 15; // Good performance bonus
  }

  return xp;
}

// Add XP to user and trigger achievement checks
export async function addXPToUser(
  userId: string,
  xpAmount: number,
  activityType: string,
  description?: string,
) {
  try {
    // Get current user XP
    const { data: currentXP, error: xpError } = await supabase
      .from('user_xp')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (xpError && xpError.code !== 'PGRST116') throw xpError;

    const newTotalXP = (currentXP?.total_xp || 0) + xpAmount;
    const newLevel = Math.floor(newTotalXP / 100) + 1;
    const newQuestionsSolved = (currentXP?.questions_solved || 0) + 1;

    // Update or insert user XP
    const xpData = {
      user_id: userId,
      total_xp: newTotalXP,
      current_level: newLevel,
      questions_solved: newQuestionsSolved,
      last_activity_date: new Date().toISOString().split('T')[0],
    };

    const { data: updatedXP, error: updateError } = await supabase
      .from('user_xp')
      .upsert(xpData)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log the XP gain
    const { error: logError } = await supabase.from('xp_logs').insert([
      {
        user_id: userId,
        xp_gained: xpAmount,
        activity_type: activityType,
        description: description || `Gained ${xpAmount} XP from ${activityType}`,
      },
    ]);

    if (logError) throw logError;

    // Check for achievements
    const unlockedAchievements = await AchievementEngine.checkAndUnlockAchievements(
      userId,
      'question_solved',
    );

    return {
      success: true,
      newXP: newTotalXP,
      newLevel,
      xpGained: xpAmount,
      levelUp: newLevel > (currentXP?.current_level || 1),
      achievements: unlockedAchievements,
      error: null,
    };
  } catch (error) {
    console.error('Error adding XP to user:', error);
    return {
      success: false,
      error,
      newXP: 0,
      newLevel: 1,
      xpGained: 0,
      levelUp: false,
      achievements: [],
    };
  }
}

// Update streak when user is active
export async function updateUserStreak(userId: string) {
  try {
    const { data: xpData, error } = await supabase
      .from('user_xp')
      .select('study_streak, last_activity_date')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    const today = new Date().toISOString().split('T')[0];
    const lastActivity = xpData?.last_activity_date;
    const currentStreak = xpData?.study_streak || 0;

    let newStreak = currentStreak;

    if (!lastActivity || lastActivity !== today) {
      // Check if yesterday (consecutive day)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastActivity === yesterdayStr) {
        // Consecutive day - increment streak
        newStreak = currentStreak + 1;
      } else if (lastActivity !== today) {
        // Missed days - reset streak
        newStreak = 1;
      }

      // Update streak
      await supabase
        .from('user_xp')
        .update({
          study_streak: newStreak,
          last_activity_date: today,
        })
        .eq('user_id', userId);
    }

    return { success: true, streak: newStreak, error: null };
  } catch (error) {
    console.error('Error updating user streak:', error);
    return { success: false, streak: 0, error };
  }
}

// Check and update daily goal progress
export async function updateDailyGoalFromQuestions(userId: string, questionCount: number) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get today's total questions
    const { data: todayQuestions, error: questionsError } = await supabase
      .from('question_entries')
      .select('question_count')
      .eq('user_id', userId)
      .eq('entry_date', today);

    if (questionsError) throw questionsError;

    const totalQuestionsToday =
      todayQuestions?.reduce((sum, entry) => sum + entry.question_count, 0) || 0;

    // Get unique subjects studied today
    const { data: todaySubjects, error: subjectsError } = await supabase
      .from('question_entries')
      .select('subject')
      .eq('user_id', userId)
      .eq('entry_date', today);

    if (subjectsError) throw subjectsError;

    const uniqueSubjects = new Set(todaySubjects?.map((entry) => entry.subject) || []).size;

    // Update daily goal
    await supabase
      .from('daily_goals')
      .update({
        achieved_questions: totalQuestionsToday,
        achieved_subjects: uniqueSubjects,
      })
      .eq('user_id', userId)
      .eq('goal_date', today);

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating daily goal:', error);
    return { success: false, error };
  }
}

// Complete workflow: Save question + Add XP + Update goals + Check achievements
export async function processQuestionEntry(
  userId: string,
  questionData: {
    subject: string;
    topic?: string;
    question_count: number;
    correct_count: number;
  },
) {
  try {
    // 1. Update streak first
    const streakResult = await updateUserStreak(userId);
    const hasStreak = (streakResult.streak || 0) > 0;

    // 2. Calculate XP
    const xpAmount = calculateQuestionXP(
      questionData.question_count,
      questionData.correct_count,
      hasStreak,
    );

    // 3. Add XP and check achievements
    const xpResult = await addXPToUser(
      userId,
      xpAmount,
      'question_solved',
      `Solved ${questionData.question_count} questions in ${questionData.subject}`,
    );

    // 4. Update daily goal progress
    await updateDailyGoalFromQuestions(userId, questionData.question_count);

    return {
      success: true,
      xpGained: xpAmount,
      newLevel: xpResult.newLevel,
      levelUp: xpResult.levelUp,
      achievements: xpResult.achievements,
      streak: streakResult.streak,
      error: null,
    };
  } catch (error) {
    console.error('Error processing question entry:', error);
    return {
      success: false,
      error,
      xpGained: 0,
      newLevel: 1,
      levelUp: false,
      achievements: [],
      streak: 0,
    };
  }
}

// Complete workflow: Save exam + Add XP + Check achievements
export async function processExamEntry(
  userId: string,
  examData: {
    exam_type: 'tyt' | 'ayt' | 'mixed';
    total_questions: number;
    total_correct: number;
  },
) {
  try {
    // Calculate XP for exam
    const xpAmount = calculateExamXP(examData.total_questions, examData.total_correct);

    // Add XP and check achievements
    const xpResult = await addXPToUser(
      userId,
      xpAmount,
      'exam_completed',
      `Completed ${examData.exam_type.toUpperCase()} exam: ${examData.total_correct}/${examData.total_questions}`,
    );

    return {
      success: true,
      xpGained: xpAmount,
      newLevel: xpResult.newLevel,
      levelUp: xpResult.levelUp,
      achievements: xpResult.achievements,
      error: null,
    };
  } catch (error) {
    console.error('Error processing exam entry:', error);
    return {
      success: false,
      error,
      xpGained: 0,
      newLevel: 1,
      levelUp: false,
      achievements: [],
    };
  }
}
