import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit3, Trash2, Lock, Unlock, Search, Filter, Star, Calendar, Tag } from 'lucide-react';
import { Question, QuestionList, User } from '../../types';

interface QuestionListManagerProps {
  currentUser: User;
  questions: Question[];
}

export const QuestionListManager: React.FC<QuestionListManagerProps> = ({ currentUser, questions }) => {
  const [questionLists, setQuestionLists] = useState<QuestionList[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingList, setEditingList] = useState<QuestionList | null>(null);
  const [selectedList, setSelectedList] = useState<QuestionList | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPrivate, setFilterPrivate] = useState<'all' | 'private' | 'public'>('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: true,
    tags: '',
    color: '#3B82F6'
  });

  // Load question lists from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`question-lists-${currentUser.id}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const listsWithDates = parsed.map((list: any) => ({
          ...list,
          createdAt: new Date(list.createdAt),
          updatedAt: new Date(list.updatedAt)
        }));
        setQuestionLists(listsWithDates);
      } catch (error) {
        console.error('Error loading question lists:', error);
      }
    }
  }, [currentUser.id]);

  // Save question lists to localStorage
  const saveQuestionLists = (lists: QuestionList[]) => {
    localStorage.setItem(`question-lists-${currentUser.id}`, JSON.stringify(lists));
    setQuestionLists(lists);
  };

  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280'  // Gray
  ];

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newList: QuestionList = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      questionIds: [],
      isPrivate: formData.isPrivate,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      color: formData.color
    };

    saveQuestionLists([...questionLists, newList]);
    setShowCreateForm(false);
    setFormData({
      name: '',
      description: '',
      isPrivate: true,
      tags: '',
      color: '#3B82F6'
    });
  };

  const handleEditList = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingList) return;

    const updatedList: QuestionList = {
      ...editingList,
      name: formData.name,
      description: formData.description,
      isPrivate: formData.isPrivate,
      updatedAt: new Date(),
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      color: formData.color
    };

    const updatedLists = questionLists.map(list => 
      list.id === editingList.id ? updatedList : list
    );
    
    saveQuestionLists(updatedLists);
    setEditingList(null);
    setFormData({
      name: '',
      description: '',
      isPrivate: true,
      tags: '',
      color: '#3B82F6'
    });
  };

  const handleDeleteList = (listId: string) => {
    if (confirm('Are you sure you want to delete this list? This action cannot be undone.')) {
      const updatedLists = questionLists.filter(list => list.id !== listId);
      saveQuestionLists(updatedLists);
      if (selectedList?.id === listId) {
        setSelectedList(null);
      }
    }
  };

  const startEditing = (list: QuestionList) => {
    setEditingList(list);
    setFormData({
      name: list.name,
      description: list.description || '',
      isPrivate: list.isPrivate,
      tags: list.tags.join(', '),
      color: list.color || '#3B82F6'
    });
  };

  const addQuestionToList = (listId: string, questionId: string) => {
    const updatedLists = questionLists.map(list => {
      if (list.id === listId && !list.questionIds.includes(questionId)) {
        return {
          ...list,
          questionIds: [...list.questionIds, questionId],
          updatedAt: new Date()
        };
      }
      return list;
    });
    saveQuestionLists(updatedLists);
  };

  const removeQuestionFromList = (listId: string, questionId: string) => {
    const updatedLists = questionLists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          questionIds: list.questionIds.filter(id => id !== questionId),
          updatedAt: new Date()
        };
      }
      return list;
    });
    saveQuestionLists(updatedLists);
  };

  const filteredLists = questionLists.filter(list => {
    const matchesSearch = list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         list.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         list.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPrivacy = filterPrivate === 'all' || 
                          (filterPrivate === 'private' && list.isPrivate) ||
                          (filterPrivate === 'public' && !list.isPrivate);
    
    return matchesSearch && matchesPrivacy;
  });

  const getListQuestions = (list: QuestionList) => {
    return questions.filter(q => list.questionIds.includes(q.id));
  };

  if (selectedList) {
    const listQuestions = getListQuestions(selectedList);
    
    return (
      <div className="space-y-6">
        {/* List Header */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setSelectedList(null)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span>←</span>
              <span>Back to Lists</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => startEditing(selectedList)}
                className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDeleteList(selectedList.id)}
                className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 mb-4">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: selectedList.color }}
            />
            <h2 className="text-2xl font-bold text-gray-900">{selectedList.name}</h2>
            {selectedList.isPrivate ? (
              <Lock className="w-5 h-5 text-gray-500" />
            ) : (
              <Unlock className="w-5 h-5 text-gray-500" />
            )}
          </div>
          
          {selectedList.description && (
            <p className="text-gray-600 mb-4">{selectedList.description}</p>
          )}
          
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedList.tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{listQuestions.length}</div>
                <div className="text-sm text-gray-600">Questions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {listQuestions.filter(q => q.difficulty === 'Easy').length}
                </div>
                <div className="text-sm text-gray-600">Easy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {listQuestions.filter(q => q.difficulty === 'Medium').length}
                </div>
                <div className="text-sm text-gray-600">Medium</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {listQuestions.filter(q => q.difficulty === 'Hard').length}
                </div>
                <div className="text-sm text-gray-600">Hard</div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Questions Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Questions to List</h3>
          
          <div className="space-y-4">
            {questions
              .filter(q => !selectedList.questionIds.includes(q.id))
              .slice(0, 10)
              .map(question => (
                <div key={question.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-1 line-clamp-2">{question.question}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {question.domain}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        question.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                        question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {question.difficulty}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => addQuestionToList(selectedList.id, question.id)}
                    className="ml-4 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* List Questions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions in List</h3>
          
          {listQuestions.length > 0 ? (
            <div className="space-y-4">
              {listQuestions.map(question => (
                <div key={question.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-1 line-clamp-2">{question.question}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {question.domain}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        question.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                        question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {question.difficulty}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeQuestionFromList(selectedList.id, question.id)}
                    className="ml-4 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Questions Yet</h4>
              <p className="text-gray-600">Add questions to this list to start studying.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Question Lists</h2>
              <p className="text-sm text-gray-600">Create and manage private question collections</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#F8D380] text-gray-900 rounded-lg hover:bg-[#F6C95C] transition-all duration-200 font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Create List</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search lists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          
          <select
            value={filterPrivate}
            onChange={(e) => setFilterPrivate(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">All Lists</option>
            <option value="private">Private Only</option>
            <option value="public">Public Only</option>
          </select>
        </div>
      </div>

      {/* Lists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLists.map(list => {
          const listQuestions = getListQuestions(list);
          
          return (
            <div 
              key={list.id} 
              className="bg-white rounded-xl shadow-lg p-6 border-l-4 hover:shadow-xl transition-all duration-200 cursor-pointer"
              style={{ borderLeftColor: list.color }}
              onClick={() => setSelectedList(list)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{list.name}</h3>
                    {list.isPrivate ? (
                      <Lock className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Unlock className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  {list.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{list.description}</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-1 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(list);
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteList(list.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="text-2xl font-bold text-gray-900">{listQuestions.length}</div>
                <div className="text-sm text-gray-600">questions</div>
              </div>
              
              {list.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {list.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                  {list.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      +{list.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Updated {list.updatedAt.toLocaleDateString()}</span>
                <span>{list.isPrivate ? 'Private' : 'Public'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredLists.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {questionLists.length === 0 ? 'No Lists Yet' : 'No Lists Match Your Filters'}
          </h3>
          <p className="text-gray-600 mb-4">
            {questionLists.length === 0 
              ? 'Create your first question list to organize your study materials.'
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
          {questionLists.length === 0 && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-[#F8D380] text-gray-900 rounded-lg hover:bg-[#F6C95C] transition-all duration-200 font-medium"
            >
              Create Your First List
            </button>
          )}
        </div>
      )}

      {/* Create/Edit List Modal */}
      {(showCreateForm || editingList) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingList ? 'Edit List' : 'Create New List'}
              </h3>
              
              <form onSubmit={editingList ? handleEditList : handleCreateList} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Risk Management Questions"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe what this list is for..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., risk, management, governance"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {colors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          formData.color === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isPrivate}
                      onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Make this list private</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Private lists are only visible to you
                  </p>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingList(null);
                      setFormData({
                        name: '',
                        description: '',
                        isPrivate: true,
                        tags: '',
                        color: '#3B82F6'
                      });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#F8D380] text-gray-900 rounded-lg hover:bg-[#F6C95C] transition-all duration-200 font-medium"
                  >
                    {editingList ? 'Update List' : 'Create List'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};