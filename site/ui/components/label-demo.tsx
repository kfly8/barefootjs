import { Label } from '@ui/components/ui/label'

const inputClasses = 'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'

export function LabelFormDemo() {
  return (
    <div className="flex flex-col gap-4 max-w-sm">
      <div className="grid w-full items-center gap-1.5">
        <Label for="label-name">Name</Label>
        <input id="label-name" type="text" placeholder="Enter your name" className={inputClasses} />
      </div>
      <div className="grid w-full items-center gap-1.5">
        <Label for="label-email">Email</Label>
        <input id="label-email" type="email" placeholder="Enter your email" className={inputClasses} />
      </div>
    </div>
  )
}

export function LabelDisabledDemo() {
  return (
    <div className="flex flex-col gap-4 max-w-sm">
      <div className="group grid w-full items-center gap-1.5" data-disabled="true">
        <Label for="label-disabled">Disabled field</Label>
        <input id="label-disabled" type="text" disabled placeholder="Cannot edit" className={inputClasses} />
      </div>
    </div>
  )
}
