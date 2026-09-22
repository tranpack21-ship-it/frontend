import { formatCurrency, formatNumber } from './formatCurrency';
import { formatDateOnly, formatDateTime } from './formatDate';

const fileStamp = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
};

const buildFilename = (fechaDesde, fechaHasta, ext) =>
  `tran-pack_reporte_${fechaDesde}_${fechaHasta}_${fileStamp()}.${ext}`;

export const exportReportExcel = async ({
  fechaDesde,
  fechaHasta,
  dashboard,
  salesByDay,
  topProducts,
  salesByUser,
  lowStock,
  expenses,
  resultado,
  compras,
}) => {
  const XLSX = await import('xlsx');

  const resumen = [
    ['Tran-Pack — Reporte completo'],
    ['Período', `${fechaDesde} al ${fechaHasta}`],
    ['Generado', formatDateTime(new Date())],
    [],
    ['Indicador', 'Valor'],
    ['Ingresos del período', dashboard.ventas.ingresos],
    ['Cantidad de ventas', dashboard.ventas.cantidad],
    ['Ticket promedio', dashboard.ventas.ticket_promedio],
    ['Ventas anuladas', dashboard.ventas.anuladas],
    ['Productos con stock bajo', dashboard.inventario.productos_stock_bajo],
    [],
    ['Total egresos de caja', expenses?.resumen?.total ?? 0],
    ['Cantidad de egresos', expenses?.resumen?.cantidad ?? 0],
    [],
    ['Costo mercadería (est.)', resultado?.costo_mercaderia ?? 0],
    ['Margen bruto', resultado?.margen_bruto ?? 0],
    ['Resultado neto estimado', resultado?.resultado_neto ?? 0],
    [],
    ['Compras — egresos caja', compras?.egresos_caja ?? 0],
    ['Compras — valor entradas', compras?.valor_entradas ?? 0],
    ['Compras — diferencia', compras?.diferencia ?? 0],
  ];

  const porMetodo = [
    ['Método de pago', 'Operaciones', 'Total'],
    ...(dashboard.por_metodo_pago || []).map((m) => [
      m.metodo_pago_nombre || m.metodo_pago,
      m.cantidad,
      m.total,
    ]),
  ];

  const ventasDia = [
    ['Fecha', 'Cantidad', 'Total'],
    ...salesByDay.map((d) => [d.fecha, d.cantidad, d.total]),
  ];

  const topProd = [
    ['#', 'Producto', 'Código', 'Unidades', 'Ingresos'],
    ...topProducts.map((p, i) => [
      i + 1,
      p.producto_nombre,
      p.producto_codigo,
      p.cantidad_vendida,
      p.ingresos,
    ]),
  ];

  const porVendedor = [
    ['Vendedor', 'Ventas', 'Total'],
    ...salesByUser.map((u) => [u.nombre_usuario, u.cantidad, u.total]),
  ];

  const stockBajo = [
    ['Producto', 'Código', 'Stock', 'Mínimo', 'Unidad', 'Categoría'],
    ...lowStock.map((p) => [
      p.nombre,
      p.codigo,
      p.stock,
      p.stock_minimo,
      p.unidad_medida,
      p.categoria_nombre || '',
    ]),
  ];

  const egresosResumen = [
    ['Tran-Pack — Egresos'],
    ['Período', `${fechaDesde} al ${fechaHasta}`],
    [],
    ['Total egresos', expenses?.resumen?.total ?? 0],
    ['Cantidad', expenses?.resumen?.cantidad ?? 0],
    ['Promedio', expenses?.resumen?.promedio ?? 0],
    [],
    ['Método', 'Movimientos', 'Total'],
    ...(expenses?.por_metodo || []).map((m) => [
      m.metodo_pago_nombre,
      m.cantidad,
      m.total,
    ]),
  ];

  const egresosDia = [
    ['Fecha', 'Cantidad', 'Total'],
    ...(expenses?.por_dia || []).map((d) => [d.fecha, d.cantidad, d.total]),
  ];

  const egresosPorDesc = [
    ['Descripción', 'Cantidad', 'Total'],
    ...(expenses?.por_descripcion || []).map((d) => [d.descripcion, d.cantidad, d.total]),
  ];

  const egresosDetalle = [
    ['Fecha', 'Descripción', 'Método', 'Usuario', 'Monto'],
    ...(expenses?.detalle || []).map((e) => [
      e.fecha,
      e.descripcion,
      e.metodo_pago_nombre,
      e.usuario_nombre,
      e.monto,
    ]),
  ];

  const resultadoSheet = [
    ['Tran-Pack — Resultado neto'],
    ['Período', `${fechaDesde} al ${fechaHasta}`],
    [],
    ['Concepto', 'Monto'],
    ...(resultado?.desglose || []).map((r) => [r.concepto, r.monto]),
    [],
    ['Margen bruto %', resultado?.margen_bruto_pct ?? 0],
    ['Resultado neto %', resultado?.resultado_pct ?? 0],
    ['Productos sin costo', resultado?.productos_sin_costo ?? 0],
  ];

  const comprasSheet = [
    ['Tran-Pack — Conciliación compras'],
    ['Período', `${fechaDesde} al ${fechaHasta}`],
    ['Concepto', compras?.concepto ?? 'Compra de mercadería'],
    [],
    ['Egresos en caja', compras?.egresos_caja ?? 0],
    ['Valor entradas a costo', compras?.valor_entradas ?? 0],
    ['Diferencia', compras?.diferencia ?? 0],
    ['Coinciden', compras?.coinciden ? 'Sí' : 'No'],
    [],
    ['Fecha', 'Tipo', 'Detalle', 'Monto/Valor'],
    ...(compras?.detalle_egresos || []).map((e) => [
      e.fecha,
      'Egreso caja',
      e.descripcion,
      e.monto,
    ]),
    ...(compras?.detalle_entradas || []).map((e) => [
      e.fecha,
      'Entrada inventario',
      e.producto_nombre,
      e.valor_costo,
    ]),
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(resumen), 'Resumen');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(porMetodo), 'Por método pago');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(ventasDia), 'Ventas por día');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(topProd), 'Top productos');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(porVendedor), 'Por vendedor');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(stockBajo), 'Stock bajo');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(egresosResumen), 'Egresos');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(egresosDia), 'Egresos por día');
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet(egresosPorDesc),
    'Egresos por concepto'
  );
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(egresosDetalle), 'Detalle egresos');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(resultadoSheet), 'Resultado neto');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(comprasSheet), 'Compras');

  XLSX.writeFile(workbook, buildFilename(fechaDesde, fechaHasta, 'xlsx'));
};

