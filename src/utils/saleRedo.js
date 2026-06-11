/** Construye el estado de navegación para rehacer una venta anulada */
export const buildSaleRedoState = (venta) => {
  if (!venta?.detalle?.length) return null;

  return {
    redoFrom: {
      cliente_id: venta.cliente_id ? String(venta.cliente_id) : '',
      observaciones: venta.observaciones || '',
      descuento: venta.descuento ?? 0,
      metodo_pago: venta.metodo_pago,
      items: venta.detalle.map((line) => ({
        producto_id: line.producto_id,
        codigo: line.producto_codigo,
        nombre: line.producto_nombre,
        precio_unitario: line.precio_unitario,
        cantidad: line.cantidad,
        descuento: line.descuento ?? 0,
        stock: null,
      })),
    },
  };
};
