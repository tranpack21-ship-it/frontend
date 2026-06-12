import { useMemo } from 'react';
import { Plus, Trash2, Banknote, Split, CircleDollarSign } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { CurrencyInput } from '../ui/CurrencyInput';
import { formatCurrency } from '../../utils/formatCurrency';
import { PRICE_INPUT_HINT } from '../../utils/currencyInput';

const newLineId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `pay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const createPaymentLine = (metodoPago, monto = 0, montoRecibido = null) => ({
  id: newLineId(),
  metodo_pago: metodoPago,
  monto: Number(monto) || 0,
  monto_recibido: montoRecibido != null ? Number(montoRecibido) : null,
});

export const SalePaymentSplitEditor = ({
  paymentMethods = [],
  total = 0,
  splitMode,
  onSplitModeChange,
  lines,
  onLinesChange,
  defaultMethodCode,
}) => {
  const methodsByCode = useMemo(
    () => Object.fromEntries(paymentMethods.map((m) => [m.codigo, m])),
    [paymentMethods]
  );

  const allocated = useMemo(
    () => lines.reduce((acc, line) => acc + (Number(line.monto) || 0), 0),
    [lines]
  );

  const remainder = Math.round((total - allocated) * 100) / 100;
  const isBalanced = Math.abs(remainder) < 0.01;

  const methodOptions = paymentMethods.map((m) => ({
    value: m.codigo,
    label: m.nombre,
  }));

  const updateLine = (id, patch) => {
    onLinesChange(
      lines.map((line) => (line.id === id ? { ...line, ...patch } : line))
    );
  };

  const removeLine = (id) => {
    if (lines.length <= 1) return;
    onLinesChange(lines.filter((line) => line.id !== id));
  };

  const addLine = () => {
    const code = defaultMethodCode || paymentMethods[0]?.codigo || 'efectivo';
    const amount = Math.max(0, remainder);
    const method = methodsByCode[code];
    onLinesChange([
      ...lines,
      createPaymentLine(
        code,
        amount,
        method?.requiere_monto_recibido ? amount : null
      ),
    ]);
  };

  const handleSingleMethod = (code) => {
    const method = methodsByCode[code];
    onLinesChange([
      createPaymentLine(code, total, method?.requiere_monto_recibido ? total : null),
    ]);
  };

  const enableSplit = () => {
    onSplitModeChange(true);
    if (lines.length <= 1) {
      const first = lines[0] || createPaymentLine(defaultMethodCode || 'efectivo', total, total);
      const half = Math.round((total / 2) * 100) / 100;
      const secondCode =
        paymentMethods.find((m) => m.codigo !== first.metodo_pago)?.codigo ||
        first.metodo_pago;
      const secondMethod = methodsByCode[secondCode];
      onLinesChange([
        {
          ...first,
          monto: half,
          monto_recibido: methodsByCode[first.metodo_pago]?.requiere_monto_recibido
            ? half
            : null,
        },
        createPaymentLine(
          secondCode,
          total - half,
          secondMethod?.requiere_monto_recibido ? total - half : null
        ),
      ]);
    }
  };

  const disableSplit = () => {
    onSplitModeChange(false);
    const current = lines[0]?.metodo_pago || defaultMethodCode || 'efectivo';
    handleSingleMethod(current);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <CircleDollarSign className="w-3.5 h-3.5 text-brand-600" />
          Forma de pago
        </h4>
        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs">
          <button
            type="button"
            onClick={disableSplit}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
              !splitMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Un método
          </button>
          <button
            type="button"
            onClick={enableSplit}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center gap-1 ${
              splitMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            <Split className="w-3 h-3" />
            Dividir
          </button>
        </div>
      </div>

      {!splitMode ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {paymentMethods.map((method) => {
            const active = lines[0]?.metodo_pago === method.codigo;
            return (
              <button
                key={method.codigo}
                type="button"
                onClick={() => handleSingleMethod(method.codigo)}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all border text-left w-full ${
                  active
                    ? 'bg-brand-500 text-slate-900 border-brand-500 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300 hover:bg-brand-50/50'
                }`}
              >
                <span className="block truncate">{method.nombre}</span>
                {method.genera_cargo_cc && (
                  <span className="block text-[10px] opacity-80 mt-0.5">Requiere cliente</span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2.5">
          {lines.map((line, index) => {
            const method = methodsByCode[line.metodo_pago];
            const vuelto =
              method?.requiere_monto_recibido && line.monto_recibido != null
                ? Math.max(0, Number(line.monto_recibido) - Number(line.monto))
                : 0;

            return (
              <div
                key={line.id}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2.5"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Select
                      id={`pay-method-${line.id}`}
                      label={`Método ${index + 1}`}
                      size="md"
                      hidePlaceholder
                      value={line.metodo_pago}
                      onChange={(e) => {
                        const code = e.target.value;
                        const nextMethod = methodsByCode[code];
                        updateLine(line.id, {
                          metodo_pago: code,
                          monto_recibido: nextMethod?.requiere_monto_recibido
                            ? line.monto
                            : null,
                        });
                      }}
                      options={methodOptions}
                    />
                    <CurrencyInput
                      label="Monto"
                      hint={PRICE_INPUT_HINT}
                      size="md"
                      value={line.monto}
                      onChange={(v) => {
                        const monto = v ?? 0;
                        updateLine(line.id, {
                          monto,
                          monto_recibido: method?.requiere_monto_recibido ? monto : null,
                        });
                      }}
                    />
                  </div>
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      className="mt-6 p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                      aria-label="Quitar método"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {method?.requiere_monto_recibido && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-2.5 space-y-2">
                    <CurrencyInput
                      label="Monto recibido"
                      hint={PRICE_INPUT_HINT}
                      size="md"
                      value={line.monto_recibido ?? line.monto}
                      onChange={(v) => updateLine(line.id, { monto_recibido: v ?? 0 })}
                    />
                    <p className="text-sm text-slate-700 flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
                      Vuelto:{' '}
                      <strong className="tabular-nums text-emerald-800">
                        {formatCurrency(vuelto)}
                      </strong>
                    </p>
                  </div>
                )}

                {method?.genera_cargo_cc && (
                  <p className="text-xs text-sky-700">Se cargará a cuenta corriente del cliente.</p>
                )}
              </div>
            );
          })}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="w-4 h-4" />
              Agregar método
            </Button>
            <div
              className={`text-sm font-medium tabular-nums ${
                isBalanced ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {isBalanced
                ? 'Total cubierto'
                : `Restante: ${formatCurrency(remainder)}`}
            </div>
          </div>
        </div>
      )}

      {!splitMode && methodsByCode[lines[0]?.metodo_pago]?.requiere_monto_recibido && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 space-y-2.5">
          <CurrencyInput
            label="Monto recibido"
            hint={PRICE_INPUT_HINT}
            size="md"
            value={lines[0]?.monto_recibido ?? total}
            onChange={(v) =>
              updateLine(lines[0].id, { monto_recibido: v ?? 0, monto: total })
            }
          />
          <div className="flex flex-wrap gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => updateLine(lines[0].id, { monto_recibido: total, monto: total })}
            >
              Exacto
            </Button>
            {[100, 500, 1000].map((extra) => (
              <Button
                key={extra}
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  updateLine(lines[0].id, {
                    monto_recibido: total + extra,
                    monto: total,
                  })
                }
              >
                +{formatCurrency(extra, { withoutDecimals: true })}
              </Button>
            ))}
          </div>
          <p className="text-sm text-slate-800 flex items-center gap-1.5">
            <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
            Vuelto:{' '}
            <strong className="tabular-nums text-emerald-800">
              {formatCurrency(Math.max(0, (lines[0]?.monto_recibido ?? total) - total))}
            </strong>
          </p>
        </div>
      )}
    </section>
  );
};
