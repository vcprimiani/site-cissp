import React, { useState } from 'react';
import { Question } from '../../types';
import { Brain, Wand2, Plus, Loader, AlertCircle, CheckCircle, Target, Play } from 'lucide-react';
import { generateAIQuestion, getAIUsageInfo, startBulkGeneration, endBulkGeneration } from '../../services/openai';
import { formatTimeRemaining } from '../../services/aiSecurity';

interface AIGeneratorProps {
  questions: Question[];
  currentUser: any;
  onAddQuestion: (question: Omit<Question, 'id' | 'createdAt'>) => Promise<Question | null>;
  onNavigateToQuestionBank: () => void;
}

interface GenerationOptions {
  domain: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionType: 'most-likely' | 'least-likely' | 'best-practice' | 'scenario-based' | 'definition' | 'comparison';
  scenarioType: 'technical' | 'management' | 'compliance' | 'incident-response' | 'risk-assessment';
  topic: string;
  includeDistractors: boolean;
  focusArea: string;
}

export const AIGenerator: React.FC<AIGeneratorProps> = ({
  questions,
  currentUser,
  onAddQuestion,
  onNavigateToQuestionBank
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [bulkResults, setBulkResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [quickTopic, setQuickTopic] = useState('');
  const [options, setOptions] = useState<GenerationOptions>({
    domain: 'Security and Risk Management',
    difficulty: 'Medium',
    questionType: 'scenario-based',
    scenarioType: 'technical',
    topic: '',
    includeDistractors: true,
    focusArea: ''
  });

  const domains = [
    'Security and Risk Management',
    'Asset Security',
    'Security Architecture and Engineering',
    'Communication and Network Security',
    'Identity and Access Management (IAM)',
    'Security Assessment and Testing',
    'Security Operations',
    'Software Development Security'
  ];

  const questionTypes = [
    { value: 'most-likely', label: 'Most Likely/Best Approach', description: 'Questions asking for the most appropriate solution' },
    { value: 'least-likely', label: 'Least Likely/Inappropriate', description: 'Questions asking to identify incorrect approaches' },
    { value: 'best-practice', label: 'Best Practice', description: 'Questions about industry best practices' },
    { value: 'scenario-based', label: 'Scenario-Based', description: 'Detailed scenarios requiring analysis' },
    { value: 'definition', label: 'Definition/Concept', description: 'Questions testing knowledge of terms and concepts' },
    { value: 'comparison', label: 'Comparison', description: 'Questions comparing different approaches or models' }
  ];

  const scenarioTypes = [
    { value: 'technical', label: 'Technical Implementation', description: 'Focus on technical details and implementation' },
    { value: 'management', label: 'Management Decision', description: 'Focus on management and strategic decisions' },
    { value: 'compliance', label: 'Compliance/Legal', description: 'Focus on regulatory and legal requirements' },
    { value: 'incident-response', label: 'Incident Response', description: 'Focus on security incident handling' },
    { value: 'risk-assessment', label: 'Risk Assessment', description: 'Focus on risk analysis and mitigation' }
  ];

  const usageInfo = getAIUsageInfo();

  const generateSingleQuestion = async (topic: string, useAdvanced: boolean = false) => {
    setIsGenerating(true);
    setError(null);

    try {
      const existingTerms = questions.map(q => q.tags).flat();
      const result = await generateAIQuestion(
        topic,
        useAdvanced ? options : undefined,
        existingTerms
      );

      if (result.rateLimited) {
        setError(`Rate limited: ${result.error}. Please wait ${formatTimeRemaining(result.waitTime || 0)}.`);
        return;
      }

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.question) {
        const newQuestion: Omit<Question, 'id' | 'createdAt'> = {
          ...result.question,
          createdBy: currentUser.id,
          isActive: true,
          tags: [...result.question.tags, 'ai-generated']
        };

        const addedQuestion = await onAddQuestion(newQuestion);
        if (addedQuestion) {
          setGeneratedQuestions(prev => [addedQuestion, ...prev]);
          setQuickTopic('');
          if (useAdvanced) {
            setOptions(prev => ({ ...prev, topic: '' }));
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate question');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateBulkQuestions = async (count: number, topics: string[]) => {
    setIsBulkGenerating(true);
    setError(null);
    setBulkProgress({ current: 0, total: count });
    setBulkResults({ success: 0, failed: 0 });

    startBulkGeneration();

    try {
      const existingTerms = questions.map(q => q.tags).flat();
      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < count; i++) {
        setBulkProgress({ current: i + 1, total: count });
        
        const topic = topics[i % topics.length];
        
        try {
          const result = await generateAIQuestion(
            topic,
            undefined,
            existingTerms,
            true // isBulkRequest
          );

          if (result.rateLimited) {
            setError(`Rate limited during bulk generation: ${result.error}`);
            break;
          }

          if (result.error) {
            failedCount++;
            setBulkResults({ success: successCount, failed: failedCount });
            continue;
          }

          if (result.question) {
            const newQuestion: Omit<Question, 'id' | 'createdAt'> = {
              ...result.question,
              createdBy: currentUser.id,
              isActive: true,
              tags: [...result.question.tags, 'ai-generated', 'bulk-generated']
            };

            const addedQuestion = await onAddQuestion(newQuestion);
            if (addedQuestion) {
              setGeneratedQuestions(prev => [addedQuestion, ...prev]);
              successCount++;
              setBulkResults({ success: successCount, failed: failedCount });
            } else {
              failedCount++;
              setBulkResults({ success: successCount, failed: failedCount });
            }
          }
        } catch (err) {
          failedCount++;
          setBulkResults({ success: successCount, failed: failedCount });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate bulk questions');
    } finally {
      endBulkGeneration();
      setIsBulkGenerating(false);
    }
  };

  const generate8HardQuestions = async () => {
    const hardTopics = [
      'Advanced cryptographic protocols and key management in enterprise environments',
      'Complex incident response scenarios involving APT groups and forensic analysis',
      'Multi-layered network security architecture with zero-trust implementation',
      'Risk assessment frameworks for cloud-native applications and microservices',
      'Identity federation and advanced access control in hybrid environments',
      'Security testing methodologies for DevSecOps and CI/CD pipelines',
      'Business continuity planning for critical infrastructure and supply chain attacks',
      'Secure software development lifecycle with threat modeling and code analysis'
    ];

    await generateBulkQuestions(8, hardTopics);
  };

  const startQuizWithGeneratedQuestions = () => {
    if (generatedQuestions.length === 0) return;
    
    // Create a custom event to start quiz with specific questions
    const event = new CustomEvent('startQuizWithQuestions', {
      detail: { questions: generatedQuestions }
    });
    window.dispatchEvent(event);
    
    // Navigate to quiz mode
    window.location.hash = '#quiz';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">AI Question Generator</h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Generate high-quality CISSP practice questions using advanced AI
            </p>
          </div>
        </div>

        {/* Usage Information */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {usageInfo.daily.used}/{usageInfo.daily.limit}
              </div>
              <div className="text-sm text-gray-600">Daily Requests</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(usageInfo.daily.percentage, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {usageInfo.hourly.used}/{usageInfo.hourly.limit}
              </div>
              <div className="text-sm text-gray-600">Hourly Requests</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(usageInfo.hourly.percentage, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {usageInfo.minute.used}/{usageInfo.minute.limit}
              </div>
              <div className="text-sm text-gray-600">Per Minute</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(usageInfo.minute.percentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
          
          {usageInfo.nextRequestAllowed > 0 && (
            <div className="mt-3 text-center">
              <p className="text-sm text-gray-600">
                Next request available in: <span className="font-medium text-purple-600">
                  {Math.ceil(usageInfo.nextRequestAllowed / 1000)}s
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Generate 8 Hard Questions */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center space-x-2 mb-3">
              <Target className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-900">Exam Prep Challenge</h3>
            </div>
            <p className="text-sm text-red-800 mb-4">
              Generate 8 hard questions covering all CISSP domains and start an immediate quiz
            </p>
            <button
              onClick={generate8HardQuestions}
              disabled={isBulkGenerating || isGenerating}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isBulkGenerating ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Generating... ({bulkProgress.current}/{bulkProgress.total})</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generate 8 Hard Questions</span>
                </>
              )}
            </button>
            
            {/* Start Quiz Button */}
            {generatedQuestions.length >= 8 && !isBulkGenerating && (
              <button
                onClick={startQuizWithGeneratedQuestions}
                className="w-full mt-3 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 font-medium"
              >
                <Play className="w-4 h-4" />
                <span>Start Quiz with Generated Questions</span>
              </button>
            )}
          </div>

          {/* Quick Generation */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-2 mb-3">
              <Wand2 className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Quick Generation</h3>
            </div>
            <p className="text-sm text-blue-800 mb-4">
              Generate a single question on any CISSP topic
            </p>
            <div className="space-y-3">
              <input
                type="text"
                value={quickTopic}
                onChange={(e) => setQuickTopic(e.target.value)}
                placeholder="e.g., Network Access Control, Risk Assessment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                onClick={() => generateSingleQuestion(quickTopic)}
                disabled={!quickTopic.trim() || isGenerating || isBulkGenerating}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isGenerating ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Generate Question</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Generation Progress */}
        {isBulkGenerating && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <Loader className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="font-medium text-blue-900">Generating Questions...</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-3 mb-2">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-blue-800">
              <span>Progress: {bulkProgress.current}/{bulkProgress.total}</span>
              <span>Success: {bulkResults.success} | Failed: {bulkResults.failed}</span>
            </div>
          </div>
        )}

        {/* Advanced Options Toggle */}
        <div className="border-t border-gray-200 pt-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span className="text-sm font-medium">Advanced Options</span>
            <div className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
              ▼
            </div>
          </button>
        </div>
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Generation Options</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
                <select
                  value={options.domain}
                  onChange={(e) => setOptions(prev => ({ ...prev, domain: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                >
                  {domains.map(domain => (
                    <option key={domain} value={domain}>{domain}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                <select
                  value={options.difficulty}
                  onChange={(e) => setOptions(prev => ({ ...prev, difficulty: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
                <select
                  value={options.questionType}
                  onChange={(e) => setOptions(prev => ({ ...prev, questionType: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                >
                  {questionTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-600 mt-1">
                  {questionTypes.find(t => t.value === options.questionType)?.description}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scenario Type</label>
                <select
                  value={options.scenarioType}
                  onChange={(e) => setOptions(prev => ({ ...prev, scenarioType: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                >
                  {scenarioTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-600 mt-1">
                  {scenarioTypes.find(t => t.value === options.scenarioType)?.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Topic/Concept</label>
                <input
                  type="text"
                  value={options.topic}
                  onChange={(e) => setOptions(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder="e.g., Zero Trust Architecture, SIEM Implementation..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Focus Area (Optional)</label>
                <input
                  type="text"
                  value={options.focusArea}
                  onChange={(e) => setOptions(prev => ({ ...prev, focusArea: e.target.value }))}
                  placeholder="e.g., Implementation challenges, Cost considerations..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeDistractors"
                  checked={options.includeDistractors}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeDistractors: e.target.checked }))}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="includeDistractors" className="text-sm text-gray-700">
                  Include strong distractors (plausible wrong answers)
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => generateSingleQuestion(options.topic, true)}
              disabled={!options.topic.trim() || isGenerating || isBulkGenerating}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isGenerating ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Generating Advanced Question...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generate Advanced Question</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="font-medium text-red-900">Generation Error</span>
          </div>
          <p className="text-red-800 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Recently Generated Questions */}
      {generatedQuestions.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Recently Generated Questions ({generatedQuestions.length})
            </h3>
            <div className="flex space-x-2">
              {generatedQuestions.length >= 8 && (
                <button
                  onClick={startQuizWithGeneratedQuestions}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 font-medium"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Quiz</span>
                </button>
              )}
              <button
                onClick={onNavigateToQuestionBank}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <span>View All Questions</span>
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            {generatedQuestions.slice(0, 5).map((question, index) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">
                      Question {generatedQuestions.length - index}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {question.domain}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      question.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                      question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {question.difficulty}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{question.question}</p>
              </div>
            ))}
            
            {generatedQuestions.length > 5 && (
              <div className="text-center">
                <button
                  onClick={onNavigateToQuestionBank}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View all {generatedQuestions.length} generated questions →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 sm:p-6 border border-purple-200">
        <h3 className="font-medium text-purple-900 mb-3">💡 AI Generation Tips</h3>
        <ul className="text-purple-800 text-sm space-y-2">
          <li>• <strong>Exam Prep Challenge:</strong> Generate 8 hard questions covering all domains for comprehensive practice</li>
          <li>• <strong>Quick Generation:</strong> Perfect for exploring specific topics or concepts you're studying</li>
          <li>• <strong>Advanced Options:</strong> Fine-tune question type, scenario focus, and difficulty for targeted practice</li>
          <li>• <strong>Rate Limits:</strong> Designed to provide smooth experience while managing AI costs</li>
          <li>• <strong>Quality Focus:</strong> AI generates exam-realistic questions with detailed explanations</li>
          <li>• <strong>Auto-Quiz:</strong> Generated questions can immediately start a quiz for instant practice</li>
        </ul>
      </div>
    </div>
  );
};