/**
 * Avatar Documentation Page
 */

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { AvatarDemo, AvatarFallbackDemo, AvatarGroupDemo } from '@/components/avatar-demo'
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

// Table of contents items
const tocItems: TocItem[] = [
  { id: 'installation', title: 'Installation' },
  { id: 'examples', title: 'Examples' },
  { id: 'basic', title: 'Basic', branch: 'start' },
  { id: 'with-fallback', title: 'With Fallback', branch: 'child' },
  { id: 'group', title: 'Group', branch: 'end' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const previewCode = `import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

function AvatarDemo() {
  return (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  )
}`

const basicCode = `import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

function AvatarBasic() {
  return (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  )
}`

const fallbackCode = `import { Avatar, AvatarFallback } from '@/components/ui/avatar'

function AvatarWithFallback() {
  return (
    <Avatar>
      <AvatarFallback>BF</AvatarFallback>
    </Avatar>
  )
}`

const groupCode = `import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

function AvatarGroup() {
  return (
    <div className="flex -space-x-3">
      <Avatar className="border-2 border-background">
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarFallback>CD</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarFallback>+3</AvatarFallback>
      </Avatar>
    </div>
  )
}`

// Props definitions
const avatarProps: PropDefinition[] = [
  {
    name: 'className',
    type: 'string',
    description: 'Additional CSS classes for the avatar container.',
  },
  {
    name: 'children',
    type: 'ReactNode',
    description: 'AvatarImage and AvatarFallback components.',
  },
]

const avatarImageProps: PropDefinition[] = [
  {
    name: 'src',
    type: 'string',
    description: 'The image source URL.',
  },
  {
    name: 'alt',
    type: 'string',
    description: 'Alt text for the image.',
  },
  {
    name: 'className',
    type: 'string',
    description: 'Additional CSS classes for the image.',
  },
]

const avatarFallbackProps: PropDefinition[] = [
  {
    name: 'className',
    type: 'string',
    description: 'Additional CSS classes for the fallback.',
  },
  {
    name: 'children',
    type: 'ReactNode',
    description: 'Fallback content (typically user initials).',
  },
]

export function AvatarPage() {
  return (
    <DocPage slug="avatar" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Avatar"
          description="An image element with a fallback for representing the user."
          {...getNavLinks('avatar')}
        />

        {/* Preview */}
        <Example title="" code={previewCode}>
          <AvatarDemo />
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add avatar" />
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Basic" code={basicCode}>
              <AvatarDemo />
            </Example>

            <Example title="With Fallback" code={fallbackCode}>
              <AvatarFallbackDemo />
            </Example>

            <Example title="Group" code={groupCode}>
              <AvatarGroupDemo />
            </Example>
          </div>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Avatar</h3>
              <PropsTable props={avatarProps} />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">AvatarImage</h3>
              <PropsTable props={avatarImageProps} />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">AvatarFallback</h3>
              <PropsTable props={avatarFallbackProps} />
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
