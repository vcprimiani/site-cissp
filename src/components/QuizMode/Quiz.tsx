import React, { useState, useEffect, useRef } from 'react';
import { Question } from '../../types';
import { Clock, CheckCircle, XCircle, ArrowRight, ArrowLeft, RotateCcw, Trophy, Target, Plus, Minus, Lightbulb, Loader, Briefcase, Sparkles } from 'lucide-react';
import { getDomainColor, getDifficultyColor } from '../../utils/colorSystem';
import { analyzeCISSPKeywords, highlightKeywords } from '../../services/keywordAnalysis';
import { generateManagerPerspective, enhanceQuestionExplanation } from '../../services/openai';
import { useQuizPersistence } from '../../hooks/useQuizPersistence';
import { isStructuredExplanation } from '../../utils/textFormatting';

interface QuizProps {
  questions: Question[];
  initialIndex?: number;
  onComplete: (results: QuizResults) => void;
  onExit: () => void;
  onProgressChange?: (current: number, total: number) => void;
}

interface QuizResults {
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  questionResults: {
    question: Question;
    userAnswer: number | null;
    isCorrect: boolean;
    timeSpent: number;
  }[];
}

export const Quiz: React.FC<QuizProps> = ({ questions, initialIndex, onComplete, onExit, onProgressChange }) => {
  const { persistedState, saveQuizState, clearPersistedState, hasPersistedQuiz } = useQuizPersistence();
  
  // Initialize state from initialIndex, persistedState, or 0
  const [currentIndex, setCurrentIndex] = useState(
    typeof initialIndex === 'number' ? initialIndex : (persistedState?.currentIndex || 0)
  );
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(
    persistedState?.userAnswers || new Array(questions.length).fill(null)
  );
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(persistedState?.selectedAnswer || null);
  const [showResult, setShowResult] = useState(persistedState?.showResult || false);
  // Always restore startTime and questionStartTime from persistedState if available
  const [startTime] = useState(
    persistedState?.startTime ? persistedState.startTime : Date.now()
  );
  const [questionStartTime, setQuestionStartTime] = useState(
    persistedState?.questionStartTime ? persistedState.questionStartTime : Date.now()
  );
  const [questionTimes, setQuestionTimes] = useState<number[]>(persistedState?.questionTimes || []);
  const [elapsedTime, setElapsedTime] = useState(persistedState?.elapsedTime || 0);
  const [questionElapsedTime, setQuestionElapsedTime] = useState(persistedState?.questionElapsedTime || 0);
  
  // Tally tracking for participant responses
  const [tallyCounts, setTallyCounts] = useState<number[]>(persistedState?.tallyCounts || [0, 0, 0, 0]);
  const [showTallies, setShowTallies] = useState(persistedState?.showTallies || false);



  // Manager's perspective feature
  const [managerPerspectives, setManagerPerspectives] = useState<Record<string, string>>({});
  const [showManagerPerspective, setShowManagerPerspective] = useState(false);
  const [loadingManagerPerspective, setLoadingManagerPerspective] = useState(false);
  const [managerPerspectiveError, setManagerPerspectiveError] = useState<string | null>(null);

  // Enhance Explanation state
  const [isEnhancedExplanation, setIsEnhancedExplanation] = useState(persistedState?.isEnhancedExplanation || false);
  const [enhancedExplanation, setEnhancedExplanation] = useState<string | null>(persistedState?.enhancedExplanation || null);
  const [loadingEnhancedExplanation, setLoadingEnhancedExplanation] = useState(false);
  const [enhancedExplanationError, setEnhancedExplanationError] = useState<string | null>(null);

  // Text size controls
  const [textSize, setTextSize] = useState(persistedState?.textSize || 1); // 0.8, 1, 1.2, 1.4, 1.6
  const textSizeOptions = [0.8, 1, 1.2, 1.4, 1.6];
  const currentTextSizeIndex = textSizeOptions.indexOf(textSize);
  
  const handleTextSizeChange = (direction: 'increase' | 'decrease') => {
    if (direction === 'increase' && currentTextSizeIndex < textSizeOptions.length - 1) {
      setTextSize(textSizeOptions[currentTextSizeIndex + 1]);
    } else if (direction === 'decrease' && currentTextSizeIndex > 0) {
      setTextSize(textSizeOptions[currentTextSizeIndex - 1]);
    }
  };



  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  // Save state whenever it changes
  useEffect(() => {
    saveQuizState({
      questions,
      currentIndex,
      userAnswers,
      selectedAnswer,
      showResult,
      startTime,
      questionStartTime,
      questionTimes,
      elapsedTime,
      questionElapsedTime,
      tallyCounts,
      showTallies,
      isActive: true,
      isEnhancedExplanation,
      enhancedExplanation,
      loadingEnhancedExplanation,
      enhancedExplanationError,
      textSize
    });
  }, [currentIndex, userAnswers, selectedAnswer, showResult, questionStartTime, questionTimes, elapsedTime, questionElapsedTime, tallyCounts, showTallies, isEnhancedExplanation, enhancedExplanation, loadingEnhancedExplanation, enhancedExplanationError, textSize]);

  // Timer effect
  useEffect(() => {
    // Only run timer if not showing result (i.e., not in review mode)
    if (showResult) return; // Pause timer when showing explanation
    const interval = setInterval(() => {
      const newElapsedTime = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(newElapsedTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, showResult]);

  // Per-question timer effect
  useEffect(() => {
    // Only run timer if not showing result (i.e., not in review mode)
    if (showResult) return; // Pause timer when showing explanation
    const interval = setInterval(() => {
      const newQuestionElapsedTime = Math.floor((Date.now() - questionStartTime) / 1000);
      setQuestionElapsedTime(newQuestionElapsedTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [questionStartTime, showResult]);

  // Reset selected answer and tallies when question changes
  useEffect(() => {
    setSelectedAnswer(userAnswers[currentIndex]);
    setShowResult(false);
    // Only reset timer when moving to a new question, not when just showing result
    setQuestionStartTime(Date.now());
    setQuestionElapsedTime(0); // Reset per-question timer
    setTallyCounts([0, 0, 0, 0]); // Reset tallies for new question
    setShowManagerPerspective(false);
    setManagerPerspectiveError(null);
    setIsEnhancedExplanation(false);
    setEnhancedExplanation(null);
    setLoadingEnhancedExplanation(false);
    setEnhancedExplanationError(null);
  }, [currentIndex, userAnswers]);

  // Error handling for missing/corrupted persisted state
  useEffect(() => {
    if (hasPersistedQuiz() && !persistedState) {
      alert('Quiz session could not be restored. Returning to setup.');
      onExit();
    }
  }, [hasPersistedQuiz, persistedState, onExit]);

  // Always generate manager perspective when question changes
  useEffect(() => {
    const questionId = currentQuestion.id;
    if (!managerPerspectives[questionId]) {
      setLoadingManagerPerspective(true);
      setManagerPerspectiveError(null);
      generateManagerPerspective(
        currentQuestion.question,
        currentQuestion.options,
        currentQuestion.correctAnswer,
        currentQuestion.domain
      ).then(result => {
        if (result.error) {
          setManagerPerspectiveError(result.error);
        } else {
          setManagerPerspectives(prev => ({
            ...prev,
            [questionId]: result.content
          }));
        }
      }).catch(() => {
        setManagerPerspectiveError('Failed to generate manager perspective. Please try again.');
      }).finally(() => {
        setLoadingManagerPerspective(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, currentQuestion.id]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return; // Prevent selection after showing result
    setSelectedAnswer(answerIndex);
  };

  const handleTallyChange = (optionIndex: number, increment: boolean) => {
    setTallyCounts(prev => {
      const newCounts = [...prev];
      if (increment) {
        newCounts[optionIndex] = Math.max(0, newCounts[optionIndex] + 1);
      } else {
        newCounts[optionIndex] = Math.max(0, newCounts[optionIndex] - 1);
      }
      return newCounts;
    });
  };

  const resetTallies = () => {
    setTallyCounts([0, 0, 0, 0]);
  };

  const getTotalParticipants = () => {
    return tallyCounts.reduce((sum, count) => sum + count, 0);
  };



  const handleManagerPerspective = async () => {
    const questionId = currentQuestion.id;
    
    // If we already have the perspective for this question, just toggle display
    if (managerPerspectives[questionId]) {
      setShowManagerPerspective(!showManagerPerspective);
      return;
    }

    // If we don't have the perspective yet, generate it
    if (loadingManagerPerspective) return;
    
    setLoadingManagerPerspective(true);
    setManagerPerspectiveError(null);
    
    try {
      const result = await generateManagerPerspective(
        currentQuestion.question,
        currentQuestion.options,
        currentQuestion.correctAnswer,
        currentQuestion.domain
      );
      
      if (result.error) {
        setManagerPerspectiveError(result.error);
      } else {
        setManagerPerspectives(prev => ({
          ...prev,
          [questionId]: result.content
        }));
        setShowManagerPerspective(true);
      }
    } catch (error: any) {
      setManagerPerspectiveError('Failed to generate manager perspective. Please try again.');
    } finally {
      setLoadingManagerPerspective(false);
    }
  };

  const handleEnhanceExplanation = async () => {
    const questionId = currentQuestion.id;
    
    // If we already have an enhanced explanation for this question, just toggle display
    if (enhancedExplanation) {
      setIsEnhancedExplanation(!isEnhancedExplanation);
      return;
    }

    // If we don't have the enhanced explanation yet, generate it
    if (loadingEnhancedExplanation) return;
    
    setLoadingEnhancedExplanation(true);
    setEnhancedExplanationError(null);
    
    try {
             const result = await enhanceQuestionExplanation(
         currentQuestion.question,
         currentQuestion.options,
         currentQuestion.correctAnswer,
         currentQuestion.explanation,
         currentQuestion.domain
       );
      
             if (result.error) {
         setEnhancedExplanationError(result.error);
       } else {
         setEnhancedExplanation(result.content);
         setIsEnhancedExplanation(true);
       }
    } catch (error: any) {
      setEnhancedExplanationError('Failed to enhance explanation. Please try again.');
    } finally {
      setLoadingEnhancedExplanation(false);
    }
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return;
    
    // Calculate time spent on current question
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    
    // Update question times
    setQuestionTimes(prev => {
      const newTimes = [...prev];
      newTimes[currentIndex] = timeSpent;
      return newTimes;
    });

    // Save answer
    const newAnswers = [...userAnswers];
    newAnswers[currentIndex] = selectedAnswer;
    setUserAnswers(newAnswers);

    if (isLastQuestion) {
      // Quiz complete - clear persisted state and calculate results
      clearPersistedState();
      
      const finalTimes = [...questionTimes];
      finalTimes[currentIndex] = timeSpent;
      
      const results: QuizResults = {
        totalQuestions: questions.length,
        correctAnswers: newAnswers.reduce<number>((count, answer, index) => 
          answer !== null && answer === questions[index].correctAnswer ? count + 1 : count, 0
        ),
        timeSpent: Math.floor((Date.now() - startTime) / 1000),
        questionResults: questions.map((q, index) => ({
          question: q,
          userAnswer: newAnswers[index],
          isCorrect: newAnswers[index] !== null && newAnswers[index] === q.correctAnswer,
          timeSpent: finalTimes[index] || 0
        }))
      };
      window.scrollTo({ top: 0, behavior: 'smooth' });
      onComplete(results);
    } else {
      // Next question
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentIndex === 0) return; // Can't go back from first question
    
    // Calculate time spent on current question
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    
    // Update question times
    setQuestionTimes(prev => {
      const newTimes = [...prev];
      newTimes[currentIndex] = timeSpent;
      return newTimes;
    });

    // Save current answer if selected
    if (selectedAnswer !== null) {
      const newAnswers = [...userAnswers];
      newAnswers[currentIndex] = selectedAnswer;
      setUserAnswers(newAnswers);
    }

    // Go to previous question
    setCurrentIndex(prev => prev - 1);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handleShowResult = () => {
    if (selectedAnswer === null) return;
    setShowResult(true);
  };

  const handleExit = () => {
    clearPersistedState();
    onExit();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const domainColor = getDomainColor(currentQuestion.domain);
  const difficultyColor = getDifficultyColor(currentQuestion.difficulty);



  // Format manager perspective response for better readability
  const formatManagerPerspective = (text: string): JSX.Element[] => {
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1')     // Remove italic markdown
      .replace(/\s+/g, ' ')           // Clean multiple spaces
      .trim();

    const sections = cleanText.split(/\n\s*\n/).filter(section => section.trim());
    
    return sections.map((section, index) => {
      const trimmedSection = section.trim();
      
      // Check if it's a numbered section (1., 2., etc.)
      if (/^\d+\./.test(trimmedSection)) {
        const [title, ...content] = trimmedSection.split(/[:\-]/);
        return (
          <div key={index} className="mb-4">
            <h4 className="font-semibold text-blue-800 mb-2 text-sm">
              {title.trim()}
            </h4>
            {content.length > 0 && (
              <div className="text-gray-700 text-sm leading-relaxed pl-4">
                {content.join(':').trim()}
              </div>
            )}
          </div>
        );
      }
      
      // Check if it contains bullet points
      if (trimmedSection.includes('- ') || trimmedSection.includes('• ')) {
        const lines = trimmedSection.split('\n');
        const title = lines[0];
        const bullets = lines.slice(1).filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'));
        
        return (
          <div key={index} className="mb-4">
            {title && !title.startsWith('-') && !title.startsWith('•') && (
              <h4 className="font-semibold text-blue-800 mb-2 text-sm">{title}</h4>
            )}
            <ul className="space-y-1 pl-4">
              {bullets.map((bullet, bIndex) => (
                <li key={bIndex} className="text-gray-700 text-sm flex items-start">
                  <span className="text-blue-600 mr-2 mt-1">•</span>
                  <span className="leading-relaxed">
                    {bullet.replace(/^[-•]\s*/, '').trim()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      }
      
      // Regular paragraph
      return (
        <div key={index} className="mb-3">
          <p className="text-gray-700 text-sm leading-relaxed">
            {trimmedSection}
          </p>
        </div>
      );
    });
  };

  // Add a function to format the explanation text for better readability
  const formatExplanation = (text: string): JSX.Element[] => {
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1')     // Remove italic markdown
      .replace(/\s+/g, ' ')           // Clean multiple spaces
      .trim();

    const sections = cleanText.split(/\n\s*\n/).filter(section => section.trim());
    return sections.map((section, index) => {
      const trimmedSection = section.trim();
      // Numbered section
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
      // Bullet points
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
      // Regular paragraph
      return (
        <div key={index} className="mb-2">
          <p className="text-gray-700 text-sm leading-relaxed">{trimmedSection}</p>
        </div>
      );
    });
  };

  // Ref for the main question card
  const questionCardRef = useRef<HTMLDivElement | null>(null);

  // Scroll question card into view on question change
  useEffect(() => {
    if (questionCardRef.current) {
      questionCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentIndex]);

  useEffect(() => {
    if (onProgressChange) {
      onProgressChange(currentIndex, questions.length);
    }
  }, [currentIndex, questions.length, onProgressChange]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 py-8 flex justify-center items-start">
        <div className="w-full max-w-[1920px] mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col lg:flex-row gap-8 w-full">
            {/* Main Question Content */}
            <div className="flex-1 min-w-0">

              {/* Question Text */}
              <div className="mb-6">
                <span 
                  className="leading-relaxed text-gray-900 font-medium"
                  style={{ fontSize: `${textSize * 1.25}rem` }}
                >
                  {currentQuestion.question}
                </span>
              </div>

              {/* Answer Options */}
              <div className="space-y-3 mb-6">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showResult}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 ${
                      showResult
                        ? index === currentQuestion.correctAnswer
                          ? 'border-green-500 bg-green-50 cursor-default'
                          : selectedAnswer === index && index !== currentQuestion.correctAnswer
                          ? 'border-red-500 bg-red-50 cursor-default'
                          : 'border-gray-200 bg-gray-50 cursor-default'
                        : selectedAnswer === index
                        ? 'border-blue-500 bg-blue-50 cursor-pointer'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                          showResult && index === currentQuestion.correctAnswer
                            ? 'bg-green-500 text-white'
                            : showResult && selectedAnswer === index && index !== currentQuestion.correctAnswer
                            ? 'bg-red-500 text-white'
                            : selectedAnswer === index
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <p 
                          className="text-gray-900 leading-relaxed flex-1"
                          style={{ fontSize: `${textSize * 0.875}rem` }}
                        >
                          {option}
                        </p>
                      </div>
                      {/* Inline Tally Controls */}
                      <div className="flex flex-col items-end gap-1 ml-3">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={e => { e.stopPropagation(); handleTallyChange(index, false); }}
                            className="w-5 h-5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors"
                            disabled={tallyCounts[index] === 0}
                            tabIndex={-1}
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="w-6 text-center font-bold text-sm">{tallyCounts[index]}</span>
                          <button
                            onClick={e => { e.stopPropagation(); handleTallyChange(index, true); }}
                            className="w-5 h-5 rounded-full bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center transition-colors"
                            tabIndex={-1}
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        {/* Progress bar and percentage */}
                        <div className="w-20 bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                            style={{
                              width: getTotalParticipants() > 0 
                                ? `${(tallyCounts[index] / getTotalParticipants()) * 100}%` 
                                : '0%'
                            }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 text-right w-20">
                          {getTotalParticipants() > 0 
                            ? `${Math.round((tallyCounts[index] / getTotalParticipants()) * 100)}%`
                            : '0%'}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Explanation (show after submit) */}
              {showResult && (
                <div className="bg-white rounded-lg p-4 border mb-6">
                  <h4 
                    className="font-medium text-gray-900 mb-2"
                    style={{ fontSize: `${textSize * 1.125}rem` }}
                  >
                    Explanation:
                  </h4>
                  <div style={{ fontSize: `${textSize * 0.875}rem` }}>
                    {isEnhancedExplanation && enhancedExplanation
                      ? formatExplanation(enhancedExplanation)
                      : formatExplanation(currentQuestion.explanation)}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between">
                {!showResult ? (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleShowResult}
                      disabled={selectedAnswer === null}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      Submit Answer
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
                  >
                    <span>{isLastQuestion ? 'Complete Quiz' : 'Next Question'}</span>
                    {!isLastQuestion && <ArrowRight className="w-4 h-4" />}
                    {isLastQuestion && <Trophy className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {/* Manager Perspective Content */}
              {showManagerPerspective && managerPerspectives[currentQuestion.id] && (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900 text-sm">Manager's Strategic Perspective</span>
                  </div>
                  <div className="max-w-none">
                    {formatManagerPerspective(managerPerspectives[currentQuestion.id])}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions (formerly sidebar) */}
            <div className="flex-1 w-full max-w-xs lg:max-w-sm flex-shrink-0 flex flex-col gap-6">
              {/* Quiz Header Info */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">Quiz</span>
                </div>
                {hasPersistedQuiz() && (
                  <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full inline-block">
                    Resumed
                  </div>
                )}
              </div>

              {/* Timers and Text Size Controls */}
              <div className="flex items-start justify-between">
                {/* Timers */}
                <div className="space-y-4 flex-1">
                  {/* Total Timer */}
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Total Time</div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="font-mono text-lg font-semibold">{formatTime(elapsedTime)}</span>
                    </div>
                  </div>

                  {/* Per-Question Timer */}
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Question Time</div>
                    <div className="flex items-center space-x-2">
                      <RotateCcw className="w-4 h-4" />
                      <span 
                        className={`font-mono text-lg font-semibold ${
                          questionElapsedTime >= 85 ? 'text-red-600' : 'text-gray-600'
                        }`}
                      >
                        {formatTime(questionElapsedTime)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Text Size Controls */}
                <div
                  className="backdrop-blur bg-white/70 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg px-6 py-4 flex flex-col items-center min-w-[170px]"
                  style={{ boxShadow: '0 4px 24px 0 rgba(80,120,255,0.08)' }}
                >
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 tracking-wide select-none" style={{letterSpacing: '0.01em'}}>Text Size</div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleTextSizeChange('decrease')}
                      disabled={currentTextSizeIndex === 0}
                      className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-gray-500 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Decrease text size"
                      style={{ boxShadow: '0 2px 8px 0 rgba(80,120,255,0.06)' }}
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span
                      className="font-bold text-2xl text-gray-900 dark:text-white transition-all duration-200 select-none"
                      style={{ minWidth: 56, display: 'inline-block', textAlign: 'center' }}
                    >
                      {Math.round(textSize * 100)}%
                    </span>
                    <button
                      onClick={() => handleTextSizeChange('increase')}
                      disabled={currentTextSizeIndex === textSizeOptions.length - 1}
                      className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-gray-500 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Increase text size"
                      style={{ boxShadow: '0 2px 8px 0 rgba(80,120,255,0.06)' }}
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="text-xs text-gray-500 mb-1 text-center">Progress</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-gray-600 mt-1 text-center">
                  Question {currentIndex + 1} of {questions.length}
                </div>
              </div>

              {/* Domain and Difficulty Badges */}
              <div className="space-y-3">
                <span
                  className="px-3 py-2 rounded-lg text-sm font-medium block text-center"
                  style={{
                    backgroundColor: domainColor.primary,
                    color: 'white'
                  }}
                >
                  🏛️ {currentQuestion.domain}
                </span>
                <span
                  className="px-3 py-2 rounded-lg text-sm font-medium block text-center"
                  style={{
                    backgroundColor: difficultyColor.primary,
                    color: 'white'
                  }}
                >
                  {currentQuestion.difficulty === 'Easy' && '🟢'}
                  {currentQuestion.difficulty === 'Medium' && '🟡'}
                  {currentQuestion.difficulty === 'Hard' && '🔴'}
                  {currentQuestion.difficulty}
                </span>
              </div>







              {/* Navigation Buttons */}
              <div className="space-y-3">
                {/* Back Button */}
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentIndex === 0}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {/* Exit Button */}
                <button
                  onClick={handleExit}
                  className="w-full px-4 py-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                >
                  Exit Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};