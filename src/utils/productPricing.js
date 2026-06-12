import { formatCurrency, formatNumber } from './formatCurrency';

export const MODOS_VENTA = {
  SUELTO: 'suelto',
  PAQUETE: 'paquete',
};

export const MODO_VENTA_LABELS = {
  suelto: 'Suelto',
  paquete: 'Paquete',
};

export const hasPaquetePricing = (product) =>
  product != null &&
  product.precio_venta_paquete != null &&
  Number(product.precio_venta_paquete) > 0 &&
  Number(product.unidades_por_paquete) > 0;

export const cartLineKey = (productoId, modoVenta = MODOS_VENTA.SUELTO) =>
  `${productoId}:${modoVenta}`;

export const getPrecioForModo = (product, modoVenta) =>
  modoVenta === MODOS_VENTA.PAQUETE
    ? Number(product.precio_venta_paquete)
    : Number(product.precio_venta);

export const getInventoryQty = (item) =>
  item.modo_venta === MODOS_VENTA.PAQUETE
    ? Number(item.cantidad) * Number(item.unidades_por_paquete || 1)
    : Number(item.cantidad);

export const getCantidadLabel = (item) =>
  item.modo_venta === MODOS_VENTA.PAQUETE ? 'Paquetes' : item.unidad_medida || 'uds';

export const formatPaqueteHint = (product) => {
  if (!hasPaquetePricing(product)) return null;
  const units = formatNumber(product.unidades_por_paquete, 0);
  const unit = product.unidad_medida || 'uds';
  return `1 paq. = ${units} ${unit}`;
};

export const formatPrecioResumen = (product, modoVenta) => {
  if (modoVenta === MODOS_VENTA.PAQUETE) {
    return `${formatCurrency(product.precio_venta_paquete)} / paq.`;
  }
  const unit = product.unidad_medida || 'ud';
  return `${formatCurrency(product.precio_venta)} / ${unit}`;
};

export const buildCartLine = (product, modoVenta = MODOS_VENTA.SUELTO) => ({
  lineKey: cartLineKey(product.id, modoVenta),
  producto_id: product.id,
  modo_venta: modoVenta,
  codigo: product.codigo,
  nombre: product.nombre,
  imagen_url: product.imagen_url,
  color: product.color,
  talle: product.talle,
  stock: product.stock,
  unidad_medida: product.unidad_medida,
  precio_venta: product.precio_venta,
  precio_venta_paquete: product.precio_venta_paquete ?? null,
  unidades_por_paquete: product.unidades_por_paquete ?? 1,
  tiene_precio_paquete: hasPaquetePricing(product),
  precio_unitario: getPrecioForModo(product, modoVenta),
  cantidad: 1,
  descuento: 0,
});
