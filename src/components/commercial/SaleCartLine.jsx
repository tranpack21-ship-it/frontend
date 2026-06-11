import { useState } from 'react';
import { Trash2, Minus, Plus, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../utils/formatCurrency';
import { getStockAddWarning } from '../../utils/stockWarnings';
import { CurrencyInput } from '../ui/CurrencyInput';
import { ProductImage } from '../catalog/ProductImage';
import { ProductMetaChips } from '../catalog/ProductMetaChips';

const roundQty = (n, step = 0.001) => Math.round(n / step) * step;

export const SaleCartLine = ({ item, onUpdate, onRemove }) => {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const lineTotal = item.precio_unitario * item.cantidad - (item.descuento || 0);
  const stockWarning = getStockAddWarning(item, item.cantidad);
  const stock = Number(item.stock ?? 0);

  const changeQty = (delta) => {
    const next = Math.max(0.001, roundQty(item.cantidad + delta, 0.001));
    onUpdate(item.producto_id, 'cantidad', next);
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="p-3 sm:p-4">
        <div className="flex gap-3 items-start">
          <ProductImage src={item.imagen_url} alt={item.nombre} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 leading-snug">{item.nombre}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">{item.codigo}</p>
            <ProductMetaChips color={item.color} talle={item.talle} className="mt-1" />
            <p
              className={`text-xs mt-1 ${
                stock <= 0 ? 'text-red-600 font-medium' : stockWarning ? 'text-amber-700' : 'text-slate-400'
              }`}
            >
              Stock: {formatNumber(stock, 2)}
              {stock < 0 ? ' (negativo)' : stock <= 0 ? ' (sin stock)' : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.producto_id)}
            className="shrink-0 p-2.5 -mr-1 text-red-600 hover:bg-red-50 rounded-xl touch-manipulation"
            aria-label={`Quitar ${item.nombre}`}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {stockWarning && (
          <div className="mt-2 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{stockWarning}</span>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={() => changeQty(-1)}
              className="p-3 text-slate-700 hover:bg-slate-100 rounded-l-xl touch-manipulation active:bg-slate-200"
              aria-label="Menos cantidad"
            >
              <Minus className="w-5 h-5" />
            </button>
            <label className="sr-only" htmlFor={`qty-${item.producto_id}`}>
              Cantidad
            </label>
            <input
              id={`qty-${item.producto_id}`}
              type="number"
              inputMode="decimal"
              min="0.001"
              step="0.001"
              value={item.cantidad}
              onChange={(e) => onUpdate(item.producto_id, 'cantidad', e.target.value)}
              className="w-16 sm:w-20 text-center text-base font-semibold bg-transparent border-x border-slate-200 py-3 tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-400/50"
            />
            <button
              type="button"
              onClick={() => changeQty(1)}
              className="p-3 text-slate-700 hover:bg-slate-100 rounded-r-xl touch-manipulation active:bg-slate-200"
              aria-label="Más cantidad"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-500">Subtotal</p>
            <p className="text-lg font-bold text-brand-700 tabular-nums">
              {formatCurrency(lineTotal)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setAdvancedOpen((o) => !o)}
          className="mt-3 w-full flex items-center justify-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 py-1 touch-manipulation"
        >
          {advancedOpen ? (
            <>
              Ocultar precio y descuento <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Ajustar precio o descuento <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {advancedOpen && (
        <div className="px-3 pb-3 sm:px-4 sm:pb-4 pt-0 grid grid-cols-2 gap-2 border-t border-slate-100 bg-slate-50/80">
          <CurrencyInput
            label="Precio u."
            size="md"
            value={item.precio_unitario}
            onChange={(v) => onUpdate(item.producto_id, 'precio_unitario', v ?? 0)}
          />
          <CurrencyInput
            label="Descuento"
            size="md"
            value={item.descuento ?? 0}
            onChange={(v) => onUpdate(item.producto_id, 'descuento', v ?? 0)}
          />
        </div>
      )}
    </article>
  );
};
