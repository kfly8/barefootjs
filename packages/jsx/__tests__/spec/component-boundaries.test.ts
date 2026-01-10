/**
 * Component Boundaries Specification Tests
 *
 * Tests for DIR-006 spec item: Server/Client Component boundary enforcement.
 * Each test validates the rules for component dependencies.
 */

import { describe, it, expect } from 'bun:test'
import { compileWithFiles } from '../compiler/test-helpers'

describe('Component Boundaries Specs', () => {
  // DIR-006: Client Component cannot import Server Component
  describe('DIR-006: Client/Server Component boundary enforcement', () => {
    it('throws error when Client Component imports Server Component', async () => {
      await expect(
        compileWithFiles('/test/ClientComponent.tsx', {
          '/test/ClientComponent.tsx': `
            "use client"
            import ServerChild from './ServerChild'

            export default function ClientComponent() {
              return <div><ServerChild /></div>
            }
          `,
          '/test/ServerChild.tsx': `
            export default function ServerChild() {
              return <p>Server rendered</p>
            }
          `,
        })
      ).rejects.toThrow('Client Component cannot import Server Component')
    })

    it('error message contains both file paths', async () => {
      try {
        await compileWithFiles('/test/Client.tsx', {
          '/test/Client.tsx': `
            "use client"
            import Server from './Server'
            export default function Client() { return <Server /> }
          `,
          '/test/Server.tsx': `
            export default function Server() { return <p>Server</p> }
          `,
        })
        expect(true).toBe(false) // Should not reach here
      } catch (e: any) {
        expect(e.message).toContain('/test/Client.tsx')
        expect(e.message).toContain('/test/Server.tsx')
      }
    })

    it('allows Server Component to import Client Component', async () => {
      const result = await compileWithFiles('/test/ServerComponent.tsx', {
        '/test/ServerComponent.tsx': `
          import ClientChild from './ClientChild'

          export default function ServerComponent() {
            return <div><ClientChild /></div>
          }
        `,
        '/test/ClientChild.tsx': `
          "use client"
          import { createSignal } from '@barefootjs/dom'

          export default function ClientChild() {
            const [count, setCount] = createSignal(0)
            return <button onClick={() => setCount(n => n + 1)}>{count()}</button>
          }
        `,
      })

      expect(result.files.length).toBeGreaterThan(0)
      // Client component should be included in the output
      const clientFile = result.files.find(f => f.sourcePath.includes('ClientChild'))
      expect(clientFile).toBeDefined()
      expect(clientFile!.hasClientJs).toBe(true)
    })

    it('allows Client Component to import Client Component', async () => {
      const result = await compileWithFiles('/test/ClientParent.tsx', {
        '/test/ClientParent.tsx': `
          "use client"
          import ClientChild from './ClientChild'

          export default function ClientParent() {
            return <div><ClientChild /></div>
          }
        `,
        '/test/ClientChild.tsx': `
          "use client"
          import { createSignal } from '@barefootjs/dom'

          export default function ClientChild() {
            const [count, setCount] = createSignal(0)
            return <button onClick={() => setCount(n => n + 1)}>{count()}</button>
          }
        `,
      })

      expect(result.files.length).toBe(2)
      // Both files should have client JS
      for (const file of result.files) {
        expect(file.hasUseClientDirective).toBe(true)
      }
    })

    it('allows Server Component to import Server Component', async () => {
      // This should not throw
      const result = await compileWithFiles('/test/ServerParent.tsx', {
        '/test/ServerParent.tsx': `
          import ServerChild from './ServerChild'

          export default function ServerParent() {
            return <div><ServerChild /></div>
          }
        `,
        '/test/ServerChild.tsx': `
          export default function ServerChild() {
            return <p>Nested server content</p>
          }
        `,
      })

      // Server components don't generate client JS files
      expect(result.files.every(f => !f.hasClientJs)).toBe(true)
    })

    it('detects violation in deeply nested imports', async () => {
      await expect(
        compileWithFiles('/test/Client.tsx', {
          '/test/Client.tsx': `
            "use client"
            import Middle from './Middle'
            export default function Client() { return <Middle /> }
          `,
          '/test/Middle.tsx': `
            "use client"
            import Server from './Server'
            export default function Middle() { return <Server /> }
          `,
          '/test/Server.tsx': `
            export default function Server() { return <p>Server</p> }
          `,
        })
      ).rejects.toThrow('Client Component cannot import Server Component')
    })

    it('allows mixed import chains: Server -> Client -> Client', async () => {
      const result = await compileWithFiles('/test/Server.tsx', {
        '/test/Server.tsx': `
          import ClientA from './ClientA'

          export default function Server() {
            return <div><ClientA /></div>
          }
        `,
        '/test/ClientA.tsx': `
          "use client"
          import ClientB from './ClientB'

          export default function ClientA() {
            return <div><ClientB /></div>
          }
        `,
        '/test/ClientB.tsx': `
          "use client"
          import { createSignal } from '@barefootjs/dom'

          export default function ClientB() {
            const [count, setCount] = createSignal(0)
            return <button onClick={() => setCount(n => n + 1)}>{count()}</button>
          }
        `,
      })

      expect(result.files.length).toBeGreaterThan(0)
      // Both client components should be in the output
      const clientFiles = result.files.filter(f => f.hasUseClientDirective)
      expect(clientFiles.length).toBe(2)
    })

    it('throws error when Client imports Server in multi-file chain', async () => {
      // Server -> Client -> Server should fail at Client -> Server
      await expect(
        compileWithFiles('/test/Entry.tsx', {
          '/test/Entry.tsx': `
            import Client from './Client'
            export default function Entry() { return <Client /> }
          `,
          '/test/Client.tsx': `
            "use client"
            import DeepServer from './DeepServer'
            export default function Client() { return <DeepServer /> }
          `,
          '/test/DeepServer.tsx': `
            export default function DeepServer() { return <p>Deep server</p> }
          `,
        })
      ).rejects.toThrow('Client Component cannot import Server Component')
    })
  })
})
