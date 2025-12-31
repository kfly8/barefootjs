"use client"
/**
 * Tabs Documentation Page
 */

import { createSignal, createMemo } from '@barefootjs/dom'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/Tabs'
import {
  PageHeader,
  Section,
  Example,
  CodeBlock,
  PropsTable,
  type PropDefinition,
} from '../_shared/docs'

// Code examples
const installCode = `bunx barefoot add tabs`

const usageCode = `import { createSignal, createMemo } from '@barefootjs/dom'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/tabs'

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

// Interactive example - Basic tabs
// Note: Uses createMemo to compute selection states because the compiler
// doesn't yet support inline comparison expressions in JSX props.
function BasicTabs() {
  const [activeTab, setActiveTab] = createSignal('account')

  const isAccountSelected = createMemo(() => activeTab() === 'account')
  const isPasswordSelected = createMemo(() => activeTab() === 'password')

  return (
    <Tabs value={activeTab()} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger
          value="account"
          selected={isAccountSelected()}
          disabled={false}
          onClick={() => setActiveTab('account')}
        >
          Account
        </TabsTrigger>
        <TabsTrigger
          value="password"
          selected={isPasswordSelected()}
          disabled={false}
          onClick={() => setActiveTab('password')}
        >
          Password
        </TabsTrigger>
      </TabsList>
      <TabsContent value="account" selected={isAccountSelected()}>
        <div class="p-4 rounded-lg border border-zinc-200 bg-white">
          <h4 class="font-medium mb-2">Account Settings</h4>
          <p class="text-zinc-500 text-sm">Make changes to your account here. Click save when you're done.</p>
        </div>
      </TabsContent>
      <TabsContent value="password" selected={isPasswordSelected()}>
        <div class="p-4 rounded-lg border border-zinc-200 bg-white">
          <h4 class="font-medium mb-2">Password Settings</h4>
          <p class="text-zinc-500 text-sm">Change your password here. After saving, you'll be logged out.</p>
        </div>
      </TabsContent>
    </Tabs>
  )
}

// Interactive example - Multiple tabs
function MultipleTabs() {
  const [activeTab, setActiveTab] = createSignal('overview')

  const isOverviewSelected = createMemo(() => activeTab() === 'overview')
  const isAnalyticsSelected = createMemo(() => activeTab() === 'analytics')
  const isReportsSelected = createMemo(() => activeTab() === 'reports')
  const isNotificationsSelected = createMemo(() => activeTab() === 'notifications')

  return (
    <Tabs value={activeTab()} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger
          value="overview"
          selected={isOverviewSelected()}
          disabled={false}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </TabsTrigger>
        <TabsTrigger
          value="analytics"
          selected={isAnalyticsSelected()}
          disabled={false}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </TabsTrigger>
        <TabsTrigger
          value="reports"
          selected={isReportsSelected()}
          disabled={false}
          onClick={() => setActiveTab('reports')}
        >
          Reports
        </TabsTrigger>
        <TabsTrigger
          value="notifications"
          selected={isNotificationsSelected()}
          disabled={false}
          onClick={() => setActiveTab('notifications')}
        >
          Notifications
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview" selected={isOverviewSelected()}>
        <div class="p-4 rounded-lg border border-zinc-200 bg-white">
          <p class="text-zinc-600">Overview content goes here.</p>
        </div>
      </TabsContent>
      <TabsContent value="analytics" selected={isAnalyticsSelected()}>
        <div class="p-4 rounded-lg border border-zinc-200 bg-white">
          <p class="text-zinc-600">Analytics content goes here.</p>
        </div>
      </TabsContent>
      <TabsContent value="reports" selected={isReportsSelected()}>
        <div class="p-4 rounded-lg border border-zinc-200 bg-white">
          <p class="text-zinc-600">Reports content goes here.</p>
        </div>
      </TabsContent>
      <TabsContent value="notifications" selected={isNotificationsSelected()}>
        <div class="p-4 rounded-lg border border-zinc-200 bg-white">
          <p class="text-zinc-600">Notifications content goes here.</p>
        </div>
      </TabsContent>
    </Tabs>
  )
}

// Disabled tab example
function DisabledTabsExample() {
  const [activeTab, setActiveTab] = createSignal('active')

  const isActiveSelected = createMemo(() => activeTab() === 'active')
  const isAnotherSelected = createMemo(() => activeTab() === 'another')

  return (
    <Tabs value={activeTab()}>
      <TabsList>
        <TabsTrigger
          value="active"
          selected={isActiveSelected()}
          disabled={false}
          onClick={() => setActiveTab('active')}
        >
          Active
        </TabsTrigger>
        <TabsTrigger
          value="disabled"
          selected={false}
          disabled={true}
        >
          Disabled
        </TabsTrigger>
        <TabsTrigger
          value="another"
          selected={isAnotherSelected()}
          disabled={false}
          onClick={() => setActiveTab('another')}
        >
          Another
        </TabsTrigger>
      </TabsList>
      <TabsContent value="active" selected={isActiveSelected()}>
        <div class="p-4 rounded-lg border border-zinc-200 bg-white">
          <p class="text-zinc-600">This tab is active.</p>
        </div>
      </TabsContent>
      <TabsContent value="another" selected={isAnotherSelected()}>
        <div class="p-4 rounded-lg border border-zinc-200 bg-white">
          <p class="text-zinc-600">Another active tab.</p>
        </div>
      </TabsContent>
    </Tabs>
  )
}

export function TabsPage() {
  return (
    <div class="space-y-12">
      <PageHeader
        title="Tabs"
        description="A set of layered sections of content—known as tab panels—that are displayed one at a time."
      />

      {/* Preview */}
      <Example title="" code={`<Tabs>...</Tabs>`}>
        <div class="w-full max-w-md">
          <BasicTabs />
        </div>
      </Example>

      {/* Installation */}
      <Section title="Installation">
        <CodeBlock code={installCode} lang="bash" />
      </Section>

      {/* Usage */}
      <Section title="Usage">
        <CodeBlock code={usageCode} />
      </Section>

      {/* Examples */}
      <Section title="Examples">
        <div class="space-y-8">
          <Example title="Basic" code={basicCode}>
            <div class="w-full max-w-md">
              <BasicTabs />
            </div>
          </Example>

          <Example title="Multiple Tabs" code={multipleTabsCode}>
            <div class="w-full max-w-lg">
              <MultipleTabs />
            </div>
          </Example>

          <Example title="Disabled Tab" code={disabledCode}>
            <div class="w-full max-w-md">
              <DisabledTabsExample />
            </div>
          </Example>
        </div>
      </Section>

      {/* API Reference */}
      <Section title="API Reference">
        <div class="space-y-6">
          <div>
            <h3 class="text-lg font-medium text-zinc-100 mb-4">Tabs</h3>
            <PropsTable props={tabsProps} />
          </div>
          <div>
            <h3 class="text-lg font-medium text-zinc-100 mb-4">TabsTrigger</h3>
            <PropsTable props={tabsTriggerProps} />
          </div>
          <div>
            <h3 class="text-lg font-medium text-zinc-100 mb-4">TabsContent</h3>
            <PropsTable props={tabsContentProps} />
          </div>
        </div>
      </Section>
    </div>
  )
}
