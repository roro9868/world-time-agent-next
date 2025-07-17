// Date helper functions
export function generateDateRange(startDate: Date, count: number): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < count; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date);
  }
  return dates;
}

export function groupByMonth(dates: Date[]): Array<{ month: string; start: number; end: number }> {
  const groups: Array<{ month: string; start: number; end: number }> = [];
  let currentMonth = '';
  let startIndex = 0;

  dates.forEach((date, index) => {
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    if (month !== currentMonth) {
      if (currentMonth) {
        groups.push({ month: currentMonth, start: startIndex, end: index - 1 });
      }
      currentMonth = month;
      startIndex = index;
    }
  });

  // Add the last group
  if (currentMonth) {
    groups.push({ month: currentMonth, start: startIndex, end: dates.length - 1 });
  }

  return groups;
}

export function formatDateForDisplay(date: Date): { day: number; weekday: string } {
  return {
    day: date.getDate(),
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' })
  };
} 