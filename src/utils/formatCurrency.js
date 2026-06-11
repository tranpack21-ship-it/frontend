/** Locale y moneda del sistema — peso argentino (ARS) */
export const APP_LOCALE = 'es-AR';
export const APP_CURRENCY = 'ARS';

/** @deprecated Importar desde currencyInput.js */
export { PRICE_INPUT_HINT, CURRENCY_INPUT_HINT } from './currencyInput.js';

const currencyFormatter = new Intl.NumberFormat(APP_LOCALE, {
  style: 'currency',
  currency: APP_CURRENCY,
  currencyDisplay: 'symbol',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integerCurrencyFormatter = new Intl.NumberFormat(APP_LOCALE, {
  style: 'currency',
  currency: APP_CURRENCY,
  currencyDisplay: 'symbol',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const numberFormatters = new Map();

const getNumberFormatter = (decimals) => {
  if (!numberFormatters.has(decimals)) {
    numberFormatters.set(
      decimals,
      new Intl.NumberFormat(APP_LOCALE, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }),
    );
  }
  return numberFormatters.get(decimals);
};

/**
 * Formatea un monto en pesos argentinos (ej. $ 1.234,56).
 * @param {number|string|null|undefined} value
 * @param {{ withoutDecimals?: boolean }} [options]
 */
export const formatCurrency = (value, options = {}) => {
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  const formatter = options.withoutDecimals
    ? integerCurrencyFormatter
    : currencyFormatter;
  return formatter.format(num);
};

/**
 * Formatea números con separadores argentinos (punto miles, coma decimal).
 */
export const formatNumber = (value, decimals = 2) => {
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  return getNumberFormatter(decimals).format(num);
};
