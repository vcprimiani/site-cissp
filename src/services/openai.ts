import OpenAI from 'openai';
import { aiSecurity, formatTimeRemaining } from './aiSecurity';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface AIResponse {
  content: string;
  error?: string;
}

export interface AIQuestionResponse {
  question?: {
    domain: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    tags: string[];
  };
  error?: string;
  rateLimited?: boolean;
  waitTime?: number;
}

export interface AIGenerationOptions {
  domain: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionType: 'most-likely' | 'least-likely' | 'best-practice' | 'scenario-based' | 'definition' | 'comparison';
  scenarioType: 'technical' | 'management' | 'compliance' | 'incident-response' | 'risk-assessment';
  topic: string;
  includeDistractors: boolean;
  focusArea: string;
}

// Enhanced JSON extraction and cleaning functions
const extractJSON = (content: string): string => {
  // First, trim whitespace
  content = content.trim();
  
  // Remove any markdown code block wrappers
  const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  
  // Look for JSON object boundaries
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return content.substring(firstBrace, lastBrace + 1);
  }
  
  // If no clear JSON boundaries found, return original content
  return content;
};

const cleanJSONString = (jsonStr: string): string => {
  // Fix common JSON issues that can occur in AI responses
  return jsonStr
    // Fix unescaped quotes in strings
    .replace(/"([^"]*)"([^"]*)"([^"]*)"/g, (match, p1, p2, p3) => {
      // Only fix if this appears to be inside a string value
      if (p2.includes(':') || p2.includes(',') || p2.includes('{') || p2.includes('}')) {
        return match; // Don't modify if it looks like proper JSON structure
      }
      return `"${p1}\\"${p2}\\"${p3}"`;
    })
    // Fix unescaped newlines in strings
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    // Fix trailing commas
    .replace(/,(\s*[}\]])/g, '$1')
    // Fix missing commas between properties
    .replace(/"\s*\n\s*"/g, '",\n"')
    // Remove any non-printable characters
    .replace(/[\x00-\x1F\x7F]/g, '');
};

const validateQuestionData = (data: any): boolean => {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.domain === 'string' &&
    typeof data.difficulty === 'string' &&
    typeof data.question === 'string' &&
    Array.isArray(data.options) &&
    data.options.length === 4 &&
    data.options.every((opt: any) => typeof opt === 'string') &&
    typeof data.correctAnswer === 'number' &&
    data.correctAnswer >= 0 &&
    data.correctAnswer < 4 &&
    typeof data.explanation === 'string' &&
    Array.isArray(data.tags)
  );
};

// Enhanced security wrapper for AI requests
const secureAIRequest = async <T>(
  requestFn: () => Promise<T>,
  requestType: string = 'general',
  isBulkRequest: boolean = false
): Promise<T> => {
  // Check if user is in penalty period
  const penaltyCheck = aiSecurity.isInPenaltyPeriod();
  if (penaltyCheck.inPenalty) {
    throw new Error(
      `${penaltyCheck.reason} Please try again in ${formatTimeRemaining(penaltyCheck.remainingTime || 0)}.`
    );
  }

  // Check rate limits
  const rateLimitCheck = aiSecurity.checkRateLimit(isBulkRequest);
  if (!rateLimitCheck.allowed) {
    const error = new Error(rateLimitCheck.reason || 'Rate limit exceeded');
    (error as any).rateLimited = true;
    (error as any).waitTime = rateLimitCheck.waitTime;
    throw error;
  }

  try {
    // Record the request
    aiSecurity.recordRequest(isBulkRequest);
    
    // Make the actual API request
    const result = await requestFn();
    
    return result;
  } catch (error: any) {
    // If it's a rate limit error we threw, preserve the metadata
    if (error.rateLimited) {
      throw error;
    }
    
    // Handle OpenAI API errors
    if (error.code === 'rate_limit_exceeded') {
      throw new Error('OpenAI API rate limit exceeded. Please try again in a few minutes.');
    }
    
    if (error.code === 'insufficient_quota') {
      throw new Error('OpenAI API quota exceeded. Please check your account.');
    }
    
    if (error.code === 'invalid_api_key') {
      throw new Error('Invalid OpenAI API key. Please check your configuration.');
    }
    
    // Re-throw other errors
    throw error;
  }
};

