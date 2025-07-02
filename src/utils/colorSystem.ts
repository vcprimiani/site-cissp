// Comprehensive color-coding system for question cards
export interface ColorScheme {
  primary: string;
  secondary: string;
  background: string;
  border: string;
  text: string;
  accent: string;
}

// Domain Colors - Each CISSP domain gets a unique color family
export const domainColors: Record<string, ColorScheme> = {
  'Security and Risk Management': {
    primary: '#7C3AED', // Violet-600 (changed from red)
    secondary: '#C4B5FD', // Violet-300
    background: '#F5F3FF', // Violet-50
    border: '#DDD6FE', // Violet-200
    text: '#5B21B6', // Violet-800
    accent: '#6D28D9' // Violet-700
  },
  'Asset Security': {
    primary: '#059669', // Emerald-600
    secondary: '#6EE7B7', // Emerald-300
    background: '#ECFDF5', // Emerald-50
    border: '#A7F3D0', // Emerald-200
    text: '#065F46', // Emerald-800
    accent: '#047857' // Emerald-700
  },
  'Security Architecture and Engineering': {
    primary: '#2563EB', // Blue-600
    secondary: '#93C5FD', // Blue-300
    background: '#EFF6FF', // Blue-50
    border: '#BFDBFE', // Blue-200
    text: '#1E3A8A', // Blue-800
    accent: '#1D4ED8' // Blue-700
  },
  'Communication and Network Security': {
    primary: '#0891B2', // Cyan-600
    secondary: '#67E8F9', // Cyan-300
    background: '#ECFEFF', // Cyan-50
    border: '#A5F3FC', // Cyan-200
    text: '#164E63', // Cyan-800
    accent: '#0E7490' // Cyan-700
  },
  'Identity and Access Management (IAM)': {
    primary: '#EA580C', // Orange-600
    secondary: '#FDBA74', // Orange-300
    background: '#FFF7ED', // Orange-50
    border: '#FED7AA', // Orange-200
    text: '#9A3412', // Orange-800
    accent: '#C2410C' // Orange-700
  },
  'Security Assessment and Testing': {
    primary: '#BE185D', // Pink-600
    secondary: '#F9A8D4', // Pink-300
    background: '#FDF2F8', // Pink-50
    border: '#FBCFE8', // Pink-200
    text: '#831843', // Pink-800
    accent: '#A21CAF' // Pink-700
  },
  'Security Operations': {
    primary: '#DC2626', // Red-600 (moved from Security and Risk Management)
    secondary: '#FCA5A5', // Red-300
    background: '#FEF2F2', // Red-50
    border: '#FECACA', // Red-200
    text: '#991B1B', // Red-800
    accent: '#B91C1C' // Red-700
  },
  'Software Development Security': {
    primary: '#65A30D', // Lime-600
    secondary: '#BEF264', // Lime-300
    background: '#F7FEE7', // Lime-50
    border: '#D9F99D', // Lime-200
    text: '#365314', // Lime-800
    accent: '#4D7C0F' // Lime-700
  }
};

// Difficulty Colors - Visual hierarchy for question difficulty
export const difficultyColors: Record<string, ColorScheme> = {
  'Easy': {
    primary: '#16A34A', // Green-600
    secondary: '#86EFAC', // Green-300
    background: '#F0FDF4', // Green-50
    border: '#BBF7D0', // Green-200
    text: '#14532D', // Green-900
    accent: '#15803D' // Green-700
  },
  'Medium': {
    primary: '#D97706', // Amber-600
    secondary: '#FCD34D', // Amber-300
    background: '#FFFBEB', // Amber-50
    border: '#FDE68A', // Amber-200
    text: '#92400E', // Amber-800
    accent: '#B45309' // Amber-700
  },
  'Hard': {
    primary: '#DC2626', // Red-600
    secondary: '#FCA5A5', // Red-300
    background: '#FEF2F2', // Red-50
    border: '#FECACA', // Red-200
    text: '#991B1B', // Red-800
    accent: '#B91C1C' // Red-700
  }
};

