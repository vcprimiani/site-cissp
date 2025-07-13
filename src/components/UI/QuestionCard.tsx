import React from 'react';
import { Question } from '../../types';
import { ChevronDown, ChevronUp, Brain, Share2, Bookmark, Flag } from 'lucide-react';
import { getDomainColor, getDifficultyColor, getStatusColor, generateColorClasses, categoryIcons } from '../../utils/colorSystem';
import { SocialShareButtons } from './SocialShareButtons';
import { highlightKeywords } from '../../services/keywordAnalysis';
import { parseExplanationSections, renderSectionContent } from '../../utils/textFormatting';
import { useBookmarks } from '../../hooks/useBookmarks';
import { Lock, Crown } from 'lucide-react';
import { redirectToCheckout } from '../../services/stripe';
import { stripeProducts } from '../../stripe-config';


interface QuestionCardProps {
  question: Question;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  className?: string;
  keywords?: string[];
  hasActiveSubscription: boolean;
  subscriptionLoading: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  isExpanded = false,
  onToggleExpanded,
  onDelete,
  showActions = true,
  className = '',
  keywords = [],
  hasActiveSubscription,
  subscriptionLoading
}) => {
  const [showShareMenu, setShowShareMenu] = React.useState(false);
  const domainColor = getDomainColor(question.domain);
  const difficultyColor = getDifficultyColor(question.difficulty);
  const aiColor = getStatusColor('ai-generated');
  const { bookmarkedIds, toggleBookmark, loading: bookmarksLoading } = useBookmarks();
  const isBookmarked = bookmarkedIds.includes(question.id);

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

  const renderFormattedExplanation = (text: string) => {
    return parseExplanationSections(text).map((section, idx) => (
      <div key={idx} className="mb-2">
        {section.header && <div className="font-bold text-gray-800 mb-1">{section.header}</div>}
        {renderSectionContent(section.content).length > 1 ? (
          <ul className="list-disc list-inside ml-4">
            {renderSectionContent(section.content).map((item, i) => (
              <li key={i} className="text-sm text-gray-700">{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-700">{section.content}</p>
        )}
      </div>
    ));
  };

  return (
    <div 
      className={`bg-white rounded-xl border-2 border-gray-200 shadow-md hover:shadow-lg hover:border-gray-300 transition-all duration-200 relative w-full max-w-none ${className}`}
    >
      {/* Card Header */}
      <div 
        className={`p-5 ${onToggleExpanded ? 'cursor-pointer' : ''}`}
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

              {/* Flagged Indicator */}
              {question.isFlagged && (
                <div 
                  className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 border border-red-200"
                >
                  <Flag className="w-3 h-3" />
                  <span className="hidden sm:inline">{question.flagCount} flags</span>
                  <span className="sm:hidden">{question.flagCount}</span>
                </div>
              )}
            </div>

            {/* Keywords Display */}
            {keywords.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-yellow-600">💡</span>
                  <span className="font-medium text-yellow-800 text-xs">Key CISSP Terms:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Question Text */}
            <div className="mb-2">
              <span className="text-gray-900 font-medium text-base">
                {question.question}
              </span>
            </div>

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
      </div>

      {/* Always show answer/explanation section for unpaid users, only expanded for paid */}
      <div className="px-5 pb-5 relative">
        {/* Expanded content for all users */}
        {isExpanded && (
          <div className="relative">
            {/* Answers and Explanation (blurred/blocked for unpaid) */}
            <div>
              {/* Answer Options */}
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
                    } relative`}
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
                      {index === question.correctAnswer && hasActiveSubscription && (
                        <span className="text-sm font-semibold ml-2 text-green-600">
                          ✓ Correct
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Explanation Section */}
              <div className="mt-4">
                <h4 className="font-semibold text-blue-800 mb-2 text-sm">Explanation:</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  {renderFormattedExplanation(question.explanation)}
                </div>
              </div>
            </div>
            {/* Overlay for unsubscribed users, covers both answers and explanation */}
            {!hasActiveSubscription && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur rounded-xl" style={{ pointerEvents: 'auto' }}>
                <Lock className="w-8 h-8 text-blue-500 mb-2" />
                <button
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium shadow"
                  onClick={async () => {
                    const product = stripeProducts[0];
                    await redirectToCheckout({ priceId: product.priceId, mode: product.mode });
                  }}
                >
                  Upgrade Now
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons - bottom right, side by side */}
      <div className="absolute bottom-3 right-3 z-50 flex flex-row gap-2">
        {/* Share Button */}
        {showActions && (
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
        )}
        
        {/* Bookmark Button */}
        <button
          className={`p-3 rounded-full shadow-lg border border-gray-200 transition-colors ${
            isBookmarked
              ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-300 shadow-lg'
              : 'bg-white hover:bg-blue-50'
          } ${!hasActiveSubscription ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          onClick={e => { if (hasActiveSubscription) { e.stopPropagation(); toggleBookmark(question.id); } }}
          disabled={bookmarksLoading || !hasActiveSubscription}
          title={!hasActiveSubscription ? 'Bookmarking is for paid members only' : (isBookmarked ? 'Remove bookmark' : 'Add bookmark')}
        >
          <Bookmark
            className={`w-5 h-5 transition-colors ${
              isBookmarked ? 'text-blue-700 fill-blue-400' : 'text-gray-400'
            }`}
            fill={isBookmarked ? 'currentColor' : 'none'}
          />
        </button>
      </div>
    </div>
  );
};