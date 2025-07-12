import React, { useState } from 'react';
import { FlagService } from '../../services/flagService';
import { useFlags } from '../../hooks/useFlags';

export const FlagTest: React.FC = () => {
  const [testQuestionId, setTestQuestionId] = useState<string>('');
  const [testUserId, setTestUserId] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const { flagQuestion, unflagQuestion, isQuestionFlagged } = useFlags();

  const testFlagQuestion = async () => {
    if (!testQuestionId || !testUserId) {
      setResult('Please enter both question ID and user ID');
      return;
    }

    try {
      const success = await flagQuestion(testQuestionId, 'test', 'Test flag from admin panel');
      setResult(success ? 'Question flagged successfully!' : 'Failed to flag question');
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    }
  };

  const testUnflagQuestion = async () => {
    if (!testQuestionId || !testUserId) {
      setResult('Please enter both question ID and user ID');
      return;
    }

    try {
      const success = await unflagQuestion(testQuestionId);
      setResult(success ? 'Question unflagged successfully!' : 'Failed to unflag question');
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    }
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
    <div className="p-6 bg-white rounded-lg border border-gray-200">
      <h2 className="text-xl font-bold mb-4">Flag Test Panel</h2>
      
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
            Test User ID:
          </label>
          <input
            type="text"
            value={testUserId}
            onChange={(e) => setTestUserId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter user ID to test"
          />
        </div>

        <div className="flex space-x-3">
          <button
            onClick={testFlagQuestion}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Test Flag
          </button>
          <button
            onClick={testUnflagQuestion}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Test Unflag
          </button>
          <button
            onClick={testGetFlaggedQuestions}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Flagged Questions
          </button>
        </div>

        {result && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">{result}</p>
          </div>
        )}
      </div>
    </div>
  );
}; 