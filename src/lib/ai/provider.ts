// src/lib/ai/provider.ts
// AI provider abstraction — Gemini primary, OpenAI fallback

import { nanoid } from 'nanoid';

// ============================================================
// Shared interfaces
// ============================================================
export interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  name: string;
  result: unknown;
  isError: boolean;
}

export interface AgentRequest {
  organizationId: string;
  conversationId: string;
  messages: AgentMessage[];
  systemPrompt: string;
  tools?: ToolSchema[];
  maxInputTokens?: number;
  maxOutputTokens?: number;
  maxToolCalls?: number;
}

export interface AgentResponse {
  content: string;
  toolCalls: ToolCall[];
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  provider: string;
  model: string;
  requestId: string;
  latencyMs: number;
  finishReason: string;
}

export interface ToolSchema {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
}

// ============================================================
// Provider interface
// ============================================================
export interface AIProvider {
  name: string;
  model: string;
  generateResponse(request: AgentRequest): Promise<AgentResponse>;
  isAvailable(): Promise<boolean>;
}

// ============================================================
// Gemini Provider
// ============================================================
export class GeminiProvider implements AIProvider {
  name = 'gemini';
  model: string;

  constructor() {
    this.model = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash';
  }

  async generateResponse(request: AgentRequest): Promise<AgentResponse> {
    const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

    const model = genAI.getGenerativeModel({
      model: this.model,
      systemInstruction: request.systemPrompt,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
      generationConfig: {
        maxOutputTokens: request.maxOutputTokens ?? 700,
        temperature: 0.3,
      },
    });

    // Convert messages to Gemini format ensuring strict compliance:
    // 1. History must start with role 'user' (never 'model')
    // 2. Roles must strictly alternate: 'user' -> 'model' -> 'user' -> 'model'
    // 3. Last message must be sent via sendMessage
    const rawMessages = request.messages.filter(m => m.content && m.content.trim().length > 0);
    const lastMsg = rawMessages.length > 0
      ? rawMessages[rawMessages.length - 1]
      : { role: 'user' as const, content: 'Hello' };
    const prior = rawMessages.slice(0, -1);

    const history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    // Skip any leading assistant/greeting messages so history begins with a user turn
    const firstUserIndex = prior.findIndex(m => m.role === 'user');
    if (firstUserIndex !== -1) {
      const validPrior = prior.slice(firstUserIndex);
      for (const m of validPrior) {
        const geminiRole = m.role === 'assistant' ? 'model' : 'user';
        if (history.length === 0) {
          if (geminiRole === 'user') {
            history.push({ role: 'user', parts: [{ text: m.content }] });
          }
        } else {
          const lastRole = history[history.length - 1].role;
          if (lastRole === geminiRole) {
            history[history.length - 1].parts[0].text += '\n\n' + m.content;
          } else {
            history.push({ role: geminiRole, parts: [{ text: m.content }] });
          }
        }
      }
    }

    // Ensure history does not end with 'user' right before sendMessage sends another user turn
    let messageToSend = lastMsg.content;
    if (history.length > 0 && history[history.length - 1].role === 'user') {
      const popped = history.pop()!;
      messageToSend = popped.parts[0].text + '\n\n' + messageToSend;
    }

    const requestId = nanoid(12);
    const startTime = Date.now();

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(messageToSend);
    const latencyMs = Date.now() - startTime;

    const response = result.response;
    const text = response.text();
    const usage = response.usageMetadata;

    return {
      content: text,
      toolCalls: [], // Tool calling handled separately via function declarations
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
      cachedTokens: usage?.cachedContentTokenCount ?? 0,
      provider: this.name,
      model: this.model,
      requestId,
      latencyMs,
      finishReason: response.candidates?.[0]?.finishReason ?? 'STOP',
    };
  }

  async isAvailable(): Promise<boolean> {
    const key = process.env.GEMINI_API_KEY;
    return !!key && key.trim() !== '' && !key.includes('your-gemini-api-key');
  }
}

// ============================================================
// OpenAI Fallback Provider
// ============================================================
export class OpenAIProvider implements AIProvider {
  name = 'openai';
  model: string;

  constructor() {
    this.model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  }

  async generateResponse(request: AgentRequest): Promise<AgentResponse> {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: request.systemPrompt },
      ...request.messages,
    ];

    const requestId = nanoid(12);
    const startTime = Date.now();

    const completion = await openai.chat.completions.create({
      model: this.model,
      messages,
      max_tokens: request.maxOutputTokens ?? 700,
      temperature: 0.3,
    });

    const latencyMs = Date.now() - startTime;
    const choice = completion.choices[0];
    const usage = completion.usage;

    return {
      content: choice.message.content ?? '',
      toolCalls: [],
      inputTokens: usage?.prompt_tokens ?? 0,
      outputTokens: usage?.completion_tokens ?? 0,
      cachedTokens: (usage as any)?.prompt_tokens_details?.cached_tokens ?? 0,
      provider: this.name,
      model: this.model,
      requestId,
      latencyMs,
      finishReason: choice.finish_reason,
    };
  }

  async isAvailable(): Promise<boolean> {
    const key = process.env.OPENAI_API_KEY;
    return !!key && key.trim() !== '' && !key.includes('your-openai-api-key');
  }
}

// ============================================================
// AI Provider Factory with Fallback
// ============================================================
export class AIProviderFactory {
  private static primaryProvider: AIProvider | null = null;
  private static fallbackProvider: AIProvider | null = null;

  static getPrimary(): AIProvider {
    if (!this.primaryProvider) {
      this.primaryProvider = new GeminiProvider();
    }
    return this.primaryProvider;
  }

  static getFallback(): AIProvider {
    if (!this.fallbackProvider) {
      this.fallbackProvider = new OpenAIProvider();
    }
    return this.fallbackProvider;
  }

  /**
   * Generates a response with automatic fallback.
   * Records all attempts for usage metering.
   */
  static async generateWithFallback(
    request: AgentRequest,
    maxRetries = 2
  ): Promise<{ response: AgentResponse; attempts: Array<{ provider: string; success: boolean; error?: string }> }> {
    const attempts: Array<{ provider: string; success: boolean; error?: string }> = [];
    const primary = this.getPrimary();

    // Try primary provider
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await primary.generateResponse(request);
        attempts.push({ provider: primary.name, success: true });
        return { response, attempts };
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error';
        attempts.push({ provider: primary.name, success: false, error });

        // Don't retry auth errors or quota errors
        if (error.includes('PERMISSION_DENIED') || error.includes('INVALID_ARGUMENT')) {
          break;
        }
        // Last retry before fallback
        if (i === maxRetries - 1) break;
      }
    }

    // Try fallback provider if enabled
    if (process.env.ENABLE_AI_FALLBACK === 'true') {
      const fallback = this.getFallback();
      if (await fallback.isAvailable()) {
        try {
          const response = await fallback.generateResponse({
            ...request,
            // Fallback may have different token limits — use safe defaults
            maxOutputTokens: Math.min(request.maxOutputTokens ?? 700, 700),
          });
          attempts.push({ provider: fallback.name, success: true });
          return { response, attempts };
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Unknown error';
          attempts.push({ provider: fallback.name, success: false, error });
        }
      }
    }

    throw new Error(`All AI providers failed. Attempts: ${JSON.stringify(attempts)}`);
  }
}
