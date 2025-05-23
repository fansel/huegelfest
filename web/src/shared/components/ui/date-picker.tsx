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
  // Erkennung von mobilen Geräten
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Mobile: Native HTML date input
  if (isMobile) {
    return (
      <input
        type="date"
        value={value ? value.toISOString().split('T')[0] : ''}
        onChange={(e) => {
          const dateValue = e.target.value;
          onChange(dateValue ? new Date(dateValue) : undefined);
        }}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:border-transparent"
        {...props}
      />
    );
  }

  // Desktop: Popover mit Calendar
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
