import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown, ArrowUp, SlidersHorizontal, Package, AlertTriangle } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { ProductPicker } from '../catalog/ProductPicker';
import { ProductImage } from '../catalog/ProductImage';
import { ProductMetaChips } from '../catalog/ProductMetaChips';
import { movementFormSchema } from '../../validations/commercialSchemas';
import { inventoryMotiveService } from '../../services/inventoryMotiveService';
import { formatCurrency, formatNumber } from '../../utils/formatCurrency';

const TIPO_OPTIONS = [
  {
    value: 'entrada',
    label: 'Entrada',
    hint: 'Suma al stock',
    icon: ArrowDown,
    activeClass: 'bg-emerald-500 text-white border-emerald-500',
  },
  {
    value: 'salida',
    label: 'Salida',
    hint: 'Resta del stock',
    icon: ArrowUp,
    activeClass: 'bg-red-500 text-white border-red-500',
  },
  {
    value: 'ajuste',
    label: 'Ajuste',
    hint: 'Stock exacto',
    icon: SlidersHorizontal,
    activeClass: 'bg-blue-500 text-white border-blue-500',
  },
];

const tipoChipClass = (active, activeClass) =>
  `flex flex-col items-center justify-center gap-0.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border touch-manipulation min-h-[4.5rem] ${
    active
      ? `${activeClass} shadow-sm`
      : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300 hover:bg-brand-50/50'
  }`;

