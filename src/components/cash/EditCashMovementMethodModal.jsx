import { useEffect, useMemo, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Alert } from '../ui/Alert';
import { formatCurrency } from '../../utils/formatCurrency';
import { movTipoLabel } from './cashConstants';

export const EditCashMovementMethodModal = ({
  isOpen,
  onClose,
  movement,
  paymentMethods = [],
  onSubmit,
  submitting = false,
}) => {
  const options = useMemo(
    () =>
      paymentMethods
        .filter((m) => !m.genera_cargo_cc)
        .map((m) => ({ value: m.codigo, label: m.nombre })),
    [paymentMethods]
  );

  const [metodo, setMetodo] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !movement) return;
    setError('');
    const current = movement.metodo_pago || '';
    const stillValid = options.some((o) => o.value === current);
    setMetodo(stillValid ? current : options[0]?.value || '');
  }, [isOpen, movement, options]);

  if (!movement) return null;

  const handleSave = async () => {
    if (!metodo) {
      setError('Seleccione un método de pago');
      return;
    }
    if (metodo === movement.metodo_pago) {
      onClose();
      return;
    }
    setError('');
    try {
      await onSubmit(metodo);
    } catch (err) {
      setError(err?.message || 'No se pudo actualizar el método');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cambiar método de pago"
      size="md"
      stickyFooter
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} isLoading={submitting} disabled={submitting}>
            <Pencil className="w-4 h-4" />
            Guardar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm space-y-1">
          <p className="text-slate-500">
            {movTipoLabel[movement.tipo] || movement.tipo} ·{' '}
            <span className="font-semibold text-slate-800 tabular-nums">
              {formatCurrency(movement.monto)}
            </span>
          </p>
          <p className="text-slate-700 truncate">
            {movement.descripcion || movement.referencia || '—'}
          </p>
          <p className="text-xs text-slate-500">
            Actual: {movement.metodo_pago_nombre || movement.metodo_pago || '—'}
          </p>
        </div>

        {error && <Alert>{error}</Alert>}

        <Select
          id="edit-mov-metodo"
          label="Nuevo método"
          value={metodo}
          onChange={(e) => setMetodo(e.target.value)}
          options={
            options.length
              ? options
              : [{ value: 'efectivo', label: 'Efectivo' }]
          }
          hidePlaceholder
        />

        <p className="text-xs text-slate-500">
          Si pasás de efectivo a transferencia (o al revés), el efectivo esperado del cajón
          se recalcula solo. No se puede cambiar a cuenta corriente desde acá.
        </p>
      </div>
    </Modal>
  );
};
