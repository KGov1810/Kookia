// Kookia — Appel à l'API Claude avec un outil imposé.

import { t } from '../i18n/i18n.js';

export class ClaudeError extends Error {}

export async function callTool({ key, model, system, content, tool, maxTokens, timeoutMs }) {
  if (!key) throw new ClaudeError(t('claude.noKey'));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        // Autorise l'appel direct depuis le navigateur (clé propre à l'utilisateur).
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system,
        tools: [tool],
        tool_choice: { type: 'tool', name: tool.name },
        messages: [{ role: 'user', content }]
      })
    });
  } catch (error) {
    if (error.name === 'AbortError') throw new ClaudeError(t('claude.timeout'));
    throw new ClaudeError(t('claude.offline'));
  } finally {
    clearTimeout(timer);
  }

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const message = json?.error?.message ?? `code ${response.status}`;
    if (response.status === 401) throw new ClaudeError(t('claude.badKey'));
    if (response.status === 429) throw new ClaudeError(t('claude.tooMany'));
    if (response.status === 529 || response.status === 503) throw new ClaudeError(t('claude.overloaded'));
    if (/credit balance/i.test(message)) throw new ClaudeError(t('claude.noCredit'));
    throw new ClaudeError(t('claude.error', { message }));
  }
  if (json?.stop_reason === 'max_tokens') throw new ClaudeError(t('claude.cut'));
  const block = json?.content?.find((b) => b.type === 'tool_use');
  if (!block?.input) throw new ClaudeError(t('claude.unexpected'));
  return block.input;
}
