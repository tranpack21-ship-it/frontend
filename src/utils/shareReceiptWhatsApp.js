import { formatCurrency } from './formatCurrency';
import { downloadBlob, generateReceiptPdfBlob } from './receiptPdf';

const tipoNombre = {
  ticket: 'ticket',
  factura: 'factura',
  boleta: 'boleta',
};

/**
 * Normaliza teléfono a formato internacional para wa.me (sin +).
 * Por defecto asume Argentina (54) si no trae código de país.
 */
export const normalizePhoneForWhatsApp = (phone, defaultCountryCode = '54') => {
  let digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);

  if (defaultCountryCode && !digits.startsWith(defaultCountryCode)) {
    digits = `${defaultCountryCode}${digits}`;
  }

  return digits;
};

export const buildReceiptWhatsAppMessage = (data, { includeAttachHint = false } = {}) => {
  const { comprobante, venta } = data;
  const tipo = tipoNombre[comprobante.tipo] || 'comprobante';
  const nombre = venta.cliente_nombre || 'cliente';
  const total = formatCurrency(venta.total);

  const lines = [
    `Estimado/a ${nombre},`,
    '',
    'Le saludamos desde *Tran-Pack*.',
    '',
    `Le enviamos su ${tipo} N° *${comprobante.numero}* correspondiente a la venta *${venta.numero}*, por un total de *${total}*.`,
    '',
    'Ante cualquier consulta, quedamos a disposición.',
    '',
    '— Equipo Tran-Pack',
  ];

  if (includeAttachHint) {
    lines.push('', '_Por favor adjunte el comprobante PDF en este chat._');
  }

  return lines.join('\n');
};

export const openWhatsAppChat = (phone, message) => {
  const normalized = normalizePhoneForWhatsApp(phone);
  if (!normalized) {
    throw new Error('Número de teléfono inválido');
  }

  const url = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Genera PDF y abre WhatsApp (Web o app según dispositivo).
 * En móvil intenta compartir el PDF directamente; en escritorio descarga el PDF y abre el chat.
 */
export const shareReceiptViaWhatsApp = async ({ receiptData, phone }) => {
  const { blob, filename } = await generateReceiptPdfBlob(receiptData);
  const file = new File([blob], filename, { type: 'application/pdf' });
  const message = buildReceiptWhatsAppMessage(receiptData);

  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        text: message,
        title: `Comprobante ${receiptData.comprobante.numero} — Tran-Pack`,
      });
      return { method: 'native_share' };
    } catch (err) {
      if (err?.name === 'AbortError') {
        return { method: 'cancelled' };
      }
    }
  }

  downloadBlob(blob, filename);
  const chatMessage = buildReceiptWhatsAppMessage(receiptData, { includeAttachHint: true });
  openWhatsAppChat(phone, chatMessage);
  return { method: 'download_and_whatsapp' };
};
