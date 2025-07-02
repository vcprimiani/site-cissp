import React, { useState, useEffect } from 'react';
import { Question } from '../../types';
import { Clock, CheckCircle, XCircle, ArrowRight, RotateCcw, Trophy, Target } from 'lucide-react';
import { getDomainColor, getDifficultyColor } from '../../utils/colorSystem';

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [startTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Reset selected answer when question changes
  useEffect(() => {
    setSelectedAnswer(userAnswers[currentIndex]);
    setShowResult(false);
    setQuestionStartTime(Date.now());
  }, [currentIndex, userAnswers]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return; // Prevent selection after showing result
    setSelectedAnswer(answerIndex);
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
      // Quiz complete - ensure we have all question times
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const domainColor = getDomainColor(currentQuestion.domain);
  const difficultyColor = getDifficultyColor(currentQuestion.difficulty);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">Quiz</span>
            </div>
            <div className="text-sm text-gray-600">
              Question {currentIndex + 1} of {questions.length}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="font-mono text-sm">{formatTime(elapsedTime)}</span>
            </div>
            <button
              onClick={onExit}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            >
              Exit
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mt-4">
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
        <div className="max-w-4xl w-full">
          {/* Question Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
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
              
              {/* Removed tags section to prevent giving away answers */}
            </div>

            {/* Question Text */}
            <div className="mb-8">
              <p className="text-xl leading-relaxed text-gray-900 font-medium">
                {currentQuestion.question}
              </p>
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
                    <div className="flex items-start space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
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
                    
                    {showResult && (
                      <div>
                        {index === currentQuestion.correctAnswer ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : selectedAnswer === index ? (
                          <XCircle className="w-6 h-6 text-red-600" />
                        ) : null}
                      </div>
                    )}
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
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  </div>
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
  );
};