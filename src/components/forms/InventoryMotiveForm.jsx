import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import {
  inventoryMotiveFormSchema,
  inventoryMotiveEditSchema,
} from '../../validations/inventoryMotiveSchemas';

export const InventoryMotiveForm = ({
  mode = 'create',
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const isEdit = mode === 'edit';
  const schema = isEdit ? inventoryMotiveEditSchema : inventoryMotiveFormSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || {
      nombre: '',
      tipo: 'entrada',
      orden: 0,
      estado: 'activo',
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data) =>
        onSubmit({
          ...data,
          nombre: data.nombre.trim(),
          orden: Number(data.orden) || 0,
        })
      )}
      className="space-y-4"
    >
      <Input
        id="motivo-nombre"
        label="Nombre"
        placeholder="Ej: Compra de mercadería"
        error={errors.nombre?.message}
        {...register('nombre')}
      />
      <Select
        id="motivo-tipo"
        label="Aplica a"
        error={errors.tipo?.message}
        options={[
          { value: 'entrada', label: 'Solo entradas' },
          { value: 'salida', label: 'Solo salidas' },
          { value: 'ambos', label: 'Entradas, salidas y ajustes' },
        ]}
        {...register('tipo')}
      />
      <Input
        id="motivo-orden"
        label="Orden"
        type="number"
        min={0}
        error={errors.orden?.message}
        {...register('orden')}
      />
      {isEdit && (
        <Select
          id="motivo-estado"
          label="Estado"
          error={errors.estado?.message}
          options={[
            { value: 'activo', label: 'Activo' },
            { value: 'inactivo', label: 'Inactivo' },
          ]}
          {...register('estado')}
        />
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {isEdit ? 'Guardar' : 'Crear motivo'}
        </Button>
      </div>
    </form>
  );
};
