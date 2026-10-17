import { useCallback, useId, useSyncExternalStore } from 'react'
import type { ComponentType } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import { useTranslation } from 'react-i18next'
import { RadioGroup } from '@/components/ui/radio-group'
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useTheme } from './theme-provider'
import {
  hasDefaultCaption,
  isThemeValue,
  resolveSystem,
  THEME_VALUES,
  type ThemeControlVariant,
  type ThemeValue,
} from './theme-control.policy'

export type { ThemeControlVariant, ThemeValue } from './theme-control.policy'

export interface ThemeControlProps {
  /**
   * Visual form (Albert PRO.10, user-profile 8.2). Account menu / mobile sheet: `segmented-icons`.
   * Settings > Appearance: `preview-cards`. `submenu` and `radio-items` render menu items and
   * must be placed inside a `DropdownMenuContent`. Default `segmented-icons`.
   */
  variant?: ThemeControlVariant
  /**
   * Controlled value. Omit it to follow the app's `ThemeProvider` (which persists to its storage key
   * and toggles the `dark` class on <html>).
   */
  value?: ThemeValue
  /** Called after every user choice. With no `value` the provider is also updated. */
  onValueChange?: (value: ThemeValue) => void
  /**
   * Show the caption naming the current choice ("System · following your device (Dark)").
   * Default: on for `segmented-icons` and `preview-cards` (required by the guideline), off elsewhere.
   */
  showCaption?: boolean
  /** Accessible name of the group. Defaults to the translated "Theme". */
  'aria-label'?: string
  className?: string
}

const DARK_QUERY = '(prefers-color-scheme: dark)'

