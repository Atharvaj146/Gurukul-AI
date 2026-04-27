/**
 * calendar.js — Generates .ics files for spaced repetition scheduling
 */

export function addToGoogleCalendar(conceptName, reviewDateMs) {
  // Add 30 minutes to review date for the end time
  const startDate = new Date(reviewDateMs);
  const endDate = new Date(reviewDateMs + 30 * 60000);

  // Format date to ICS required format: YYYYMMDDTHHMMSSZ
  const formatGoogleDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const title = encodeURIComponent(`Review: ${conceptName}`);
  const details = encodeURIComponent(`Time for your spaced repetition review of "${conceptName}" on Gurukul AI. Keep that forgetting curve flat!`);
  const dates = `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`;

  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}`;

  // Open in a new tab
  window.open(googleCalendarUrl, '_blank');
}

export default { addToGoogleCalendar };
