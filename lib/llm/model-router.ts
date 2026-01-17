// Model Router - 智能模型路由
// Plan 任务用 GPT-5.1/GPT-4o，Implement/Repair 用 Claude Sonnet

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import type { ModelRouterConfig } from '@/lib/cbb/types';

/**
 * 默认模型配置
 */
export const DEFAULT_MODEL_CONFIG: ModelRouterConfig = {
  plan: {
    provider: 'openai',
    model: 'gpt-4o', // GPT-5.1 发布后替换为 gpt-5.1
    max_tokens: 8192,
    temperature: 0.7,
  },
  implement: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16384,
    temperature: 0.3,
  },
  repair: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    temperature: 0.2,
  },
};

/**
 * LLM 调用结果
 */
export interface LLMResult {
  success: boolean;
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cachedInputTokens?: number;
  };
  model: string;
  provider: string;
  error?: string;
}

/**
 * OpenAI 客户端单例
 */
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

/**
 * Anthropic 客户端单例
 */
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

export class ModelRouter {
  private config: ModelRouterConfig;

  constructor(config?: Partial<ModelRouterConfig>) {
    this.config = {
      ...DEFAULT_MODEL_CONFIG,
      ...config,
    };
  }

  /**
   * 执行 Plan 任务（使用 OpenAI GPT）
   */
  async executePlan(params: {
    systemPrompt: string;
    userPrompt: string;
    jsonMode?: boolean;
  }): Promise<LLMResult> {
    const config = this.config.plan;
    const client = getOpenAIClient();

    try {
      console.log(`[ModelRouter] Executing Plan with ${config.model}`);

      const response = await client.chat.completions.create({
        model: config.model,
        max_tokens: config.max_tokens,
        temperature: config.temperature,
        response_format: params.jsonMode ? { type: 'json_object' } : { type: 'text' },
        messages: [
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: params.userPrompt },
        ],
      });

      const content = response.choices[0]?.message?.content || '';
      const usage = response.usage;

      return {
        success: true,
        content,
        usage: {
          inputTokens: usage?.prompt_tokens || 0,
          outputTokens: usage?.completion_tokens || 0,
          cachedInputTokens: (usage as any)?.prompt_tokens_details?.cached_tokens || 0,
        },
        model: config.model,
        provider: 'openai',
      };
    } catch (error: any) {
      console.error('[ModelRouter] Plan execution failed:', error);
      return {
        success: false,
        content: '',
        usage: { inputTokens: 0, outputTokens: 0 },
        model: config.model,
        provider: 'openai',
        error: error.message || '模型调用失败',
      };
    }
  }

  /**
   * 执行 Implement 任务（使用 Claude Sonnet）
   */
  async executeImplement(params: {
    systemPrompt: string;
    userPrompt: string;
  }): Promise<LLMResult> {
    const config = this.config.implement;
    const client = getAnthropicClient();

    try {
      console.log(`[ModelRouter] Executing Implement with ${config.model}`);

      const response = await client.messages.create({
        model: config.model,
        max_tokens: config.max_tokens,
        system: params.systemPrompt,
        messages: [
          { role: 'user', content: params.userPrompt },
        ],
      });

      const content = response.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as any).text)
        .join('\n');

      return {
        success: true,
        content,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          cachedInputTokens: (response.usage as any).cache_read_input_tokens || 0,
        },
        model: config.model,
        provider: 'anthropic',
      };
    } catch (error: any) {
      console.error('[ModelRouter] Implement execution failed:', error);
      return {
        success: false,
        content: '',
        usage: { inputTokens: 0, outputTokens: 0 },
        model: config.model,
        provider: 'anthropic',
        error: error.message || '模型调用失败',
      };
    }
  }

  /**
   * 执行 Repair 任务（使用 Claude Sonnet）
   */
  async executeRepair(params: {
    systemPrompt: string;
    userPrompt: string;
  }): Promise<LLMResult> {
    const config = this.config.repair;
    const client = getAnthropicClient();

    try {
      console.log(`[ModelRouter] Executing Repair with ${config.model}`);

      const response = await client.messages.create({
        model: config.model,
        max_tokens: config.max_tokens,
        system: params.systemPrompt,
        messages: [
          { role: 'user', content: params.userPrompt },
        ],
      });

      const content = response.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as any).text)
        .join('\n');

      return {
        success: true,
        content,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          cachedInputTokens: (response.usage as any).cache_read_input_tokens || 0,
        },
        model: config.model,
        provider: 'anthropic',
      };
    } catch (error: any) {
      console.error('[ModelRouter] Repair execution failed:', error);
      return {
        success: false,
        content: '',
        usage: { inputTokens: 0, outputTokens: 0 },
        model: config.model,
        provider: 'anthropic',
        error: error.message || '模型调用失败',
      };
    }
  }

  /**
   * 通用执行方法
   */
  async execute(params: {
    taskType: 'plan' | 'implement' | 'repair';
    systemPrompt: string;
    userPrompt: string;
    jsonMode?: boolean;
  }): Promise<LLMResult> {
    switch (params.taskType) {
      case 'plan':
        return this.executePlan({
          systemPrompt: params.systemPrompt,
          userPrompt: params.userPrompt,
          jsonMode: params.jsonMode,
        });
      case 'implement':
        return this.executeImplement({
          systemPrompt: params.systemPrompt,
          userPrompt: params.userPrompt,
        });
      case 'repair':
        return this.executeRepair({
          systemPrompt: params.systemPrompt,
          userPrompt: params.userPrompt,
        });
      default:
        return {
          success: false,
          content: '',
          usage: { inputTokens: 0, outputTokens: 0 },
          model: '',
          provider: '',
          error: `未知任务类型: ${params.taskType}`,
        };
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): ModelRouterConfig {
    return this.config;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ModelRouterConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }
}

// 默认实例
export const modelRouter = new ModelRouter();

export default ModelRouter;
