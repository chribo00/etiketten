import type { Plugin } from 'vite';

export default function cspPlugin(): Plugin {
  const csp = "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none';";

  return {
    name: 'vite-plugin-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        /<head>/i,
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}">`,
      );
    },
  };
}
