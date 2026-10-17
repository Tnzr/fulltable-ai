import * as React from "react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react"
import { useChrome } from "@/lib/i18n"

function Pagination({
  className,
  ...props
}: React.ComponentProps<"nav">) {
  const t = useChrome()
  return (
    <nav data-vid="0gjqnbg"
      role="navigation"
      aria-label={t("kit.pagination.label")}
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul data-vid="w0p4hor"
      data-slot="pagination-content"
      className={cn("flex items-center gap-0.5", className)}
      {...props}
    />
  )
}

function PaginationItem({
  ...props
}: React.ComponentProps<"li">) {
  return <li data-vid="sz0qspv" data-slot="pagination-item" {...props} />
}

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">) {
  return (
    <Button data-vid="hdhemxv"
      asChild
      variant={isActive ? "outline" : "ghost"}
      size={size}
      className={cn(className)}
    >
      <a data-vid="qs7ga8t"
        aria-current={isActive ? "page" : undefined}
        data-slot="pagination-link"
        data-active={isActive}
        {...props}
      />
    </Button>
  )
}

function PaginationPrevious({
  className,
  text,
  ...props
}: React.ComponentProps<typeof PaginationLink> & {
  text?: string
}) {
  const t = useChrome()
  return (
    <PaginationLink data-vid="ud04xej"
      aria-label={t("kit.pagination.goPrevious")}
      size="default"
      className={cn("pl-1.5!", className)}
      {...props}
    >
      <ChevronLeftIcon data-vid="dyk6thu" data-icon="inline-start" />
      <span data-vid="a3l0zxt" className="hidden sm:block">{text ?? t("kit.pagination.previous")}</span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  text,
  ...props
}: React.ComponentProps<typeof PaginationLink> & {
  text?: string
}) {
  const t = useChrome()
  return (
    <PaginationLink data-vid="71s7rjb"
      aria-label={t("kit.pagination.goNext")}
      size="default"
      className={cn("pr-1.5!", className)}
      {...props}
    >
      <span data-vid="pmmupdx" className="hidden sm:block">{text ?? t("kit.pagination.next")}</span>
      <ChevronRightIcon data-vid="9epwf2a" data-icon="inline-end" />
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const t = useChrome()
  return (
    <span data-vid="js7v64l"
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "flex size-8 items-center justify-center [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <MoreHorizontalIcon data-vid="6kk8lvx"
      />
      <span data-vid="7jlbczp" className="sr-only">{t("kit.pagination.more")}</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
