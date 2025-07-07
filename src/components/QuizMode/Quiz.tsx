import React, { useState, useEffect } from 'react';
import { Question } from '../../types';
import { Clock, CheckCircle, XCircle, ArrowRight, RotateCcw, Trophy, Target, Plus, Minus, Lightbulb, Loader, Briefcase } from 'lucide-react';
import { getDomainColor, getDifficultyColor } from '../../utils/colorSystem';
import { analyzeCISSPKeywords, highlightKeywords } from '../../services/keywordAnalysis';
import { generateManagerPerspective } from '../../services/openai';
import { useQuizPersistence } from '../../hooks/useQuizPersistence';

interface QuizProps {
  questions: Question[];
  onComplete: (results: QuizResults) => void;
  onExit: () => void;
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

export const Quiz: React.FC<QuizProps> = ({ questions, onComplete, onExit }) => {
  const { persistedState, saveQuizState, clearPersistedState, hasPersistedQuiz } = useQuizPersistence();
  
  // Initialize state from persisted data or defaults
  const [currentIndex, setCurrentIndex] = useState(persistedState?.currentIndex || 0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(
    persistedState?.userAnswers || new Array(questions.length).fill(null)
  );
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(persistedState?.selectedAnswer || null);
  const [showResult, setShowResult] = useState(persistedState?.showResult || false);
  const [startTime] = useState(persistedState?.startTime || Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(persistedState?.questionStartTime || Date.now());
  const [questionTimes, setQuestionTimes] = useState<number[]>(persistedState?.questionTimes || []);
  const [elapsedTime, setElapsedTime] = useState(persistedState?.elapsedTime || 0);
  
  // Tally tracking for participant responses
  const [tallyCounts, setTallyCounts] = useState<number[]>(persistedState?.tallyCounts || [0, 0, 0, 0]);
  const [showTallies, setShowTallies] = useState(persistedState?.showTallies || false);

  // Keyword highlighting - store keywords per question
  const [questionKeywords, setQuestionKeywords] = useState<Record<string, string[]>>({});
  const [showKeywords, setShowKeywords] = useState(persistedState?.showKeywords || false);
  const [loadingKeywords, setLoadingKeywords] = useState(false);
  const [keywordError, setKeywordError] = useState<string | null>(null);

  // Manager's perspective feature
  const [managerPerspectives, setManagerPerspectives] = useState<Record<string, string>>({});
  const [showManagerPerspective, setShowManagerPerspective] = useState(false);
  const [loadingManagerPerspective, setLoadingManagerPerspective] = useState(false);
  const [managerPerspectiveError, setManagerPerspectiveError] = useState<string | null>(null);

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
      tallyCounts,
      showTallies,
      keywords: questionKeywords[currentQuestion?.id] || [],
      showKeywords,
      isActive: true
    });
  }, [currentIndex, userAnswers, selectedAnswer, showResult, questionStartTime, questionTimes, elapsedTime, tallyCounts, showTallies, questionKeywords, showKeywords]);

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      const newElapsedTime = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(newElapsedTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Reset selected answer and tallies when question changes
  useEffect(() => {
    setSelectedAnswer(userAnswers[currentIndex]);
    setShowResult(false);
    setQuestionStartTime(Date.now());
    setTallyCounts([0, 0, 0, 0]); // Reset tallies for new question
    setKeywordError(null);
    setShowManagerPerspective(false);
    setManagerPerspectiveError(null);
  }, [currentIndex, userAnswers]);

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

  const handleToggleKeywords = async () => {
    const questionId = currentQuestion.id;
    
    // If we already have keywords for this question, just toggle display
    if (questionKeywords[questionId]) {
      setShowKeywords(!showKeywords);
      return;
    }

    // If we don't have keywords yet, analyze them
    if (loadingKeywords) return;
    
    setLoadingKeywords(true);
    setKeywordError(null);
    
    try {
      const result = await analyzeCISSPKeywords(currentQuestion.question);
      
      if (result.error) {
        setKeywordError(result.error);
      } else {
        setQuestionKeywords(prev => ({
          ...prev,
          [questionId]: result.keywords
        }));
        setShowKeywords(true);
      }
    } catch (error: any) {
      setKeywordError('Failed to analyze keywords. Please try again.');
    } finally {
      setLoadingKeywords(false);
    }
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

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return;

    // Record time spent on this question
    const timeSpent = Date.now() - questionStartTime;
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
        correctAnswers: newAnswers.reduce((count, answer, index) => 
          answer === questions[index].correctAnswer ? count + 1 : count, 0
        ),
        timeSpent: Math.floor((Date.now() - startTime) / 1000),
        questionResults: questions.map((q, index) => ({
          question: q,
          userAnswer: newAnswers[index],
          isCorrect: newAnswers[index] === q.correctAnswer,
          timeSpent: finalTimes[index] || 0
        }))
      };
      onComplete(results);
    } else {
      // Next question
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
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

  // Get highlighted question text
  const getHighlightedQuestionText = () => {
    const keywords = questionKeywords[currentQuestion.id] || [];
    if (showKeywords && keywords.length > 0) {
      return highlightKeywords(currentQuestion.question, keywords);
    }
    return currentQuestion.question;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">Quiz</span>
            </div>
            <div className="text-sm text-gray-600">
              Question {currentIndex + 1} of {questions.length}
            </div>
            {hasPersistedQuiz() && (
              <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                Resumed
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Keyword Analysis Button */}
            <button
              onClick={handleToggleKeywords}
              disabled={loadingKeywords}
              className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                showKeywords 
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
            >
              {loadingKeywords ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Lightbulb className="w-4 h-4" />
              )}
              <span>
                {loadingKeywords 
                  ? 'Analyzing...' 
                  : showKeywords 
                  ? 'Hide Keywords' 
                  : 'Highlight Keywords'
                }
              </span>
            </button>

            {/* Tally Toggle */}
            {/* Remove the Tally Toggle button from the quiz header */}
            
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="font-mono text-sm">{formatTime(elapsedTime)}</span>
            </div>
            <button
              onClick={handleExit}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            >
              Exit
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-6xl mx-auto mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-7xl w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Tally Panel */}
            {/* Remove the Tally Panel (showTallies && ...) */}

            {/* Question Card */}
            <div className={showTallies ? "lg:col-span-9" : "lg:col-span-12"}>
              <div className="bg-white rounded-2xl shadow-xl p-8">
                {/* Question Header */}
                <div className="flex flex-wrap items-center justify-between mb-6">
                  <div className="flex flex-wrap gap-3">
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: domainColor.primary,
                        color: 'white'
                      }}
                    >
                      🏛️ {currentQuestion.domain}
                    </span>
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium"
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
                </div>

                {/* Keywords Display */}
                {showKeywords && questionKeywords[currentQuestion.id]?.length > 0 && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Key CISSP Terms:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {questionKeywords[currentQuestion.id].map((keyword, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm font-medium"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keyword Error */}
                {keywordError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="text-red-800 text-sm">{keywordError}</span>
                    </div>
                  </div>
                )}

                {/* Question Text */}
                <div className="mb-8">
                  {showKeywords && questionKeywords[currentQuestion.id]?.length > 0 ? (
                    <div 
                      className="text-xl leading-relaxed text-gray-900 font-medium"
                      dangerouslySetInnerHTML={{ __html: getHighlightedQuestionText() }}
                    />
                  ) : (
                    <p className="text-xl leading-relaxed text-gray-900 font-medium">
                      {currentQuestion.question}
                    </p>
                  )}
                </div>

                {/* Answer Options */}
                <div className="space-y-4 mb-8">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={showResult}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
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
                        <div className="flex items-start space-x-4 flex-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
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
                          <p className="text-gray-900 leading-relaxed flex-1">
                            {option}
                          </p>
                        </div>
                        
                        {/* Inline Tally Controls */}
                        <div className="flex flex-col items-end gap-1 ml-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={e => { e.stopPropagation(); handleTallyChange(index, false); }}
                              className="w-6 h-6 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors"
                              disabled={tallyCounts[index] === 0}
                              tabIndex={-1}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center font-bold text-lg">{tallyCounts[index]}</span>
                            <button
                              onClick={e => { e.stopPropagation(); handleTallyChange(index, true); }}
                              className="w-6 h-6 rounded-full bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center transition-colors"
                              tabIndex={-1}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          {/* Progress bar and percentage */}
                          <div className="w-24 bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: getTotalParticipants() > 0 
                                  ? `${(tallyCounts[index] / getTotalParticipants()) * 100}%` 
                                  : '0%'
                              }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 mt-1 text-right w-24">
                            {getTotalParticipants() > 0 
                              ? `${Math.round((tallyCounts[index] / getTotalParticipants()) * 100)}%`
                              : '0%'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Result Explanation */}
                {showResult && (
                  <div className="mb-6">
                    <div className={`p-4 rounded-lg border ${
                      selectedAnswer === currentQuestion.correctAnswer
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center space-x-2 mb-2">
                        {selectedAnswer === currentQuestion.correctAnswer ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span className={`font-medium ${
                          selectedAnswer === currentQuestion.correctAnswer ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {selectedAnswer === currentQuestion.correctAnswer ? 'Correct!' : 'Incorrect'}
                        </span>
                      </div>
                      {selectedAnswer !== currentQuestion.correctAnswer && (
                        <p className="text-gray-700 text-sm mb-3">
                          The correct answer is: <strong>{currentQuestion.options[currentQuestion.correctAnswer]}</strong>
                        </p>
                      )}
                      <div className="bg-white rounded-lg p-3 border">
                        <h4 className="font-medium text-gray-900 mb-2">Explanation:</h4>
                        {formatExplanation(currentQuestion.explanation)}
                      </div>
                    </div>

                    {/* Manager's Perspective Button */}
                    <div className="mt-4">
                      <button
                        onClick={handleManagerPerspective}
                        disabled={loadingManagerPerspective}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {loadingManagerPerspective ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Briefcase className="w-4 h-4" />
                        )}
                        <span>
                          {loadingManagerPerspective 
                            ? 'Generating...' 
                            : showManagerPerspective 
                            ? 'Hide Manager\'s Perspective' 
                            : 'Manager\'s Perspective'
                          }
                        </span>
                      </button>

                      {/* Manager Perspective Error */}
                      {managerPerspectiveError && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="text-red-800 text-sm">{managerPerspectiveError}</span>
                          </div>
                        </div>
                      )}

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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};