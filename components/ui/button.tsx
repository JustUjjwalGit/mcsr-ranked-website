import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-sm font-heading text-sm font-semibold tracking-[0.04em] whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/45 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/25 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'border-2 border-t-[color-mix(in_srgb,var(--primary)_85%,white)] border-l-[color-mix(in_srgb,var(--primary)_85%,white)] border-r-[color-mix(in_srgb,var(--primary)_60%,black)] border-b-[color-mix(in_srgb,var(--primary)_50%,black)] bg-primary text-primary-foreground font-bold shadow-[0_3px_0_0_color-mix(in_srgb,var(--primary)_35%,black)] hover:brightness-110 active:translate-y-[2px] active:shadow-none',
        outline:
          'border-2 border-border bg-card text-foreground font-sans font-medium hover:border-primary hover:text-primary active:translate-y-[1px]',
        secondary:
          'border border-border bg-secondary text-secondary-foreground font-sans hover:border-primary hover:bg-muted aria-expanded:bg-muted aria-expanded:text-secondary-foreground',
        ghost:
          'font-sans hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground',
        destructive:
          'border-2 border-t-[#f56e6e] border-l-[#f56e6e] border-r-[#9e2424] border-b-[#7a1818] bg-[#d63838] text-white font-bold hover:bg-[#e64747] active:translate-y-[1px]',
        link: 'font-sans text-primary underline-offset-4 hover:underline',
      },
      size: {
        default:
          'h-9 gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5',
        xs: "h-6 gap-1 rounded-[2px] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7.5 gap-1 rounded-[2px] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-10 gap-2 px-4 text-base has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3',
        icon: 'size-8',
        'icon-xs':
          "size-6 rounded-[2px] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        'icon-sm':
          'size-7.5 rounded-[2px] in-data-[slot=button-group]:rounded-lg',
        'icon-lg': 'size-9.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
