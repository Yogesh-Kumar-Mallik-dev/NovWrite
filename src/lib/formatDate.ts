/**
 * =============================================================================
 * Cultivation Calendar
 * =============================================================================
 *
 * Calendar Rules
 * -----------------------------------------------------------------------------
 * • 7 Days per Week
 * • 5 Weeks per Month
 * • 35 Days per Month
 * • 12 Months per Year
 * • 420 Days per Year
 *
 * • Year may be negative.
 * • Year 0 is the historical pivot.
 *
 * This world's calendar is perfectly cyclical:
 * • Every week starts on Solarday.
 * • Every month starts on Solarday.
 * • Every year starts on Solarday.
 *
 * Therefore:
 * • The weekday depends only on the day of the month.
 * =============================================================================
 */

export const DAYS_PER_WEEK = 7;
export const WEEKS_PER_MONTH = 5;
export const DAYS_PER_MONTH = 35;
export const MONTHS_PER_YEAR = 12;
export const DAYS_PER_YEAR = DAYS_PER_MONTH * MONTHS_PER_YEAR;

export const WEEKDAYS = [
  "Solarday",
  "Lunarday",
  "Stellarday",
  "Anemoday",
  "Igisday",
  "Bhooday",
  "Atmaday",
] as const;

export const WEEKS = [
  "Adya",
  "Logos",
  "Daohe",
  "Maara",
  "Punar",
] as const;

export const MONTHS = [
  "Adira",
  "Maara",
  "Daorin",
  "Urdis",
  "Lucis",
  "Namar",
  "Reiya",
  "Sophis",
  "Pariza",
  "Kinar",
  "Nemis",
  "Ananta",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];
export type Week = (typeof WEEKS)[number];
export type Month = (typeof MONTHS)[number];

export interface WorldDate {
  year: number;
  month: number;
  day: number;
}

export interface MonthDay {
  month: number;
  monthName: Month;
  day: number;
}

export interface WeekInfo {
  week: number;
  weekName: Week;
  dayOfWeek: number;
  weekday: Weekday;
}

export interface WeekRange {
  week: number;
  weekName: Week;
  startDay: number;
  endDay: number;
}

/* -------------------------------------------------------------------------- */
/*                                  Validation                                */
/* -------------------------------------------------------------------------- */

export const validateDate = (
  date: WorldDate,
): void => {
  if (date.month < 1 || date.month > MONTHS_PER_YEAR) {
    throw new RangeError(
      `Month must be between 1 and ${MONTHS_PER_YEAR}.`,
    );
  }

  if (date.day < 1 || date.day > DAYS_PER_MONTH) {
    throw new RangeError(
      `Day must be between 1 and ${DAYS_PER_MONTH}.`,
    );
  }
};

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

export const getMonthName = (
  month: number,
): Month => {
  if (month < 1 || month > MONTHS_PER_YEAR) {
    throw new RangeError(
      `Month must be between 1 and ${MONTHS_PER_YEAR}.`,
    );
  }

  return MONTHS[month - 1];
};

export const getWeekName = (
  week: number,
): Week => {
  if (week < 1 || week > WEEKS_PER_MONTH) {
    throw new RangeError(
      `Week must be between 1 and ${WEEKS_PER_MONTH}.`,
    );
  }

  return WEEKS[week - 1];
};

/* -------------------------------------------------------------------------- */
/*                              Week Calculations                             */
/* -------------------------------------------------------------------------- */

export const getWeekday = (
  date: WorldDate,
): Weekday => {
  validateDate(date);

  return WEEKDAYS[(date.day - 1) % DAYS_PER_WEEK];
};

export const dayToWeek = (
  day: number,
): WeekInfo => {
  if (day < 1 || day > DAYS_PER_MONTH) {
    throw new RangeError(
      `Day must be between 1 and ${DAYS_PER_MONTH}.`,
    );
  }

  const weekIndex = Math.floor((day - 1) / DAYS_PER_WEEK);

  return {
    week: weekIndex + 1,
    weekName: WEEKS[weekIndex],
    dayOfWeek: ((day - 1) % DAYS_PER_WEEK) + 1,
    weekday: WEEKDAYS[(day - 1) % DAYS_PER_WEEK],
  };
};

export const weekToDayRange = (
  week: number,
): WeekRange => {
  if (week < 1 || week > WEEKS_PER_MONTH) {
    throw new RangeError(
      `Week must be between 1 and ${WEEKS_PER_MONTH}.`,
    );
  }

  const startDay =
    (week - 1) * DAYS_PER_WEEK + 1;

  return {
    week,
    weekName: WEEKS[week - 1],
    startDay,
    endDay: startDay + DAYS_PER_WEEK - 1,
  };
};

/* -------------------------------------------------------------------------- */
/*                             Month Calculations                             */
/* -------------------------------------------------------------------------- */

export const dateToDayOfYear = (
  month: number,
  day: number,
): number => {
  if (month < 1 || month > MONTHS_PER_YEAR) {
    throw new RangeError(
      `Month must be between 1 and ${MONTHS_PER_YEAR}.`,
    );
  }

  if (day < 1 || day > DAYS_PER_MONTH) {
    throw new RangeError(
      `Day must be between 1 and ${DAYS_PER_MONTH}.`,
    );
  }

  return (month - 1) * DAYS_PER_MONTH + day;
};

export const dayOfYearToDate = (
  dayOfYear: number,
): MonthDay => {
  if (dayOfYear < 1 || dayOfYear > DAYS_PER_YEAR) {
    throw new RangeError(
      `Day of year must be between 1 and ${DAYS_PER_YEAR}.`,
    );
  }

  const monthIndex = Math.floor(
    (dayOfYear - 1) / DAYS_PER_MONTH,
  );

  return {
    month: monthIndex + 1,
    monthName: MONTHS[monthIndex],
    day:
      ((dayOfYear - 1) % DAYS_PER_MONTH) + 1,
  };
};

export const getDayOfYear = (
  date: Pick<WorldDate, "month" | "day">,
): number =>
  dateToDayOfYear(
    date.month,
    date.day,
  );

/* -------------------------------------------------------------------------- */
/*                                 Formatting                                 */
/* -------------------------------------------------------------------------- */

export const formatDate = (
  date: WorldDate,
): string => {
  validateDate(date);

  return `${date.year} ${getMonthName(
    date.month,
  )} ${date.day}`;
};

export const formatLongDate = (
  date: WorldDate,
): string => {
  validateDate(date);

  const week = dayToWeek(date.day);

  return `${date.year} ${getMonthName(
    date.month,
  )}, ${week.weekName}, ${week.weekday}, Day ${date.day
    }`;
};
