import {
  Banknote,
  CreditCard,
  User,
  FileText,
  Receipt,
  Wallet,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { CurrencyInput } from '../ui/CurrencyInput';
import { ClientSearchSelect } from './ClientSearchSelect';
import { PRICE_INPUT_HINT } from '../../utils/currencyInput';
import { Alert } from '../ui/Alert';
import { formatCurrency } from '../../utils/formatCurrency';

const methodChipClass = (active) =>
  `px-3 py-2.5 rounded-xl text-sm font-medium transition-all border text-left w-full ${
    active
      ? 'bg-brand-500 text-slate-900 border-brand-500 shadow-sm'
      : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300 hover:bg-brand-50/50'
  }`;

export const SaleCheckoutModal = ({
  isOpen,
  onClose,
  clients,
  clienteId,
  onClienteChange,
  onClientSelect,
  observaciones,
  onObservacionesChange,
  descuentoGlobal,
  onDescuentoChange,
  paymentMethods,
  metodoPago,
  onMetodoPagoChange,
  tipoComprobante,
  onTipoComprobanteChange,
  tipoComprobanteOptions,
  selectedPaymentMethod,
  selectedClient,
  isCuentaCorriente,
  total,
  subtotal,
  montoRecibido,
  onMontoRecibidoChange,
  vuelto,
  onSetMontoExacto,
  onAddMontoExtra,
  needsCashWarning,
  cashSession,
  onSubmit,
  submitting,
  submitDisabled,
}) => {
  const footer = (
    <>
      <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={onClose}>
        Seguir agregando
      </Button>
      <Button
        type="button"
        className="w-full sm:w-auto min-h-12 shadow-md"
        size="lg"
        onClick={onSubmit}
        isLoading={submitting}
        disabled={submitDisabled}
      >
        Confirmar venta · {formatCurrency(total)}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar pago"
      size="2xl"
      footer={footer}
      stickyFooter
    >
      <div className="space-y-4">
        {needsCashWarning && (
          <Alert variant="info" className="!py-2.5 text-sm">
            Debe tener la caja abierta para este método.
            {!cashSession && ' Abra un turno en Caja antes de confirmar.'}
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 xl:gap-5">
          {/* Columna 1: Cliente y comprobante */}
          <section className="space-y-3">
            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <User className="w-3.5 h-3.5 text-brand-600" />
              Cliente
            </h4>
            <ClientSearchSelect
              id="modal-cliente"
              label=""
              size="md"
              value={clienteId}
              clients={clients}
              onChange={onClienteChange}
              onClientSelect={onClientSelect}
            />
            <Select
              id="modal-tipo-comp"
              label="Comprobante"
              size="md"
              hidePlaceholder
              value={tipoComprobante}
              onChange={(e) => onTipoComprobanteChange(e.target.value)}
              options={tipoComprobanteOptions}
            />
            {isCuentaCorriente && selectedClient && (
              <div className="rounded-xl border border-sky-200 bg-sky-50/80 p-3 text-sm">
                <p className="font-medium text-sky-900 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4" />
                  Cargo a {selectedClient.nombre}
                </p>
                <p className="text-xs text-sky-800 mt-1">
                  Saldo: {formatCurrency(selectedClient.saldo_cuenta_corriente ?? 0)}
                  {selectedClient.limite_credito != null && (
                    <> · Límite {formatCurrency(selectedClient.limite_credito)}</>
                  )}
                </p>
                {selectedClient.limite_credito != null &&
                  selectedClient.saldo_cuenta_corriente + total >
                    selectedClient.limite_credito && (
                    <p className="text-xs mt-1 text-amber-800 font-medium">
                      Supera el límite de crédito
                    </p>
                  )}
              </div>
            )}
            {isCuentaCorriente && !selectedClient && (
              <p className="text-xs text-amber-700">
                Seleccione un cliente para cuenta corriente.
              </p>
            )}
          </section>

          {/* Columna 2: Métodos de pago */}
          <section className="space-y-3">
            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <CreditCard className="w-3.5 h-3.5 text-brand-600" />
              Método de pago
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods?.map((method) => (
                <button
                  key={method.codigo}
                  type="button"
                  onClick={() => onMetodoPagoChange(method.codigo)}
                  className={methodChipClass(metodoPago === method.codigo)}
                >
                  <span className="block truncate">{method.nombre}</span>
                  {method.genera_cargo_cc && (
                    <span className="block text-[10px] opacity-80 mt-0.5">Requiere cliente</span>
                  )}
                </button>
              ))}
            </div>

            {selectedPaymentMethod?.requiere_monto_recibido && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 space-y-2.5">
                <CurrencyInput
                  label="Monto recibido"
                  hint={PRICE_INPUT_HINT}
                  size="md"
                  value={montoRecibido}
                  onChange={(v) => onMontoRecibidoChange(v ?? 0)}
                />
                <div className="flex flex-wrap gap-1.5">
                  <Button type="button" variant="outline" size="sm" onClick={onSetMontoExacto}>
                    Exacto
                  </Button>
                  {[100, 500, 1000].map((extra) => (
                    <Button
                      key={extra}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onAddMontoExtra(extra)}
                    >
                      +{formatCurrency(extra, { withoutDecimals: true })}
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-slate-800 flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
                  Vuelto:{' '}
                  <strong className="tabular-nums text-emerald-800">{formatCurrency(vuelto)}</strong>
                </p>
              </div>
            )}
          </section>

          {/* Columna 3: Ajustes y resumen */}
          <section className="space-y-3 md:col-span-2 xl:col-span-1">
            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Receipt className="w-3.5 h-3.5 text-brand-600" />
              Detalle y total
            </h4>
            <CurrencyInput
              label="Descuento global"
              hint={PRICE_INPUT_HINT}
              size="md"
              value={descuentoGlobal}
              onChange={(v) => onDescuentoChange(v ?? 0)}
            />
            <div>
              <label
                htmlFor="modal-obs"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Observaciones
              </label>
              <textarea
                id="modal-obs"
                value={observaciones}
                onChange={(e) => onObservacionesChange(e.target.value)}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 resize-none"
                placeholder="Opcional"
              />
            </div>

            <div className="rounded-xl bg-slate-900 text-white p-4">
              <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                <div>
                  <p className="text-slate-400">Subtotal</p>
                  <p className="font-semibold tabular-nums">{formatCurrency(subtotal)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Desc.</p>
                  <p className="font-semibold tabular-nums text-red-300">
                    −{formatCurrency(descuentoGlobal)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Pago</p>
                  <p className="font-medium truncate text-[11px] sm:text-xs">
                    {selectedPaymentMethod?.nombre || metodoPago}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                <span className="text-slate-300 text-sm font-medium">Total</span>
                <span className="text-2xl xl:text-3xl font-bold text-brand-400 tabular-nums">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Modal>
  );
};