export const exportReportPdf = async ({
  fechaDesde,
  fechaHasta,
  dashboard,
  salesByDay,
  topProducts,
  salesByUser,
  lowStock,
  expenses,
  resultado,
}) => {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 14;
  let y = margin;

  const ensureSpace = (needed = 40) => {
    if (y > 280 - needed) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFontSize(16);
  doc.text('Tran-Pack — Reporte', margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Período: ${fechaDesde} al ${fechaHasta}`, margin, y);
  y += 5;
  doc.text(`Generado: ${formatDateTime(new Date())}`, margin, y);
  y += 8;
  doc.setTextColor(0);

  autoTable(doc, {
    startY: y,
    head: [['Indicador', 'Valor']],
    body: [
      ['Ingresos', formatCurrency(dashboard.ventas.ingresos)],
      ['Ventas completadas', String(dashboard.ventas.cantidad)],
      ['Ticket promedio', formatCurrency(dashboard.ventas.ticket_promedio)],
      ['Ventas anuladas', String(dashboard.ventas.anuladas)],
      ['Total egresos', formatCurrency(expenses?.resumen?.total ?? 0)],
      ['Costo mercadería (est.)', formatCurrency(resultado?.costo_mercaderia ?? 0)],
      ['Margen bruto', formatCurrency(resultado?.margen_bruto ?? 0)],
      ['Resultado neto', formatCurrency(resultado?.resultado_neto ?? 0)],
      ['Stock bajo', String(dashboard.inventario.productos_stock_bajo)],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [234, 179, 8] },
  });

  y = doc.lastAutoTable.finalY + 8;

  if (salesByDay.length > 0) {
    ensureSpace();
    doc.setFontSize(12);
    doc.text('Ventas por día', margin, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [['Fecha', 'Cant.', 'Total']],
      body: salesByDay.map((d) => [
        formatDateOnly(d.fecha),
        String(d.cantidad),
        formatCurrency(d.total),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [51, 65, 85] },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  if (topProducts.length > 0) {
    ensureSpace();
    doc.setFontSize(12);
    doc.text('Top productos', margin, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [['Producto', 'Uds.', 'Ingresos']],
      body: topProducts.map((p) => [
        p.producto_nombre,
        formatNumber(p.cantidad_vendida, 2),
        formatCurrency(p.ingresos),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [51, 65, 85] },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  if (salesByUser.length > 0) {
    ensureSpace();
    doc.setFontSize(12);
    doc.text('Ventas por vendedor', margin, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [['Vendedor', 'Ventas', 'Total']],
      body: salesByUser.map((u) => [
        u.nombre_usuario,
        String(u.cantidad),
        formatCurrency(u.total),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [51, 65, 85] },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  if (expenses?.por_dia?.length > 0) {
    ensureSpace();
    doc.setFontSize(12);
    doc.text('Egresos por día', margin, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [['Fecha', 'Cant.', 'Total']],
      body: expenses.por_dia.map((d) => [
        formatDateOnly(d.fecha),
        String(d.cantidad),
        formatCurrency(d.total),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [185, 28, 28] },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  if (expenses?.detalle?.length > 0) {
    ensureSpace();
    doc.setFontSize(12);
    doc.text('Detalle de egresos', margin, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [['Fecha', 'Descripción', 'Método', 'Monto']],
      body: expenses.detalle.slice(0, 40).map((e) => [
        formatDateOnly(e.fecha),
        e.descripcion,
        e.metodo_pago_nombre,
        formatCurrency(e.monto),
      ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [185, 28, 28] },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  if (resultado?.desglose?.length > 0) {
    ensureSpace();
    doc.setFontSize(12);
    doc.text('Resultado neto', margin, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [['Concepto', 'Monto']],
      body: resultado.desglose.map((r) => [r.concepto, formatCurrency(r.monto)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 23, 42] },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  if (lowStock.length > 0) {
    doc.addPage();
    y = margin;
    doc.setFontSize(12);
    doc.text('Alertas de stock bajo', margin, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [['Producto', 'Stock', 'Mínimo']],
      body: lowStock.map((p) => [
        p.nombre,
        formatNumber(p.stock, 2),
        formatNumber(p.stock_minimo, 2),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [220, 38, 38] },
    });
  }

  doc.save(buildFilename(fechaDesde, fechaHasta, 'pdf'));
};
