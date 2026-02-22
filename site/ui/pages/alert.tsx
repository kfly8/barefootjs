/**
 * Alert Documentation Page
 */

import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import {
  DocPage,
  PageHeader,
  Section,
  Example,
  PropsTable,
  PackageManagerTabs,
  type PropDefinition,
  type TocItem,
} from '../components/shared/docs'
import { getNavLinks } from '../components/shared/PageNavigation'

const tocItems: TocItem[] = [
  { id: 'installation', title: 'Installation' },
  { id: 'examples', title: 'Examples' },
  { id: 'default', title: 'Default', branch: 'start' },
  { id: 'destructive', title: 'Destructive', branch: 'end' },
  { id: 'api-reference', title: 'API Reference' },
]

const previewCode = `import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

function AlertDemo() {
  return (
    <Alert>
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components to your app using the CLI.
      </AlertDescription>
    </Alert>
  )
}`

const defaultCode = `import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

function AlertDefault() {
  return (
    <Alert>
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components to your app using the CLI.
      </AlertDescription>
    </Alert>
  )
}`

const destructiveCode = `import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

function AlertDestructive() {
  return (
    <Alert variant="destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Your session has expired. Please log in again.
      </AlertDescription>
    </Alert>
  )
}`

const alertProps: PropDefinition[] = [
  {
    name: 'variant',
    type: "'default' | 'destructive'",
    defaultValue: "'default'",
    description: 'The visual style of the alert.',
  },
  {
    name: 'children',
    type: 'ReactNode',
    description: 'The content of the alert (typically AlertTitle and AlertDescription).',
  },
]

const alertTitleProps: PropDefinition[] = [
  {
    name: 'children',
    type: 'ReactNode',
    description: 'The title text of the alert.',
  },
]

const alertDescriptionProps: PropDefinition[] = [
  {
    name: 'children',
    type: 'ReactNode',
    description: 'The description text of the alert.',
  },
]

export function AlertPage() {
  return (
    <DocPage slug="alert" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Alert"
          description="Displays a callout for important content."
          {...getNavLinks('alert')}
        />

        {/* Preview */}
        <Example title="" code={previewCode}>
          <Alert>
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>
              You can add components to your app using the CLI.
            </AlertDescription>
          </Alert>
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add alert" />
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Default" code={defaultCode}>
              <Alert>
                <AlertTitle>Heads up!</AlertTitle>
                <AlertDescription>
                  You can add components to your app using the CLI.
                </AlertDescription>
              </Alert>
            </Example>

            <Example title="Destructive" code={destructiveCode}>
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Your session has expired. Please log in again.
                </AlertDescription>
              </Alert>
            </Example>
          </div>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Alert</h3>
              <PropsTable props={alertProps} />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">AlertTitle</h3>
              <PropsTable props={alertTitleProps} />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">AlertDescription</h3>
              <PropsTable props={alertDescriptionProps} />
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
