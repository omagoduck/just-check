/**
 * Predefined time ranges for search filtering
 * These are used by AI to specify time periods that will be converted to specific dates
 */
export enum TimeRange {
  Today = 'Today',
  Last7Days = 'Last 7 days',
  Last30Days = 'Last 30 days',
  Last3Months = 'Last 3 months',
  Last6Months = 'Last 6 months',
  LastYear = 'Last year'
}

/**
 * Converts a TimeRange enum value to a start date
 * The end date will be automatically set to today by the search provider
 * @param timeRange The time range to convert
 * @returns Start date in DD-MM-YYYY format
 */
export function convertTimeRangeToStartDate(timeRange: TimeRange): string {
  const today = new Date();
  let startDate = new Date(today);

  switch (timeRange) {
    case TimeRange.Today:
      // Start date is today
      startDate.setHours(0, 0, 0, 0);
      break;

    case TimeRange.Last7Days:
      startDate.setDate(today.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;

    case TimeRange.Last30Days:
      startDate.setDate(today.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      break;

    case TimeRange.Last3Months:
      startDate.setMonth(today.getMonth() - 3);
      startDate.setHours(0, 0, 0, 0);
      break;

    case TimeRange.Last6Months:
      startDate.setMonth(today.getMonth() - 6);
      startDate.setHours(0, 0, 0, 0);
      break;

    case TimeRange.LastYear:
      startDate.setFullYear(today.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
  }

  return formatDate(startDate);
}

/**
 * Formats a Date object as DD-MM-YYYY
 * @param date The date to format
 * @returns Formatted date string
 */
function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}
