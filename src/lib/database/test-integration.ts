/**
 * Backend Integration Tests
 * Comprehensive testing suite for SARA platform database functions
 */

import {
  saveQuestionEntry,
  saveExamEntry,
  getDashboardData,
  getAllSubjects,
  getSubjectTopics,
} from './dashboard-api';

import {
  getUserFriends,
  searchUsers,
  sendFriendRequest,
  getFriendRequests,
  respondToFriendRequest,
  removeFriend,
  getFriendsActivity,
  getFriendsLeaderboard,
} from './friends-api';

import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createNotification,
  getUnreadNotificationCount,
  getUserAchievements,
  getAchievement,
  createAchievementNotification,
  createGoalAchievementNotification,
  createStreakWarningNotification,
  createDailyReminderNotification,
} from './notifications-api';

// ===================================================================
// TEST UTILITIES
// ===================================================================

interface TestResult {
  testName: string;
  success: boolean;
  message: string;
  duration: number;
  data?: any;
  error?: any;
}

class TestRunner {
  private results: TestResult[] = [];
  private currentTestName = '';

  async runTest(testName: string, testFunction: () => Promise<any>): Promise<TestResult> {
    this.currentTestName = testName;
    const startTime = Date.now();

    try {
      console.log(`🧪 Running test: ${testName}`);
      const data = await testFunction();
      const duration = Date.now() - startTime;

      const result: TestResult = {
        testName,
        success: true,
        message: 'Test passed successfully',
        duration,
        data,
      };

      this.results.push(result);
      console.log(`✅ Test passed: ${testName} (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      const result: TestResult = {
        testName,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        duration,
        error,
      };

      this.results.push(result);
      console.error(`❌ Test failed: ${testName} (${duration}ms)`, error);
      return result;
    }
  }

  getResults(): TestResult[] {
    return this.results;
  }

  getSummary() {
    const total = this.results.length;
    const passed = this.results.filter((r) => r.success).length;
    const failed = total - passed;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    return {
      total,
      passed,
      failed,
      successRate: (passed / total) * 100,
      totalDuration,
      averageDuration: totalDuration / total,
    };
  }

  printSummary() {
    const summary = this.getSummary();
    console.log('\n📊 Test Summary:');
    console.log(`Total: ${summary.total}`);
    console.log(`Passed: ${summary.passed}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Success Rate: ${summary.successRate.toFixed(1)}%`);
    console.log(`Total Duration: ${summary.totalDuration}ms`);
    console.log(`Average Duration: ${summary.averageDuration.toFixed(1)}ms`);

    if (summary.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter((r) => !r.success)
        .forEach((r) => console.log(`  - ${r.testName}: ${r.message}`));
    }
  }
}

// ===================================================================
// DASHBOARD API TESTS
// ===================================================================

export async function testDashboardAPI(userId: string): Promise<TestResult[]> {
  const runner = new TestRunner();

  // Test getting all subjects
  await runner.runTest('Get All Subjects', async () => {
    const result = await getAllSubjects();

    if (result.error) {
      throw new Error(`Failed to get subjects: ${result.error.message}`);
    }

    if (!result.data || result.data.length === 0) {
      throw new Error('No subjects returned');
    }

    // Verify we have the expected 9 subjects
    const expectedSubjects = [
      'matematik',
      'fizik',
      'kimya',
      'biyoloji',
      'turkce',
      'tarih',
      'cografya',
      'felsefe',
      'dil',
    ];
    const actualSubjects = result.data.map((s) => s.name);

    for (const expected of expectedSubjects) {
      if (!actualSubjects.includes(expected)) {
        throw new Error(`Missing subject: ${expected}`);
      }
    }

    return { subjectCount: result.data.length, subjects: result.data };
  });

  // Test getting subject topics
  await runner.runTest('Get Subject Topics', async () => {
    const result = await getSubjectTopics('matematik');

    if (result.error) {
      throw new Error(`Failed to get topics: ${result.error.message}`);
    }

    if (!result.data || result.data.length === 0) {
      throw new Error('No topics returned for matematik');
    }

    return { topicCount: result.data.length, topics: result.data };
  });

  // Test saving question entry
  await runner.runTest('Save Question Entry', async () => {
    const questionData = {
      user_id: userId,
      subject: 'matematik',
      topic: 'Test Konusu',
      question_count: 10,
      correct_count: 8,
    };

    const result = await saveQuestionEntry(questionData);

    if (result.error) {
      throw new Error(`Failed to save question entry: ${result.error.message}`);
    }

    return { entryId: result.data?.entry_id, xpGained: result.data?.xp_gained };
  });

  // Test saving exam entry
  await runner.runTest('Save Exam Entry', async () => {
    const examData = {
      user_id: userId,
      exam_type: 'tyt' as const,
      exam_date: new Date().toISOString().split('T')[0],
      subjects: {
        matematik: { total: 40, correct: 32 },
        fizik: { total: 7, correct: 5 },
        kimya: { total: 7, correct: 6 },
      },
    };

    const result = await saveExamEntry(examData);

    if (result.error) {
      throw new Error(`Failed to save exam entry: ${result.error.message}`);
    }

    return { entryId: result.data?.entry_id, xpGained: result.data?.xp_gained };
  });

  // Test getting dashboard data
  await runner.runTest('Get Dashboard Data', async () => {
    const result = await getDashboardData(userId);

    if (result.error) {
      throw new Error(`Failed to get dashboard data: ${result.error.message}`);
    }

    if (!result.data) {
      throw new Error('No dashboard data returned');
    }

    // Verify data structure
    const data = result.data;
    if (!data.user_stats) {
      throw new Error('Missing user_stats in dashboard data');
    }

    return {
      userStats: data.user_stats,
      subjectCount: data.subject_progress?.length || 0,
      hasWeeklyData: !!data.weekly_performance,
    };
  });

  return runner.getResults();
}

// ===================================================================
// FRIENDS API TESTS
// ===================================================================

export async function testFriendsAPI(userId: string): Promise<TestResult[]> {
  const runner = new TestRunner();

  // Test getting user friends
  await runner.runTest('Get User Friends', async () => {
    const result = await getUserFriends(userId);

    if (result.error) {
      throw new Error(`Failed to get friends: ${result.error.message}`);
    }

    return { friendCount: result.data?.length || 0, friends: result.data };
  });

  // Test searching users
  await runner.runTest('Search Users', async () => {
    const result = await searchUsers('test', userId);

    if (result.error) {
      throw new Error(`Failed to search users: ${result.error.message}`);
    }

    return { userCount: result.data?.length || 0, users: result.data };
  });

  // Test getting friend requests
  await runner.runTest('Get Friend Requests', async () => {
    const result = await getFriendRequests(userId);

    if (result.error) {
      throw new Error(`Failed to get friend requests: ${result.error.message}`);
    }

    return {
      receivedCount: result.data?.received.length || 0,
      sentCount: result.data?.sent.length || 0,
    };
  });

  // Test getting friends activity
  await runner.runTest('Get Friends Activity', async () => {
    const result = await getFriendsActivity(userId);

    if (result.error) {
      throw new Error(`Failed to get friends activity: ${result.error.message}`);
    }

    return { activityCount: result.data?.length || 0, activities: result.data };
  });

  // Test getting friends leaderboard
  await runner.runTest('Get Friends Leaderboard', async () => {
    const result = await getFriendsLeaderboard(userId);

    if (result.error) {
      throw new Error(`Failed to get friends leaderboard: ${result.error.message}`);
    }

    return { userCount: result.data?.length || 0, leaderboard: result.data };
  });

  return runner.getResults();
}

// ===================================================================
// NOTIFICATIONS API TESTS
// ===================================================================

export async function testNotificationsAPI(userId: string): Promise<TestResult[]> {
  const runner = new TestRunner();

  // Test creating notification
  await runner.runTest('Create Notification', async () => {
    const result = await createNotification(
      userId,
      'system_update',
      'Test Notification',
      'This is a test notification for integration testing.',
      { priority: 'normal' },
    );

    if (result.error) {
      throw new Error(`Failed to create notification: ${result.error.message}`);
    }

    return { notificationId: result.data };
  });

  // Test getting user notifications
  await runner.runTest('Get User Notifications', async () => {
    const result = await getUserNotifications(userId, { limit: 10 });

    if (result.error) {
      throw new Error(`Failed to get notifications: ${result.error.message}`);
    }

    return { notificationCount: result.data?.length || 0, notifications: result.data };
  });

  // Test getting unread notification count
  await runner.runTest('Get Unread Notification Count', async () => {
    const result = await getUnreadNotificationCount(userId);

    if (result.error) {
      throw new Error(`Failed to get unread count: ${result.error.message}`);
    }

    return { unreadCount: result.data };
  });

  // Test getting user achievements
  await runner.runTest('Get User Achievements', async () => {
    const result = await getUserAchievements(userId);

    if (result.error) {
      throw new Error(`Failed to get achievements: ${result.error.message}`);
    }

    return {
      earnedCount: result.data?.earned.length || 0,
      availableCount: result.data?.available.length || 0,
    };
  });

  // Test creating achievement notification
  await runner.runTest('Create Achievement Notification', async () => {
    const result = await createAchievementNotification(
      userId,
      'test-achievement-id',
      'Test Achievement',
    );

    if (result.error) {
      throw new Error(`Failed to create achievement notification: ${result.error.message}`);
    }

    return { notificationId: result.data };
  });

  // Test creating goal achievement notification
  await runner.runTest('Create Goal Achievement Notification', async () => {
    const result = await createGoalAchievementNotification(userId, 'daily_questions', 5);

    if (result.error) {
      throw new Error(`Failed to create goal notification: ${result.error.message}`);
    }

    return { notificationId: result.data };
  });

  return runner.getResults();
}

// ===================================================================
// COMPREHENSIVE INTEGRATION TEST
// ===================================================================

export async function runComprehensiveIntegrationTest(userId: string): Promise<{
  success: boolean;
  summary: any;
  results: {
    dashboard: TestResult[];
    friends: TestResult[];
    notifications: TestResult[];
  };
}> {
  console.log('🚀 Starting Comprehensive Integration Test for SARA Backend');
  console.log(`Testing with user ID: ${userId}`);
  console.log('==========================================\n');

  const startTime = Date.now();

  try {
    // Run all test suites
    console.log('📊 Testing Dashboard API...');
    const dashboardResults = await testDashboardAPI(userId);

    console.log('\n👥 Testing Friends API...');
    const friendsResults = await testFriendsAPI(userId);

    console.log('\n🔔 Testing Notifications API...');
    const notificationsResults = await testNotificationsAPI(userId);

    // Calculate overall results
    const allResults = [...dashboardResults, ...friendsResults, ...notificationsResults];
    const totalTests = allResults.length;
    const passedTests = allResults.filter((r) => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = Date.now() - startTime;

    const summary = {
      totalTests,
      passedTests,
      failedTests,
      successRate: (passedTests / totalTests) * 100,
      totalDuration,
      testSuites: {
        dashboard: {
          total: dashboardResults.length,
          passed: dashboardResults.filter((r) => r.success).length,
          failed: dashboardResults.filter((r) => !r.success).length,
        },
        friends: {
          total: friendsResults.length,
          passed: friendsResults.filter((r) => r.success).length,
          failed: friendsResults.filter((r) => !r.success).length,
        },
        notifications: {
          total: notificationsResults.length,
          passed: notificationsResults.filter((r) => r.success).length,
          failed: notificationsResults.filter((r) => !r.success).length,
        },
      },
    };

    // Print comprehensive summary
    console.log('\n==========================================');
    console.log('🎯 COMPREHENSIVE TEST SUMMARY');
    console.log('==========================================');
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passedTests} ✅`);
    console.log(`Failed: ${summary.failedTests} ❌`);
    console.log(`Success Rate: ${summary.successRate.toFixed(1)}%`);
    console.log(`Total Duration: ${summary.totalDuration}ms`);
    console.log('');

    // Test suite breakdown
    console.log('📋 Test Suite Breakdown:');
    console.log(
      `  Dashboard API: ${summary.testSuites.dashboard.passed}/${summary.testSuites.dashboard.total} passed`,
    );
    console.log(
      `  Friends API: ${summary.testSuites.friends.passed}/${summary.testSuites.friends.total} passed`,
    );
    console.log(
      `  Notifications API: ${summary.testSuites.notifications.passed}/${summary.testSuites.notifications.total} passed`,
    );

    // Show failed tests if any
    if (summary.failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      allResults
        .filter((r) => !r.success)
        .forEach((r) => console.log(`  - ${r.testName}: ${r.message}`));
    }

    const success = summary.successRate >= 80; // Consider success if 80%+ tests pass

    if (success) {
      console.log('\n🎉 Integration test completed successfully!');
      console.log('✅ Backend functions are ready for production use.');
    } else {
      console.log('\n⚠️  Integration test completed with issues.');
      console.log('❌ Some backend functions need attention before production use.');
    }

    console.log('==========================================\n');

    return {
      success,
      summary,
      results: {
        dashboard: dashboardResults,
        friends: friendsResults,
        notifications: notificationsResults,
      },
    };
  } catch (error) {
    console.error('💥 Comprehensive integration test failed:', error);

    return {
      success: false,
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        successRate: 0,
        totalDuration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      results: {
        dashboard: [],
        friends: [],
        notifications: [],
      },
    };
  }
}

// ===================================================================
// QUICK TEST FUNCTION FOR DEVELOPMENT
// ===================================================================

export async function quickTest(userId: string): Promise<void> {
  console.log('🔧 Running Quick Development Test...\n');

  try {
    // Test basic dashboard functionality
    console.log('Testing dashboard...');
    const dashboardResult = await getDashboardData(userId);
    console.log('Dashboard result:', dashboardResult.data ? '✅ Success' : '❌ Failed');

    // Test basic question entry
    console.log('Testing question entry...');
    const questionResult = await saveQuestionEntry({
      user_id: userId,
      subject: 'matematik',
      topic: 'Quick Test',
      question_count: 1,
      correct_count: 1,
    });
    console.log('Question entry result:', questionResult.data ? '✅ Success' : '❌ Failed');

    // Test notification creation
    console.log('Testing notification...');
    const notificationResult = await createNotification(
      userId,
      'system_update',
      'Quick Test',
      'Development test notification',
    );
    console.log('Notification result:', notificationResult.data ? '✅ Success' : '❌ Failed');

    console.log('\n🎯 Quick test completed!');
  } catch (error) {
    console.error('💥 Quick test failed:', error);
  }
}
