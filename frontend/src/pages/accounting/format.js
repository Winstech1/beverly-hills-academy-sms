export const MONTHS = ['January','February','March','April','May','June','July',
  'August','September','October','November','December'];

export const money = (n) =>
  'GH₵ ' + Number(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const errMsg = (err, fallback) => err?.response?.data?.message || fallback;

export const today = () => new Date().toISOString().slice(0, 10);