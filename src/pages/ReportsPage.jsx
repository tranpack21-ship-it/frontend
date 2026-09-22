import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Receipt,
  Users,
  Package,
  XCircle,
  Wallet,
  RefreshCw,
  FileSpreadsheet,
  FileDown,
  ArrowDownCircle,
  ArrowUpCircle,
  Scale,
  PiggyBank,
  ClipboardList,
} from 'lucide-react';
import { reportService } from '../services/reportService';
import { cashConceptService } from '../services/cashConceptService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { EmptyState } from '../components/common/EmptyState';
import { CompactPeriodFilter } from '../components/common/CompactPeriodFilter';
import { getDefaultDateRange, getPresetRange, isValidDateRange } from '../utils/dateRange';
import { formatCurrency, formatNumber } from '../utils/formatCurrency';
import { formatDate, formatDateOnly } from '../utils/formatDate';
import { getErrorMessage } from '../utils/getErrorMessage';
import { exportReportExcel, exportReportPdf } from '../utils/exportReport';

const COMPRA_CONCEPTO = 'Compra de mercadería';

const TABS = [
  { id: 'ingresos', label: 'Ingresos', icon: TrendingUp },
  { id: 'egresos', label: 'Egresos', icon: ArrowDownCircle },
  { id: 'compras', label: 'Compras', icon: Package },
  { id: 'resultado', label: 'Resultado', icon: Scale },
];

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-start gap-2">
    {Icon && <Icon className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />}
    <div>
      <h2 className="font-semibold text-slate-800">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const KpiCard = ({ icon: Icon, label, value, hint, accent = 'brand' }) => {
  const accents = {
    brand: 'border-l-brand-500 text-brand-700',
    emerald: 'border-l-emerald-500 text-emerald-700',
    amber: 'border-l-amber-500 text-amber-800',
    red: 'border-l-red-400 text-red-600',
    slate: 'border-l-slate-400 text-slate-800',
    sky: 'border-l-sky-500 text-sky-800',
  };
  return (
    <Card className={`!p-5 border-l-4 ${accents[accent] || accents.brand}`}>
      <p className="text-sm text-slate-500 flex items-center gap-1">
        {Icon && <Icon className="w-4 h-4" />} {label}
      </p>
      <p className={`text-2xl font-bold mt-1 tabular-nums ${accents[accent]?.split(' ')[1] || ''}`}>
        {value}
      </p>
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </Card>
  );
};

