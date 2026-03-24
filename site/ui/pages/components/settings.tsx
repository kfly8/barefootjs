/**
 * Settings Reference Page (/components/settings)
 *
 * Block-level composition pattern: Tabs + Card + Field + Switch + AlertDialog + Toast.
 * Compiler stress test for 20+ signals, branch switching, depth 9, and cross-branch toast.
 */

import { SettingsDemo } from '@/components/settings-demo'
import {
  DocPage,
  PageHeader,
  Section,
  Example,
  type TocItem,
} from '../../components/shared/docs'
import { getNavLinks } from '../../components/shared/PageNavigation'

const tocItems: TocItem[] = [
  { id: 'preview', title: 'Preview' },
  { id: 'features', title: 'Features' },
  { id: 'profile', title: 'Profile Tab', branch: 'start' },
  { id: 'account', title: 'Account Tab', branch: 'child' },
  { id: 'notifications', title: 'Notifications Tab', branch: 'end' },
]

const previewCode = `"use client"

import { createSignal, createMemo } from '@barefootjs/dom'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Field, FieldLabel, FieldContent, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { AlertDialog, AlertDialogContent, ... } from '@/components/ui/alert-dialog'
import { ToastProvider, Toast, ... } from '@/components/ui/toast'

function Settings() {
  // Tab state
  const [activeTab, setActiveTab] = createSignal('profile')
  const isProfileSelected = createMemo(() => activeTab() === 'profile')
  const isAccountSelected = createMemo(() => activeTab() === 'account')
  const isNotificationsSelected = createMemo(() => activeTab() === 'notifications')

  // Profile: displayName, profileEmail, bio, profileSaving
  // Account: currentPassword, newPassword, confirmPassword, accountSaving, deleteDialogOpen
  // Notifications: emailNotifications, pushNotifications, marketingEmails,
  //                securityAlerts, notificationFrequency, notificationsSaving
  // Shared: toastOpen, toastMessage
  // 20+ signals, 7+ memos in single component

  return (
    <div className="w-full max-w-2xl">
      <Tabs value={activeTab()} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profile" selected={isProfileSelected()} onClick={...}>Profile</TabsTrigger>
          <TabsTrigger value="account" selected={isAccountSelected()} onClick={...}>Account</TabsTrigger>
          <TabsTrigger value="notifications" selected={isNotificationsSelected()} onClick={...}>Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" selected={isProfileSelected()}>
          <Card>...</Card>
        </TabsContent>
        <TabsContent value="account" selected={isAccountSelected()}>
          <Card>...</Card>
        </TabsContent>
        <TabsContent value="notifications" selected={isNotificationsSelected()}>
          <Card>...</Card>
        </TabsContent>
      </Tabs>
      <ToastProvider position="bottom-right">
        <Toast variant="success" open={toastOpen()}>...</Toast>
      </ToastProvider>
    </div>
  )
}`

export function SettingsRefPage() {
  return (
    <DocPage slug="settings" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Settings"
          description="A settings page block combining Tabs, Card, Field, Switch, AlertDialog, and Toast for multi-section form management."
          {...getNavLinks('settings')}
        />

        {/* Preview */}
        <Section id="preview" title="Preview">
          <Example title="" code={previewCode}>
            <SettingsDemo />
          </Example>
        </Section>

        {/* Features */}
        <Section id="features" title="Features">
          <div className="space-y-4">
            <div>
              <h3 id="profile" className="text-base font-medium text-foreground mb-2">Profile Tab</h3>
              <p className="text-sm text-muted-foreground">
                Avatar display, display name with validation, email, and bio textarea.
                Demonstrates form validation with createMemo and conditional error rendering.
              </p>
            </div>
            <div>
              <h3 id="account" className="text-base font-medium text-foreground mb-2">Account Tab</h3>
              <p className="text-sm text-muted-foreground">
                Password change form with current/new/confirm validation chain.
                Includes AlertDialog for destructive account deletion confirmation.
              </p>
            </div>
            <div>
              <h3 id="notifications" className="text-base font-medium text-foreground mb-2">Notifications Tab</h3>
              <p className="text-sm text-muted-foreground">
                Toggle switches for notification channels, NativeSelect for frequency.
                Tests Switch component wiring with boolean signals.
              </p>
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
