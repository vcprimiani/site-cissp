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
        model: "gpt-4o",
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

export const generateManagerPerspective = async (
  question: string,
  options: string[],
  correctAnswer: number,
  domain: string
): Promise<AIResponse> => {
  const prompt = `As a senior cybersecurity manager and CISSP professional, provide a clear, concise, exam-focused explanation for this question. Directly explain why the correct answer is correct, and why the other options are not as appropriate. Use bullet points or short paragraphs for clarity.

Question: ${question}

Options:
${options.map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`).join('\n')}

Correct Answer: ${String.fromCharCode(65 + correctAnswer)}. ${options[correctAnswer]}
Domain: ${domain}

Please address:

- **Why is the correct answer the best choice?**
- **Why are the other options less appropriate?**
- **Strategic Context**: How does this relate to business objectives and risk management?
- **Decision Framework**: What management principles or frameworks apply?
- **Stakeholder Considerations**: Who is affected and what are their concerns?
- **Risk vs. Business Impact**: How should a manager balance security and business needs?

Be direct, actionable, and exam-focused. Format for easy reading.`;

  return generateAIResponse(prompt, `This is a CISSP management perspective analysis for the ${domain} domain.`);
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

export const enhanceQuestionExplanation = async (
  question: string,
  options: string[],
  correctAnswer: number,
  currentExplanation: string,
  domain: string
): Promise<AIResponse> => {
  const correctAnswerText = options[correctAnswer];
  const incorrectOptions = options
    .map((option, index) => ({ option, index }))
    .filter((_, index) => index !== correctAnswer);

  const prompt = `Please enhance this CISSP question explanation with better structure and formatting:

Question: ${question}
Correct Answer: ${correctAnswerText}
Domain: ${domain}
Current Explanation: ${currentExplanation}

Please restructure the explanation using this format:

1. Correct Answer:
- Explain in detail why the chosen option is correct
- Reference key CISSP concepts and industry standards
- Provide real-world applications and examples

2. Why Other Options Are Wrong:
${incorrectOptions.map(({ option, index }) => `- Option ${String.fromCharCode(65 + index)}: Explain why this is incorrect and what misconception it represents`).join('\n')}

3. Key Concepts:
- List the main CISSP concepts being tested
- Explain how they relate to real-world security scenarios
- Connect to other relevant CISSP domains

4. Practical Application:
- Describe how this knowledge applies in practice
- Provide examples of when this concept would be used
- Mention any relevant tools, frameworks, or methodologies

IMPORTANT REQUIREMENTS:
- Ensure ALL sections are complete and no final questions are missing
- Each section must have substantive content with bullet points
- Use clear, structured formatting with proper line breaks
- Make the explanation comprehensive but well-organized
- Include specific examples and real-world applications
- Reference relevant CISSP domains and industry standards

Keep the enhanced explanation comprehensive but well-structured. Use bullet points and clear sections for better readability.`;

  return generateAIResponse(prompt, `This is an explanation enhancement for a CISSP question from the ${domain} domain.`);
};

export const generateAIQuestion = async (
  topic: string,
  options?: AIGenerationOptions,
  existingTerms?: string[],
  isBulkRequest = false
): Promise<AIQuestionResponse> => {
  try {
    const result = await secureAIRequest(async () => {
      let prompt: string;

      if (options && options.questionType) {
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

EXAMPLE QUALITY LEVEL:
"Natalie wants mobile devices that connect to her network to be inspected for updated virus signatures and kept isolated until the most recent signatures can be downloaded. Which Network Access Control (NAC) remediation mode should Natalie enable and how should the MOST recent signatures file be downloaded?"

Format as JSON:
{
  "domain": "${options.domain}",
  "difficulty": "${options.difficulty}",
  "question": "Your detailed question here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "STRUCTURE YOUR EXPLANATION AS FOLLOWS:\\n\\n1. Correct Answer:\\n- Explain in detail why the chosen option is correct\\n- Reference key CISSP concepts and industry standards\\n- Provide real-world applications and examples\\n\\n2. Why Other Options Are Wrong:\\n- Option A: Explain why this is incorrect and what misconception it represents\\n- Option B: Explain why this is incorrect and what misconception it represents\\n- Option C: Explain why this is incorrect and what misconception it represents\\n\\n3. Key Concepts:\\n- List the main CISSP concepts being tested\\n- Explain how they relate to real-world security scenarios\\n- Connect to other relevant CISSP domains\\n\\n4. Practical Application:\\n- Describe how this knowledge applies in practice\\n- Provide examples of when this concept would be used\\n- Mention any relevant tools, frameworks, or methodologies\\n\\nIMPORTANT: Ensure ALL sections are complete and no final questions are missing. Each section must have substantive content.",
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

Format your response as JSON with this structure:
{
  "domain": "Security and Risk Management",
  "difficulty": "Hard",
  "question": "Your question here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "STRUCTURE YOUR EXPLANATION AS FOLLOWS:\\n\\n1. Correct Answer:\\n- Explain in detail why the chosen option is correct\\n- Reference key CISSP concepts and industry standards\\n- Provide real-world applications and examples\\n\\n2. Why Other Options Are Wrong:\\n- Option A: Explain why this is incorrect and what misconception it represents\\n- Option B: Explain why this is incorrect and what misconception it represents\\n- Option C: Explain why this is incorrect and what misconception it represents\\n\\n3. Key Concepts:\\n- List the main CISSP concepts being tested\\n- Explain how they relate to real-world security scenarios\\n- Connect to other relevant CISSP domains\\n\\n4. Practical Application:\\n- Describe how this knowledge applies in practice\\n- Provide examples of when this concept would be used\\n- Mention any relevant tools, frameworks, or methodologies\\n\\nIMPORTANT: Ensure ALL sections are complete and no final questions are missing. Each section must have substantive content.",
  "tags": ["tag1", "tag2", "tag3"]
}`;
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert CISSP question writer with deep knowledge of cybersecurity. Create high-quality, exam-realistic questions that test practical understanding and real-world application of security concepts. Your explanations must be comprehensive, breaking down why the correct answer is right and why each incorrect option is wrong, including common misconceptions. Always respond with valid JSON only. IMPORTANT: Ensure all explanation sections are complete and no final questions are missing."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.8
      });

      let content = completion.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response generated');
      }

      // Strip code block if present
      content = content.trim();
      if (content.startsWith('```')) {
        content = content.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
      }

      try {
        const questionData = JSON.parse(content);
        return { question: questionData };
      } catch (parseError) {
        console.error('Failed to parse AI question response:', parseError, content);
        return { error: 'Failed to generate properly formatted question' };
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