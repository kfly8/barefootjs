/**
 * AI Chat Page — SSE Streaming Example
 *
 * Interactive AI chat with token-by-token streaming responses via Server-Sent Events.
 */

import { AIChatInteractive } from '@/components/AIChatInteractive'

export function AIChatPage() {
  return (
    <div>
      <h1>AI Chat — SSE Streaming</h1>
      <AIChatInteractive />
      <p><a href="/">← Back</a></p>
    </div>
  )
}