export const generateAIResponse = async (prompt: string, context?: string): Promise<AIResponse> => {
  try {
    const result = await secureAIRequest(async () => {
      const systemPrompt = `You are an expert CISSP (Certified Information Systems Security Professional) instructor and mentor. You have deep knowledge of all 8 CISSP domains:

1. Security and Risk Management
2. Asset Security
3. Security Architecture and Engineering
4. Communication and Network Security
5. Identity and Access Management (IAM)
6. Security Assessment and Testing
7. Security Operations
8. Software Development Security

Your role is to:
- Provide clear, accurate explanations of CISSP concepts
- Give real-world examples and practical applications
- Break down complex topics into understandable parts
- Help students understand the "why" behind security principles
- Relate concepts to current industry practices and standards
- Provide exam-focused insights while maintaining practical relevance

Always be encouraging, professional, and focus on helping students truly understand the material rather than just memorize it.

${context ? `Additional context: ${context}` : ''}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const content = completion.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response generated');
      }

      return { content };
    }, 'ai_response');

    return result;
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    
    // Handle rate limiting errors
    if (error.rateLimited) {
      return {
        content: '',
        error: error.message
      };
    }
    
    // Provide helpful error messages
    let errorMessage = 'Unable to generate AI response at this time.';
    
    if (error.code === 'insufficient_quota') {
      errorMessage = 'API quota exceeded. Please check your OpenAI account.';
    } else if (error.code === 'invalid_api_key') {
      errorMessage = 'Invalid API key. Please check your configuration.';
    } else if (error.code === 'rate_limit_exceeded') {
      errorMessage = 'Rate limit exceeded. Please try again in a moment.';
    }
    
    return { 
      content: 'I apologize, but I\'m having trouble connecting to the AI service right now. Please try again in a moment.',
      error: errorMessage 
    };
  }
};

export const generateQuestionExplanation = async (question: string, correctAnswer: string, domain: string): Promise<AIResponse> => {
  const prompt = `Please provide an enhanced explanation for this CISSP question:

Question: ${question}
Correct Answer: ${correctAnswer}
Domain: ${domain}

Please explain:
1. Why this answer is correct
2. Key concepts being tested
3. Real-world applications
4. Common misconceptions to avoid
5. How this relates to other CISSP domains

Keep the explanation clear, comprehensive, and exam-focused.`;

  return generateAIResponse(prompt, `This is a CISSP exam question from the ${domain} domain.`);
};

export const generateAIQuestion = async (
  topic: string, 
  options?: AIGenerationOptions, 
  existingTerms?: string[],
  isBulkRequest: boolean = false
): Promise<AIQuestionResponse> => {
  try {
    const result = await secureAIRequest(async () => {
      let prompt = '';
      
      if (options) {
        // Advanced generation with detailed options
        const questionTypeInstructions = {
          'most-likely': 'Create a question asking "Which is MOST likely to..." or "What is the BEST approach to..." requiring selection of the most appropriate answer.',
          'least-likely': 'Create a question asking "Which is LEAST likely to..." or "What would NOT be appropriate..." requiring identification of the incorrect or inappropriate option.',
          'best-practice': 'Create a question about industry best practices, asking "What is the BEST practice for..." or "Which approach follows security best practices..."',
          'scenario-based': 'Create a detailed scenario-based question with a realistic business/technical situation requiring analysis and decision-making.',
          'definition': 'Create a question testing knowledge of definitions, concepts, or terminology.',
          'comparison': 'Create a question comparing different concepts, models, or approaches, highlighting key differences.'
        };

        const scenarioInstructions = {
          'technical': 'Focus on technical implementation details like NAC, firewalls, encryption, network security, system configuration.',
          'management': 'Focus on management decisions, policy creation, governance, strategic planning, business alignment.',
          'compliance': 'Focus on regulatory compliance, audit requirements, legal obligations, standards adherence.',
          'incident-response': 'Focus on security incident handling, breach response, forensics, recovery procedures.',
          'risk-assessment': 'Focus on risk analysis, threat assessment, vulnerability management, risk mitigation strategies.'
        };

        prompt = `Create a high-quality CISSP exam question with the following specifications:

REQUIREMENTS:
- Domain: ${options.domain}
- Difficulty: ${options.difficulty}
- Question Type: ${questionTypeInstructions[options.questionType]}
- Scenario Focus: ${scenarioInstructions[options.scenarioType]}
- Topic/Concept: ${topic}
${options.focusArea ? `- Focus Area: ${options.focusArea}` : ''}
${options.includeDistractors ? '- Include strong, plausible distractors that test common misconceptions' : ''}

QUALITY STANDARDS:
- Create a realistic, practical scenario that a CISSP professional might encounter
- Use specific technical terms and industry terminology appropriately
- Ensure the question tests understanding, not just memorization
- Make distractors plausible but clearly incorrect to someone who understands the concept
- Include enough context for the scenario without being overly verbose
- Follow the style of actual CISSP exam questions

${existingTerms && existingTerms.length > 0 ? `
AVOID REPETITION:
Avoid using these concepts/terms that are already covered in existing questions: ${existingTerms.slice(0, 20).join(', ')}
Focus on different aspects or related but distinct concepts.
` : ''}

CRITICAL FORMATTING REQUIREMENTS:
- You MUST respond with ONLY valid JSON
- Do NOT include any explanatory text, markdown formatting, or code blocks
- Ensure all string values are properly escaped
- Use \\n for line breaks in explanations
- The response must be complete and not truncated

Format as valid JSON:
{
  "domain": "${options.domain}",
  "difficulty": "${options.difficulty}",
  "question": "Your detailed question here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Provide a comprehensive explanation. Use \\n\\n for paragraph breaks. Structure as: Correct Answer: Explain why this option is correct. \\n\\nIncorrect Answers: \\n- Option A: Explain why wrong. \\n- Option B: Explain why wrong. \\n- Option C: Explain why wrong. \\n\\nKey Takeaway: Summarize the main learning point.",
  "tags": ["relevant", "tags", "here"]
}`;
      } else {
        // Simple generation for quick mode
        prompt = `Create a CISSP exam-style multiple choice question about: ${topic}

Requirements:
- The question should test understanding of CISSP concepts
- Include 4 answer options (A, B, C, D)
- Provide a comprehensive explanation for the correct answer and why others are wrong
- Assign appropriate difficulty level (Easy, Medium, Hard)
- Assign to the most relevant CISSP domain
- Include relevant tags for categorization

CRITICAL FORMATTING REQUIREMENTS:
- You MUST respond with ONLY valid JSON
- Do NOT include any explanatory text, markdown formatting, or code blocks
- Ensure all string values are properly escaped
- Use \\n for line breaks in explanations
- The response must be complete and not truncated

Format your response as valid JSON:
{
  "domain": "Security and Risk Management",
  "difficulty": "Medium",
  "question": "Your question here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Provide a comprehensive explanation. Use \\n\\n for paragraph breaks. Structure as: Correct Answer: Explain why this option is correct. \\n\\nIncorrect Answers: \\n- Option A: Explain why wrong. \\n- Option B: Explain why wrong. \\n- Option C: Explain why wrong. \\n\\nKey Takeaway: Summarize the main learning point.",
  "tags": ["tag1", "tag2", "tag3"]
}`;
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert CISSP question writer with deep knowledge of cybersecurity. Create high-quality, exam-realistic questions that test practical understanding and real-world application of security concepts. Your explanations must be comprehensive, breaking down why the correct answer is right and why each incorrect option is wrong, including common misconceptions. CRITICAL: You must respond with ONLY valid JSON. Do not include any explanatory text, markdown formatting, or code blocks around the JSON. Ensure all string values in your JSON response are properly escaped - use \\n for line breaks, \\t for tabs, and escape any quotes or backslashes. The response must be complete and not truncated."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2500, // Increased to prevent truncation
        temperature: 0.8
      });

      const content = completion.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response generated');
      }

      try {
        // Extract and clean JSON from the response
        const extractedJSON = extractJSON(content);
        const cleanedJSON = cleanJSONString(extractedJSON);
        
        // Parse the JSON
        const questionData = JSON.parse(cleanedJSON);
        
        // Validate the parsed data
        if (!validateQuestionData(questionData)) {
          throw new Error('Generated question is missing required fields or has invalid structure');
        }
        
        return { question: questionData };
      } catch (parseError) {
        console.error('Failed to parse AI question response:', parseError);
        console.error('Original content:', content);
        console.error('Extracted JSON:', extractJSON(content));
        console.error('Cleaned JSON:', cleanJSONString(extractJSON(content)));
        
        // Provide more detailed error information
        const errorDetails = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
        return { 
          error: `Failed to generate properly formatted question: ${errorDetails}. The AI response may have been truncated or contained invalid JSON.` 
        };
      }
    }, 'question_generation', isBulkRequest);

    return result;
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    
    // Handle rate limiting errors
    if (error.rateLimited) {
      return {
        error: error.message,
        rateLimited: true,
        waitTime: error.waitTime
      };
    }
    
    return { error: 'Failed to generate AI question. Please try again.' };
  }
};

// Export usage info for components
export const getAIUsageInfo = () => aiSecurity.getUsageInfo();

// Export bulk generation controls
export const startBulkGeneration = () => aiSecurity.startBulkGeneration();
export const endBulkGeneration = () => aiSecurity.endBulkGeneration();