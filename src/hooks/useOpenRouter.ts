import { useState } from 'react';
import { OpenRouterRequest, OpenRouterResponse, ChatMessage } from '../types/narrative.types';

export const useOpenRouter = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendChatCompletion = async (
    apiKey: string,
    model: string,
    messages: ChatMessage[],
    maxTokens: number = 500
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const request: OpenRouterRequest = {
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.8,
      };

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Idle Ace Commander',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `API error: ${response.status} ${response.statusText}`
        );
      }

      const data: OpenRouterResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from AI model');
      }

      return data.choices[0].message.content;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('OpenRouter API error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { sendChatCompletion, loading, error };
};
