import React, { useState, useEffect, useRef } from 'react';
import { Question } from '../../types';
import { Clock, CheckCircle, XCircle, ArrowRight, ArrowLeft, RotateCcw, Trophy, Target, Plus, Minus, Lightbulb, Loader, Briefcase, Sparkles, Flag, ThumbsUp, ThumbsDown } from 'lucide-react';
import { getDomainColor, getDifficultyColor } from '../../utils/colorSystem';
import { analyzeCISSPKeywords, highlightKeywords } from '../../services/keywordAnalysis';
import { generateManagerPerspective, enhanceQuestionExplanation } from '../../services/openai';
import { useQuizPersistence } from '../../hooks/useQuizPersistence';
import { parseExplanationSections, renderSectionContent } from '../../utils/textFormatting';
import { useFlags } from '../../hooks/useFlags';
import { FlagModal } from '../UI/FlagModal';
import { getQuestionRating, setQuestionRating, getQuestionRatingAggregate } from '../../services/flagService';
import { useRatings } from '../../hooks/useRatings';
import { showToast } from '../../utils/toast';
import { RatingButton } from '../UI/RatingButton';
import { supabase } from '../../lib/supabase';
import { saveQuizProgress } from '../../services/progress';

interface QuizProps {
  questions: Question[];
  initialIndex?: number;
  onComplete: (results: QuizResults) => void;
  onExit: () => void;
  onProgressChange?: (current: number, total: number) => void;
  currentUser?: any; // Accept currentUser as a prop
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

export const Quiz: React.FC<QuizProps> = ({ questions, initialIndex, onComplete, onExit, onProgressChange, currentUser }) => {
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

  // Get current question - add safety check
  const currentQuestion = questions && questions.length > 0 ? questions[currentIndex] || questions[0] : null;

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



  // Flag functionality
  const [showFlagModal, setShowFlagModal] = React.useState(false);
  const { isQuestionFlagged, flagQuestion, unflagQuestion, loading: flagsLoading } = useFlags();
  const isFlagged = isQuestionFlagged(currentQuestion?.id || '');

  const handleFlagClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFlagged) {
      unflagQuestion(currentQuestion?.id || '');
    } else {
      setShowFlagModal(true);
    }
  };

  const handleFlagSubmit = async (reason: string, customReason?: string) => {
    try {
      const success = await flagQuestion(currentQuestion?.id || '', reason, customReason);
      if (success) {
        setShowFlagModal(false);
      }
    } catch (error) {
      console.error('Error flagging question:', error);
    }
  };

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
    const questionId = currentQuestion?.id || '';
    if (!managerPerspectives[questionId]) {
      setLoadingManagerPerspective(true);
      setManagerPerspectiveError(null);
      generateManagerPerspective(
        currentQuestion?.question || '',
        currentQuestion?.options || [],
        currentQuestion?.correctAnswer || 0,
        currentQuestion?.domain || ''
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
  }, [currentIndex, currentQuestion?.id]);

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
    const questionId = currentQuestion?.id || '';
    
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
        currentQuestion?.question || '',
        currentQuestion?.options || [],
        currentQuestion?.correctAnswer || 0,
        currentQuestion?.domain || ''
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
    const questionId = currentQuestion?.id || '';
    
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
         currentQuestion?.question || '',
         currentQuestion?.options || [],
         currentQuestion?.correctAnswer || 0,
         currentQuestion?.explanation || '',
         currentQuestion?.domain || ''
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

  const handleNextQuestion = async () => {
    if (selectedAnswer === null) return;
    
    // Calculate time spent on current question
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    
    // Update question times
    setQuestionTimes(prev => {
      const newTimes = [...prev];
      newTimes[currentIndex] = timeSpent;
      return newTimes;
    });

    // Save answer to batched progress
    if (currentQuestion) {
      setBatchedProgress(prev => [
        ...prev,
        {
          user_id: currentUser.id,
          question_id: currentQuestion.id,
          user_answer: selectedAnswer,
          is_correct: selectedAnswer === currentQuestion.correctAnswer,
          answered_at: new Date().toISOString(),
          time_spent: Math.floor((Date.now() - questionStartTime) / 1000),
        }
      ]);
    }

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
      // Save quiz progress to quiz_sessions
      if (currentUser && currentUser.id) {
        try {
          await saveQuizProgress({ user_id: currentUser.id, results, dev_mode: true });
          console.log('Quiz progress saved to quiz_sessions');
        } catch (err) {
          console.error('Failed to save quiz progress:', err);
        }
      }
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

  const domainColor = getDomainColor(currentQuestion?.domain || '');
  const difficultyColor = getDifficultyColor(currentQuestion?.difficulty || 'Easy');

  // Remove localStorage-based user lookup
  // const currentUser = JSON.parse(localStorage.getItem('supabase.auth.user') || 'null');
  const questionIds = questions.map(q => q.id);
  const { ratings, setRating } = useRatings(questionIds, currentUser?.id || null);
  const [ratingCounts, setRatingCounts] = useState<{ up: number; down: number }>({ up: 0, down: 0 });

  useEffect(() => {
    if (!currentQuestion || !currentQuestion.id) return;
    getQuestionRatingAggregate(currentQuestion.id).then(setRatingCounts);
  }, [currentQuestion?.id]);

  const handleThumb = async (val: 1 | -1) => {
    console.log('Thumb clicked', val, currentUser, currentQuestion?.id);
    if (!currentUser) {
      showToast('error', 'No user found. Please log in.');
      return;
    }
    if (!currentQuestion || !currentQuestion.id) {
      showToast('error', 'No question found.');
      return;
    }
    try {
      const success = await setQuestionRating(currentQuestion.id, currentUser.id, val);
      if (!success) {
        showToast('error', 'Failed to save your rating. Please try again.');
        return;
      }
      setRating(currentQuestion.id, val);
      getQuestionRatingAggregate(currentQuestion.id).then(setRatingCounts);
    } catch (error) {
      console.error('Error saving rating:', error);
      showToast('error', 'Error saving your rating. Please check your connection or permissions.');
    }
  };


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

  // Replace the formatExplanation function and use this in the render:
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

  // Early return if no current question
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-red-700 font-semibold text-lg mb-2">No questions available</p>
          <p className="text-gray-600">Please try refreshing the page or contact support if the problem persists.</p>
        </div>
      </div>
    );
  }

  const [batchedProgress, setBatchedProgress] = useState<any[]>([]);

  const handleQuizComplete = async (results: QuizResults) => {
    if (batchedProgress.length > 0) {
      try {
        console.log('[Progress] Attempting to upsert quiz progress:', batchedProgress);
        showToast('info', 'Saving your progress...');
        const { error } = await supabase.from('quiz_progress').upsert(batchedProgress, { onConflict: 'user_id,question_id' });
        if (error) {
          showToast('error', 'Failed to save your progress.');
          console.error('[Progress] Quiz progress upsert error:', error);
        } else {
          showToast('success', 'Your progress has been saved!');
          console.log('[Progress] Progress upserted successfully.');
        }
      } catch (err) {
        showToast('error', 'Unexpected error saving progress.');
        console.error('[Progress] Quiz progress upsert exception:', err);
      }
    } else {
      console.log('[Progress] No progress to save (batchedProgress is empty).');
    }
    setBatchedProgress([]); // Clear after saving
    onComplete(results);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 py-8 flex justify-center items-start">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex justify-center w-full">
          <div className="w-full max-w-8xl mx-auto rounded-2xl shadow-xl bg-white/90 p-8 flex flex-col md:flex-row gap-8">
            {/* Controls Card (Sidebar on desktop, top on mobile) */}
            <div className="w-full md:w-64 flex-shrink-0 mb0">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4 flex flex-col gap-3 shadow-lg backdrop-blur-sm">
                {/* Quiz Header Info */}
                <div className="w-full">
                  <div className="flex items-center space-x-1.5 mb-2">
                    <div className="w-6 h-6 gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Target className="w-3 h-3" />
                    </div>
                    <span className="font-bold text-gray-90 text-base">Quiz</span>
                  </div>
                  {hasPersistedQuiz() && (
                    <div className="text-[10] text-blue-60 bg-blue-50 px-2 py-0.5 rounded-full inline-block border border-blue-200">
                      ⏸️ Resumed
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full">
                  <div className="text-[10] text-gray-500 mb-1 font-medium">Progress</div>
                  <div className="w-full bg-gray-200 rounded-full h-10.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-300 shadow-sm"
                      style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    />
                  </div>
                  <div className="text-[10] text-gray-600 text-center font-medium">
                    Question {currentIndex + 1} of {questions.length}
                  </div>
                </div>

                {/* Timers */}
                <div className="space-y-2">
                  <div className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm">
                    <div className="text-[10] text-gray-500 mb-1 font-medium">Total Time</div>
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3 h-3 text-blue-500" />
                      <span className="font-mono text-sm font-bold">{formatTime(elapsedTime)}</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm">
                    <div className="text-[10] text-gray-500 mb-1 font-medium">Question Time</div>
                    <div className="flex items-center space-x-1.5">
                      <RotateCcw className="w-3 h-3 text-purple-500" />
                      <span className={`font-mono text-sm font-bold ${questionElapsedTime >= 85 ? 'text-red-600' : 'text-gray-700'}`}>
                        {formatTime(questionElapsedTime)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Text Size Controls */}
                <div className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm">
                  <div className="text-[10] text-gray-500 mb-2 font-medium">Text Size</div>
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => setTextSize(Math.max(0.8, textSize - 0.1))} 
                      className="w-6 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-200 font-bold text-xs"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold text-gray-900 min-w-[20.5em] text-center">
                      {Math.round(textSize * 100)}%
                    </span>
                    <button 
                      onClick={() => setTextSize(Math.min(2, textSize + 0.1))} 
                      className="w-6 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-200 font-bold text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Domain & Difficulty */}
                <div className="w-full space-y-2">
                  <div className="bg-white rounded-lg p-2 border border-gray-200 shadow-sm">
                    <span 
                      className="w-full px-2 py-1 rounded text-xs font-medium block text-center"
                      style={{ 
                        backgroundColor: domainColor.primary, 
                        color: 'white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                      🏛️ {currentQuestion.domain}
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-gray-200 shadow-sm">
                    <span 
                      className="w-full px-2 py-1 rounded text-xs font-medium block text-center"
                      style={{ 
                        backgroundColor: difficultyColor.primary, 
                        color: 'white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                      {currentQuestion.difficulty === 'Easy' && '🟢'}
                      {currentQuestion.difficulty === 'Medium' && '🟡'}
                      {currentQuestion.difficulty === 'Hard' && '🔴'}
                      {currentQuestion.difficulty}
                    </span>
                  </div>
                </div>

                {/* Flag Button */}
                <div className="w-full">
                  <button 
                    onClick={handleFlagClick} 
                    disabled={flagsLoading}
                    className={`w-full flex items-center justify-center space-x-1.5 px-3-2 rounded-lg text-xs font-semibold transition-all duration-20 ${isFlagged ? 'bg-gradient-to-r from-red-500 to-red-600 text-white border border-red-600 shadow-lg hover:from-red-600 to-red-700 transform hover:scale-[1.02]' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-gray-400 hover:shadow-md'}`}
                  > 
                    <Flag className={`w-3 h-3 ${isFlagged ? 'text-white' : 'text-gray-600'}`} /> 
                    <span>{isFlagged ? '🚩 Flagged' : 'Flag'}</span>
                  </button>
                </div>

                {/* Rating UI */}
                {currentQuestion && currentUser && (
                  <div className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm">
                    <RatingButton questionId={currentQuestion.id} userId={currentUser.id} />
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="w-full space-y-2">
                  <button 
                    onClick={handlePreviousQuestion} 
                    disabled={currentIndex === 0} 
                    className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 border border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-sm hover:shadow-md"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Previous</span>
                  </button>
                  <button 
                    onClick={handleExit} 
                    className="w-full px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 border border-gray-300 hover:border-gray-40 bg-white shadow-sm hover:shadow-md"
                  >
                    Exit Quiz
                  </button>
                </div>
              </div>
            </div>

            {/* Main Question Content (Wide) */}
            <div className="flex-1 min-w-0">
              {/* Question Text */}
              <div className="mb-8">
                <span 
                  className="leading-relaxed text-gray-900 font-medium block"
                  style={{ fontSize: `${textSize * 1.25}rem` }}
                >
                  {currentQuestion.question}
                </span>
              </div>

              {/* Answer Options */}
              <div className="space-y-4 mb-8">
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="relative">
                    <button
                      onClick={() => handleAnswerSelect(index)}
                      disabled={showResult}
                      className={`w-full text-left p-6 rounded-xl border-2 transition-all duration-200 ${
                        selectedAnswer === index
                          ? showResult
                            ? index === currentQuestion.correctAnswer
                              ? 'border-green-500 bg-green-50 text-green-900 shadow-lg'
                              : 'border-red-500 bg-red-50 text-red-900 shadow-lg'
                            : 'border-blue-500 bg-blue-50 text-blue-900 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      } ${showResult ? 'cursor-default' : 'cursor-pointer hover:shadow-md'}`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                          selectedAnswer === index
                            ? showResult
                              ? index === currentQuestion.correctAnswer
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                              : 'bg-blue-500 text-white'
                            : 'border-gray-300 text-gray-100'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <div className="flex-1">
                          <span className="block" style={{ fontSize: `${textSize}rem` }}>
                            {option}
                          </span>
                          {showResult && (
                            <div className="mt-2 text-sm">
                              {index === currentQuestion.correctAnswer ? (
                                <span className="text-green-600 font-semibold">✓ Correct Answer</span>
                              ) : selectedAnswer === index ? (
                                <span className="text-red-600 font-semibold">✗ Your Answer</span>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
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
                      ? renderFormattedExplanation(enhancedExplanation)
                      : renderFormattedExplanation(currentQuestion.explanation)}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between mt-8">
                {!showResult ? (
                  <div className="flex space-x-4">
                    <button
                      onClick={handleShowResult}
                      disabled={selectedAnswer === null}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Answer
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-200 font-medium"
                  >
                    <span>{isLastQuestion ? 'Complete Quiz' : 'Next Question'}</span>
                    {!isLastQuestion && <ArrowRight className="w-5 h-5" />}
                    {isLastQuestion && <Trophy className="w-5 h-5" />}
                  </button>
                )}
              </div>

              {/* Manager Perspective Content */}
              {showManagerPerspective && managerPerspectives[currentQuestion?.id || ''] && (
                <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-blue-500">
                      <Briefcase className="w-3 h-3" />
                    </div>
                    <span className="font-bold text-blue-900 text-sm">Manager's Strategic Perspective</span>
                  </div>
                  <div className="text-gray-800 leading-relaxed">
                    {formatManagerPerspective(managerPerspectives[currentQuestion?.id || ''])}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Flag Modal */}
      <FlagModal
        isOpen={showFlagModal}
        onClose={() => setShowFlagModal(false)}
        onFlag={handleFlagSubmit}
        questionText={currentQuestion.question}
        loading={flagsLoading}
      />
    </div>
  );
};