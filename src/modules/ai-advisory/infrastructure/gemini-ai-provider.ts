import type { AiAdvisoryRequest, AiProvider } from '../ports/ai-provider.js';
import { advisoryInstruction, boundedText, HttpAiProvider } from './http-ai-provider.js';
import { AiProviderError } from './provider-error.js';
import type { AiProviderConfig } from './ai-configuration.js';

export class GeminiAiProvider extends HttpAiProvider implements AiProvider {
  constructor(config: AiProviderConfig) {
    super(config);
  }

  async complete(request: AiAdvisoryRequest): Promise<unknown> {
    const context = request.context
      .map(({ label, content }) => `Source: ${label}\nExcerpt: ${content}`)
      .join('\n\n');
    const raw = await this.requestJson(request, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': this.config.apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: advisoryInstruction() }] },
        contents: [
          {
            role: 'user',
            parts: [{ text: `Mode: ${request.mode}\nQuestion: ${request.question}\n${context}` }],
          },
        ],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1200 },
      }),
    });
    const candidate = (
      raw as {
        candidates?: Array<{
          finishReason?: unknown;
          content?: { parts?: Array<{ text?: unknown }> };
        }>;
        promptFeedback?: { blockReason?: unknown };
      }
    ).candidates?.[0];
    if (
      candidate?.finishReason === 'SAFETY' ||
      (raw as { promptFeedback?: { blockReason?: unknown } }).promptFeedback?.blockReason
    ) {
      throw new AiProviderError('SAFETY_BLOCK', 'gemini');
    }
    const text = boundedText(candidate?.content?.parts?.map((part) => part.text).join(''));
    if (!text) throw new AiProviderError('INVALID_RESPONSE', 'gemini');
    return { text };
  }

  protected endpoint(): string {
    const base = this.config.baseUrl.replace(/\/$/, '');
    const modelPath = base.endsWith('/models') ? '' : '/models';
    return `${base}${modelPath}/${encodeURIComponent(this.config.model)}:generateContent`;
  }
}
