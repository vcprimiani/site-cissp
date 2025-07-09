import React from 'react';
import { AppMode, User } from '../../types';
import { Database, Target, LogOut, Crown, Users, CheckCircle, XCircle, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
// import { useSubscription } from '../../hooks/useSubscription'; // REMOVE
import { Avatar } from '../UI/Avatar';
import { clearInvalidSession } from '../../lib/supabase';

interface HeaderProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  currentUser: User;
  onLogout: () => void;
  hasActiveSubscription: boolean;
  subscriptionLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({ mode, onModeChange, currentUser, onLogout, hasActiveSubscription, subscriptionLoading }) => {
  const { signOut } = useAuth();
  // const { isActive, productName } = useSubscription(); // REMOVE
  const [showSettings, setShowSettings] = React.useState(false);

  const handleLogout = async () => {
    await signOut();
    await clearInvalidSession();
    window.location.href = '/'; // Hard redirect to root/login
  };

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-2 min-w-0 flex-shrink-0">
            <img 
              src="/Untitled design-7.png" 
              alt="CISSP Study Group" 
              className="w-8 h-8 object-contain rounded-lg"
            />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900">CISSP Study Group</h1>
              <p className="text-xs text-gray-600">AI Question Bank & Quiz Platform</p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-lg font-bold text-gray-900">CISSP</h1>
            </div>
          </div>

          {/* Mode Toggle - Responsive */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile Mode Toggle */}
            <div className="flex sm:hidden bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onModeChange('question-bank')}
                className={`p-2 rounded-md transition-all duration-200 ${
                  mode === 'question-bank'
                    ? 'bg-[#F8D380] text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Question Bank"
              >
                <Database className="w-4 h-4" />
              </button>
              <button
                onClick={() => onModeChange('quiz')}
                className={`p-2 rounded-md transition-all duration-200 ${
                  mode === 'quiz'
                    ? 'bg-[#F8D380] text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Quiz"
              >
                <Target className="w-4 h-4" />
              </button>
              <a
                href="https://CISSPStudyGroup.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md transition-all duration-200 text-gray-600 hover:text-gray-900"
                title="Study Group"
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <Users className="w-4 h-4" />
              </a>
            </div>

            {/* Desktop Mode Toggle */}
            <div className="hidden sm:flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onModeChange('question-bank')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                  mode === 'question-bank'
                    ? 'bg-[#F8D380] text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Manage and organize your CISSP practice questions"
              >
                <Database className="w-4 h-4" />
                <span className="hidden md:inline">Question Bank</span>
              </button>
              <button
                onClick={() => onModeChange('quiz')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                  mode === 'quiz'
                    ? 'bg-[#F8D380] text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Take quizzes and get AI assistance"
              >
                <Target className="w-4 h-4" />
                <span className="hidden md:inline">Quiz</span>
              </button>
            </div>

            {/* Separate Community button to the far right with a subtle outline glow */}
            <div className="flex-1 flex justify-end">
              <a
                href="https://CISSPStudyGroup.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 text-gray-600 hover:text-gray-900 border-2 border-[#F8D27F] shadow-[0_0_0_3px_#F8D27F33] focus:ring-2 focus:ring-[#F8D27F] focus:ring-opacity-50 outline-none"
                title="Study Group"
                style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}
              >
                <Users className="w-4 h-4 mr-2 text-[#F8D27F]" />
                <span>Study Group</span>
              </a>
            </div>

            {/* User Info - Responsive */}
            <div className="flex items-center space-x-2 sm:space-x-3 bg-gradient-to-r from-blue-50 to-purple-50 px-2 sm:px-4 py-2 rounded-lg relative">
                {/* Premium/Unpaid Card Indicator */}
                <span
                  className={`flex items-center justify-center rounded-lg border shadow-md transition-all duration-200 mr-2 px-2 py-1 ${
                    hasActiveSubscription
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                  title={hasActiveSubscription ? 'Premium Member' : 'Unpaid Member'}
                >
                  {hasActiveSubscription ? (
                    <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs font-semibold ${hasActiveSubscription ? 'text-green-700' : 'text-red-700'}`}>{hasActiveSubscription ? 'Premium' : 'Unpaid'}</span>
                </span>
                <Avatar 
                  user={currentUser} 
                  size="sm"
                  className="flex-shrink-0"
                />
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-24 lg:max-w-none">
                    {currentUser.name}
                  </p>
                  <div className="flex items-center space-x-1">
                    <p className="text-xs text-gray-600">{hasActiveSubscription ? 'Study Leader' : 'Almost a Member'}</p>
                    {hasActiveSubscription && (
                      <Crown className="w-3 h-3 text-green-600" title="Premium subscriber" />
                    )}
                  </div>
                </div>
                {/* Settings Gear */}
                <div className="relative">
                  <button
                    onClick={() => setShowSettings(v => !v)}
                    className="p-2 ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  {showSettings && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <a
                        href="/progress"
                        className="block px-4 py-3 text-gray-800 hover:bg-blue-50 rounded-t-lg text-sm font-medium"
                        onClick={() => setShowSettings(false)}
                      >
                        📈 View Progress
                      </a>
                    </div>
                  )}
                </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};