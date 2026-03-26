import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GenerateSummaryRequest {
  transcript: string;
  contextPrompt: string;
}

export interface AskLiaRequest {
  transcript: string;
  userQuestion: string;
  chatHistory?: Array<{ role: 'user' | 'assistant'; message: string }>;
}

export interface GeneratePromptRequest {
  useCase: string;
}

export interface OpenAIResponse {
  content: string;
  success: boolean;
  error?: string;
}

/**
 * Generate a call summary using OpenAI API
 */
export async function generateCallSummary({ transcript, contextPrompt }: GenerateSummaryRequest): Promise<OpenAIResponse> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    const systemPrompt = `You are an AI assistant specialized in analyzing call transcripts and generating comprehensive summaries. 
Your task is to create a detailed summary based on the provided transcript and any specific context or requirements from the user.

Guidelines:
- Focus on key points, decisions, and outcomes
- Identify important topics discussed
- Note any action items or next steps
- Maintain a professional and objective tone
- If specific context is provided, tailor the summary accordingly`;

    const userPrompt = `Please generate a comprehensive summary of the following call transcript:

Context/Requirements: ${contextPrompt}

Call Transcript:
${transcript}

Please provide a well-structured summary that captures the essential information from this call.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content || '';
    
    return {
      content,
      success: true,
    };
  } catch (error) {
    console.error('Error generating call summary:', error);
    return {
      content: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate summary',
    };
  }
}

/**
 * Ask Lia AI assistant questions about the call transcript
 */
export async function askLiaAboutCall({ transcript, userQuestion, chatHistory = [] }: AskLiaRequest): Promise<OpenAIResponse> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    const systemPrompt = `You are Lia, an AI assistant specialized in analyzing call transcripts and providing insights. 
You have access to the full call transcript and can answer questions about:
- Call content and key topics discussed
- Customer sentiment and satisfaction
- Action items and next steps
- Key insights and recommendations
- Any specific details from the conversation

Guidelines:
- Be helpful, accurate, and professional
- Base your responses on the actual transcript content
- If you cannot find information in the transcript, say so clearly
- Provide actionable insights when possible
- Maintain context from previous questions in the conversation`;

    // Build conversation history
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `Here is the call transcript for context:\n\n${transcript}\n\nPlease keep this transcript in mind for all subsequent questions.` }
    ];

    // Add chat history
    chatHistory.forEach(chat => {
      messages.push({
        role: chat.role === 'user' ? 'user' as const : 'assistant' as const,
        content: chat.message
      });
    });

    // Add current question
    messages.push({
      role: 'user' as const,
      content: userQuestion
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.4,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content || '';
    
    return {
      content,
      success: true,
    };
  } catch (error) {
    console.error('Error asking Lia:', error);
    return {
      content: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get response from Lia',
    };
  }
}

/**
 * Generate a custom prompt for AI agents based on use case
 */
export async function generateCustomPrompt({ useCase }: GeneratePromptRequest): Promise<OpenAIResponse> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    const systemPrompt = `You are an expert in creating AI agent prompts and system instructions. 
Your task is to generate a comprehensive, professional system prompt for an AI agent based on the user's specific use case.

Guidelines:
- Create a clear, actionable system prompt
- Include specific instructions for the agent's role and responsibilities
- Define communication style and tone
- Include guidelines for handling different scenarios
- Make it professional and comprehensive
- Ensure it's suitable for a conversational AI agent
- Include examples of good responses when appropriate`;

    const userPrompt = `Please generate a comprehensive system prompt for an AI agent that specializes in: ${useCase}

The prompt should be detailed, professional, and provide clear guidance for the AI agent's behavior and responses.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5,
      max_tokens: 1200,
    });

    const content = completion.choices[0]?.message?.content || '';
    
    return {
      content,
      success: true,
    };
  } catch (error) {
    console.error('Error generating custom prompt:', error);
    return {
      content: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate prompt',
    };
  }
}

/**
 * Check if OpenAI API key is configured
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
