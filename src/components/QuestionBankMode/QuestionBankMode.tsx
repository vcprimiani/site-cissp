import React, { useState } from 'react';
import { QuestionBank } from './QuestionBank';
import { AIGenerator } from './AIGenerator';
import { AppState } from '../../types';
import { Database, Brain } from 'lucide-react';
import { useQuestions } from '../../hooks/useQuestions';

interface QuestionBankModeProps {
  appState: AppState;
  onUpdateState: (updates: Partial<AppState>) => void;
}

export const QuestionBankMode: React.FC<QuestionBankModeProps> = ({ appState, onUpdateState }) => {
  const [activeTab, setActiveTab] = useState<'questions' | 'generator'>('questions');
  const { questions, loading, error, addQuestion, updateQuestion, deleteQuestion } = useQuestions();

  const handleNavigateToQuestionBank = () => {
    setActiveTab('questions');
  };

  const tabs = [
    { 
      id: 'questions', 
      label: 'Question Bank', 
      icon: Database,
      description: 'Manage and organize your CISSP practice questions'
    },
    { 
      id: 'generator', 
      label: 'AI Question Generator', 
      icon: Brain,
      description: 'Generate new questions using advanced AI tools'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Mode Description */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8 border border-blue-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Question Bank</h2>
        <p className="text-gray-700">
          Manage your CISSP question bank and generate new questions with advanced AI tools. Create high-quality 
          exam-style questions and organize them for use in Interactive Quiz mode. All questions are automatically 
          saved to your secure database.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-red-800 font-medium">Database Error</span>
          </div>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="flex border-b border-gray-200">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors relative group ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title={tab.description}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {tab.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-8">
        {activeTab === 'questions' && (
          <QuestionBank
            questions={questions}
            loading={loading}
            currentUser={appState.currentUser!}
            onAddQuestion={addQuestion}
            onUpdateQuestion={updateQuestion}
            onDeleteQuestion={deleteQuestion}
          />
        )}
        
        {activeTab === 'generator' && (
          <AIGenerator
            questions={questions}
            currentUser={appState.currentUser!}
            onAddQuestion={addQuestion}
            onNavigateToQuestionBank={handleNavigateToQuestionBank}
          />
        )}
      </div>
    </div>
  );
};