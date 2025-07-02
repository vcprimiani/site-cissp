import React from 'react';
import { AppMode, User } from '../../types';
import { Database, Target, LogOut, Crown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import { Avatar } from '../UI/Avatar';

interface HeaderProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  currentUser: User;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ mode, onModeChange, currentUser }) => {
  const { signOut } = useAuth();
  const { isActive, productName } = useSubscription();

  const handleLogout = async () => {
    await signOut();
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
              <p className="text-xs text-gray-600">Question Bank & Quiz Platform</p>
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

            {/* Subscription Status */}
            {isActive && productName && (
              <div className="hidden lg:flex items-center space-x-2 bg-gradient-to-r from-green-50 to-blue-50 px-3 py-2 rounded-lg border border-green-200">
                <Crown className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Premium</span>
              </div>
            )}

            {/* User Info - Responsive */}
            <div className="flex items-center space-x-2 sm:space-x-3 bg-gradient-to-r from-blue-50 to-purple-50 px-2 sm:px-4 py-2 rounded-lg">
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
                  <p className="text-xs text-gray-600">Study Leader</p>
                  {isActive && (
                    <Crown className="w-3 h-3 text-green-600" title="Premium subscriber" />
                  )}
                </div>
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