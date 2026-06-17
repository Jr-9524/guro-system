export const formatDate = (value) => {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

export const startOfDay = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const daysUntil = (value) => {
  if (!value) return null;

  const target = startOfDay(value);
  if (Number.isNaN(target.getTime())) return null;

  return Math.ceil((target - startOfDay()) / 86400000);
};
