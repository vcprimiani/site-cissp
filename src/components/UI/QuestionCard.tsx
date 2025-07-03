import React from 'react';
import { Question } from '../../types';
import { Star, StarOff, ChevronDown, ChevronUp, Brain, Share2 } from 'lucide-react';
import { getDomainColor, getDifficultyColor, getStatusColor, generateColorClasses, categoryIcons } from '../../utils/colorSystem';
import { SocialShareButtons } from './SocialShareButtons';

interface QuestionCardProps {
  question: Question;
  isExpanded?: boolean;
  isInPracticeSet?: boolean;
  onToggleExpanded?: () => void;
  onTogglePracticeSet?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  className?: string;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  isExpanded = false,
  isInPracticeSet = false,
  onToggleExpanded,
  onTogglePracticeSet,
  onDelete,
  showActions = true,
  className = ''
}) => {
  const [showShareMenu, setShowShareMenu] = React.useState(false);
  const domainColor = getDomainColor(question.domain);
  const difficultyColor = getDifficultyColor(question.difficulty);
  const practiceColor = getStatusColor('practice');
  const aiColor = getStatusColor('ai-generated');

  const getShareMessage = () => {
    const correctAnswer = question.options[question.correctAnswer];
    // Keep under 280 characters for Twitter
    return `🧠 I'm studying with CISSPStudyGroup.com! Check out this ${question.difficulty} ${question.domain} question:

"${question.question.length > 120 ? question.question.substring(0, 120) + '...' : question.question}"

✅ Answer: ${correctAnswer}

Great AI-powered CISSP prep! 🚀 site.cisspstudygroup.com

#CISSP #Cybersecurity #StudyGroup`;
  };

  const getCopyContent = () => {
    const correctAnswer = question.options[question.correctAnswer];
    return `CISSP Practice Question (${question.domain} - ${question.difficulty}):

${question.question}

Options:
${question.options.map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`).join('\n')}

Correct Answer: ${String.fromCharCode(65 + question.correctAnswer)}. ${correctAnswer}

Explanation: ${question.explanation}

Study more at: https://site.cisspstudygroup.com`;
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareMenu(!showShareMenu);
  };

  return (
    <div 
      className={`bg-white rounded-xl border-2 border-gray-200 shadow-md hover:shadow-lg hover:border-gray-300 transition-all duration-200 relative ${className}`}
    >
      {/* Card Header */}
      <div 
        className="p-5 cursor-pointer"
        onClick={onToggleExpanded}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            {/* Status Indicators Row */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {/* Domain Badge */}
              <div 
                className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: domainColor.primary,
                  color: 'white'
                }}
              >
                <span>{categoryIcons.domains[question.domain as keyof typeof categoryIcons.domains]}</span>
                <span className="hidden sm:inline">{question.domain}</span>
                <span className="sm:hidden">
                  {question.domain.split(' ').map(word => word[0]).join('')}
                </span>
              </div>

              {/* Difficulty Badge */}
              <div 
                className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: difficultyColor.primary,
                  color: 'white'
                }}
              >
                <span>{categoryIcons.difficulty[question.difficulty as keyof typeof categoryIcons.difficulty]}</span>
                <span>{question.difficulty}</span>
              </div>

              {/* Status Indicators */}
              <div className="flex items-center space-x-2">
                {/* Practice Set Indicator */}
                {isInPracticeSet && (
                  <div 
                    className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs"
                    style={{
                      backgroundColor: practiceColor.primary,
                      color: 'white'
                    }}
                  >
                    <Star className="w-3 h-3 fill-current" />
                    <span className="hidden sm:inline">Practice</span>
                  </div>
                )}

                {/* AI Generated Indicator */}
                {question.tags.includes('ai-generated') && (
                  <div 
                    className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs"
                    style={{
                      backgroundColor: aiColor.primary,
                      color: 'white'
                    }}
                  >
                    <Brain className="w-3 h-3" />
                    <span className="hidden sm:inline">AI</span>
                  </div>
                )}
              </div>
            </div>

            {/* Question Text */}
            <p className="text-sm sm:text-base font-semibold mb-4 break-words leading-relaxed text-gray-900">
              {question.question}
            </p>

            {/* Tags - Softer colors */}
            <div className="flex flex-wrap gap-2 mb-3">
              {question.tags.filter(tag => tag !== 'ai-generated').map(tag => (
                <span 
                  key={tag} 
                  className="px-3 py-1 rounded-full text-xs font-medium border"
                  style={{
                    backgroundColor: `${domainColor.primary}15`, // 15% opacity
                    color: domainColor.primary,
                    borderColor: `${domainColor.primary}30` // 30% opacity
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Metadata */}
            <p className="text-xs text-gray-500 font-medium">
              Created {question.createdAt.toLocaleDateString()}
            </p>
          </div>

          {/* Expand/Collapse Button */}
          <div className="flex items-center space-x-2 ml-4">
            {onToggleExpanded && (
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && onTogglePracticeSet && (
          <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onTogglePracticeSet}
              className={`flex items-center space-x-1 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                isInPracticeSet 
                  ? 'bg-cyan-600 text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
              title={isInPracticeSet ? 'Remove from practice set' : 'Add to practice set'}
            >
              {isInPracticeSet ? (
                <Star className="w-3 h-3 fill-current" />
              ) : (
                <StarOff className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">
                {isInPracticeSet ? 'In Practice' : 'Add to Practice'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div 
          className="border-t-2 border-gray-100 px-5 py-5 space-y-5 bg-gray-50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Answer Options */}
          <div>
            <h4 className="font-semibold mb-3 text-gray-900">
              Answer Options:
            </h4>
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border-2 ${
                    index === question.correctAnswer 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span 
                      className={`text-sm break-words flex-1 font-medium ${
                        index === question.correctAnswer 
                          ? 'text-green-800' 
                          : 'text-gray-900'
                      }`}
                    >
                      {option}
                    </span>
                    {index === question.correctAnswer && (
                      <span className="text-sm font-semibold ml-2 text-green-600">
                        ✓ Correct
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div>
            <h4 className="font-semibold mb-3 text-gray-900">
              Explanation:
            </h4>
            <div className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
              <p className="leading-relaxed text-sm text-gray-800 font-medium">
                {question.explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Share Button in Bottom Right Corner */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="relative">
          <button
            onClick={handleShareClick}
            className="p-2 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors group shadow-sm"
            title="Share this question"
          >
            <Share2 className="w-4 h-4 text-blue-600 group-hover:text-blue-800" />
          </button>
          
          {/* Share Menu Dropdown */}
          {showShareMenu && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowShareMenu(false)}
              />
              
              {/* Share Menu */}
              <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 z-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Share Question</h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowShareMenu(false);
                    }}
                    className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <SocialShareButtons
                    title={`CISSP Practice Question - ${question.domain}`}
                    text={getShareMessage()}
                    hashtags={['CISSP', 'Cybersecurity', 'StudyGroup', 'Practice', 'InfoSec']}
                    variant="compact"
                    size="sm"
                    copyContent={getCopyContent()}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};