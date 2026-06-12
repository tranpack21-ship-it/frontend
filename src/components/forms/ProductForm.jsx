import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../ui/Input';
import { CurrencyInput } from '../ui/CurrencyInput';
import { Select } from '../ui/Select';
import { CategoryPicker } from '../catalog/CategoryPicker';
import { ProductFormPreview } from '../catalog/ProductFormPreview';
import { productFormSchema } from '../../validations/catalogSchemas';
import { UNIDADES_MEDIDA } from '../../constants/permissions';
import { PRICE_INPUT_HINT } from '../../utils/currencyInput';

export const ProductForm = ({
  formId = 'product-form',
  categories = [],
  onCategoryCreated,
  defaultValues,
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
    resolver: zodResolver(productFormSchema),
    defaultValues: defaultValues || {
      codigo: '',
      nombre: '',
      descripcion: '',
      imagen_url: '',
      color: '',
      talle: '',
      categoria_id: '',
      precio_venta: 0,
      precio_costo: 0,
      stock: 0,
      stock_minimo: 0,
      unidad_medida: 'unidad',
      estado: 'activo',
    },
  });

  const [previewKey, setPreviewKey] = useState(0);
  const watched = watch();

  const categoryName =
    categories.find((c) => String(c.id) === String(watched.categoria_id))?.nombre || '';

  const handleCategoryCreated = (categoria) => {
    onCategoryCreated?.(categoria);
    setValue('categoria_id', categoria.id, { shouldValidate: true });
  };

  const handleFormSubmit = (data) => {
    onSubmit({
      ...data,
      codigo: data.codigo || null,
      descripcion: data.descripcion || null,
      imagen_url: data.imagen_url || null,
      color: data.color || null,
      talle: data.talle || null,
    });
  };

  const estadoOptions = [
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' },
  ];

  return (
    <form id={formId} onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_260px] gap-5 xl:gap-6">
        {/* Columna formulario — compacta */}
        <div className="space-y-3.5 min-w-0">
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="codigo"
              label="Código / SKU (opcional)"
              size="md"
              placeholder="PROD-001"
              error={errors.codigo?.message}
              {...register('codigo')}
            />
            <Controller
              name="categoria_id"
              control={control}
              render={({ field }) => (
                <CategoryPicker
                  id="categoria_id"
                  label="Categoría"
                  size="md"
                  value={field.value ? String(field.value) : ''}
                  categories={categories}
                  onChange={(v) => field.onChange(v ? Number(v) : '')}
                  onCategoryCreated={handleCategoryCreated}
                  error={errors.categoria_id?.message}
                />
              )}
            />
          </div>

          <Input
            id="nombre"
            label="Nombre"
            size="md"
            placeholder="Nombre comercial"
            error={errors.nombre?.message}
            {...register('nombre')}
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Input
              id="color"
              label="Color"
              size="md"
              placeholder="Opcional"
              error={errors.color?.message}
              {...register('color')}
            />
            <Input
              id="talle"
              label="Talle"
              size="md"
              placeholder="Opcional"
              error={errors.talle?.message}
              {...register('talle')}
            />
            <div className="col-span-2 sm:col-span-1">
              <Select
                id="unidad_medida"
                label="Unidad"
                size="md"
                hidePlaceholder
                options={UNIDADES_MEDIDA}
                error={errors.unidad_medida?.message}
                {...register('unidad_medida')}
              />
            </div>
          </div>

          <Input
            id="imagen_url"
            label="URL imagen (opcional)"
            size="md"
            placeholder="https://…"
            hint="Enlace directo http/https"
            error={errors.imagen_url?.message}
            {...register('imagen_url', {
              onChange: () => setPreviewKey((k) => k + 1),
            })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Controller
              name="precio_venta"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  id="precio_venta"
                  label="Precio venta"
                  hint={PRICE_INPUT_HINT}
                  size="md"
                  emptyZero
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.precio_venta?.message}
                />
              )}
            />
            <Controller
              name="precio_costo"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  id="precio_costo"
                  label="Precio costo"
                  hint={PRICE_INPUT_HINT}
                  size="md"
                  emptyZero
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.precio_costo?.message}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              id="stock"
              label="Stock"
              type="number"
              step="0.001"
              min="0"
              size="md"
              error={errors.stock?.message}
              {...register('stock')}
            />
            <Input
              id="stock_minimo"
              label="Stock mín."
              type="number"
              step="0.001"
              min="0"
              size="md"
              error={errors.stock_minimo?.message}
              {...register('stock_minimo')}
            />
            <Select
              id="estado"
              label="Estado"
              size="md"
              hidePlaceholder
              options={estadoOptions}
              error={errors.estado?.message}
              {...register('estado')}
            />
          </div>

          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-slate-700 mb-1.5">
              Descripción <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <textarea
              id="descripcion"
              rows={2}
              placeholder="Notas del producto…"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 resize-none"
              {...register('descripcion')}
            />
          </div>
        </div>

        {/* Columna vista previa — sticky en XL */}
        <div className="xl:sticky xl:top-0 xl:self-start">
          <ProductFormPreview
            key={previewKey}
            product={watched}
            categoryName={categoryName}
          />
        </div>
      </div>
    </form>
  );
};
