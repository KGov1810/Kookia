// Kookia — Appel à l'API Claude avec un outil imposé.

export class ClaudeError extends Error {}

export async function callTool({ key, model, system, content, tool, maxTokens, timeoutMs }) {
  if (!key) throw new ClaudeError('Ajoutez votre clé API Claude dans Réglages pour utiliser cette fonction.');
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
    if (error.name === 'AbortError') throw new ClaudeError('Claude met trop de temps à répondre, réessayez.');
    throw new ClaudeError('Connexion à Claude impossible : vérifiez la connexion internet.');
  } finally {
    clearTimeout(timer);
  }

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const message = json?.error?.message ?? `code ${response.status}`;
    if (response.status === 401) throw new ClaudeError('Clé API Claude refusée : vérifiez-la dans Réglages.');
    if (response.status === 429) throw new ClaudeError('Trop de demandes envoyées à Claude, réessayez dans une minute.');
    if (response.status === 529 || response.status === 503) throw new ClaudeError('Claude est surchargé pour le moment, réessayez un peu plus tard.');
    if (/credit balance/i.test(message)) throw new ClaudeError('Crédit Claude épuisé : ajoutez du crédit sur console.anthropic.com.');
    throw new ClaudeError(`Erreur Claude : ${message}`);
  }
  if (json?.stop_reason === 'max_tokens') throw new ClaudeError('La réponse de Claude a été coupée, réessayez.');
  const block = json?.content?.find((b) => b.type === 'tool_use');
  if (!block?.input) throw new ClaudeError('Réponse inattendue de Claude, réessayez.');
  return block.input;
}
