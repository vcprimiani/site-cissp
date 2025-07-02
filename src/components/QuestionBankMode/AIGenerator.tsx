import React, { useState, useEffect } from 'react';
import { Question } from '../../types';
import { Brain, Wand2, Loader, CheckCircle, ArrowLeft, Zap, Target, Settings, RotateCcw, Plus, Sparkles } from 'lucide-react';
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

interface GenerationProgress {
  total: number;
  completed: number;
  failed: number;
  isGenerating: boolean;
  currentTopic: string;
}

export const AIGenerator: React.FC<AIGeneratorProps> = ({
  questions,
  currentUser,
  onAddQuestion,
  onNavigateToQuestionBank
}) => {
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [simpleTopic, setSimpleTopic] = useState('');
  const [advancedOptions, setAdvancedOptions] = useState<GenerationOptions>({
    domain: 'Security and Risk Management',
    difficulty: 'Medium',
    questionType: 'scenario-based',
    scenarioType: 'technical',
    topic: '',
    includeDistractors: true,
    focusArea: ''
  });
  const [bulkTopics, setBulkTopics] = useState<string[]>(['']);
  const [showBulkMode, setShowBulkMode] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    isGenerating: false,
    currentTopic: ''
  });
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [usageInfo, setUsageInfo] = useState(getAIUsageInfo());
  const [error, setError] = useState<string | null>(null);

  // Update usage info periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setUsageInfo(getAIUsageInfo());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
    { value: 'most-likely', label: 'Most Likely/Best Approach' },
    { value: 'least-likely', label: 'Least Likely/Inappropriate' },
    { value: 'best-practice', label: 'Best Practice' },
    { value: 'scenario-based', label: 'Scenario-Based' },
    { value: 'definition', label: 'Definition/Concept' },
    { value: 'comparison', label: 'Comparison/Analysis' }
  ];

  const scenarioTypes = [
    { value: 'technical', label: 'Technical Implementation' },
    { value: 'management', label: 'Management Decision' },
    { value: 'compliance', label: 'Compliance/Regulatory' },
    { value: 'incident-response', label: 'Incident Response' },
    { value: 'risk-assessment', label: 'Risk Assessment' }
  ];

  const addBulkTopic = () => {
    setBulkTopics([...bulkTopics, '']);
  };

  const updateBulkTopic = (index: number, value: string) => {
    const newTopics = [...bulkTopics];
    newTopics[index] = value;
    setBulkTopics(newTopics);
  };

  const removeBulkTopic = (index: number) => {
    if (bulkTopics.length > 1) {
      setBulkTopics(bulkTopics.filter((_, i) => i !== index));
    }
  };

  const generateSingleQuestion = async () => {
    setError(null);
    const topic = mode === 'simple' ? simpleTopic : advancedOptions.topic;
    
    if (!topic.trim()) {
      setError('Please enter a topic for question generation');
      return;
    }

    setProgress({
      total: 1,
      completed: 0,
      failed: 0,
      isGenerating: true,
      currentTopic: topic
    });

    try {
      const existingTerms = questions.flatMap(q => q.tags);
      const options = mode === 'advanced' ? advancedOptions : undefined;
      
      const result = await generateAIQuestion(topic, options, existingTerms, false);
      
      if (result.rateLimited) {
        setError(result.error || 'Rate limit exceeded');
        setProgress(prev => ({ ...prev, isGenerating: false, failed: 1 }));
        return;
      }
      
      if (result.error || !result.question) {
        setError(result.error || 'Failed to generate question');
        setProgress(prev => ({ ...prev, isGenerating: false, failed: 1 }));
        return;
      }

      const newQuestion: Omit<Question, 'id' | 'createdAt'> = {
        ...result.question,
        tags: [...result.question.tags, 'ai-generated'],
        createdBy: currentUser.id,
        isActive: true
      };

      const addedQuestion = await onAddQuestion(newQuestion);
      if (addedQuestion) {
        setGeneratedQuestions([addedQuestion]);
        setProgress(prev => ({ ...prev, completed: 1, isGenerating: false }));
        
        // Clear the topic input
        if (mode === 'simple') {
          setSimpleTopic('');
        } else {
          setAdvancedOptions(prev => ({ ...prev, topic: '' }));
        }
      } else {
        setError('Failed to save question to database');
        setProgress(prev => ({ ...prev, isGenerating: false, failed: 1 }));
      }
    } catch (error: any) {
      console.error('Error generating question:', error);
      setError(error.message || 'Failed to generate question');
      setProgress(prev => ({ ...prev, isGenerating: false, failed: 1 }));
    }
  };

  const generateBulkQuestions = async () => {
    setError(null);
    const validTopics = bulkTopics.filter(topic => topic.trim());
    
    if (validTopics.length === 0) {
      setError('Please enter at least one topic for bulk generation');
      return;
    }

    setProgress({
      total: validTopics.length,
      completed: 0,
      failed: 0,
      isGenerating: true,
      currentTopic: validTopics[0]
    });

    const newGeneratedQuestions: Question[] = [];
    startBulkGeneration();

    try {
      const existingTerms = questions.flatMap(q => q.tags);
      
      for (let i = 0; i < validTopics.length; i++) {
        const topic = validTopics[i];
        setProgress(prev => ({ ...prev, currentTopic: topic }));

        try {
          const options = mode === 'advanced' ? advancedOptions : undefined;
          const result = await generateAIQuestion(topic, options, existingTerms, true);
          
          if (result.rateLimited) {
            setError(`Rate limit exceeded at question ${i + 1}. Generated ${newGeneratedQuestions.length} questions.`);
            break;
          }
          
          if (result.error || !result.question) {
            setProgress(prev => ({ ...prev, failed: prev.failed + 1 }));
            continue;
          }

          const newQuestion: Omit<Question, 'id' | 'createdAt'> = {
            ...result.question,
            tags: [...result.question.tags, 'ai-generated'],
            createdBy: currentUser.id,
            isActive: true
          };

          const addedQuestion = await onAddQuestion(newQuestion);
          if (addedQuestion) {
            newGeneratedQuestions.push(addedQuestion);
            setProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
          } else {
            setProgress(prev => ({ ...prev, failed: prev.failed + 1 }));
          }
        } catch (error: any) {
          console.error(`Error generating question ${i + 1}:`, error);
          setProgress(prev => ({ ...prev, failed: prev.failed + 1 }));
        }
      }
    } finally {
      endBulkGeneration();
      setGeneratedQuestions(newGeneratedQuestions);
      setProgress(prev => ({ ...prev, isGenerating: false }));
      
      // Clear bulk topics
      setBulkTopics(['']);
    }
  };

  const resetGeneration = () => {
    setProgress({
      total: 0,
      completed: 0,
      failed: 0,
      isGenerating: false,
      currentTopic: ''
    });
    setGeneratedQuestions([]);
    setError(null);
  };

  const getProgressPercentage = () => {
    if (progress.total === 0) return 0;
    return ((progress.completed + progress.failed) / progress.total) * 100;
  };

  const isGenerationComplete = progress.total > 0 && !progress.isGenerating;

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

        {/* Usage Stats */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {usageInfo.minute.used}/{usageInfo.minute.limit}
              </div>
              <div className="text-sm text-gray-600">This Minute</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(usageInfo.minute.percentage, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {usageInfo.hourly.used}/{usageInfo.hourly.limit}
              </div>
              <div className="text-sm text-gray-600">This Hour</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(usageInfo.hourly.percentage, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {usageInfo.daily.used}/{usageInfo.daily.limit}
              </div>
              <div className="text-sm text-gray-600">Today</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(usageInfo.daily.percentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
          
          {usageInfo.nextRequestAllowed > 0 && (
            <div className="text-center mt-3">
              <p className="text-sm text-orange-600">
                Next request available in {formatTimeRemaining(usageInfo.nextRequestAllowed)}
              </p>
            </div>
          )}
        </div>

        {/* Mode Selection */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setMode('simple')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'simple'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Simple Mode
            </button>
            <button
              onClick={() => setMode('advanced')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'advanced'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Advanced Mode
            </button>
          </div>
          
          <button
            onClick={() => setShowBulkMode(!showBulkMode)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              showBulkMode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Bulk Generation</span>
          </button>
        </div>

        {/* Generation Progress */}
        {(progress.isGenerating || isGenerationComplete) && (
          <div className="bg-white border-2 border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {progress.isGenerating ? (
                  <div className="relative">
                    <Sparkles className="w-6 h-6 text-blue-600 animate-pulse" />
                    <div className="absolute inset-0 animate-spin">
                      <Loader className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {progress.isGenerating ? 'Generating Questions...' : 'Generation Complete!'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {progress.isGenerating 
                      ? `Working on: ${progress.currentTopic}`
                      : `Generated ${progress.completed} questions${progress.failed > 0 ? `, ${progress.failed} failed` : ''}`
                    }
                  </p>
                </div>
              </div>
              
              {isGenerationComplete && (
                <button
                  onClick={resetGeneration}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              )}
            </div>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{progress.completed + progress.failed}/{progress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    progress.isGenerating 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                      : 'bg-gradient-to-r from-green-500 to-blue-500'
                  }`}
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-green-600">{progress.completed}</div>
                <div className="text-xs text-gray-600">Generated</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">{progress.failed}</div>
                <div className="text-xs text-gray-600">Failed</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">{progress.total - progress.completed - progress.failed}</div>
                <div className="text-xs text-gray-600">Remaining</div>
              </div>
            </div>
            
            {/* Return to Question Bank Button */}
            {isGenerationComplete && progress.completed > 0 && (
              <div className="mt-6 text-center">
                <button
                  onClick={onNavigateToQuestionBank}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>View Generated Questions</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Generation Form */}
        {!progress.isGenerating && (
          <div className="space-y-6">
            {/* Simple Mode */}
            {mode === 'simple' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic or Concept
                </label>
                {showBulkMode ? (
                  <div className="space-y-3">
                    {bulkTopics.map((topic, index) => (
                      <div key={index} className="flex space-x-2">
                        <input
                          type="text"
                          value={topic}
                          onChange={(e) => updateBulkTopic(index, e.target.value)}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder={`Topic ${index + 1} (e.g., "Risk assessment frameworks")`}
                        />
                        {bulkTopics.length > 1 && (
                          <button
                            onClick={() => removeBulkTopic(index)}
                            className="px-3 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addBulkTopic}
                      className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Another Topic</span>
                    </button>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={simpleTopic}
                    onChange={(e) => setSimpleTopic(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Risk assessment frameworks, Network access control, Incident response procedures"
                  />
                )}
              </div>
            )}

            {/* Advanced Mode */}
            {mode === 'advanced' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
                  <select
                    value={advancedOptions.domain}
                    onChange={(e) => setAdvancedOptions(prev => ({ ...prev, domain: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {domains.map(domain => (
                      <option key={domain} value={domain}>{domain}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                  <select
                    value={advancedOptions.difficulty}
                    onChange={(e) => setAdvancedOptions(prev => ({ ...prev, difficulty: e.target.value as any }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
                  <select
                    value={advancedOptions.questionType}
                    onChange={(e) => setAdvancedOptions(prev => ({ ...prev, questionType: e.target.value as any }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {questionTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Scenario Type</label>
                  <select
                    value={advancedOptions.scenarioType}
                    onChange={(e) => setAdvancedOptions(prev => ({ ...prev, scenarioType: e.target.value as any }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {scenarioTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic or Concept
                  </label>
                  {showBulkMode ? (
                    <div className="space-y-3">
                      {bulkTopics.map((topic, index) => (
                        <div key={index} className="flex space-x-2">
                          <input
                            type="text"
                            value={topic}
                            onChange={(e) => updateBulkTopic(index, e.target.value)}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder={`Topic ${index + 1}`}
                          />
                          {bulkTopics.length > 1 && (
                            <button
                              onClick={() => removeBulkTopic(index)}
                              className="px-3 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={addBulkTopic}
                        className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Another Topic</span>
                      </button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={advancedOptions.topic}
                      onChange={(e) => setAdvancedOptions(prev => ({ ...prev, topic: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Specific topic or concept to focus on"
                    />
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Focus Area (Optional)
                  </label>
                  <input
                    type="text"
                    value={advancedOptions.focusArea}
                    onChange={(e) => setAdvancedOptions(prev => ({ ...prev, focusArea: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Implementation details, Policy considerations, Technical controls"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={advancedOptions.includeDistractors}
                      onChange={(e) => setAdvancedOptions(prev => ({ ...prev, includeDistractors: e.target.checked }))}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Include strong distractors (plausible wrong answers)
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <div className="flex justify-center">
              <button
                onClick={showBulkMode ? generateBulkQuestions : generateSingleQuestion}
                disabled={usageInfo.nextRequestAllowed > 0}
                className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg"
              >
                <Wand2 className="w-5 h-5" />
                <span>
                  {showBulkMode 
                    ? `Generate ${bulkTopics.filter(t => t.trim()).length} Questions`
                    : 'Generate Question'
                  }
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 sm:p-6 border border-purple-200">
        <h3 className="font-medium text-purple-900 mb-3">💡 Generation Tips</h3>
        <ul className="text-purple-800 text-sm space-y-2">
          <li>• <strong>Be Specific:</strong> "NAC quarantine procedures" works better than just "NAC"</li>
          <li>• <strong>Use Real Scenarios:</strong> "Incident response for data breach" creates practical questions</li>
          <li>• <strong>Mix Difficulties:</strong> Generate Easy questions for concepts, Hard for complex scenarios</li>
          <li>• <strong>Bulk Generation:</strong> Perfect for creating comprehensive question sets on related topics</li>
          <li>• <strong>Advanced Mode:</strong> Fine-tune question types and scenarios for targeted practice</li>
          <li>• Questions are automatically tagged as "ai-generated" and saved to your question bank</li>
        </ul>
      </div>
    </div>
  );
};