import React, { useState } from 'react';
import { X, AlertTriangle, Flag } from 'lucide-react';
import { FLAG_REASONS } from '../../services/flagService';

interface FlagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFlag: (reason: string, customReason?: string) => Promise<void>;
  questionText: string;
  loading?: boolean;
}

export const FlagModal: React.FC<FlagModalProps> = ({
  isOpen,
  onClose,
  onFlag,
  questionText,
  loading = false
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [showCustomReason, setShowCustomReason] = useState(false);

  const handleReasonChange = (reason: string) => {
    setSelectedReason(reason);
    if (reason === 'other') {
      setShowCustomReason(true);
    } else {
      setShowCustomReason(false);
      setCustomReason('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedReason) {
      return;
    }

    try {
      await onFlag(selectedReason, showCustomReason ? customReason : undefined);
      handleClose();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setCustomReason('');
    setShowCustomReason(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Flag className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Flag Question</h3>
                <p className="text-sm text-gray-600">Help us improve by reporting issues</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Question Preview */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Question being flagged:</p>
              <p className="text-sm text-gray-900 line-clamp-3">
                {questionText.length > 200 
                  ? `${questionText.substring(0, 200)}...` 
                  : questionText
                }
              </p>
            </div>

            {/* Flag Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Why are you flagging this question?
                </label>
                <div className="space-y-2">
                  {FLAG_REASONS.map((reason) => (
                    <label
                      key={reason.value}
                      className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={reason.value}
                        checked={selectedReason === reason.value}
                        onChange={(e) => handleReasonChange(e.target.value)}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {reason.label}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {reason.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom Reason Input */}
              {showCustomReason && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Please specify the reason:
                  </label>
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Describe the issue with this question..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                    required
                  />
                </div>
              )}

              {/* Warning */}
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Please flag responsibly</p>
                  <p className="text-xs mt-1">
                    Only flag questions that genuinely need attention. False reports may affect your account.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedReason || loading || (showCustomReason && !customReason.trim())}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Flagging...</span>
                    </div>
                  ) : (
                    'Flag Question'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}; 