const BarList = ({ items, getKey, getLabel, getValue, getMeta, maxValue, barClass = 'bg-brand-500' }) => (
  <div className="space-y-3">
    {items.map((item) => (
      <div key={getKey(item)}>
        <div className="flex justify-between items-baseline gap-2 text-sm mb-1.5">
          <span className="font-medium text-slate-700 truncate">{getLabel(item)}</span>
          <span className="text-slate-600 tabular-nums shrink-0">
            {formatCurrency(getValue(item))}
            {getMeta ? (
              <span className="text-xs text-slate-400"> {getMeta(item)}</span>
            ) : null}
          </span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barClass}`}
            style={{ width: `${Math.max((getValue(item) / Math.max(maxValue, 1)) * 100, 4)}%` }}
          />
        </div>
      </div>
    ))}
  </div>
);

export const ReportsPage = () => {
  const defaultRange = getDefaultDateRange();
  const [tab, setTab] = useState('ingresos');
  const [fechaDesde, setFechaDesde] = useState(defaultRange.fecha_desde);
  const [fechaHasta, setFechaHasta] = useState(defaultRange.fecha_hasta);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [salesByDay, setSalesByDay] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [salesByUser, setSalesByUser] = useState([]);
  const [expenses, setExpenses] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [compras, setCompras] = useState(null);
  const [exporting, setExporting] = useState(null);
  const [expenseDescFilter, setExpenseDescFilter] = useState('');
  const [expenseConcepts, setExpenseConcepts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    cashConceptService
      .list({ activos: true, tipo: 'egreso' })
      .then((data) => {
        if (!cancelled) setExpenseConcepts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setExpenseConcepts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadReports = useCallback(async () => {
    if (!isValidDateRange(fechaDesde, fechaHasta)) {
      setError('El rango de fechas no es válido');
      return;
    }

    const params = { fecha_desde: fechaDesde, fecha_hasta: fechaHasta };
    const expenseParams = {
      ...params,
      ...(expenseDescFilter ? { descripcion: expenseDescFilter } : {}),
    };
    setLoading(true);
    setError('');
    try {
      const [dash, byDay, top, stock, byUser, egresos, res, comprasRep] =
        await Promise.all([
          reportService.dashboard(params),
          reportService.salesByDay(params),
          reportService.topProducts({ ...params, limit: 8 }),
          reportService.lowStock(),
          reportService.salesByUser(params),
          reportService.expenses(expenseParams),
          reportService.resultado(params),
          reportService.comprasMercaderia({
            ...params,
            concepto: COMPRA_CONCEPTO,
          }),
        ]);
      setDashboard(dash);
      setSalesByDay(byDay);
      setTopProducts(top);
      setLowStock(stock);
      setSalesByUser(byUser);
      setExpenses(egresos);
      setResultado(res);
      setCompras(comprasRep);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [fechaDesde, fechaHasta, expenseDescFilter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handlePresetSelect = (presetId) => {
    if (presetId === 'custom') return;
    const range = getPresetRange(presetId);
    setFechaDesde(range.fecha_desde);
    setFechaHasta(range.fecha_hasta);
  };

  const maxDayTotal = Math.max(...salesByDay.map((d) => d.total), 1);
  const maxUserTotal = Math.max(...salesByUser.map((u) => u.total), 1);
  const maxExpenseDay = Math.max(...(expenses?.por_dia?.map((d) => d.total) || [0]), 1);
  const maxExpenseDesc = Math.max(
    ...(expenses?.por_descripcion?.map((d) => d.total) || [0]),
    1
  );

  const expenseConceptOptions = (() => {
    const opts = [{ value: '', label: 'Todas las descripciones' }];
    const seen = new Set(['']);
    for (const c of expenseConcepts) {
      if (!seen.has(c.nombre)) {
        seen.add(c.nombre);
        opts.push({ value: c.nombre, label: c.nombre });
      }
    }
    for (const d of expenses?.por_descripcion || []) {
      if (
        d.descripcion &&
        d.descripcion !== 'Sin descripción' &&
        !seen.has(d.descripcion)
      ) {
        seen.add(d.descripcion);
        opts.push({
          value: d.descripcion,
          label: `${d.descripcion} (histórico)`,
        });
      }
    }
    return opts;
  })();

  const exportPayload = {
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
  };

  const handleExportExcel = async () => {
    if (!dashboard) return;
    setExporting('excel');
    try {
      await exportReportExcel(exportPayload);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setExporting(null);
    }
  };

  const handleExportPdf = async () => {
    if (!dashboard) return;
    setExporting('pdf');
    try {
      await exportReportPdf(exportPayload);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setExporting(null);
    }
  };

  const headerSummary =
    tab === 'egresos'
      ? expenses?.resumen?.total
      : tab === 'compras'
        ? compras?.diferencia
        : tab === 'resultado'
          ? resultado?.resultado_neto
          : dashboard?.ventas?.ingresos;

  const headerLabel =
    tab === 'egresos'
      ? 'egresos'
      : tab === 'compras'
        ? 'diferencia compras'
        : tab === 'resultado'
          ? 'resultado neto'
          : 'ingresos';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-brand-600" />
            Reportes
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Ingresos, egresos y resultado neto del período
          </p>
        </div>
        {dashboard && !loading && headerSummary != null && (
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
            <TrendingUp className="w-4 h-4 text-brand-600 shrink-0" />
            <span className="tabular-nums">
              <strong
                className={
                  (tab === 'resultado' || tab === 'compras') &&
                  Number(headerSummary) < 0
                    ? 'text-red-700'
                    : 'text-slate-800'
                }
              >
                {formatCurrency(headerSummary)}
              </strong>{' '}
              {headerLabel}
            </span>
          </div>
        )}
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
            <CompactPeriodFilter
              fechaDesde={fechaDesde}
              fechaHasta={fechaHasta}
              onDesdeChange={setFechaDesde}
              onHastaChange={setFechaHasta}
              onPresetSelect={handlePresetSelect}
              loading={loading}
            />
            <div className="flex flex-wrap gap-2 shrink-0 sm:self-center">
              <Button
                variant="outline"
                onClick={handleExportExcel}
                disabled={loading || exporting || !dashboard}
                className="h-11"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">Excel</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPdf}
                disabled={loading || exporting || !dashboard}
                className="h-11"
              >
                <FileDown className="w-4 h-4" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
              <Button
                variant="outline"
                onClick={loadReports}
                disabled={loading || !isValidDateRange(fechaDesde, fechaHasta)}
                className="h-11"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualizar</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/60">
          <div className="inline-flex w-full sm:w-auto rounded-xl border border-slate-200 bg-white p-1 gap-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === id
                    ? 'bg-brand-500 text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {error && <Alert>{error}</Alert>}

      {loading && !dashboard ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : null}

      {dashboard && (
        <div className={`space-y-6 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
          {tab === 'ingresos' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <KpiCard
                  icon={TrendingUp}
                  label="Ingresos del período"
                  value={formatCurrency(dashboard.ventas.ingresos)}
                  hint={`${dashboard.ventas.cantidad} ventas completadas`}
                  accent="brand"
                />
                <KpiCard
                  icon={Receipt}
                  label="Ticket promedio"
                  value={formatCurrency(dashboard.ventas.ticket_promedio)}
                  hint="Por venta completada"
                  accent="emerald"
                />
                <KpiCard
                  icon={XCircle}
                  label="Ventas anuladas"
                  value={dashboard.ventas.anuladas}
                  hint="En el mismo período"
                  accent="amber"
                />
                <KpiCard
                  icon={AlertTriangle}
                  label="Stock bajo"
                  value={dashboard.inventario.productos_stock_bajo}
                  hint="Productos bajo mínimo"
                  accent="red"
                />
              </div>

              {dashboard.por_metodo_pago?.length > 0 && (
                <Card className="!p-0 overflow-hidden">
                  <SectionHeader
                    icon={Wallet}
                    title="Ingresos por método de pago"
                    subtitle="Desglose del período seleccionado"
                  />
                  <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {dashboard.por_metodo_pago.map((m) => {
                      const share =
                        dashboard.ventas.ingresos > 0
                          ? Math.round((m.total / dashboard.ventas.ingresos) * 100)
                          : 0;
                      return (
                        <div
                          key={m.metodo_pago}
                          className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-brand-200 transition-colors"
                        >
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {m.metodo_pago_nombre || m.metodo_pago}
                          </p>
                          <p className="text-xl font-bold text-slate-900 tabular-nums mt-1">
                            {formatCurrency(m.total)}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {m.cantidad} operaciones · {share}%
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card className="!p-0 overflow-hidden">
                  <SectionHeader icon={BarChart3} title="Ventas por día" subtitle="Evolución diaria" />
                  <div className="px-4 sm:px-6 pb-6">
                    {salesByDay.length === 0 ? (
                      <EmptyState
                        title="Sin ventas"
                        description="No hay ventas registradas en este período"
                      />
                    ) : (
                      <BarList
                        items={salesByDay}
                        getKey={(d) => d.fecha}
                        getLabel={(d) => formatDateOnly(d.fecha)}
                        getValue={(d) => d.total}
                        getMeta={(d) => `(${d.cantidad})`}
                        maxValue={maxDayTotal}
                      />
                    )}
                  </div>
                </Card>

                <Card className="!p-0 overflow-hidden">
                  <SectionHeader
                    icon={Package}
                    title="Productos más vendidos"
                    subtitle="Top 8 por ingresos"
                  />
                  <div className="px-4 sm:px-6 pb-6">
                    {topProducts.length === 0 ? (
                      <EmptyState
                        title="Sin datos"
                        description="No hay productos vendidos en el período"
                      />
                    ) : (
                      <ul className="space-y-2">
                        {topProducts.map((p, i) => (
                          <li
                            key={p.producto_id}
                            className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/80"
                          >
                            <span
                              className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                                i === 0
                                  ? 'bg-brand-500 text-slate-900'
                                  : 'bg-brand-100 text-brand-800'
                              }`}
                            >
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-800 truncate">
                                {p.producto_nombre}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {formatNumber(p.cantidad_vendida, 2)} uds ·{' '}
                                {formatCurrency(p.ingresos)}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card className="!p-0 overflow-hidden">
                  <SectionHeader
                    icon={Users}
                    title="Ventas por vendedor"
                    subtitle="Ranking del período"
                  />
                  <div className="px-4 sm:px-6 pb-6">
                    {salesByUser.length === 0 ? (
                      <EmptyState
                        title="Sin datos"
                        description="No hay ventas por vendedor en el período"
                      />
                    ) : (
                      <BarList
                        items={salesByUser}
                        getKey={(u) => u.usuario_id}
                        getLabel={(u) => u.nombre_usuario}
                        getValue={(u) => u.total}
                        getMeta={(u) => `(${u.cantidad})`}
                        maxValue={maxUserTotal}
                        barClass="bg-slate-600"
                      />
                    )}
                  </div>
                </Card>

                <Card className="!p-0 overflow-hidden">
                  <SectionHeader
                    icon={AlertTriangle}
                    title="Alertas de stock bajo"
                    subtitle="Inventario actual (sin filtro de fecha)"
                  />
                  <div className="px-4 sm:px-6 pb-6">
                    {lowStock.length === 0 ? (
                      <div className="text-sm text-emerald-700 py-8 text-center rounded-xl bg-emerald-50 border border-emerald-100">
                        Todos los productos con stock adecuado
                      </div>
                    ) : (
                      <ul className="space-y-2 max-h-72 overflow-y-auto overscroll-contain">
                        {lowStock.map((p) => (
                          <li
                            key={p.id}
                            className="flex justify-between items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100 text-sm"
                          >
                            <span className="font-medium text-slate-800 truncate">{p.nombre}</span>
                            <span className="text-amber-900 tabular-nums shrink-0 text-xs">
                              {formatNumber(p.stock, 2)} / {formatNumber(p.stock_minimo, 2)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Card>
              </div>
            </>
          )}

          {tab === 'egresos' && expenses && (
            <>
              <Card className="!p-4">
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="flex-1 min-w-0">
                    <Select
                      id="filtro-egreso-desc"
                      label="Filtrar por descripción"
                      value={expenseDescFilter}
                      onChange={(e) => setExpenseDescFilter(e.target.value)}
                      options={expenseConceptOptions}
                    />
                  </div>
                  {expenseDescFilter && (
                    <Button
                      variant="outline"
                      className="h-11 shrink-0"
                      onClick={() => setExpenseDescFilter('')}
                    >
                      Limpiar filtro
                    </Button>
                  )}
                </div>
                {expenseDescFilter && (
                  <p className="text-xs text-slate-500 mt-2">
                    Mostrando solo egresos de «{expenseDescFilter}»
                  </p>
                )}
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KpiCard
                  icon={ArrowDownCircle}
                  label="Total egresos"
                  value={formatCurrency(expenses.resumen.total)}
                  hint={`${expenses.resumen.cantidad} movimientos de caja`}
                  accent="red"
                />
                <KpiCard
                  icon={Receipt}
                  label="Promedio por egreso"
                  value={formatCurrency(expenses.resumen.promedio)}
                  hint="En el período seleccionado"
                  accent="amber"
                />
                <KpiCard
                  icon={Wallet}
                  label="Métodos usados"
                  value={expenses.por_metodo.length}
                  hint="Formas de salida de dinero"
                  accent="slate"
                />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card className="!p-0 overflow-hidden">
                  <SectionHeader
                    icon={BarChart3}
                    title="Egresos por día"
                    subtitle="Salidas de caja registradas"
                  />
                  <div className="px-4 sm:px-6 pb-6">
                    {expenses.por_dia.length === 0 ? (
                      <EmptyState
                        title="Sin egresos"
                        description="No hay egresos de caja en este período"
                      />
                    ) : (
                      <BarList
                        items={expenses.por_dia}
                        getKey={(d) => d.fecha}
                        getLabel={(d) => formatDateOnly(d.fecha)}
                        getValue={(d) => d.total}
                        getMeta={(d) => `(${d.cantidad})`}
                        maxValue={maxExpenseDay}
                        barClass="bg-red-500"
                      />
                    )}
                  </div>
                </Card>

                <Card className="!p-0 overflow-hidden">
                  <SectionHeader
                    icon={ArrowDownCircle}
                    title="Egresos por descripción"
                    subtitle="Totales por concepto"
                  />
                  <div className="px-4 sm:px-6 pb-6">
                    {(expenses.por_descripcion || []).length === 0 ? (
                      <EmptyState title="Sin datos" description="Sin egresos en el período" />
                    ) : (
                      <BarList
                        items={expenses.por_descripcion}
                        getKey={(d) => d.descripcion}
                        getLabel={(d) => d.descripcion}
                        getValue={(d) => d.total}
                        getMeta={(d) => `(${d.cantidad})`}
                        maxValue={maxExpenseDesc}
                        barClass="bg-amber-500"
                      />
                    )}
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card className="!p-0 overflow-hidden">
                  <SectionHeader
                    icon={Wallet}
                    title="Egresos por método"
                    subtitle="Cómo salió el dinero"
                  />
                  <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {expenses.por_metodo.length === 0 ? (
                      <EmptyState title="Sin datos" description="Sin egresos en el período" />
                    ) : (
                      expenses.por_metodo.map((m) => {
                        const share =
                          expenses.resumen.total > 0
                            ? Math.round((m.total / expenses.resumen.total) * 100)
                            : 0;
                        return (
                          <div
                            key={m.metodo_pago}
                            className="p-4 rounded-xl bg-red-50/60 border border-red-100"
                          >
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {m.metodo_pago_nombre}
                            </p>
                            <p className="text-xl font-bold text-red-700 tabular-nums mt-1">
                              {formatCurrency(m.total)}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {m.cantidad} movimientos · {share}%
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Card>
              </div>

              <Card className="!p-0 overflow-hidden">
                <SectionHeader
                  icon={ArrowDownCircle}
                  title="Detalle de egresos"
                  subtitle="Últimos 100 del período"
                />
                <div className="px-4 sm:px-6 pb-6">
                  {expenses.detalle.length === 0 ? (
                    <EmptyState
                      title="Sin egresos"
                      description="Registre egresos desde Caja para verlos aquí"
                    />
                  ) : (
                    <>
                      <div className="md:hidden space-y-2">
                        {expenses.detalle.map((e) => (
                          <div
                            key={e.id}
                            className="rounded-xl border border-slate-200 p-3 space-y-1"
                          >
                            <div className="flex justify-between gap-2">
                              <p className="font-medium text-slate-800 text-sm">{e.descripcion}</p>
                              <p className="font-bold text-red-700 tabular-nums shrink-0">
                                −{formatCurrency(e.monto)}
                              </p>
                            </div>
                            <p className="text-xs text-slate-500">
                              {formatDate(e.fecha)} · {e.metodo_pago_nombre} · {e.usuario_nombre}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-left text-slate-500">
                              <th className="py-2 pr-3 font-medium">Fecha</th>
                              <th className="py-2 pr-3 font-medium">Descripción</th>
                              <th className="py-2 pr-3 font-medium">Método</th>
                              <th className="py-2 pr-3 font-medium">Usuario</th>
                              <th className="py-2 text-right font-medium">Monto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {expenses.detalle.map((e) => (
                              <tr key={e.id} className="border-b border-slate-100">
                                <td className="py-2.5 pr-3 text-xs text-slate-500 whitespace-nowrap">
                                  {formatDate(e.fecha)}
                                </td>
                                <td className="py-2.5 pr-3 text-slate-800">{e.descripcion}</td>
                                <td className="py-2.5 pr-3 text-slate-600">{e.metodo_pago_nombre}</td>
                                <td className="py-2.5 pr-3 text-slate-500">{e.usuario_nombre}</td>
                                <td className="py-2.5 text-right font-semibold text-red-700 tabular-nums">
                                  −{formatCurrency(e.monto)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </>
          )}

          {tab === 'compras' && compras && (
            <>
              <Card className="!p-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Compara los egresos de caja con descripción{' '}
                  <strong>«{compras.concepto}»</strong> contra el valor a costo de las
                  entradas de inventario con el mismo motivo. Si gastaste $20.000 en caja e
                  ingresaste mercadería por $20.000 de costo, la diferencia debe ser ~0.
                </p>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <KpiCard
                  icon={ArrowDownCircle}
                  label="Egresos en caja"
                  value={formatCurrency(compras.egresos_caja)}
                  hint={`${compras.cantidad_egresos} egresos · ${compras.concepto}`}
                  accent="red"
                />
                <KpiCard
                  icon={Package}
                  label="Entradas a costo"
                  value={formatCurrency(compras.valor_entradas)}
                  hint={`${compras.cantidad_entradas} mov. · ${formatNumber(compras.unidades_entradas, 2)} uds`}
                  accent="emerald"
                />
                <KpiCard
                  icon={Scale}
                  label="Diferencia"
                  value={formatCurrency(compras.diferencia)}
                  hint={
                    compras.coinciden
                      ? 'Cuadran correctamente'
                      : compras.diferencia > 0
                        ? 'Gastaste más de lo ingresado a costo'
                        : 'Ingresaste más valor del egresado'
                  }
                  accent={compras.coinciden ? 'brand' : 'amber'}
                />
                <KpiCard
                  icon={ClipboardList}
                  label="Estado"
                  value={compras.coinciden ? 'OK' : 'Revisar'}
                  hint={
                    compras.productos_sin_costo > 0
                      ? `${compras.productos_sin_costo} producto(s) sin costo`
                      : 'Usando precio de costo actual'
                  }
                  accent={compras.coinciden ? 'emerald' : 'amber'}
                />
              </div>

              {compras.productos_sin_costo > 0 && (
                <Alert variant="info" className="!py-2.5 text-sm">
                  Hay {compras.productos_sin_costo} producto(s) en las entradas sin precio de
                  costo. Completá el costo en el catálogo para que el valor coincida con caja.
                </Alert>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card className="!p-0 overflow-hidden">
                  <SectionHeader
                    icon={ArrowDownCircle}
                    title="Egresos de caja"
                    subtitle={`Concepto «${compras.concepto}»`}
                  />
                  <div className="px-4 sm:px-6 pb-6">
                    {compras.detalle_egresos.length === 0 ? (
                      <EmptyState
                        title="Sin egresos"
                        description="No hay egresos con ese concepto en el período"
                      />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-left text-slate-500">
                              <th className="py-2 pr-3 font-medium">Fecha</th>
                              <th className="py-2 pr-3 font-medium">Descripción</th>
                              <th className="py-2 text-right font-medium">Monto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {compras.detalle_egresos.map((e) => (
                              <tr key={e.id} className="border-b border-slate-100">
                                <td className="py-2.5 pr-3 text-xs text-slate-500 whitespace-nowrap">
                                  {formatDate(e.fecha)}
                                </td>
                                <td className="py-2.5 pr-3 text-slate-800">{e.descripcion}</td>
                                <td className="py-2.5 text-right font-semibold text-red-700 tabular-nums">
                                  −{formatCurrency(e.monto)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="!p-0 overflow-hidden">
                  <SectionHeader
                    icon={Package}
                    title="Entradas de inventario"
                    subtitle="Valor = cantidad × precio de costo"
                  />
                  <div className="px-4 sm:px-6 pb-6">
                    {compras.detalle_entradas.length === 0 ? (
                      <EmptyState
                        title="Sin entradas"
                        description="No hay entradas con ese motivo en el período"
                      />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-left text-slate-500">
                              <th className="py-2 pr-3 font-medium">Fecha</th>
                              <th className="py-2 pr-3 font-medium">Producto</th>
                              <th className="py-2 pr-3 text-right font-medium">Cant.</th>
                              <th className="py-2 text-right font-medium">Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {compras.detalle_entradas.map((e) => (
                              <tr key={e.id} className="border-b border-slate-100">
                                <td className="py-2.5 pr-3 text-xs text-slate-500 whitespace-nowrap">
                                  {formatDate(e.fecha)}
                                </td>
                                <td className="py-2.5 pr-3 text-slate-800">
                                  <span className="font-medium">{e.producto_nombre}</span>
                                  <span className="block text-xs text-slate-400">
                                    {formatCurrency(e.precio_costo)} / ud
                                  </span>
                                </td>
                                <td className="py-2.5 pr-3 text-right tabular-nums text-slate-600">
                                  {formatNumber(e.cantidad, 2)}
                                </td>
                                <td className="py-2.5 text-right font-semibold text-emerald-700 tabular-nums">
                                  {formatCurrency(e.valor_costo)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </>
          )}

          {tab === 'resultado' && resultado && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <KpiCard
                  icon={ArrowUpCircle}
                  label="Ingresos por ventas"
                  value={formatCurrency(resultado.ingresos_ventas)}
                  hint={`${resultado.cantidad_ventas} ventas`}
                  accent="emerald"
                />
                <KpiCard
                  icon={Package}
                  label="Costo mercadería"
                  value={formatCurrency(resultado.costo_mercaderia)}
                  hint="Estimado con precio de costo actual"
                  accent="amber"
                />
                <KpiCard
                  icon={ArrowDownCircle}
                  label="Egresos de caja"
                  value={formatCurrency(resultado.egresos_caja)}
                  hint={`${resultado.cantidad_egresos} egresos`}
                  accent="red"
                />
                <KpiCard
                  icon={PiggyBank}
                  label="Resultado neto"
                  value={formatCurrency(resultado.resultado_neto)}
                  hint={`${resultado.resultado_pct}% sobre ventas`}
                  accent={resultado.resultado_neto >= 0 ? 'brand' : 'red'}
                />
              </div>

              {resultado.productos_sin_costo > 0 && (
                <Alert variant="info" className="!py-2.5 text-sm">
                  Hay {resultado.productos_sin_costo} producto(s) vendido(s) sin precio de costo
                  cargado. El resultado es estimado: complete el costo en el catálogo para mayor
                  precisión.
                </Alert>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card className="!p-0 overflow-hidden">
                  <SectionHeader
                    icon={Scale}
                    title="Cómo se calcula el resultado"
                    subtitle="Del período seleccionado"
                  />
                  <div className="px-4 sm:px-6 pb-6 space-y-2">
                    {resultado.desglose.map((row) => {
                      const isResult = row.tipo === 'resultado';
                      const isSub = row.tipo === 'subtotal';
                      return (
                        <div
                          key={row.concepto}
                          className={`flex justify-between items-center gap-3 rounded-xl px-3 py-2.5 ${
                            isResult
                              ? 'bg-slate-900 text-white'
                              : isSub
                                ? 'bg-slate-100 border border-slate-200'
                                : 'bg-slate-50 border border-slate-100'
                          }`}
                        >
                          <span
                            className={`text-sm ${
                              isResult ? 'font-semibold' : 'text-slate-700'
                            }`}
                          >
                            {row.concepto}
                          </span>
                          <span
                            className={`tabular-nums font-semibold ${
                              isResult
                                ? row.monto >= 0
                                  ? 'text-brand-400'
                                  : 'text-red-300'
                                : row.monto < 0
                                  ? 'text-red-700'
                                  : 'text-slate-900'
                            }`}
                          >
                            {formatCurrency(row.monto)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <Card className="!p-0 overflow-hidden">
                  <SectionHeader
                    icon={TrendingUp}
                    title="Márgenes"
                    subtitle="Visión rápida de rentabilidad"
                  />
                  <div className="p-4 sm:p-6 space-y-4">
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
                      <p className="text-sm text-slate-600">Margen bruto</p>
                      <p className="text-2xl font-bold text-emerald-800 tabular-nums mt-1">
                        {formatCurrency(resultado.margen_bruto)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Ventas − costo · {resultado.margen_bruto_pct}%
                      </p>
                      <div className="mt-3 h-2.5 bg-white/80 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{
                            width: `${Math.min(Math.max(resultado.margen_bruto_pct, 0), 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div
                      className={`rounded-xl border p-4 ${
                        resultado.resultado_neto >= 0
                          ? 'border-brand-200 bg-brand-50/70'
                          : 'border-red-200 bg-red-50/70'
                      }`}
                    >
                      <p className="text-sm text-slate-600">Resultado neto estimado</p>
                      <p
                        className={`text-2xl font-bold tabular-nums mt-1 ${
                          resultado.resultado_neto >= 0 ? 'text-brand-800' : 'text-red-700'
                        }`}
                      >
                        {formatCurrency(resultado.resultado_neto)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Después de egresos de caja
                        {resultado.ingresos_caja_manuales > 0
                          ? ` (+ ${formatCurrency(resultado.ingresos_caja_manuales)} ingresos manuales)`
                          : ''}
                      </p>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      El costo de mercadería usa el precio de costo actual de cada producto. Si
                      cambió el costo después de vender, el valor es aproximado.
                    </p>
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
