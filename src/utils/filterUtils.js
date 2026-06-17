export const filterUtils = (reminders, activeFilter, dismissed) => {
  return reminders.filter((reminder) => {
    const notDismissed = !dismissed.includes(reminder.id);
    const matchesFilter =
      activeFilter === "all" || reminder.type === activeFilter;

    return notDismissed && matchesFilter;
  });
};
