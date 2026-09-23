import type { AiAdvisoryRequest, AiProvider } from '../ports/ai-provider.js';
import { advisoryInstruction, boundedText, HttpAiProvider } from './http-ai-provider.js';
import { AiProviderError } from './provider-error.js';
import type { AiProviderConfig } from './ai-configuration.js';

export class GroqAiProvider extends HttpAiProvider implements AiProvider {
  constructor(config: AiProviderConfig) {
    super(config);
  }

  async complete(request: AiAdvisoryRequest): Promise<unknown> {
    const context = request.context
      .map(({ label, content, sourceId, citation, sourceType }) =>
        [
          `Source: ${label}`,
          sourceId ? `Source identity: ${sourceId}` : undefined,
          sourceType ? `Source type: ${sourceType}` : undefined,
          citation ? `Citation: ${citation}` : undefined,
          `Excerpt: ${content}`,
        ]
          .filter(Boolean)
          .join('\n'),
      )
      .join('\n\n');
    const raw = await this.requestJson(request, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        temperature: 0.2,
        max_tokens: 1200,
        messages: [
          { role: 'system', content: advisoryInstruction() },
          {
            role: 'user',
            content: `Mode: ${request.mode}\nQuestion: ${request.question}\n${context}`,
          },
        ],
      }),
    });
    const content = (raw as { choices?: Array<{ message?: { content?: unknown } }> }).choices?.[0]
      ?.message?.content;
    const text = boundedText(content);
    if (!text) throw new AiProviderError('INVALID_RESPONSE', 'groq');
    return { text };
  }

  protected endpoint(): string {
    return this.config.baseUrl;
  }
}
