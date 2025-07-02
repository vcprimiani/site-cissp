import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info, Palette } from 'lucide-react';
import { domainColors, difficultyColors, statusColors, categoryIcons } from '../../utils/colorSystem';

interface ColorKeyProps {
  className?: string;
  compact?: boolean;
}

export const ColorKey: React.FC<ColorKeyProps> = ({ className = '', compact = false }) => {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [activeTab, setActiveTab] = useState<'domains' | 'difficulty' | 'status'>('domains');

  if (compact && !isExpanded) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-3 ${className}`}>
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Palette className="w-4 h-4" />
          <span>Color Key</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Palette className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Color-Coding System</h3>
          </div>
          {compact && (
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Visual organization system for quick identification of question categories
        </p>
      </div>

      <div className="p-4">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-4">
          {[
            { id: 'domains', label: 'Domains', icon: '🏛️' },
            { id: 'difficulty', label: 'Difficulty', icon: '📊' },
            { id: 'status', label: 'Status', icon: '🏷️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Domain Colors */}
        {activeTab === 'domains' && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-3">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">CISSP Domain Categories</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(domainColors).map(([domain, colors]) => (
                <div
                  key={domain}
                  className="flex items-center space-x-3 p-3 rounded-lg border"
                  style={{ 
                    backgroundColor: colors.background,
                    borderColor: colors.border 
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: colors.primary }}
                  />
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <span className="text-lg">{categoryIcons.domains[domain as keyof typeof categoryIcons.domains]}</span>
                    <span 
                      className="text-sm font-medium truncate"
                      style={{ color: colors.text }}
                    >
                      {domain}
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: colors.primary }}
                      title="Primary color"
                    />
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: colors.secondary }}
                      title="Secondary color"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty Colors */}
        {activeTab === 'difficulty' && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-3">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Question Difficulty Levels</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(difficultyColors).map(([difficulty, colors]) => (
                <div
                  key={difficulty}
                  className="flex items-center space-x-3 p-3 rounded-lg border"
                  style={{ 
                    backgroundColor: colors.background,
                    borderColor: colors.border 
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: colors.primary }}
                  />
                  <div className="flex items-center space-x-2 flex-1">
                    <span className="text-lg">{categoryIcons.difficulty[difficulty as keyof typeof categoryIcons.difficulty]}</span>
                    <span 
                      className="text-sm font-medium"
                      style={{ color: colors.text }}
                    >
                      {difficulty}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {difficulty === 'Easy' && 'Foundational concepts'}
                    {difficulty === 'Medium' && 'Applied knowledge'}
                    {difficulty === 'Hard' && 'Complex scenarios'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Colors */}
        {activeTab === 'status' && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-3">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Question Status & Types</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(statusColors).map(([status, colors]) => (
                <div
                  key={status}
                  className="flex items-center space-x-3 p-3 rounded-lg border"
                  style={{ 
                    backgroundColor: colors.background,
                    borderColor: colors.border 
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: colors.primary }}
                  />
                  <div className="flex items-center space-x-2 flex-1">
                    <span className="text-lg">{categoryIcons.status[status as keyof typeof categoryIcons.status]}</span>
                    <span 
                      className="text-sm font-medium capitalize"
                      style={{ color: colors.text }}
                    >
                      {status.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {status === 'active' && 'Visible in presentation'}
                    {status === 'inactive' && 'Hidden from view'}
                    {status === 'featured' && 'Highlighted question'}
                    {status === 'practice' && 'Practice set member'}
                    {status === 'ai-generated' && 'AI created content'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accessibility Note */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">Accessibility Features:</p>
              <ul className="space-y-1">
                <li>• All colors meet WCAG AA contrast standards</li>
                <li>• Icons and patterns provide additional visual cues</li>
                <li>• Color combinations are colorblind-friendly</li>
                <li>• Consistent visual hierarchy across all cards</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};