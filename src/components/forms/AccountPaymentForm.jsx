import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CurrencyInput } from '../ui/CurrencyInput';
import { Input } from '../ui/Input';
import { PRICE_INPUT_HINT } from '../../utils/currencyInput';
import { formatCurrency } from '../../utils/formatCurrency';

const methodChipClass = (active) =>
  `px-3 py-2 rounded-xl text-sm font-medium transition-all border touch-manipulation ${
    active
      ? 'bg-brand-500 text-slate-900 border-brand-500 shadow-sm'
      : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300 hover:bg-brand-50/50'
  }`;

export const AccountPaymentForm = ({
  formId = 'account-payment-form',
  saldoPendiente,
  metodoOptions = [],
  defaultMetodo = 'efectivo',
  onSubmit,
}) => {
  const schema = z.object({
    monto: z.coerce
      .number()
      .positive('Ingrese un monto mayor a 0')
      .max(saldoPendiente, `No puede superar ${formatCurrency(saldoPendiente)}`),
    metodo_cobro: z.string().min(1),
    observaciones: z.string().max(500).optional().or(z.literal('')),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      monto: saldoPendiente > 0 ? saldoPendiente : 0,
      metodo_cobro: defaultMetodo,
      observaciones: '',
    },
  });

  const metodo = watch('metodo_cobro');
  const options =
    metodoOptions.length > 0 ? metodoOptions : [{ value: 'efectivo', label: 'Efectivo' }];

  return (
    <form
      id={formId}
      onSubmit={handleSubmit((data) =>
        onSubmit({
          monto: data.monto,
          metodo_cobro: data.metodo_cobro,
          observaciones: data.observaciones?.trim() || null,
        })
      )}
      className="space-y-4"
    >
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 px-3 py-2.5 text-sm text-slate-700">
        Saldo pendiente:{' '}
        <span className="font-bold text-amber-800 tabular-nums">
          {formatCurrency(saldoPendiente)}
        </span>
      </div>

      <CurrencyInput
        id="pay-monto"
        label="Monto a cobrar"
        size="md"
        hint={PRICE_INPUT_HINT}
        min={0.01}
        max={saldoPendiente}
        value={watch('monto')}
        onChange={(v) => setValue('monto', v ?? 0, { shouldValidate: true })}
        error={errors.monto?.message}
      />

      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
          Forma de cobro
        </p>
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setValue('metodo_cobro', opt.value, { shouldValidate: true })}
              className={methodChipClass(metodo === opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <input type="hidden" {...register('metodo_cobro')} />
      </div>

      <p className="text-xs text-slate-500 -mt-1">
        Si el método registra en caja, debe tener un turno abierto.
      </p>

      <Input
        id="pay-obs"
        label="Observaciones"
        size="md"
        placeholder="Opcional"
        error={errors.observaciones?.message}
        {...register('observaciones')}
      />
    </form>
  );
};
