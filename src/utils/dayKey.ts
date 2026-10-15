// Calendar-day labels used to count streaks and the daily goal.
/** Day labels like "2026-09-21" for streaks and daily goals. */
const label = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
/** Today and yesterday as day labels in the phone's local time zone. */
export const DayKey = {
  today: () => label(new Date()),
  yesterday: () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return label(d);
  },
};
