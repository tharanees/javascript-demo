import dayjs from 'dayjs';
import numeral from 'numeral';

export const formatCurrency = (value, digits = 2) => {
  if (value === null || value === undefined) return '—';
  if (value > 1_000_000_000) {
    return `$${numeral(value).format('0.00a').toUpperCase()}`;
  }
  return `$${numeral(value).format(`0,0.${'0'.repeat(digits)}`)}`;
};

export const formatNumber = (value, digits = 2) => {
  if (value === null || value === undefined) return '—';
  if (Math.abs(value) >= 1_000_000) {
    return numeral(value).format('0.00a').toUpperCase();
  }
  return numeral(value).format(`0,0.${'0'.repeat(digits)}`);
};

export const formatPercent = (value, digits = 2) => {
  if (value === null || value === undefined) return '—';
  return `${value > 0 ? '+' : ''}${value.toFixed(digits)}%`;
};

export const formatTime = (timestamp) => {
  if (!timestamp) return '—';
  return dayjs(timestamp).format('HH:mm:ss');
};

export const deltaColor = (value) => {
  if (value > 0) return 'success.main';
  if (value < 0) return 'error.main';
  return 'text.secondary';
};
