/**
 * Tabs Documentation Page
 */

import { TabsBasicDemo, TabsMultipleDemo, TabsDisabledDemo } from '@/components/tabs-demo'
import {
  DocPage,
  PageHeader,
  Section,
  Example,
  CodeBlock,
  PropsTable,
  type PropDefinition,
  type TocItem,
} from '../components/shared/docs'
import { getNavLinks } from '../components/shared/PageNavigation'

// Table of contents items
const tocItems: TocItem[] = [
  { id: 'installation', title: 'Installation' },
  { id: 'usage', title: 'Usage' },
  { id: 'examples', title: 'Examples' },
  { id: 'accessibility', title: 'Accessibility' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const installCode = `bunx barefoot add tabs`

const usageCode = `import { createSignal, createMemo } from '@barefootjs/dom'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'

export default function Page() {
  const [activeTab, setActiveTab] = createSignal('account')

  // Use createMemo for derived selection states
  const isAccountSelected = createMemo(() => activeTab() === 'account')
  const isPasswordSelected = createMemo(() => activeTab() === 'password')

  return (
    <Tabs value={activeTab()} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger
          value="account"
          selected={isAccountSelected()}
          onClick={() => setActiveTab('account')}
        >
          Account
        </TabsTrigger>
        <TabsTrigger
          value="password"
          selected={isPasswordSelected()}
          onClick={() => setActiveTab('password')}
        >
          Password
        </TabsTrigger>
      </TabsList>
      <TabsContent value="account" selected={isAccountSelected()}>
        Make changes to your account here.
      </TabsContent>
      <TabsContent value="password" selected={isPasswordSelected()}>
        Change your password here.
      </TabsContent>
    </Tabs>
  )
}`

const basicCode = `const [activeTab, setActiveTab] = createSignal('account')

// Use createMemo for derived selection states
const isAccountSelected = createMemo(() => activeTab() === 'account')
const isPasswordSelected = createMemo(() => activeTab() === 'password')

<Tabs value={activeTab()}>
  <TabsList>
    <TabsTrigger
      value="account"
      selected={isAccountSelected()}
      onClick={() => setActiveTab('account')}
    >
      Account
    </TabsTrigger>
    <TabsTrigger
      value="password"
      selected={isPasswordSelected()}
      onClick={() => setActiveTab('password')}
    >
      Password
    </TabsTrigger>
  </TabsList>
  <TabsContent value="account" selected={isAccountSelected()}>
    Make changes to your account here.
  </TabsContent>
  <TabsContent value="password" selected={isPasswordSelected()}>
    Change your password here.
  </TabsContent>
</Tabs>`

const multipleTabsCode = `const [activeTab, setActiveTab] = createSignal('overview')

// Use createMemo for each tab's selection state
const isOverviewSelected = createMemo(() => activeTab() === 'overview')
const isAnalyticsSelected = createMemo(() => activeTab() === 'analytics')
const isReportsSelected = createMemo(() => activeTab() === 'reports')
const isNotificationsSelected = createMemo(() => activeTab() === 'notifications')

<Tabs value={activeTab()}>
  <TabsList>
    <TabsTrigger value="overview" selected={isOverviewSelected()} onClick={() => setActiveTab('overview')}>
      Overview
    </TabsTrigger>
    <TabsTrigger value="analytics" selected={isAnalyticsSelected()} onClick={() => setActiveTab('analytics')}>
      Analytics
    </TabsTrigger>
    <TabsTrigger value="reports" selected={isReportsSelected()} onClick={() => setActiveTab('reports')}>
      Reports
    </TabsTrigger>
    <TabsTrigger value="notifications" selected={isNotificationsSelected()} onClick={() => setActiveTab('notifications')}>
      Notifications
    </TabsTrigger>
  </TabsList>
  {/* TabsContent for each tab... */}
</Tabs>`

const disabledCode = `<TabsTrigger value="disabled" disabled>
  Disabled Tab
</TabsTrigger>`

// Props definition
const tabsProps: PropDefinition[] = [
  {
    name: 'value',
    type: 'string',
    description: 'The currently selected tab value.',
  },
  {
    name: 'defaultValue',
    type: 'string',
    description: 'The initial tab value when uncontrolled.',
  },
  {
    name: 'onValueChange',
    type: '(value: string) => void',
    description: 'Event handler called when the selected tab changes.',
  },
]

const tabsTriggerProps: PropDefinition[] = [
  {
    name: 'value',
    type: 'string',
    description: 'A unique value for the tab.',
  },
  {
    name: 'selected',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the tab is currently selected.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the tab is disabled.',
  },
  {
    name: 'onClick',
    type: '() => void',
    description: 'Event handler called when the tab is clicked.',
  },
]

const tabsContentProps: PropDefinition[] = [
  {
    name: 'value',
    type: 'string',
    description: 'The value that associates the content with a trigger.',
  },
  {
    name: 'selected',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the content is visible.',
  },
]

export function TabsPage() {
  return (
    <DocPage slug="tabs" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Tabs"
          description="A set of layered sections of content—known as tab panels—that are displayed one at a time."
          {...getNavLinks('tabs')}
        />

        {/* Preview */}
        <Example title="" code={`<Tabs>...</Tabs>`}>
          <div className="w-full max-w-md">
            <TabsBasicDemo />
          </div>
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <CodeBlock code={installCode} lang="bash" />
        </Section>

        {/* Usage */}
        <Section id="usage" title="Usage">
          <CodeBlock code={usageCode} />
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Basic" code={basicCode}>
              <div className="w-full max-w-md">
                <TabsBasicDemo />
              </div>
            </Example>

            <Example title="Multiple Tabs" code={multipleTabsCode}>
              <div className="w-full max-w-lg">
                <TabsMultipleDemo />
              </div>
            </Example>

            <Example title="Disabled Tab" code={disabledCode}>
              <div className="w-full max-w-md">
                <TabsDisabledDemo />
              </div>
            </Example>
          </div>
        </Section>

        {/* Accessibility */}
        <Section id="accessibility" title="Accessibility">
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong className="text-foreground">Keyboard Navigation</strong> - Arrow Left/Right to switch tabs, Home/End to jump to first/last</li>
            <li><strong className="text-foreground">Focus Management</strong> - Focus moves to the selected tab trigger</li>
            <li><strong className="text-foreground">ARIA</strong> - role="tablist" on container, role="tab" on triggers, role="tabpanel" on content</li>
            <li><strong className="text-foreground">State Attributes</strong> - aria-selected on triggers, aria-controls/aria-labelledby for associations</li>
            <li><strong className="text-foreground">Disabled State</strong> - aria-disabled on disabled tabs, skipped in keyboard navigation</li>
          </ul>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">Tabs</h3>
              <PropsTable props={tabsProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">TabsTrigger</h3>
              <PropsTable props={tabsTriggerProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">TabsContent</h3>
              <PropsTable props={tabsContentProps} />
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
