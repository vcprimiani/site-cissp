import React, { useEffect, useState } from 'react';

interface ProgressEntry {
  timestamp: number;
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
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

const ProgressPage: React.FC = () => {
  const [history, setHistory] = useState<ProgressEntry[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('quiz-progress-history');
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        setHistory([]);
      }
    }
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('quiz-progress-history');
    setHistory([]);
  };

  // Prepare data for chart
  const chartData = history.map((entry, i) => ({
    x: i,
    y: Math.round((entry.results.correctAnswers / entry.results.totalQuestions) * 100),
    date: formatDate(entry.timestamp),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Local Storage Alert */}
        <div className="mb-6">
          <div className="flex items-center bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-sm animate-fade-in">
            <svg className="w-5 h-5 text-yellow-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
            <span className="text-yellow-800 text-sm font-medium">
              Your progress is stored only in your browser. It is <strong>not backed up or synced online yet</strong>. Please do not clear your browser data if you wish to keep your progress.
            </span>
          </div>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Progress</h1>
          <p className="text-gray-600">Track your quiz performance over time</p>
        </div>

        {history.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Progress Yet</h3>
            <p className="text-gray-600">Complete quizzes and track your progress here!</p>
          </div>
        ) : (
          <>
            {/* Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Progress Chart</h2>
              <div className="w-full h-48 flex items-end">
                <svg width="100%" height="100%" viewBox="0 0 400 160" preserveAspectRatio="none">
                  {/* Axes */}
                  <line x1="30" y1="10" x2="30" y2="150" stroke="#ccc" strokeWidth="2" />
                  <line x1="30" y1="150" x2="390" y2="150" stroke="#ccc" strokeWidth="2" />
                  {/* Data */}
                  {chartData.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="3"
                      points={chartData.map((d, i) => `${30 + (i * 340 / (chartData.length - 1))},${150 - (d.y * 1.4)}`).join(' ')}
                    />
                  )}
                  {/* Dots */}
                  {chartData.map((d, i) => (
                    <circle
                      key={i}
                      cx={30 + (i * 340 / (chartData.length - 1 || 1))}
                      cy={150 - (d.y * 1.4)}
                      r="4"
                      fill="#6366f1"
                    />
                  ))}
                  {/* Y-axis labels */}
                  {[0, 25, 50, 75, 100].map((val) => (
                    <text key={val} x="0" y={150 - val * 1.4 + 5} fontSize="12" fill="#888">{val}%</text>
                  ))}
                </svg>
              </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quiz History</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead>
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Score</th>
                      <th className="px-4 py-2">Total</th>
                      <th className="px-4 py-2">Percent</th>
                      <th className="px-4 py-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice().reverse().map((entry, i) => {
                      const percent = Math.round((entry.results.correctAnswers / entry.results.totalQuestions) * 100);
                      return (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-4 py-2 whitespace-nowrap">{formatDate(entry.timestamp)}</td>
                          <td className="px-4 py-2">{entry.results.correctAnswers}</td>
                          <td className="px-4 py-2">{entry.results.totalQuestions}</td>
                          <td className="px-4 py-2">{percent}%</td>
                          <td className="px-4 py-2">{Math.round(entry.results.timeSpent)}s</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button
                onClick={clearHistory}
                className="mt-6 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Clear Progress History
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProgressPage; 