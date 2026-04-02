const CRAWLERS = [
  'Discordbot', 'Slackbot', 'Twitterbot', 'WhatsApp', 'facebookexternalhit',
  'LinkedInBot', 'TelegramBot', 'Applebot', 'Googlebot', 'bingbot',
  'Pinterestbot', 'Embedly', 'redditbot',
]

function isCrawler(ua: string): boolean {
  return CRAWLERS.some(bot => ua.includes(bot))
}

function fromBase64url(s: string): string {
  try {
    return atob(s.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, ''))
  } catch {
    return ''
  }
}

function decodeBuild(sf: string): { name: string; s: [[number, number, number], [number, number, number]] } | null {
  try {
    const raw = fromBase64url(sf)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export default async function middleware(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url)
  const sf = url.searchParams.get('sf')
  const ua = request.headers.get('user-agent') ?? ''

  if (!sf || url.pathname !== '/build' || !isCrawler(ua)) {
    return undefined
  }

  const build = decodeBuild(sf)
  const title = build?.name ? `${build.name} — ShatterApp` : 'Strike Force — ShatterApp'
  const description = 'View this Star Wars: Shatterpoint strike force on ShatterApp'
  const origin = url.origin
  const pageUrl = `${origin}/build?sf=${encodeURIComponent(sf)}`
  const imageUrl = `${origin}/api/og?sf=${encodeURIComponent(sf)}`

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imageUrl}" />
  <meta http-equiv="refresh" content="0;url=${pageUrl}" />
</head>
<body>
  <p>Redirecting to <a href="${pageUrl}">ShatterApp</a>…</p>
</body>
</html>`

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}

export const config = {
  matcher: '/build',
}
