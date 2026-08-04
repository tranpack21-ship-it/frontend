import { formatCurrency, formatNumber } from './formatCurrency';

/**
 * Filas de detalle para PDF / impresión comercial.
 * Columnas: Producto | Cant. | P. unit. | Total
 */
export const buildCommercialLineRows = (detalle = []) =>
  (detalle || []).map((line) => {
    const qtyLabel = `${formatNumber(line.cantidad, 2)}${
      line.modo_venta === 'paquete' ? ' paq.' : ''
    }`;

    const nameParts = [line.producto_nombre || 'Producto'];
    if (line.producto_codigo) nameParts.push(String(line.producto_codigo));
    if (Number(line.descuento) > 0) {
      nameParts.push(`Desc. −${formatCurrency(line.descuento)}`);
    }

    return [
      nameParts.join('\n'),
      qtyLabel,
      formatCurrency(line.precio_unitario),
      formatCurrency(line.subtotal),
    ];
  });

export const COMMERCIAL_LINE_HEAD = ['Producto', 'Cant.', 'P. unit.', 'Total'];

export const commercialLineColumnStyles = {
  1: { halign: 'right', cellWidth: 22 },
  2: { halign: 'right', cellWidth: 32 },
  3: { halign: 'right', cellWidth: 32 },
};
