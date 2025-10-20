import { format } from 'date-fns';
import numeral from 'numeral';

export const formatCurrency = (value) => {
  if (value === null || value === undefined) return '—';
  if (Math.abs(value) >= 1000) {
    return `$${numeral(value).format('0,0.00a').toUpperCase()}`;
  }
  return `$${numeral(value).format('0,0.00')}`;
};

export const formatNumber = (value, digits = 2) => {
  if (value === null || value === undefined) return '—';
  return numeral(value).format(`0,0.${'0'.repeat(digits)}`);
};

export const formatPercent = (value) => {
  if (value === null || value === undefined) return '—';
  const formatted = numeral(value / 100).format('+0.00%');
  return formatted;
};

export const formatTime = (timestamp) => {
  if (!timestamp) return '—';
  return format(new Date(timestamp), 'HH:mm:ss');
};

export const formatDateTime = (timestamp) => {
  if (!timestamp) return '—';
  return format(new Date(timestamp), 'MMM d, HH:mm:ss');
};