export const InventoryMovementForm = ({
  formId = 'inventory-movement-form',
  onSubmit,
}) => {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(movementFormSchema),
    defaultValues: {
      producto_id: '',
      tipo: 'entrada',
      cantidad: '',
      motivo: '',
      motivo_select: '',
      motivo_detalle: '',
    },
  });

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [motives, setMotives] = useState([]);
  const tipo = watch('tipo');
  const cantidad = watch('cantidad');
  const motivoSelect = watch('motivo_select');
  const motivoDetalle = watch('motivo_detalle');
  const cantidadNum = Number(cantidad) || 0;
  const stockActual = Number(selectedProduct?.stock) || 0;
  const precioCosto = Number(selectedProduct?.precio_costo) || 0;

  const stockInsuficiente =
    tipo === 'salida' && selectedProduct && cantidadNum > 0 && cantidadNum > stockActual;

  const stockProyectado =
    selectedProduct && cantidadNum > 0
      ? tipo === 'entrada'
        ? stockActual + cantidadNum
        : tipo === 'salida'
          ? stockActual - cantidadNum
          : cantidadNum
      : null;

  const motiveOptions = useMemo(() => {
    const filtered = motives.filter((m) => {
      if (tipo === 'entrada') return m.tipo === 'entrada' || m.tipo === 'ambos';
      if (tipo === 'salida') return m.tipo === 'salida' || m.tipo === 'ambos';
      return true;
    });
    return [
      { value: '', label: 'Seleccionar motivo…' },
      ...filtered.map((m) => ({ value: m.nombre, label: m.nombre })),
      { value: '__otro__', label: 'Otro (escribir manualmente)' },
    ];
  }, [motives, tipo]);

  useEffect(() => {
    let cancelled = false;
    inventoryMotiveService
      .list({ activos: true })
      .then((data) => {
        if (!cancelled) {
          const list = Array.isArray(data) ? data : [];
          setMotives(list);
          if (list.length === 0) setValue('motivo_select', '__otro__');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMotives([]);
          setValue('motivo_select', '__otro__');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [setValue]);

  useEffect(() => {
    if (motivoSelect && motivoSelect !== '__otro__') {
      const stillValid = motiveOptions.some((o) => o.value === motivoSelect);
      if (!stillValid) setValue('motivo_select', '');
    }
  }, [tipo, motiveOptions, motivoSelect, setValue]);

  useEffect(() => {
    if (
      motivoSelect &&
      motivoSelect !== '__otro__' &&
      motivoSelect.toLowerCase().includes('compra de mercader') &&
      tipo === 'ajuste'
    ) {
      setValue('tipo', 'entrada');
    }
  }, [motivoSelect, tipo, setValue]);

  const esCompraMotivo =
    motivoSelect &&
    motivoSelect !== '__otro__' &&
    motivoSelect.toLowerCase().includes('compra de mercader');

  const unidadesCompraEstimadas =
    tipo === 'entrada'
      ? cantidadNum
      : tipo === 'ajuste' && cantidadNum > stockActual
        ? cantidadNum - stockActual
        : 0;

  const valorEstimado =
    esCompraMotivo && unidadesCompraEstimadas > 0 && precioCosto > 0
      ? unidadesCompraEstimadas * precioCosto
      : null;

  const handleFormSubmit = (data) => {
    let motivo = '';
    if (data.motivo_select === '__otro__') {
      motivo = (data.motivo_detalle || '').trim();
    } else if (data.motivo_select) {
      const detalle = (data.motivo_detalle || '').trim();
      motivo = detalle ? `${data.motivo_select} — ${detalle}` : data.motivo_select;
    }

    onSubmit({
      producto_id: data.producto_id,
      tipo: data.tipo,
      cantidad: data.cantidad,
      motivo,
    });
  };

  return (
    <form id={formId} onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
          Tipo de movimiento
        </p>
        <Controller
          name="tipo"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-3 gap-2">
              {TIPO_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = field.value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => field.onChange(opt.value)}
                    className={tipoChipClass(active, opt.activeClass)}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{opt.label}</span>
                    <span className={`text-[10px] font-normal ${active ? 'opacity-90' : 'text-slate-500'}`}>
                      {opt.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        />
        {errors.tipo?.message && (
          <p className="mt-1 text-sm text-red-600">{errors.tipo.message}</p>
        )}
      </div>

      <Controller
        name="producto_id"
        control={control}
        render={({ field }) => (
          <ProductPicker
            id="mov-producto_id"
            label="Producto"
            size="md"
            value={field.value ? String(field.value) : ''}
            selectedProduct={selectedProduct}
            onChange={(v) => {
              field.onChange(v ? Number(v) : '');
              if (!v) setSelectedProduct(null);
            }}
            onProductSelect={setSelectedProduct}
            error={errors.producto_id?.message}
            placeholder="Buscar por código o nombre…"
          />
        )}
      />

      {selectedProduct && (
        <div className="rounded-xl border border-brand-200/70 bg-gradient-to-br from-slate-50 to-brand-50/30 p-3 flex items-center gap-3">
          <ProductImage
            src={selectedProduct.imagen_url}
            alt={selectedProduct.nombre}
            size="md"
            enlargeable={!!selectedProduct.imagen_url}
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 text-sm truncate">{selectedProduct.nombre}</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedProduct.codigo}</p>
            <ProductMetaChips
              color={selectedProduct.color}
              talle={selectedProduct.talle}
              className="mt-1"
            />
            <p className="text-xs text-slate-600 mt-1.5">
              Stock actual:{' '}
              <span className="font-semibold tabular-nums">
                {formatNumber(stockActual, 2)} {selectedProduct.unidad_medida || 'unidad'}
              </span>
              {precioCosto > 0 && (
                <span className="text-slate-500">
                  {' '}
                  · Costo {formatCurrency(precioCosto)}
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      <Input
        id="cantidad"
        label={tipo === 'ajuste' ? 'Nuevo stock total' : 'Cantidad'}
        type="number"
        step="0.001"
        min="0"
        size="md"
        hint={
          tipo === 'ajuste'
            ? 'El stock quedará en este valor exacto'
            : tipo === 'salida'
              ? 'Se descontará del stock actual'
              : 'Se sumará al stock actual'
        }
        error={errors.cantidad?.message}
        {...register('cantidad')}
      />

      <Select
        id="motivo_select"
        label="Motivo"
        value={motivoSelect}
        onChange={(e) => setValue('motivo_select', e.target.value, { shouldValidate: true })}
        options={motiveOptions}
        error={errors.motivo_select?.message || errors.motivo_detalle?.message}
      />

      {(motivoSelect === '__otro__' || motivoSelect) && (
        <Input
          id="motivo_detalle"
          label={
            motivoSelect === '__otro__' ? 'Escriba el motivo' : 'Detalle opcional'
          }
          size="md"
          placeholder={
            motivoSelect === '__otro__'
              ? 'Ej: Compra proveedor Juan'
              : 'Nota adicional (opcional)'
          }
          value={motivoDetalle || ''}
          onChange={(e) => setValue('motivo_detalle', e.target.value)}
          error={errors.motivo_detalle?.message}
        />
      )}

      {valorEstimado != null && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
          Valor estimado a costo:{' '}
          <span className="font-semibold tabular-nums">{formatCurrency(valorEstimado)}</span>
          <span className="block text-xs text-emerald-700 mt-0.5">
            Se usa para conciliar con egresos de «Compra de mercadería» en Reportes.
          </span>
        </div>
      )}

      {motives.length === 0 && (
        <p className="text-xs text-amber-700">
          No hay motivos cargados. Configurelos en Configuración → Motivos de inventario.
        </p>
      )}

      {stockInsuficiente && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            Stock insuficiente. Disponible: {formatNumber(stockActual, 2)}.
          </p>
        </div>
      )}

      {stockProyectado != null && cantidadNum > 0 && !stockInsuficiente && selectedProduct && (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
          <Package className="w-4 h-4 text-brand-600 shrink-0" />
          <p>
            Stock resultante:{' '}
            <span className="font-semibold tabular-nums">
              {formatNumber(stockActual, 2)} → {formatNumber(stockProyectado, 2)}
            </span>
          </p>
        </div>
      )}
    </form>
  );
};
