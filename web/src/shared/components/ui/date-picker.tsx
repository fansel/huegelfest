"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { de } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/shared/components/ui/button"
import { Calendar } from "@/shared/components/ui/calender"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover"

export function DatePicker({
  value,
  onChange,
  ...props
}: {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  // ...weitere Props falls nötig
}) {
  // Kein eigener State!
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[240px] justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon />
          {value ? format(value, "PPP", { locale: de }) : <span>Datum wählen</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
          locale={de}
        />
      </PopoverContent>
    </Popover>
  )
}
