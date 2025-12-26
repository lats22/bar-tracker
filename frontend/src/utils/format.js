export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB'
  }).format(amount || 0);
};

export const formatNumber = (num) => {
  return new Intl.NumberFormat('th-TH').format(num || 0);
};

export const formatPercent = (value) => {
  return `${(value || 0).toFixed(2)}%`;
};
