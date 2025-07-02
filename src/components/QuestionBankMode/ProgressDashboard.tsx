import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Award, Calendar, BarChart3, Clock, Flame, Trophy, CheckCircle, Star } from 'lucide-react';
import { Question, StudyProgress, User } from '../../types';

interface ProgressDashboardProps {
  currentUser: User;
  questions: Question[];
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ currentUser, questions }) => {
  const [studyProgress, setStudyProgress] = useState<StudyProgress>(() => {
    // Load from localStorage or create default
    const stored = localStorage.getItem(`study-progress-${currentUser.id}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        return {
          ...parsed,
          lastStudySession: parsed.lastStudySession ? new Date(parsed.lastStudySession) : new Date(),
          domainProgress: Object.fromEntries(
            Object.entries(parsed.domainProgress || {}).map(([domain, progress]: [string, any]) => [
              domain,
              {
                ...progress,
                lastStudied: progress.lastStudied ? new Date(progress.lastStudied) : new Date()
              }
            ])
          )
        };
      } catch (error) {
        console.error('Error parsing study progress:', error);
      }
    }
    
    return {
      totalQuestionsAnswered: 0,
      correctAnswers: 0,
      streakCount: 0,
      longestStreak: 0,
      domainProgress: {},
      difficultyProgress: {
        'Easy': { questionsAnswered: 0, correctAnswers: 0 },
        'Medium': { questionsAnswered: 0, correctAnswers: 0 },
        'Hard': { questionsAnswered: 0, correctAnswers: 0 }
      },
      weeklyGoal: 50,
      weeklyProgress: 0,
      lastStudySession: new Date(),
      studyDays: 0
    };
  });

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(`study-progress-${currentUser.id}`, JSON.stringify(studyProgress));
  }, [studyProgress, currentUser.id]);

  // Listen for quiz completion events to update progress
  useEffect(() => {
    const handleQuizComplete = (event: CustomEvent) => {
      const { questionResults } = event.detail;
      if (questionResults && questionResults.length > 0) {
        updateProgressFromQuiz(questionResults);
      }
    };

    window.addEventListener('quizCompleted', handleQuizComplete as EventListener);
    return () => {
      window.removeEventListener('quizCompleted', handleQuizComplete as EventListener);
    };
  }, []);

  const updateProgressFromQuiz = (questionResults: any[]) => {
    setStudyProgress(prev => {
      const newProgress = { ...prev };
      const today = new Date();
      const isNewDay = prev.lastStudySession.toDateString() !== today.toDateString();
      
      // Update basic stats
      newProgress.totalQuestionsAnswered += questionResults.length;
      newProgress.correctAnswers += questionResults.filter(r => r.isCorrect).length;
      newProgress.lastStudySession = today;
      
      if (isNewDay) {
        newProgress.studyDays += 1;
      }
      
      // Update streak
      const allCorrect = questionResults.every(r => r.isCorrect);
      if (allCorrect) {
        newProgress.streakCount += 1;
        newProgress.longestStreak = Math.max(newProgress.longestStreak, newProgress.streakCount);
      } else {
        newProgress.streakCount = 0;
      }
      
      // Update domain progress
      questionResults.forEach(result => {
        const domain = result.question.domain;
        if (!newProgress.domainProgress[domain]) {
          newProgress.domainProgress[domain] = {
            questionsAnswered: 0,
            correctAnswers: 0,
            lastStudied: today
          };
        }
        
        newProgress.domainProgress[domain].questionsAnswered += 1;
        if (result.isCorrect) {
          newProgress.domainProgress[domain].correctAnswers += 1;
        }
        newProgress.domainProgress[domain].lastStudied = today;
      });
      
      // Update difficulty progress
      questionResults.forEach(result => {
        const difficulty = result.question.difficulty;
        newProgress.difficultyProgress[difficulty].questionsAnswered += 1;
        if (result.isCorrect) {
          newProgress.difficultyProgress[difficulty].correctAnswers += 1;
        }
      });
      
      // Update weekly progress (reset if new week)
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const lastWeekStart = new Date(prev.lastStudySession);
      lastWeekStart.setDate(prev.lastStudySession.getDate() - prev.lastStudySession.getDay());
      
      if (weekStart.getTime() !== lastWeekStart.getTime()) {
        newProgress.weeklyProgress = questionResults.length;
      } else {
        newProgress.weeklyProgress += questionResults.length;
      }
      
      return newProgress;
    });
  };

  const getAccuracyPercentage = () => {
    if (studyProgress.totalQuestionsAnswered === 0) return 0;
    return Math.round((studyProgress.correctAnswers / studyProgress.totalQuestionsAnswered) * 100);
  };

  const getWeeklyProgressPercentage = () => {
    return Math.min((studyProgress.weeklyProgress / studyProgress.weeklyGoal) * 100, 100);
  };

  const getDomainAccuracy = (domain: string) => {
    const progress = studyProgress.domainProgress[domain];
    if (!progress || progress.questionsAnswered === 0) return 0;
    return Math.round((progress.correctAnswers / progress.questionsAnswered) * 100);
  };

  const getDifficultyAccuracy = (difficulty: string) => {
    const progress = studyProgress.difficultyProgress[difficulty];
    if (!progress || progress.questionsAnswered === 0) return 0;
    return Math.round((progress.correctAnswers / progress.questionsAnswered) * 100);
  };

  const domains = [
    'Security and Risk Management',
    'Asset Security',
    'Security Architecture and Engineering',
    'Communication and Network Security',
    'Identity and Access Management (IAM)',
    'Security Assessment and Testing',
    'Security Operations',
    'Software Development Security'
  ];

  const achievements = [
    {
      id: 'first-quiz',
      name: 'First Steps',
      description: 'Complete your first quiz',
      icon: '🎯',
      earned: studyProgress.totalQuestionsAnswered > 0,
      progress: Math.min(studyProgress.totalQuestionsAnswered, 1),
      target: 1
    },
    {
      id: 'streak-master',
      name: 'Streak Master',
      description: 'Achieve a 10-question streak',
      icon: '🔥',
      earned: studyProgress.longestStreak >= 10,
      progress: Math.min(studyProgress.longestStreak, 10),
      target: 10
    },
    {
      id: 'domain-explorer',
      name: 'Domain Explorer',
      description: 'Study all 8 CISSP domains',
      icon: '🗺️',
      earned: Object.keys(studyProgress.domainProgress).length >= 8,
      progress: Object.keys(studyProgress.domainProgress).length,
      target: 8
    },
    {
      id: 'accuracy-ace',
      name: 'Accuracy Ace',
      description: 'Maintain 80% accuracy over 50 questions',
      icon: '🎯',
      earned: studyProgress.totalQuestionsAnswered >= 50 && getAccuracyPercentage() >= 80,
      progress: studyProgress.totalQuestionsAnswered >= 50 ? getAccuracyPercentage() : 0,
      target: 80
    },
    {
      id: 'weekly-warrior',
      name: 'Weekly Warrior',
      description: 'Complete weekly goal 4 weeks in a row',
      icon: '⚡',
      earned: false, // This would need more complex tracking
      progress: 0,
      target: 4
    },
    {
      id: 'study-veteran',
      name: 'Study Veteran',
      description: 'Study for 30 days',
      icon: '🏆',
      earned: studyProgress.studyDays >= 30,
      progress: Math.min(studyProgress.studyDays, 30),
      target: 30
    }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Questions Answered</p>
              <p className="text-2xl font-bold text-gray-900">{studyProgress.totalQuestionsAnswered}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Accuracy</p>
              <p className="text-2xl font-bold text-gray-900">{getAccuracyPercentage()}%</p>
            </div>
            <Target className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Streak</p>
              <p className="text-2xl font-bold text-gray-900">{studyProgress.streakCount}</p>
            </div>
            <Flame className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Study Days</p>
              <p className="text-2xl font-bold text-gray-900">{studyProgress.studyDays}</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Weekly Goal Progress */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-600" />
            <span>Weekly Goal</span>
          </h3>
          <button
            onClick={() => {
              const newGoal = prompt('Set your weekly question goal:', studyProgress.weeklyGoal.toString());
              if (newGoal && !isNaN(parseInt(newGoal))) {
                setStudyProgress(prev => ({ ...prev, weeklyGoal: parseInt(newGoal) }));
              }
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Edit Goal
          </button>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress this week</span>
            <span>{studyProgress.weeklyProgress}/{studyProgress.weeklyGoal} questions</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${getWeeklyProgressPercentage()}%` }}
            />
          </div>
        </div>
        
        <p className="text-sm text-gray-600">
          {studyProgress.weeklyProgress >= studyProgress.weeklyGoal 
            ? '🎉 Congratulations! You\'ve reached your weekly goal!' 
            : `${studyProgress.weeklyGoal - studyProgress.weeklyProgress} questions remaining to reach your goal.`
          }
        </p>
      </div>

      {/* Domain Progress */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <span>Domain Progress</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {domains.map(domain => {
            const progress = studyProgress.domainProgress[domain];
            const accuracy = getDomainAccuracy(domain);
            const questionsAnswered = progress?.questionsAnswered || 0;
            
            return (
              <div key={domain} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900 text-sm">{domain}</h4>
                  <span className="text-xs text-gray-500">{questionsAnswered} questions</span>
                </div>
                
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        accuracy >= 80 ? 'bg-green-500' : 
                        accuracy >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(accuracy, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{accuracy}%</span>
                </div>
                
                {progress?.lastStudied && (
                  <p className="text-xs text-gray-500">
                    Last studied: {progress.lastStudied.toLocaleDateString()}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Difficulty Analysis */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <span>Difficulty Analysis</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['Easy', 'Medium', 'Hard'].map(difficulty => {
            const progress = studyProgress.difficultyProgress[difficulty];
            const accuracy = getDifficultyAccuracy(difficulty);
            
            return (
              <div key={difficulty} className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
                  difficulty === 'Easy' ? 'bg-green-100' :
                  difficulty === 'Medium' ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <span className="text-2xl">
                    {difficulty === 'Easy' ? '🟢' : difficulty === 'Medium' ? '🟡' : '🔴'}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{difficulty}</h4>
                <p className="text-2xl font-bold text-gray-900 mb-1">{accuracy}%</p>
                <p className="text-sm text-gray-600">{progress.questionsAnswered} questions</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
          <Award className="w-5 h-5 text-blue-600" />
          <span>Achievements</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map(achievement => (
            <div 
              key={achievement.id} 
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                achievement.earned 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  achievement.earned ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  <span className="text-lg">
                    {achievement.earned ? '🏆' : achievement.icon}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">{achievement.name}</h4>
                  <p className="text-xs text-gray-600">{achievement.description}</p>
                </div>
                {achievement.earned && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
              
              {!achievement.earned && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Progress</span>
                    <span>{achievement.progress}/{achievement.target}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};