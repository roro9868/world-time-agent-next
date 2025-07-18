import * as React from "react";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const YEAR_RANGE = 12;

export function CustomDatePicker({
  value,
  onSelect,
  trigger,
}: {
  value?: Date;
  onSelect: (date: Date) => void;
  trigger: React.ReactNode;
}) {
  const today = new Date();
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState(
    value ? value.getMonth() : today.getMonth()
  );
  const [year, setYear] = React.useState(
    value ? value.getFullYear() : today.getFullYear()
  );

  React.useEffect(() => {
    if (open && value) {
      setMonth(value.getMonth());
      setYear(value.getFullYear());
    }
  }, [open, value]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfWeek(year, month);

  function handleDayClick(day: number) {
    const date = new Date(year, month, day);
    onSelect(date);
    setOpen(false);
  }

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function handleToday() {
    setMonth(today.getMonth());
    setYear(today.getFullYear());
    onSelect(today);
    setOpen(false);
  }

  // Generate a range of years centered around the current year
  const years = Array.from({ length: YEAR_RANGE * 2 + 1 }, (_, i) => today.getFullYear() - YEAR_RANGE + i);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <div className="flex items-center justify-between mb-2 gap-2">
          <Button variant="outline" size="sm" className="px-2 py-1 text-xs" onClick={handleToday}>
            Today
          </Button>
          <div className="flex items-center gap-2">
            <Select value={month.toString()} onValueChange={v => setMonth(Number(v))}>
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue>{MONTHS[month]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={m} value={i.toString()}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={year.toString()} onValueChange={v => setYear(Number(v))}>
              <SelectTrigger className="w-[70px] h-8 text-xs">
                <SelectValue>{year}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={prevMonth} aria-label="Previous month">
              &#8592;
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth} aria-label="Next month">
              &#8594;
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="text-xs text-muted-foreground text-center">
              {wd}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={"empty-" + i} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isSelected =
              value &&
              value.getFullYear() === year &&
              value.getMonth() === month &&
              value.getDate() === day;
            const isToday =
              today.getFullYear() === year &&
              today.getMonth() === month &&
              today.getDate() === day;
            return (
              <Button
                key={day}
                variant={isSelected ? "default" : isToday ? "outline" : "ghost"}
                size="icon"
                className={`h-8 w-8 p-0 text-sm font-medium ${isSelected ? "bg-primary text-primary-foreground" : isToday ? "border-primary text-primary" : ""}`}
                onClick={() => handleDayClick(day)}
                aria-label={`Select ${year}-${month + 1}-${day}`}
              >
                {day}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
} 