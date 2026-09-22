import { APP_LOCALE } from './formatCurrency.js';

/**
 * Formatea un número al estilo argentino para mostrar (1.234,56).
 * Usar al salir del campo (blur), no mientras se escribe.
 */
export const numberToCurrencyInputString = (value, { decimals = 2, emptyZero = false } = {}) => {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  if (emptyZero && num === 0) return '';

  if (decimals === 0) {
    return String(Math.max(0, Math.round(num))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  const fixed = num.toFixed(decimals);
  const [intPart, decPart = ''] = fixed.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const trimmed = decPart.replace(/0+$/, '');
  if (!trimmed) return formattedInt;
  return `${formattedInt},${trimmed.padEnd(Math.min(decimals, 2), '0').slice(0, decimals)}`;
};

/**
 * Versión editable sin puntos de miles (1500,5). Evita ambigüedad al borrar.
 */
export const numberToCurrencyEditString = (value, { decimals = 2, emptyZero = false } = {}) => {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  if (emptyZero && num === 0) return '';

  if (decimals === 0) return String(Math.max(0, Math.round(num)));

  const fixed = num.toFixed(decimals);
  const [intPart, decPart = ''] = fixed.split('.');
  const trimmed = decPart.replace(/0+$/, '');
  if (!trimmed) return intPart;
  return `${intPart},${trimmed}`;
};

/**
 * Normaliza pegado US/AR a formato editable argentino (coma decimal, sin miles).
 */
export const normalizePastedCurrency = (input) => {
  if (input == null) return '';
  let s = String(input).trim().replace(/[^\d.,]/g, '');
  if (!s) return '';

  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');

  if (lastComma !== -1 && lastDot !== -1) {
    // El último separador es el decimal: 1.234,56 o 1,234.56
    if (lastDot > lastComma) {
      const intPart = s.slice(0, lastDot).replace(/[.,]/g, '');
      const decPart = s.slice(lastDot + 1).replace(/[^\d]/g, '').slice(0, 2);
      return decPart ? `${intPart},${decPart}` : intPart;
    }
    const intPart = s.slice(0, lastComma).replace(/[.,]/g, '');
    const decPart = s.slice(lastComma + 1).replace(/[^\d]/g, '').slice(0, 2);
    return decPart ? `${intPart},${decPart}` : intPart;
  }

  if (lastDot !== -1) {
    const parts = s.split('.');
    // Un solo punto con 1–2 decimales → decimal US (12.50). Varios puntos → miles (1.234.567).
    if (parts.length === 2 && parts[1].length > 0 && parts[1].length <= 2) {
      return `${parts[0].replace(/[^\d]/g, '')},${parts[1].replace(/[^\d]/g, '')}`;
    }
    return parts.join('').replace(/[^\d]/g, '');
  }

  if (lastComma !== -1) {
    const intPart = s.slice(0, lastComma).replace(/[.,]/g, '');
    const decPart = s.slice(lastComma + 1).replace(/[^\d]/g, '').slice(0, 2);
    const endsWithComma = s.endsWith(',');
    if (endsWithComma && !decPart) return `${intPart || '0'},`;
    return decPart ? `${intPart || '0'},${decPart}` : intPart;
  }

  return s.replace(/[^\d]/g, '');
};

/**
 * Sanitiza mientras el usuario escribe.
 * Sin separadores de miles (evita que "1.50" se vuelva decimal al borrar).
 * Acepta "," o "." como decimal; se normaliza a ",".
 */
export const formatCurrencyInputString = (input, { maxDecimals = 2 } = {}) => {
  if (input == null) return '';
  let s = String(input).replace(/[^\d.,]/g, '');
  if (!s) return '';

  // Primer separador decimal gana; el resto de ,/. se eliminan
  const sepMatch = s.match(/[.,]/);
  if (!sepMatch) {
    return s.replace(/^0+(?=\d)/, '') || (s.includes('0') ? '0' : '');
  }

  const sepIdx = sepMatch.index;
  const intRaw = s.slice(0, sepIdx).replace(/[.,]/g, '');
  const decRaw = s.slice(sepIdx + 1).replace(/[.,]/g, '').slice(0, maxDecimals);
  const endsWithSep = /[.,]$/.test(s);

  let intDigits = intRaw.replace(/^0+(?=\d)/, '');
  if (!intDigits) intDigits = '0';

  if (endsWithSep && !decRaw) return `${intDigits},`;
  return decRaw ? `${intDigits},${decRaw}` : intDigits;
};

/**
 * Convierte texto (editable o formateado) a número.
 */
export const parseCurrencyInput = (input) => {
  if (input == null || input === '') return null;
  const s = String(input).trim();
  if (!s || s === ',' || s === '.') return null;
  if (/[.,]$/.test(s)) return null;

  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastDot > lastComma) {
      const intPart = s.slice(0, lastDot).replace(/[.,]/g, '');
      const decPart = s.slice(lastDot + 1).replace(/[^\d]/g, '');
      const num = parseFloat(`${intPart || '0'}.${decPart || '0'}`);
      return Number.isNaN(num) ? null : num;
    }
    const intPart = s.slice(0, lastComma).replace(/[.,]/g, '');
    const decPart = s.slice(lastComma + 1).replace(/[^\d]/g, '');
    const num = parseFloat(`${intPart || '0'}.${decPart || '0'}`);
    return Number.isNaN(num) ? null : num;
  }

  if (lastComma !== -1) {
    const intPart = s.slice(0, lastComma).replace(/\./g, '');
    const decPart = s.slice(lastComma + 1).replace(/[^\d]/g, '');
    const num = parseFloat(`${intPart || '0'}.${decPart || '0'}`);
    return Number.isNaN(num) ? null : num;
  }

  if (lastDot !== -1) {
    const parts = s.split('.');
    // Varios puntos → miles argentinos (1.234.567)
    if (parts.length > 2) {
      const digits = s.replace(/\./g, '');
      const num = parseFloat(digits);
      return Number.isNaN(num) ? null : num;
    }
    // Un punto: decimal si hay 1–2 dígitos; si hay 3, miles (1.500)
    if (parts[1].length >= 1 && parts[1].length <= 2) {
      const num = parseFloat(`${parts[0].replace(/[^\d]/g, '') || '0'}.${parts[1]}`);
      return Number.isNaN(num) ? null : num;
    }
    const digits = s.replace(/\./g, '');
    const num = parseFloat(digits);
    return Number.isNaN(num) ? null : num;
  }

  const digits = s.replace(/\s/g, '');
  if (!digits) return null;
  const num = parseFloat(digits);
  return Number.isNaN(num) ? null : num;
};

export const clampCurrencyValue = (value, { min, max } = {}) => {
  if (value == null || Number.isNaN(value)) return value;
  let n = value;
  if (min != null && n < min) n = min;
  if (max != null && n > max) n = max;
  return n;
};

/** @deprecated Ya no se muestra en UI */
export const PRICE_INPUT_HINT = '';

/** @deprecated use PRICE_INPUT_HINT */
export const CURRENCY_INPUT_HINT = PRICE_INPUT_HINT;

export const formatCurrencyPreview = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  return new Intl.NumberFormat(APP_LOCALE, {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};
