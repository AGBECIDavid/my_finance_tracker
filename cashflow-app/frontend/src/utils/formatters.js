// Format a number as currency (EUR by default)
export const formatCurrency = (amount, currency = 'EUR') => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

// Format a date as "12 Mar 2025"
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Format a date as YYYY-MM-DD for input type="date"
export const toInputDate = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};
