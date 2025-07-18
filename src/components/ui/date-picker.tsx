import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Calendar } from "./calendar"

export function DatePicker({
  date,
  onDateChange,
  fromYear = 2000,
  toYear = 2100,
  className,
}: {
  date: Date | undefined
  onDateChange: (date: Date | undefined) => void
  fromYear?: number
  toYear?: number
  className?: string
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn("h-10 w-10 p-0 flex items-center justify-center", className)}
          aria-label="Open calendar"
        >
          <CalendarIcon className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          defaultMonth={date}
          captionLayout="dropdown"
          startMonth={new Date(fromYear, 0)}
          endMonth={new Date(toYear, 11)}
          className="rounded-lg border shadow-sm"
        />
      </PopoverContent>
    </Popover>
  )
} 