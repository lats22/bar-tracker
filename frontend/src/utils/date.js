import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export const formatDate = (date) => {
  return format(new Date(date), 'yyyy-MM-dd');
};

export const formatDisplayDate = (date) => {
  return format(new Date(date), 'MMM dd, yyyy');
};

export const formatDateTime = (date) => {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
};

export const getToday = () => {
  return formatDate(new Date());
};

export const getYesterday = () => {
  return formatDate(subDays(new Date(), 1));
};

export const getThisWeek = () => {
  const now = new Date();
  return {
    start: formatDate(startOfWeek(now, { weekStartsOn: 1 })),
    end: formatDate(endOfWeek(now, { weekStartsOn: 1 }))
  };
};

export const getThisMonth = () => {
  const now = new Date();
  return {
    start: formatDate(startOfMonth(now)),
    end: formatDate(endOfMonth(now))
  };
};

export const getThisYear = () => {
  const now = new Date();
  return {
    start: formatDate(startOfYear(now)),
    end: formatDate(endOfYear(now))
  };
};

export const getLast30Days = () => {
  return {
    start: formatDate(subDays(new Date(), 30)),
    end: formatDate(new Date())
  };
};
