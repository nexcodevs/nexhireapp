/**
 * Aplica o tema antes da hidratação pra evitar FOUC.
 * Default = light. Só usa dark se o usuário explicitamente trocou (localStorage).
 */
export default function ThemeScript() {
  const code = `
(function() {
  try {
    var stored = localStorage.getItem('nexhire:theme');
    var theme = stored === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`.trim()

  return <script dangerouslySetInnerHTML={{ __html: code }} />
}
