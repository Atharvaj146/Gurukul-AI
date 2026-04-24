/**
 * calendar.js — Generates .ics files for spaced repetition scheduling
 */

export function generateICS(conceptName, reviewDateMs) {
  // Add 30 minutes to review date for the end time
  const startDate = new Date(reviewDateMs);
  const endDate = new Date(reviewDateMs + 30 * 60000);

  // Format date to ICS required format: YYYYMMDDTHHMMSSZ
  const formatICSDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsData = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gurukul AI//Study Companion//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `UID:gurukul-review-${Date.now()}@gurukul.ai`,
    `SUMMARY:Review: ${conceptName}`,
    `DESCRIPTION:Time for your spaced repetition review of "${conceptName}" on Gurukul AI. Keep that forgetting curve flat!`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  // Create a Blob and trigger download
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Review_${conceptName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export default { generateICS };
