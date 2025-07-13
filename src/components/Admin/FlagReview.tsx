import React, { useState, useEffect } from 'react';
import { FlagService } from '../../services/flagService';
import { Question, FlagHistory } from '../../types';
import { Eye, EyeOff, Check, X, AlertTriangle, Clock, Users, RefreshCw, Filter, Search, Trash2, Shield, CheckCircle, XCircle } from 'lucide-react';
import { QuestionCard } from '../UI/QuestionCard';
import { useToast } from '../UI/Toast';
import { useAuth } from '../../hooks/useAuth';

interface FlagReviewProps {
  hasActiveSubscription: boolean;
  subscriptionLoading: boolean;
}

export const FlagReview: React.FC<FlagReviewProps> = ({
  hasActiveSubscription,
  subscriptionLoading
}) => {
  const { user } = useAuth();
  const [flaggedQuestions, setFlaggedQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [flagHistory, setFlagHistory] = useState<FlagHistory[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'dismissed' | 'actioned'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  const { showSuccess, showError, showInfo } = useToast();

  // Fetch flagged questions
  const fetchFlaggedQuestions = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await FlagService.getFlaggedQuestions();
      
      // Transform data to Question type
      const transformedQuestions: Question[] = data.map((item: any) => ({
        id: item.id,
        domain: item.domain,
        difficulty: item.difficulty,
        question: item.question,
        options: item.options,
        correctAnswer: item.correct_answer,
        explanation: item.explanation,
        tags: item.tags || [],
        createdBy: item.created_by,
        isActive: item.is_active,
        createdAt: new Date(item.created_at),
        flagCount: item.flag_count || 0,
        flaggedBy: item.flagged_by || [],
        flagReasons: item.flag_reasons || [],
        isFlagged: item.is_flagged || false,
        flaggedAt: item.flagged_at ? new Date(item.flagged_at) : undefined,
        flagStatus: item.flag_status || 'pending'
      }));

      setFlaggedQuestions(transformedQuestions);
      if (isRefresh) {
        showSuccess('Refreshed', 'Flagged questions updated');
      }
    } catch (err: any) {
      console.error('Error fetching flagged questions:', err);
      const errorMessage = err.message || 'Failed to fetch flagged questions';
      setError(errorMessage);
      showError('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch flag history for a question
  const fetchFlagHistory = async (questionId: string) => {
    try {
      const history = await FlagService.getFlagHistory(questionId);
      setFlagHistory(history);
    } catch (err: any) {
      console.error('Error fetching flag history:', err);
      showError('Error', 'Failed to load flag history');
    }
  };

  // Handle status update
  const handleStatusUpdate = async (questionId: string, status: 'pending' | 'reviewed' | 'dismissed' | 'actioned') => {
    if (!user) {
      showError('Error', 'You must be logged in as an admin to perform this action.');
      return;
    }
    try {
      setActionLoading(questionId);
      
      await FlagService.updateFlagStatus({
        questionId,
        status,
        adminUserId: user.id // Use real authenticated user id
      });

      // Update local state
      setFlaggedQuestions(prev => 
        prev.map(q => 
          q.id === questionId 
            ? { ...q, flagStatus: status }
            : q
        )
      );

      // Update selected question if it's the one being updated
      if (selectedQuestion?.id === questionId) {
        setSelectedQuestion(prev => prev ? { ...prev, flagStatus: status } : null);
      }

      const statusMessages = {
        'dismissed': 'Flags dismissed',
        'actioned': 'Action taken on question',
        'reviewed': 'Question marked as reviewed',
        'pending': 'Question marked as pending'
      };

      showSuccess('Status Updated', statusMessages[status]);
      
      // Refresh the list after a short delay
      setTimeout(() => {
        fetchFlaggedQuestions(true);
      }, 1000);
    } catch (err: any) {
      console.error('Error updating flag status:', err);
      const errorMessage = err.message || 'Failed to update status';
      showError('Error', errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle question deletion
  const handleDeleteQuestion = async (questionId: string) => {
    if (!user) {
      showError('Error', 'You must be logged in as an admin to perform this action.');
      return;
    }
    try {
      setActionLoading(questionId);
      
      // Call the delete method from FlagService
      await FlagService.deleteQuestion({
        questionId,
        adminUserId: user.id // Use real authenticated user id
      });

      // Remove from local state
      setFlaggedQuestions(prev => prev.filter(q => q.id !== questionId));
      
      // Close modal if it was the selected question
      if (selectedQuestion?.id === questionId) {
        setSelectedQuestion(null);
      }

      showSuccess('Question Deleted', 'Question has been permanently removed from the database');
      setDeleteConfirm(null);
    } catch (err: any) {
      console.error('Error deleting question:', err);
      const errorMessage = err.message || 'Failed to delete question';
      showError('Error', errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle question selection
  const handleQuestionSelect = async (question: Question) => {
    setSelectedQuestion(question);
    await fetchFlagHistory(question.id);
  };

  // Filter and search questions
  const filteredQuestions = flaggedQuestions.filter(q => {
    // Apply status filter
    if (filter !== 'all' && q.flagStatus !== filter) {
      return false;
    }
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        q.question.toLowerCase().includes(searchLower) ||
        q.domain.toLowerCase().includes(searchLower) ||
        q.difficulty.toLowerCase().includes(searchLower) ||
        q.flagReasons.some(reason => reason.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  // Get status counts
  const getStatusCount = (status: string) => {
    return flaggedQuestions.filter(q => q.flagStatus === status).length;
  };

  // Load flagged questions on mount
  useEffect(() => {
    fetchFlaggedQuestions();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="text-gray-600">Loading flagged questions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Flagged Questions</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => fetchFlaggedQuestions()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Flag Review</h2>
          <p className="text-gray-600">
            Review and manage flagged questions ({filteredQuestions.length} of {flaggedQuestions.length} questions)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchFlaggedQuestions(true)}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search questions, domains, or flag reasons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { value: 'all', label: 'All', count: flaggedQuestions.length, icon: Filter },
            { value: 'pending', label: 'Pending', count: getStatusCount('pending'), icon: Clock },
            { value: 'reviewed', label: 'Reviewed', count: getStatusCount('reviewed'), icon: CheckCircle },
            { value: 'dismissed', label: 'Dismissed', count: getStatusCount('dismissed'), icon: XCircle },
            { value: 'actioned', label: 'Actioned', count: getStatusCount('actioned'), icon: Shield }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value as any)}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  filter === tab.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{tab.label}</span>
                <span className="text-xs">({tab.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Flagged</p>
              <p className="text-2xl font-bold text-gray-900">{flaggedQuestions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">{getStatusCount('pending')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Actioned</p>
              <p className="text-2xl font-bold text-gray-900">{getStatusCount('actioned')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Flags/Question</p>
              <p className="text-2xl font-bold text-gray-900">
                {flaggedQuestions.length > 0 
                  ? Math.round(flaggedQuestions.reduce((sum, q) => sum + q.flagCount, 0) / flaggedQuestions.length * 10) / 10
                  : 0
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <EyeOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Flagged Questions</h3>
            <p className="text-gray-600">
              {searchTerm 
                ? `No questions match "${searchTerm}"`
                : filter === 'all' 
                  ? 'No questions have been flagged yet.'
                  : `No questions with status "${filter}".`
              }
            </p>
          </div>
        ) : (
          filteredQuestions.map(question => (
            <div key={question.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                      {question.flagCount} flags
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      question.flagStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      question.flagStatus === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                      question.flagStatus === 'dismissed' ? 'bg-gray-100 text-gray-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {question.flagStatus}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    {question.question.length > 100 
                      ? `${question.question.substring(0, 100)}...` 
                      : question.question
                    }
                  </h3>
                  <p className="text-sm text-gray-600">
                    {question.domain} • {question.difficulty} • Flagged {question.flaggedAt?.toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleQuestionSelect(question)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    Review
                  </button>
                  {question.flagStatus === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(question.id, 'dismissed')}
                        disabled={actionLoading === question.id}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === question.id ? '...' : 'Dismiss'}
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(question.id, 'actioned')}
                        disabled={actionLoading === question.id}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === question.id ? '...' : 'Take Action'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Flag Reasons */}
              {question.flagReasons.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-600 mb-1">Flag reasons:</p>
                  <div className="flex flex-wrap gap-1">
                    {question.flagReasons.slice(0, 3).map((reason, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded border border-red-200"
                      >
                        {reason}
                      </span>
                    ))}
                    {question.flagReasons.length > 3 && (
                      <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded border border-gray-200">
                        +{question.flagReasons.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Delete Button for Actioned Questions */}
              {question.flagStatus === 'actioned' && (
                <div className="absolute bottom-3 right-3">
                  {deleteConfirm === question.id ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        disabled={actionLoading === question.id}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === question.id ? 'Deleting...' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(question.id)}
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete from DB</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Selected Question Modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Review Flagged Question</h3>
                <button
                  onClick={() => setSelectedQuestion(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Question Card */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Question Details</h4>
                  <QuestionCard
                    question={selectedQuestion}
                    isExpanded={true}
                    showActions={false}
                    hasActiveSubscription={true} // Always show answers for admin review
                    subscriptionLoading={false}
                  />
                </div>

                {/* Flag History and Actions */}
                <div className="space-y-6">
                  {/* Flag History */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Flag History</h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {flagHistory.length === 0 ? (
                        <p className="text-gray-500 text-sm">No flag history available</p>
                      ) : (
                        flagHistory.map((entry) => (
                          <div key={entry.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                entry.action === 'flag' ? 'bg-red-100 text-red-800' :
                                entry.action === 'unflag' ? 'bg-green-100 text-green-800' :
                                entry.action === 'review' ? 'bg-blue-100 text-blue-800' :
                                entry.action === 'dismiss' ? 'bg-gray-100 text-gray-800' :
                                'bg-orange-100 text-orange-800'
                              }`}>
                                {entry.action}
                              </span>
                              <span className="text-xs text-gray-500">
                                {entry.createdAt.toLocaleDateString()}
                              </span>
                            </div>
                            {entry.reason && (
                              <p className="text-sm text-gray-700">{entry.reason}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Actions</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleStatusUpdate(selectedQuestion.id, 'dismissed')}
                        disabled={actionLoading === selectedQuestion.id}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                      >
                        {actionLoading === selectedQuestion.id ? 'Processing...' : 'Dismiss Flags'}
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(selectedQuestion.id, 'actioned')}
                        disabled={actionLoading === selectedQuestion.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                      >
                        {actionLoading === selectedQuestion.id ? 'Processing...' : 'Take Action'}
                      </button>
                    </div>
                    
                    {selectedQuestion.flagStatus === 'pending' && (
                      <button
                        onClick={() => handleStatusUpdate(selectedQuestion.id, 'reviewed')}
                        disabled={actionLoading === selectedQuestion.id}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                      >
                        {actionLoading === selectedQuestion.id ? 'Processing...' : 'Mark as Reviewed'}
                      </button>
                    )}

                    {/* Delete Button for Actioned Questions in Modal */}
                    {selectedQuestion.flagStatus === 'actioned' && (
                      <div className="border-t pt-4">
                        <h5 className="font-medium text-red-700 mb-2">Danger Zone</h5>
                        {deleteConfirm === selectedQuestion.id ? (
                          <div className="space-y-2">
                            <p className="text-sm text-red-600">Are you sure you want to permanently delete this question?</p>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleDeleteQuestion(selectedQuestion.id)}
                                disabled={actionLoading === selectedQuestion.id}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                              >
                                {actionLoading === selectedQuestion.id ? 'Deleting...' : 'Yes, Delete'}
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(selectedQuestion.id)}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete from Database</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 