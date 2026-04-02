import type { IncomingMessage, ServerResponse } from 'http'

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'text/plain')
  res.end('og function alive')
}
