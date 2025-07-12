import React, { useState } from 'react';
import { useFlags } from '../../hooks/useFlags';
import { FlagService } from '../../services/flagService';

export const FlagDebug: React.FC = () => {
  const [testQuestionId, setTestQuestionId] = useState<string>('');
  const [testReason, setTestReason] = useState<string>('test');
  const [result, setResult] = useState<string>('');
  const { flagQuestion, unflagQuestion, isQuestionFlagged, loading, error } = useFlags();

  const testFlag = async () => {
    if (!testQuestionId) {
      setResult('Please enter a question ID');
      return;
    }

    try {
      const success = await flagQuestion(testQuestionId, testReason, 'Debug test flag');
      setResult(success ? 'Question flagged successfully!' : 'Failed to flag question');
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    }
  };

  const testUnflag = async () => {
    if (!testQuestionId) {
      setResult('Please enter a question ID');
      return;
    }

    try {
      const success = await unflagQuestion(testQuestionId);
      setResult(success ? 'Question unflagged successfully!' : 'Failed to unflag question');
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    }
  };

  const testCheckFlag = () => {
    if (!testQuestionId) {
      setResult('Please enter a question ID');
      return;
    }

    const flagged = isQuestionFlagged(testQuestionId);
    setResult(`Question ${testQuestionId} is ${flagged ? 'flagged' : 'not flagged'}`);
  };

  const testGetFlaggedQuestions = async () => {
    try {
      const questions = await FlagService.getFlaggedQuestions();
      setResult(`Found ${questions.length} flagged questions`);
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200 max-w-md">
      <h2 className="text-xl font-bold mb-4">Flag Debug Panel</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Question ID:
          </label>
          <input
            type="text"
            value={testQuestionId}
            onChange={(e) => setTestQuestionId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter question ID to test"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Reason:
          </label>
          <input
            type="text"
            value={testReason}
            onChange={(e) => setTestReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter flag reason"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={testFlag}
            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Test Flag
          </button>
          <button
            onClick={testUnflag}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            Test Unflag
          </button>
          <button
            onClick={testCheckFlag}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Check Flag
          </button>
          <button
            onClick={testGetFlaggedQuestions}
            className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            Get Flagged
          </button>
        </div>

        {loading && (
          <div className="p-2 bg-blue-50 text-blue-700 rounded text-sm">
            Loading...
          </div>
        )}

        {error && (
          <div className="p-2 bg-red-50 text-red-700 rounded text-sm">
            Error: {error}
          </div>
        )}

        {result && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">{result}</p>
          </div>
        )}
      </div>
    </div>
  );
}; 