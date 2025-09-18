export const fmtCurrency = (value, currency = 'MXN', locale = 'es-MX') =>
  new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(value || 0));

export const fmtNumber = (value, locale = 'es-MX', maxFraction = 2) =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: maxFraction }).format(Number(value || 0));
