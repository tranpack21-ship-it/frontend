import { useMemo } from 'react';
import { Split, Banknote } from 'lucide-react';
import { CurrencyInput } from '../ui/CurrencyInput';
import { Button } from '../ui/Button';
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

const chipClass = (active) =>
  `px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all border touch-manipulation ${
    active
      ? 'bg-brand-500 text-slate-900 border-brand-500 shadow-sm'
      : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300'
  }`;

/**
 * Editor compacto de 1 o 2 métodos de pago.
 * Pensado para cobros rápidos (ventas y cuenta corriente).
 */
export const DualPaymentEditor = ({
  paymentMethods = [],
  total = 0,
  splitMode,
  onSplitModeChange,
  lines,
  onLinesChange,
  defaultMethodCode,
  /** Oculta hints de cuenta corriente (uso en cobros CC) */
  hideCuentaCorrienteHints = false,
  /** Título de sección */
  title = 'Forma de pago',
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

  const updateLine = (id, patch) => {
    onLinesChange(lines.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  };

  const handleSingleMethod = (code) => {
    const method = methodsByCode[code];
    onLinesChange([
      createPaymentLine(code, total, method?.requiere_monto_recibido ? total : null),
    ]);
  };

  const enableSplit = () => {
    onSplitModeChange(true);
    const firstCode = lines[0]?.metodo_pago || defaultMethodCode || paymentMethods[0]?.codigo || 'efectivo';
    const secondCode =
      paymentMethods.find((m) => m.codigo !== firstCode)?.codigo || firstCode;
    const half = Math.round((total / 2) * 100) / 100;
    const rest = Math.round((total - half) * 100) / 100;
    const m1 = methodsByCode[firstCode];
    const m2 = methodsByCode[secondCode];
    onLinesChange([
      createPaymentLine(firstCode, half, m1?.requiere_monto_recibido ? half : null),
      createPaymentLine(secondCode, rest, m2?.requiere_monto_recibido ? rest : null),
    ]);
  };

  const disableSplit = () => {
    onSplitModeChange(false);
    const current = lines[0]?.metodo_pago || defaultMethodCode || 'efectivo';
    handleSingleMethod(current);
  };

  const setLineMethod = (line, code) => {
    const other = lines.find((l) => l.id !== line.id);
    if (other && other.metodo_pago === code) {
      // Intercambiar si el otro ya usa ese método
      onLinesChange(
        lines.map((l) => {
          if (l.id === line.id) {
            const m = methodsByCode[code];
            return {
              ...l,
              metodo_pago: code,
              monto_recibido: m?.requiere_monto_recibido ? l.monto : null,
            };
          }
          if (l.id === other.id) {
            const m = methodsByCode[line.metodo_pago];
            return {
              ...l,
              metodo_pago: line.metodo_pago,
              monto_recibido: m?.requiere_monto_recibido ? l.monto : null,
            };
          }
          return l;
        })
      );
      return;
    }
    const m = methodsByCode[code];
    updateLine(line.id, {
      metodo_pago: code,
      monto_recibido: m?.requiere_monto_recibido ? line.monto : null,
    });
  };

  const fillRemainder = (lineId) => {
    const others = lines
      .filter((l) => l.id !== lineId)
      .reduce((acc, l) => acc + (Number(l.monto) || 0), 0);
    const next = Math.max(0, Math.round((total - others) * 100) / 100);
    const line = lines.find((l) => l.id === lineId);
    const method = methodsByCode[line?.metodo_pago];
    updateLine(lineId, {
      monto: next,
      monto_recibido: method?.requiere_monto_recibido ? next : null,
    });
  };

  const renderCashReceived = (line) => {
    const method = methodsByCode[line.metodo_pago];
    if (!method?.requiere_monto_recibido) return null;
    const vuelto = Math.max(0, Number(line.monto_recibido ?? line.monto) - Number(line.monto));
    return (
      <div className="mt-2 flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[8rem]">
          <CurrencyInput
            label="Recibido"
            hint={PRICE_INPUT_HINT}
            size="md"
            value={line.monto_recibido ?? line.monto}
            onChange={(v) => updateLine(line.id, { monto_recibido: v ?? 0 })}
          />
        </div>
        <div className="pb-1 text-sm text-slate-700 flex items-center gap-1">
          <Banknote className="w-4 h-4 text-emerald-600" />
          Vuelto <strong className="tabular-nums text-emerald-800">{formatCurrency(vuelto)}</strong>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mb-0.5"
          onClick={() => updateLine(line.id, { monto_recibido: line.monto })}
        >
          Exacto
        </Button>
      </div>
    );
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs">
          <button
            type="button"
            onClick={disableSplit}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
              !splitMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            1 método
          </button>
          <button
            type="button"
            onClick={enableSplit}
            disabled={paymentMethods.length < 2}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center gap-1 disabled:opacity-40 ${
              splitMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            <Split className="w-3 h-3" />
            2 métodos
          </button>
        </div>
      </div>

      {!splitMode ? (
        <>
          <div className="flex flex-wrap gap-1.5">
            {paymentMethods.map((method) => {
              const active = lines[0]?.metodo_pago === method.codigo;
              return (
                <button
                  key={method.codigo}
                  type="button"
                  onClick={() => handleSingleMethod(method.codigo)}
                  className={chipClass(active)}
                >
                  {method.nombre}
                  {!hideCuentaCorrienteHints && method.genera_cargo_cc ? ' · CC' : ''}
                </button>
              );
            })}
          </div>
          {lines[0] && renderCashReceived(lines[0])}
          {!hideCuentaCorrienteHints && methodsByCode[lines[0]?.metodo_pago]?.genera_cargo_cc && (
            <p className="text-xs text-sky-700">Se cargará a la cuenta corriente del cliente.</p>
          )}
        </>
      ) : (
        <div className="space-y-2">
          {lines.slice(0, 2).map((line, index) => {
            const method = methodsByCode[line.metodo_pago];
            return (
              <div
                key={line.id}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Parte {index + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() => fillRemainder(line.id)}
                    className="text-[11px] font-medium text-brand-700 hover:underline"
                  >
                    Completar resto
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {paymentMethods.map((m) => (
                    <button
                      key={m.codigo}
                      type="button"
                      onClick={() => setLineMethod(line, m.codigo)}
                      className={chipClass(line.metodo_pago === m.codigo)}
                    >
                      {m.nombre}
                    </button>
                  ))}
                </div>
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
                {renderCashReceived(line)}
                {!hideCuentaCorrienteHints && method?.genera_cargo_cc && (
                  <p className="text-xs text-sky-700">Cargo a cuenta corriente.</p>
                )}
              </div>
            );
          })}

          <div
            className={`text-sm font-medium tabular-nums text-center py-1 ${
              isBalanced ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {isBalanced
              ? `Total cubierto · ${formatCurrency(total)}`
              : `Falta asignar ${formatCurrency(Math.abs(remainder))}`}
          </div>
        </div>
      )}
    </section>
  );
};

/** Reexport con nombre histórico para no romper imports existentes */
export const SalePaymentSplitEditor = DualPaymentEditor;
