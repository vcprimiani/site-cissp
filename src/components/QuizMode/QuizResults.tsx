import React from 'react';
import { Trophy, Clock, Target, RotateCcw, ArrowLeft, CheckCircle, XCircle, Share2 } from 'lucide-react';
import { getDomainColor, getDifficultyColor } from '../../utils/colorSystem';
import { SocialShareButtons } from '../UI/SocialShareButtons';

interface QuizResultsProps {
  results: {
    totalQuestions: number;
    correctAnswers: number;
    timeSpent: number;
    questionResults: {
      question: any;
      userAnswer: number | null;
      isCorrect: boolean;
      timeSpent: number;
    }[];
  };
  onRetakeQuiz: () => void;
  onBackToSetup: () => void;
}

export const QuizResults: React.FC<QuizResultsProps> = ({ results, onRetakeQuiz, onBackToSetup }) => {
  const percentage = Math.round((results.correctAnswers / results.totalQuestions) * 100);
  const averageTime = Math.round(results.timeSpent / results.totalQuestions);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceMessage = (percentage: number) => {
    if (percentage >= 90) return 'Excellent! You have a strong understanding of these concepts.';
    if (percentage >= 80) return 'Great job! You\'re well-prepared in these areas.';
    if (percentage >= 70) return 'Good work! Consider reviewing the missed topics.';
    if (percentage >= 60) return 'Not bad! Focus on strengthening these concepts.';
    return 'Keep studying! Review these topics and try again.';
  };

  const getShareMessage = () => {
    const emoji = percentage >= 80 ? '🎉' : percentage >= 60 ? '📚' : '💪';
    // Keep under 280 characters for Twitter
    return `Just scored ${percentage}% on my CISSP practice quiz! ${emoji} 

${results.correctAnswers}/${results.totalQuestions} correct in ${formatTime(results.timeSpent)}

I'm studying with CISSPStudyGroup.com - great AI-powered questions and explanations! Perfect for CISSP prep 🚀

site.cisspstudygroup.com

#CISSP #Cybersecurity #StudyGroup`;
  };

  // Add the formatExplanation function from Quiz.tsx
  const formatExplanation = (text: string): JSX.Element[] => {
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
    const sections = cleanText.split(/\n\s*\n/).filter(section => section.trim());
    return sections.map((section, index) => {
      const trimmedSection = section.trim();
      if (/^\d+\./.test(trimmedSection)) {
        const [title, ...content] = trimmedSection.split(/[:\-]/);
        return (
          <div key={index} className="mb-3">
            <h4 className="font-semibold text-blue-800 mb-1 text-sm">{title.trim()}</h4>
            {content.length > 0 && (
              <div className="text-gray-700 text-sm leading-relaxed pl-4">{content.join(':').trim()}</div>
            )}
          </div>
        );
      }
      if (trimmedSection.includes('- ') || trimmedSection.includes('• ')) {
        const lines = trimmedSection.split('\n');
        const title = lines[0];
        const bullets = lines.slice(1).filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'));
        return (
          <div key={index} className="mb-3">
            {title && !title.startsWith('-') && !title.startsWith('•') && (
              <h4 className="font-semibold text-blue-800 mb-1 text-sm">{title}</h4>
            )}
            <ul className="space-y-1 pl-4">
              {bullets.map((bullet, bIndex) => (
                <li key={bIndex} className="text-gray-700 text-sm flex items-start">
                  <span className="text-blue-600 mr-2 mt-1">•</span>
                  <span className="leading-relaxed">{bullet.replace(/^[-•]\s*/, '').trim()}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      }
      return (
        <div key={index} className="mb-2">
          <p className="text-gray-700 text-sm leading-relaxed">{trimmedSection}</p>
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
          <p className="text-gray-600">Here's how you performed</p>
        </div>

        {/* Score Summary */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="text-center mb-6">
            <div className={`text-6xl font-bold mb-2 ${getPerformanceColor(percentage)}`}>
              {percentage}%
            </div>
            <div className="text-xl text-gray-600 mb-4">
              {results.correctAnswers} out of {results.totalQuestions} correct
            </div>
            <p className="text-gray-700 max-w-md mx-auto">
              {getPerformanceMessage(percentage)}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{results.correctAnswers}</div>
              <div className="text-sm text-gray-600">Correct Answers</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{formatTime(results.timeSpent)}</div>
              <div className="text-sm text-gray-600">Total Time</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <Trophy className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{formatTime(averageTime)}</div>
              <div className="text-sm text-gray-600">Avg. per Question</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={onRetakeQuiz}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Quiz</span>
            </button>
            <button
              onClick={onBackToSetup}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>New Quiz</span>
            </button>
          </div>

          {/* Share Achievement Section */}
          <div className="border-t border-gray-200 pt-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <Share2 className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Share Your Achievement</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Let your network know about your CISSP study progress!
              </p>
            </div>
            
            <div className="max-w-md mx-auto">
              <SocialShareButtons
                title={`CISSP Quiz Results - ${percentage}% Score`}
                text={getShareMessage()}
                hashtags={['CISSP', 'Cybersecurity', 'StudyGroup', 'Certification', 'InfoSec']}
                variant="compact"
                size="md"
                className="justify-center"
              />
            </div>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Question Review</h2>
          <div className="space-y-6">
            {results.questionResults.map((result, index) => {
              const domainColor = getDomainColor(result.question.domain);
              const difficultyColor = getDifficultyColor(result.question.difficulty);
              
              return (
                <div
                  key={index}
                  className={`border-2 rounded-xl p-6 ${
                    result.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {result.isCorrect ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                      <span className="font-medium text-gray-900">
                        Question {index + 1}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: domainColor.primary,
                          color: 'white'
                        }}
                      >
                        {result.question.domain}
                      </span>
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: difficultyColor.primary,
                          color: 'white'
                        }}
                      >
                        {result.question.difficulty}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-900 mb-4 font-medium">
                    {result.question.question}
                  </p>

                  <div className="grid grid-cols-1 gap-2 mb-4">
                    {result.question.options.map((option: string, optionIndex: number) => (
                      <div
                        key={optionIndex}
                        className={`p-3 rounded-lg border ${
                          optionIndex === result.question.correctAnswer
                            ? 'border-green-300 bg-green-100'
                            : result.userAnswer === optionIndex && optionIndex !== result.question.correctAnswer
                            ? 'border-red-300 bg-red-100'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-gray-900">{option}</span>
                          <div className="flex items-center space-x-2">
                            {optionIndex === result.question.correctAnswer && (
                              <span className="text-green-600 text-sm font-medium">Correct</span>
                            )}
                            {result.userAnswer === optionIndex && optionIndex !== result.question.correctAnswer && (
                              <span className="text-red-600 text-sm font-medium">Your Answer</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-lg p-3 border">
                    <h4 className="font-medium text-gray-900 mb-2">Explanation:</h4>
                    {formatExplanation(result.question.explanation)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};