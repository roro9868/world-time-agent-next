export interface TimeZone {
  name: string;
  city: string;
  country: string;
  offset: number;
  flag?: string;
}

export interface TimeSlot {
  hour: number;
  minute: number;
  time: string;
  date: Date;
  utc: Date;
  isSelected: boolean;
  isWeekend: boolean;
  isMidnight: boolean;
}

export interface Location {
  id: string;
  timezone: TimeZone;
  currentTime: Date;
  timeSlots: TimeSlot[];
}