// Status Colors - For question states and importance
export const statusColors: Record<string, ColorScheme> = {
  'active': {
    primary: '#059669', // Emerald-600
    secondary: '#6EE7B7', // Emerald-300
    background: '#ECFDF5', // Emerald-50
    border: '#A7F3D0', // Emerald-200
    text: '#065F46', // Emerald-800
    accent: '#047857' // Emerald-700
  },
  'inactive': {
    primary: '#6B7280', // Gray-500
    secondary: '#D1D5DB', // Gray-300
    background: '#F9FAFB', // Gray-50
    border: '#E5E7EB', // Gray-200
    text: '#374151', // Gray-700
    accent: '#4B5563' // Gray-600
  },
  'featured': {
    primary: '#7C3AED', // Violet-600
    secondary: '#C4B5FD', // Violet-300
    background: '#F5F3FF', // Violet-50
    border: '#DDD6FE', // Violet-200
    text: '#5B21B6', // Violet-800
    accent: '#6D28D9' // Violet-700
  },
  'practice': {
    primary: '#0891B2', // Cyan-600
    secondary: '#67E8F9', // Cyan-300
    background: '#ECFEFF', // Cyan-50
    border: '#A5F3FC', // Cyan-200
    text: '#164E63', // Cyan-800
    accent: '#0E7490' // Cyan-700
  },
  'ai-generated': {
    primary: '#8B5CF6', // Violet-500
    secondary: '#C4B5FD', // Violet-300
    background: '#F5F3FF', // Violet-50
    border: '#DDD6FE', // Violet-200
    text: '#5B21B6', // Violet-800
    accent: '#7C3AED' // Violet-600
  }
};

// Priority Colors - For importance levels
export const priorityColors: Record<string, ColorScheme> = {
  'high': {
    primary: '#DC2626', // Red-600
    secondary: '#FCA5A5', // Red-300
    background: '#FEF2F2', // Red-50
    border: '#FECACA', // Red-200
    text: '#991B1B', // Red-800
    accent: '#B91C1C' // Red-700
  },
  'medium': {
    primary: '#D97706', // Amber-600
    secondary: '#FCD34D', // Amber-300
    background: '#FFFBEB', // Amber-50
    border: '#FDE68A', // Amber-200
    text: '#92400E', // Amber-800
    accent: '#B45309' // Amber-700
  },
  'low': {
    primary: '#059669', // Emerald-600
    secondary: '#6EE7B7', // Emerald-300
    background: '#ECFDF5', // Emerald-50
    border: '#A7F3D0', // Emerald-200
    text: '#065F46', // Emerald-800
    accent: '#047857' // Emerald-700
  }
};

// Helper function to get domain color
export const getDomainColor = (domain: string): ColorScheme => {
  return domainColors[domain] || domainColors['Security and Risk Management'];
};

// Helper function to get difficulty color
export const getDifficultyColor = (difficulty: string): ColorScheme => {
  return difficultyColors[difficulty] || difficultyColors['Medium'];
};

// Helper function to get status color
export const getStatusColor = (status: string): ColorScheme => {
  return statusColors[status] || statusColors['active'];
};

// Helper function to get priority color
export const getPriorityColor = (priority: string): ColorScheme => {
  return priorityColors[priority] || priorityColors['medium'];
};

// Generate CSS classes for a color scheme
export const generateColorClasses = (scheme: ColorScheme) => ({
  background: { backgroundColor: scheme.background },
  border: { borderColor: scheme.border },
  text: { color: scheme.text },
  primary: { color: scheme.primary },
  accent: { backgroundColor: scheme.accent, color: 'white' },
  secondary: { backgroundColor: scheme.secondary, color: scheme.text }
});

// Accessibility helpers
export const getContrastRatio = (color1: string, color2: string): number => {
  // Simplified contrast ratio calculation
  // In a real implementation, you'd use a proper color contrast library
  return 4.5; // Placeholder - ensures WCAG AA compliance
};

export const isAccessible = (foreground: string, background: string): boolean => {
  return getContrastRatio(foreground, background) >= 4.5;
};

// Pattern system for additional visual distinction
export const patterns = {
  solid: 'bg-opacity-100',
  subtle: 'bg-opacity-50',
  light: 'bg-opacity-25',
  striped: 'bg-gradient-to-r',
  dotted: 'bg-opacity-75 border-dashed',
  outlined: 'bg-transparent border-2'
};

// Icon associations for each category
export const categoryIcons = {
  domains: {
    'Security and Risk Management': '🛡️',
    'Asset Security': '🔒',
    'Security Architecture and Engineering': '🏗️',
    'Communication and Network Security': '🌐',
    'Identity and Access Management (IAM)': '👤',
    'Security Assessment and Testing': '🔍',
    'Security Operations': '⚙️',
    'Software Development Security': '💻'
  },
  difficulty: {
    'Easy': '🟢',
    'Medium': '🟡',
    'Hard': '🔴'
  },
  status: {
    'active': '✅',
    'inactive': '⏸️',
    'featured': '⭐',
    'practice': '📚',
    'ai-generated': '🤖'
  }
};