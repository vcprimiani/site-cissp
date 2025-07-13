export const formatExplanationText = (text: string): string => {
  // Replace newlines with <br> tags
  let formattedText = text.replace(/\n/g, '<br>');
  
  // Handle numbered sections (1., 2., 3., etc.)
  formattedText = formattedText.replace(/\n\s*(\d+)\.\s*(.*?)(?=\n\s*\d+\.|$)/g, '\n<h4>$1. $2</h4>');
  
  // Handle bullet points (e.g., - item or • item)
  formattedText = formattedText.replace(/\n\s*[-•]\s*(.*?)(?=\n|$)/g, '\n<li>$1</li>');
  
  // Handle sub-bullets (indented with spaces)
  formattedText = formattedText.replace(/\n\s{2,}[-•]\s*(.*?)(?=\n|$)/g, '\n<li class="ml-4">$1</li>');
  
  // If we have list items, wrap them in ul tags
  if (formattedText.includes('<li>')) {
    // Split by double line breaks to handle paragraphs
    const sections = formattedText.split('<br><br>');
    const processedSections = sections.map(section => {
      if (section.includes('<li>')) {
        // This section has list items
        const lines = section.split('<br>');
        let inList = false;
        let result = '';
        
        for (const line of lines) {
          if (line.includes('<li>')) {
            if (!inList) {
              result += '<ul class="space-y-1 pl-4">';
              inList = true;
            }
            result += line;
          } else {
            if (inList) {
              result += '</ul>';
              inList = false;
            }
            if (line.trim()) {
              result += line + '<br>';
            }
          }
        }
        
        if (inList) {
          result += '</ul>';
        }
        
        return result;
      } else {
        return section;
      }
    });
    
    formattedText = processedSections.join('<br><br>');
  }
  
  // Handle bolding (e.g., **text**)
  formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Handle italic (e.g., *text*)
  formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Clean up extra <br> tags
  formattedText = formattedText.replace(/<br><br><br>/g, '<br><br>');
  formattedText = formattedText.replace(/^<br>/, '');
  formattedText = formattedText.replace(/<br>$/, '');
  
  return formattedText;
};

// Function to detect if explanation uses new structured format
export const isStructuredExplanation = (explanation: string): boolean => {
  // Check for numbered sections (1., 2., 3., etc.)
  const hasNumberedSections = /\n\s*\d+\.\s/.test(explanation);
  
  // Check for bullet points
  const hasBulletPoints = /\n\s*[-•]\s/.test(explanation);
  
  // Check for structured keywords
  const hasStructuredKeywords = /(correct answer|why other options|key concepts|practical application)/i.test(explanation);
  
  // Check for multiple line breaks (indicating sections)
  const hasMultipleSections = (explanation.match(/\n\s*\n/g) || []).length >= 2;
  
  return hasNumberedSections || (hasBulletPoints && hasStructuredKeywords) || hasMultipleSections;
};

/**
 * Parses an explanation string into a mapping of option index to explanation.
 * Supports formats like 'Option A:', 'Option 1:', etc.
 * Returns an object: { 0: '...', 1: '...', ... }
 */
export function parseOptionExplanations(explanation: string, options: string[]): Record<number, string> | null {
  // Try to match Option A/B/C/D or Option 1/2/3/4
  const regexes = [
    /Option ([A-D]):/gi,
    /Option ([1-4]):/gi
  ];
  let matchRegex = null;
  let matches = null;
  for (const regex of regexes) {
    matches = [...explanation.matchAll(regex)];
    if (matches.length === options.length) {
      matchRegex = regex;
      break;
    }
  }
  if (!matchRegex || !matches || matches.length !== options.length) {
    return null;
  }
  // Split the explanation into sections
  const result: Record<number, string> = {};
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index! + matches[i][0].length;
    const end = i < matches.length - 1 ? matches[i + 1].index! : explanation.length;
    const text = explanation.slice(start, end).trim();
    result[i] = text;
  }
  return result;
}

/**
 * Validates that the explanation string contains a section for each option.
 * Returns true if valid, false otherwise.
 */
export function isExplanationStructured(explanation: string, options: string[]): boolean {
  return !!parseOptionExplanations(explanation, options);
}