import { useMemo, useState } from 'react';
import { CalendarRange, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import {
  DATE_RANGE_PRESETS,
  detectActivePreset,
  isValidDateRange,
  toLocalISODate,
} from '../../utils/dateRange';
import { formatDateOnly } from '../../utils/formatDate';

const chipBase =
  'px-2.5 py-1 rounded-lg text-xs font-medium transition-all touch-manipulation border whitespace-nowrap';

const chipActive = 'bg-brand-500 text-slate-900 border-brand-500';
const chipIdle = 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:bg-brand-50/50';

const dateInputClass =
  'h-8 px-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500';

const DEFAULT_PRESET_IDS = ['today', 'last7', 'thisMonth', 'last30'];

export const CompactPeriodFilter = ({
  fechaDesde,
  fechaHasta,
  onDesdeChange,
  onHastaChange,
  onPresetSelect,
  loading = false,
  label = 'Período',
  presetIds = DEFAULT_PRESET_IDS,
}) => {
  const [showDates, setShowDates] = useState(false);

  const activePreset = useMemo(
    () => detectActivePreset(fechaDesde, fechaHasta),
    [fechaDesde, fechaHasta]
  );

  const rangeValid = isValidDateRange(fechaDesde, fechaHasta);
  const isCustom = activePreset === 'custom';
  const showDateRow = showDates || isCustom;

  const periodHint = rangeValid
    ? fechaDesde === fechaHasta
      ? formatDateOnly(fechaDesde)
      : `${formatDateOnly(fechaDesde)} — ${formatDateOnly(fechaHasta)}`
    : 'Rango inválido';

  const handlePreset = (presetId) => {
    if (presetId === 'custom') {
      setShowDates(true);
      onPresetSelect('custom');
      return;
    }
    setShowDates(false);
    onPresetSelect(presetId);
  };

  const presets = DATE_RANGE_PRESETS.filter((p) => presetIds.includes(p.id));

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm w-full">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-1.5 shrink-0 text-slate-500">
          <CalendarRange className="w-4 h-4 text-brand-600" />
          <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePreset(preset.id)}
              disabled={loading}
              className={`${chipBase} ${activePreset === preset.id ? chipActive : chipIdle} disabled:opacity-50`}
            >
              {preset.shortLabel}
            </button>
          ))}

          <button
            type="button"
            onClick={() => handlePreset('custom')}
            disabled={loading}
            className={`${chipBase} ${isCustom ? 'bg-slate-800 text-white border-slate-800' : chipIdle}`}
          >
            Rango
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowDates((v) => !v)}
          className="text-xs text-slate-500 hover:text-brand-700 inline-flex items-center gap-0.5 shrink-0"
        >
          {showDateRow ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Fechas
        </button>

        <span className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-none hidden sm:inline">
          {periodHint}
        </span>
      </div>

      {showDateRow && (
        <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-100">
          <label className="sr-only" htmlFor="period-fecha-desde">
            Desde
          </label>
          <input
            id="period-fecha-desde"
            type="date"
            value={fechaDesde}
            max={fechaHasta || undefined}
            onChange={(e) => onDesdeChange(e.target.value)}
            className={dateInputClass}
          />
          <span className="text-slate-400 text-xs">—</span>
          <label className="sr-only" htmlFor="period-fecha-hasta">
            Hasta
          </label>
          <input
            id="period-fecha-hasta"
            type="date"
            value={fechaHasta}
            min={fechaDesde || undefined}
            max={toLocalISODate()}
            onChange={(e) => onHastaChange(e.target.value)}
            className={dateInputClass}
          />
        </div>
      )}

      {!rangeValid && fechaDesde && fechaHasta && (
        <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          «Desde» no puede ser posterior a «hasta».
        </p>
      )}

      <p className="text-xs text-slate-500 mt-1.5 sm:hidden">{periodHint}</p>
    </div>
  );
};