// useSyncExternalStore keeps "System" live (OS change, no reload) and SSR-safe (server snapshot = light).
function subscribeSystem(onChange: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const mq = window.matchMedia(DARK_QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}
const getSystemDark = () => typeof window !== 'undefined' && !!window.matchMedia?.(DARK_QUERY).matches
const getServerDark = () => false

// English defaults: a catalog without `themeControl.*` must never show raw keys.
const FALLBACK = {
  label: 'Theme',
  light: 'Light',
  dark: 'Dark',
  system: 'System',
  caption: {
    light: 'Light',
    dark: 'Dark',
    system: 'System · following your device ({{mode}})',
  },
} as const

const ICONS: Record<ThemeValue, ComponentType<{ className?: string; 'aria-hidden'?: boolean }>> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

/**
 * The shared light / dark / system picker (PRO.9, PRO.10, PRO.17). One control, three options.
 * Arrow keys move the selection inside the `radiogroup`; each icon has a tooltip (hover and keyboard
 * focus) and an accessible name, because the System icon is ambiguous alone.
 *
 * @example
 * <ThemeControl />                          // account menu
 * <ThemeControl variant="preview-cards" />  // Settings > Appearance
 */
export function ThemeControl({
  variant = 'segmented-icons',
  value: controlled,
  onValueChange,
  showCaption,
  'aria-label': ariaLabel,
  className,
}: ThemeControlProps) {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const prefersDark = useSyncExternalStore(subscribeSystem, getSystemDark, getServerDark)
  const captionId = useId()

  const value: ThemeValue = controlled ?? theme
  const label = (v: ThemeValue) => t(`themeControl.${v}`, FALLBACK[v])
  const groupLabel = ariaLabel ?? t('themeControl.label', FALLBACK.label)

  const change = useCallback(
    (next: string) => {
      if (!isThemeValue(next)) return
      if (controlled === undefined) setTheme(next)
      onValueChange?.(next)
    },
    [controlled, setTheme, onValueChange],
  )

  const resolved = resolveSystem(prefersDark)
  const captionText =
    value === 'system'
      ? t('themeControl.caption.system', { defaultValue: FALLBACK.caption.system, mode: label(resolved) })
      : t(`themeControl.caption.${value}`, FALLBACK.caption[value])
  const caption = (showCaption ?? hasDefaultCaption(variant)) && (
    <p data-vid="5yho8w3" id={captionId} data-slot="theme-control-caption" className="text-xs text-muted-foreground">
      {captionText}
    </p>
  )
  const describedBy = caption ? captionId : undefined

  if (variant === 'radio-items') {
    return (
      <>
        <DropdownMenuLabel data-vid="5cet12u">{groupLabel}</DropdownMenuLabel>
        <DropdownMenuRadioGroup data-vid="blvnzxb" value={value} onValueChange={change}>
          {THEME_VALUES.map((v) => {
            const Icon = ICONS[v]
            return (
              <DropdownMenuRadioItem data-vid="bouq6ci" key={v} value={v}>
                <Icon data-vid="s4as4e8" aria-hidden className="size-4" />
                {label(v)}
              </DropdownMenuRadioItem>
            )
          })}
        </DropdownMenuRadioGroup>
      </>
    )
  }

  if (variant === 'submenu') {
    const Current = ICONS[value]
    return (
      <DropdownMenuSub data-vid="t07twvg">
        <DropdownMenuSubTrigger data-vid="ftsu7sx">
          <Current data-vid="6yihdaj" aria-hidden className="size-4" />
          {groupLabel}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent data-vid="9hda0ff">
          <DropdownMenuRadioGroup data-vid="6w9i47m" value={value} onValueChange={change}>
            {THEME_VALUES.map((v) => {
              const Icon = ICONS[v]
              return (
                <DropdownMenuRadioItem data-vid="3i5o0zc" key={v} value={v}>
                  <Icon data-vid="styyvhn" aria-hidden className="size-4" />
                  {label(v)}
                </DropdownMenuRadioItem>
              )
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    )
  }

  if (variant === 'select') {
    return (
      <div data-vid="4rco2vu" data-slot="theme-control" data-variant={variant} className={cn('grid gap-1.5', className)}>
        <Select data-vid="thgun7w" value={value} onValueChange={change}>
          <SelectTrigger data-vid="oautkwi" aria-label={groupLabel} aria-describedby={describedBy}>
            <SelectValue data-vid="w6n313v" />
          </SelectTrigger>
          <SelectContent data-vid="t8aowk3">
            {THEME_VALUES.map((v) => (
              <SelectItem data-vid="eglb91p" key={v} value={v}>
                {label(v)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {caption}
      </div>
    )
  }

  if (variant === 'preview-cards') {
    return (
      <div data-vid="69pl7p6" data-slot="theme-control" data-variant={variant} className={cn('grid gap-2', className)}>
        <RadioGroup data-vid="vdupp0b"
          value={value}
          onValueChange={change}
          aria-label={groupLabel}
          aria-describedby={describedBy}
          orientation="horizontal"
          className="grid-cols-3 gap-3"
        >
          {THEME_VALUES.map((v) => (
            <RadioGroupPrimitive.Item data-vid="7yuqd48"
              key={v}
              value={v}
              data-slot="theme-control-item"
              className={cn(
                'group flex flex-col items-stretch gap-2 rounded-lg border border-input p-2 text-left outline-none',
                'transition-colors motion-reduce:transition-none focus-visible:ring-3 focus-visible:ring-ring/50',
                'data-[state=checked]:border-primary data-[state=checked]:ring-1 data-[state=checked]:ring-primary',
              )}
            >
              <Thumbnail data-vid="4v1oea6" mode={v} />
              <span data-vid="w8pus6u" className="flex items-center gap-2 text-sm font-medium">
                {/* The visible radio: the card is the focus target, this dot only shows the state. */}
                <span data-vid="09cfso7"
                  aria-hidden
                  className="grid size-4 shrink-0 place-items-center rounded-full border border-input group-data-[state=checked]:border-primary group-data-[state=checked]:bg-primary"
                >
                  <span data-vid="km5i0kx" className="size-1.5 rounded-full bg-primary-foreground opacity-0 group-data-[state=checked]:opacity-100" />
                </span>
                {label(v)}
              </span>
            </RadioGroupPrimitive.Item>
          ))}
        </RadioGroup>
        {caption}
      </div>
    )
  }

  // segmented-icons | segmented-labels: one container, selected segment marked.
  const iconsOnly = variant === 'segmented-icons'
  return (
    <TooltipProvider data-vid="v8jx3y0">
      <div data-vid="uqoulv1" data-slot="theme-control" data-variant={variant} className={cn('grid gap-1.5', className)}>
        <RadioGroup data-vid="tjifw27"
          value={value}
          onValueChange={change}
          aria-label={groupLabel}
          aria-describedby={describedBy}
          orientation="horizontal"
          className="inline-flex w-fit grid-cols-none gap-0.5 rounded-lg bg-muted p-0.5"
        >
          {THEME_VALUES.map((v) => {
            const Icon = ICONS[v]
            const item = (
              <RadioGroupPrimitive.Item data-vid="9ndhc1r"
                key={v}
                value={v}
                aria-label={label(v)}
                data-slot="theme-control-item"
                className={cn(
                  'inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground outline-none',
                  'transition-colors motion-reduce:transition-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
                  'data-[state=checked]:bg-background data-[state=checked]:text-foreground data-[state=checked]:shadow-sm',
                )}
              >
                <Icon data-vid="3wada13" aria-hidden className="size-4" />
                {!iconsOnly && <span data-vid="vaac5rn">{label(v)}</span>}
              </RadioGroupPrimitive.Item>
            )
            // Tooltip only where the visible text is missing; opens on hover and on keyboard focus.
            if (!iconsOnly) return item
            return (
              <Tooltip data-vid="ueb2oeu" key={v}>
                <TooltipTrigger data-vid="s92shs4" asChild>{item}</TooltipTrigger>
                <TooltipContent data-vid="fj29caw">{label(v)}</TooltipContent>
              </Tooltip>
            )
          })}
        </RadioGroup>
        {caption}
      </div>
    </TooltipProvider>
  )
}

// Fixed colors on purpose: a thumbnail shows a MODE, so it must look the same whichever mode is active.
function Thumbnail({ mode }: { mode: ThemeValue }) {
  const light = 'bg-white [--bar:var(--color-neutral-300)]'
  const dark = 'bg-neutral-900 [--bar:var(--color-neutral-700)]'
  const panel = (cls: string) => (
    <div data-vid="ykdszmr" className={cn('flex h-full flex-1 flex-col gap-1 p-2', cls)}>
      <span data-vid="2zvk37s" className="h-1.5 w-2/3 rounded-sm bg-[var(--bar)]" />
      <span data-vid="5fol6xx" className="h-1.5 w-1/2 rounded-sm bg-[var(--bar)]" />
      <span data-vid="87ni5gi" className="mt-auto h-3 w-1/3 rounded-sm bg-[var(--bar)]" />
    </div>
  )
  return (
    <div data-vid="o9x9hoo" aria-hidden className="flex h-16 overflow-hidden rounded-md border border-border">
      {mode !== 'dark' && panel(light)}
      {mode !== 'light' && panel(dark)}
    </div>
  )
}
