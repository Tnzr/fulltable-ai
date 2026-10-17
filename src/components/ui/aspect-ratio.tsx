"use client"

import * as React from "react"
import { AspectRatio as AspectRatioPrimitive } from "radix-ui"

function AspectRatio({
  ...props
}: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return <AspectRatioPrimitive.Root data-vid="ymu0hz5" data-slot="aspect-ratio" {...props} />
}

export { AspectRatio }
