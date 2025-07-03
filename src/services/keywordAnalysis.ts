// Service for analyzing CISSP keywords in questions
import { generateAIResponse } from './openai';

export interface KeywordAnalysisResult {
  keywords: string[];
  error?: string;
}

export const analyzeCISSPKeywords = async (questionText: string): Promise<KeywordAnalysisResult> => {
  try {
    const prompt = `Analyze this CISSP exam question and identify the key CISSP-specific terms, concepts, and keywords that are critical for understanding and answering the question correctly.

Question: "${questionText}"

Please identify:
1. Technical terms specific to cybersecurity/CISSP
2. Important concepts being tested
3. Key phrases that indicate the domain or topic
4. Critical words that affect the meaning or answer

Return ONLY a comma-separated list of the most important keywords (maximum 8-10 keywords). Focus on terms that a CISSP candidate should recognize and understand.

Example format: "risk assessment, due diligence, data classification, encryption, access control"`;

    const response = await generateAIResponse(prompt);
    
    if (response.error) {
      return { keywords: [], error: response.error };
    }

    // Parse the response to extract keywords
    const keywords = response.content
      .split(',')
      .map(keyword => keyword.trim())
      .filter(keyword => keyword.length > 0)
      .slice(0, 10); // Limit to 10 keywords max

    return { keywords };
  } catch (error: any) {
    console.error('Error analyzing CISSP keywords:', error);
    return { 
      keywords: [], 
      error: 'Failed to analyze keywords. Please try again.' 
    };
  }
};

// Helper function to highlight keywords in text
export const highlightKeywords = (text: string, keywords: string[]): string => {
  if (!keywords.length) return text;
  
  let highlightedText = text;
  
  // Sort keywords by length (longest first) to avoid partial matches
  const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
  
  sortedKeywords.forEach(keyword => {
    if (keyword.length < 3) return; // Skip very short keywords
    
    // Create a case-insensitive regex that matches whole words or phrases
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    
    highlightedText = highlightedText.replace(regex, (match) => {
      return `<mark class="bg-yellow-200 px-1 rounded font-medium">${match}</mark>`;
    });
  });
  
  return highlightedText;
};