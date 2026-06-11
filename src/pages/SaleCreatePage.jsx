import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Plus, ArrowLeft, Wallet, CreditCard } from 'lucide-react';
import { saleService } from '../services/saleService';
import { clientService } from '../services/clientService';
import { productService } from '../services/productService';
import { cashService } from '../services/cashService';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS, TIPOS_COMPROBANTE } from '../constants/permissions';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SearchInput } from '../components/ui/SearchInput';
import { Alert } from '../components/ui/Alert';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';
import { SaleCartLine } from '../components/commercial/SaleCartLine';
import { SaleMobileCheckoutBar } from '../components/commercial/SaleMobileCheckoutBar';
import { SaleCheckoutModal } from '../components/commercial/SaleCheckoutModal';
import { ProductSearchCard } from '../components/catalog/ProductSearchCard';
import { ClientPickerModal } from '../components/commercial/ClientPickerModal';
import { useDebounce } from '../hooks/useDebounce';
import { formatCurrency } from '../utils/formatCurrency';
import { getErrorMessage } from '../utils/getErrorMessage';
import { useConnection } from '../context/ConnectionContext';
import { OnlineOnlyButton } from '../components/common/OnlineOnlyLink';
import { getStockAddWarning } from '../utils/stockWarnings';
import { formatNumber } from '../utils/formatCurrency';

const MIN_SEARCH_CHARS = 2;

export const SaleCreatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOffline } = useConnection();
  const { hasPermission } = usePermissions();
  const canCreateSale = hasPermission(PERMISSIONS.VENTAS_CREAR);
  const requiresOpenCash = hasPermission(PERMISSIONS.CAJA_ABRIR);
  const { methods: paymentMethods, defaultMethod, loading: paymentMethodsLoading } =
    usePaymentMethods({ activos: true });

  const [clients, setClients] = useState([]);
  const [cashSession, setCashSession] = useState(null);
  const [cashLoading, setCashLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState(location.state?.message || '');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [descuentoGlobal, setDescuentoGlobal] = useState(0);
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [montoRecibido, setMontoRecibido] = useState(0);
  const [tipoComprobante, setTipoComprobante] = useState('ticket');
  const [stockWarning, setStockWarning] = useState('');
  const debouncedProductSearch = useDebounce(productSearch, 300);

  const cartSectionRef = useRef(null);

  const refreshCashSession = useCallback(async () => {
    if (!canCreateSale) return null;
    setCashLoading(true);
    try {
      const sesion = await cashService.current();
      setCashSession(sesion);
      return sesion;
    } catch {
      setCashSession(null);
      return null;
    } finally {
      setCashLoading(false);
    }
  }, [canCreateSale]);

  useEffect(() => {
    const loadClients = async () => {
      setLoading(true);
      setError('');
      try {
        const c = await clientService.listActive();
        setClients(c);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    loadClients();
  }, []);

  useEffect(() => {
    const term = debouncedProductSearch.trim();
    if (term.length < MIN_SEARCH_CHARS) {
      setSearchResults([]);
      setSearchError('');
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    setSearchLoading(true);
    setSearchError('');

    productService
      .quickSearch(term, 25)
      .then((items) => {
        if (!cancelled) setSearchResults(items);
      })
      .catch((err) => {
        if (!cancelled) {
          setSearchError(getErrorMessage(err));
          setSearchResults([]);
        }
      })
      .finally(() => {
        if (!cancelled) setSearchLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedProductSearch]);

  useEffect(() => {
    refreshCashSession();
  }, [refreshCashSession]);

  useEffect(() => {
    const redo = location.state?.redoFrom;
    if (!redo) return;

    let cancelled = false;

    const applyRedo = async () => {
      if (redo.cliente_id != null) setClienteId(redo.cliente_id);
      if (redo.observaciones) setObservaciones(redo.observaciones);
      if (redo.descuento != null) setDescuentoGlobal(redo.descuento);
      if (redo.metodo_pago) setMetodoPago(redo.metodo_pago);

      if (redo.items?.length) {
        const itemsWithStock = await Promise.all(
          redo.items.map(async (item) => {
            try {
              const product = await productService.getById(item.producto_id);
              return {
                producto_id: item.producto_id,
                codigo: product.codigo || item.codigo,
                nombre: product.nombre || item.nombre,
                stock: product.stock,
                precio_unitario: product.precio_venta,
                cantidad: item.cantidad,
                descuento: item.descuento ?? 0,
              };
            } catch {
              return {
                producto_id: item.producto_id,
                codigo: item.codigo,
                nombre: item.nombre,
                stock: item.stock ?? 0,
                precio_unitario: item.precio_unitario,
                cantidad: item.cantidad,
                descuento: item.descuento ?? 0,
              };
            }
          })
        );
        if (!cancelled) setCart(itemsWithStock);
      }

      if (!cancelled) navigate(location.pathname, { replace: true, state: {} });
    };

    applyRedo();
    return () => {
      cancelled = true;
    };
  }, [location.state?.redoFrom, location.pathname, navigate]);

  useEffect(() => {
    const product = location.state?.addProduct;
    if (!product?.id) return;

    let cancelled = false;

    setCart((prev) => {
      const existing = prev.find((i) => i.producto_id === product.id);
      const newQty = existing ? existing.cantidad + 1 : 1;
      const warning = getStockAddWarning(product, newQty);

      if (!cancelled) {
        if (warning) setStockWarning(warning);
        if (location.state?.message) setInfo(location.state.message);
      }

      if (existing) {
        return prev.map((i) =>
          i.producto_id === product.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }

      return [
        ...prev,
        {
          producto_id: product.id,
          codigo: product.codigo,
          nombre: product.nombre,
          imagen_url: product.imagen_url,
          color: product.color,
          talle: product.talle,
          stock: product.stock,
          unidad_medida: product.unidad_medida,
          precio_unitario: product.precio_venta,
          cantidad: 1,
          descuento: 0,
        },
      ];
    });

    if (!cancelled) {
      navigate(location.pathname, { replace: true, state: {} });
      if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1279px)').matches) {
        scrollToCart();
      }
    }

    return () => {
      cancelled = true;
    };
  }, [location.state?.addProduct, location.pathname, navigate]);

  useEffect(() => {
    if (!info) return;
    const t = setTimeout(() => setInfo(''), 8000);
    return () => clearTimeout(t);
  }, [info]);

  useEffect(() => {
    if (!stockWarning) return;
    const t = setTimeout(() => setStockWarning(''), 10000);
    return () => clearTimeout(t);
  }, [stockWarning]);

  useEffect(() => {
    let debounceId;
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      clearTimeout(debounceId);
      debounceId = setTimeout(() => refreshCashSession(), 800);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(debounceId);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refreshCashSession]);

  const scrollToCart = () => {
    requestAnimationFrame(() => {
      cartSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const addToCart = (product) => {
    setError('');
    const existingQty = cart.find((i) => i.producto_id === product.id)?.cantidad ?? 0;
    const newQty = existingQty + 1;
    const warning = getStockAddWarning(product, newQty);
    if (warning) setStockWarning(warning);

    const wasEmpty = cart.length === 0;
    setCart((prev) => {
      const existing = prev.find((i) => i.producto_id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.producto_id === product.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [
        ...prev,
        {
          producto_id: product.id,
          codigo: product.codigo,
          nombre: product.nombre,
          imagen_url: product.imagen_url,
          color: product.color,
          talle: product.talle,
          stock: product.stock,
          unidad_medida: product.unidad_medida,
          precio_unitario: product.precio_venta,
          cantidad: 1,
          descuento: 0,
        },
      ];
    });
    if (wasEmpty && typeof window !== 'undefined' && window.matchMedia('(max-width: 1279px)').matches) {
      scrollToCart();
    }
  };

  const updateCartItem = (id, field, value) => {
    setCart((prev) => {
      const next = prev.map((i) =>
        i.producto_id === id ? { ...i, [field]: Number(value) || 0 } : i
      );
      if (field === 'cantidad') {
        const item = next.find((i) => i.producto_id === id);
        if (item) {
          const warning = getStockAddWarning(item, item.cantidad);
          setStockWarning(warning || '');
        }
      }
      return next;
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((i) => i.producto_id !== id));
  };

  const subtotal = cart.reduce(
    (acc, i) => acc + i.precio_unitario * i.cantidad - (i.descuento || 0),
    0
  );
  const total = Math.max(0, subtotal - descuentoGlobal);

  const selectedPaymentMethod = useMemo(
    () => paymentMethods.find((m) => m.codigo === metodoPago),
    [paymentMethods, metodoPago]
  );

  const vuelto =
    selectedPaymentMethod?.requiere_monto_recibido
      ? Math.max(0, Number(montoRecibido) - total)
      : 0;

  useEffect(() => {
    if (defaultMethod?.codigo && !paymentMethodsLoading) {
      setMetodoPago((prev) => {
        const stillValid = paymentMethods.some((m) => m.codigo === prev);
        return stillValid ? prev : defaultMethod.codigo;
      });
    }
  }, [defaultMethod, paymentMethods, paymentMethodsLoading]);

  useEffect(() => {
    if (selectedPaymentMethod?.requiere_monto_recibido && total > 0) {
      setMontoRecibido(total);
    }
  }, [total, selectedPaymentMethod?.requiere_monto_recibido]);

  const isCuentaCorriente = Boolean(selectedPaymentMethod?.genera_cargo_cc);
  const needsCashForSale = requiresOpenCash && Boolean(selectedPaymentMethod?.registra_en_caja);
  const needsCashWarning = needsCashForSale && !cashLoading && !cashSession;

  const cuentaCorrienteMethod = useMemo(
    () => paymentMethods.find((m) => m.genera_cargo_cc),
    [paymentMethods]
  );

  const selectedClient = useMemo(
    () => clients.find((c) => String(c.id) === clienteId),
    [clients, clienteId]
  );

  const mergeClient = useCallback((client) => {
    if (!client?.id) return;
    setClients((prev) =>
      prev.some((c) => c.id === client.id) ? prev : [...prev, client]
    );
  }, []);

  const handleClienteChange = useCallback(
    (id) => {
      setClienteId(id);
      if (id && cuentaCorrienteMethod) {
        setMetodoPago(cuentaCorrienteMethod.codigo);
      }
    },
    [cuentaCorrienteMethod]
  );

  const handleClientSelect = useCallback(
    (client) => {
      if (client) mergeClient(client);
    },
    [mergeClient]
  );

  const handleMetodoPagoChange = useCallback(
    (code) => {
      setMetodoPago(code);
      const method = paymentMethods.find((m) => m.codigo === code);
      if (method?.genera_cargo_cc && !clienteId) {
        setClientPickerOpen(true);
      }
    },
    [paymentMethods, clienteId]
  );

  const handleClientPicked = useCallback(
    (client) => {
      mergeClient(client);
      setClienteId(String(client.id));
      if (cuentaCorrienteMethod) {
        setMetodoPago(cuentaCorrienteMethod.codigo);
      }
      setClientPickerOpen(false);
    },
    [mergeClient, cuentaCorrienteMethod]
  );

  const submitDisabled =
    isOffline || !cart.length || (needsCashForSale && !cashSession && !cashLoading);

  const handleBackToSales = () => {
    setPaymentModalOpen(false);
    setClientPickerOpen(false);
    setError('');
    navigate('/ventas', { replace: true });
  };

  const openPaymentModal = () => {
    if (isOffline) {
      setError('Sin conexión — no podés registrar ventas hasta recuperar internet.');
      return;
    }
    if (!cart.length) {
      setError('Agregue al menos un producto al carrito');
      scrollToCart();
      return;
    }
    setError('');
    setPaymentModalOpen(true);
  };

  const handleSubmit = async () => {
    if (isOffline) {
      setError('Sin conexión — no podés registrar ventas hasta recuperar internet.');
      return;
    }

    if (!cart.length) {
      setError('Agregue al menos un producto');
      scrollToCart();
      return;
    }

    const invalidQty = cart.find((i) => !i.cantidad || i.cantidad <= 0);
    if (invalidQty) {
      setError(`La cantidad de "${invalidQty.nombre}" debe ser mayor a 0`);
      return;
    }

    if (selectedPaymentMethod?.requiere_cliente && !clienteId) {
      setError(`Seleccione un cliente para pagar con ${selectedPaymentMethod.nombre}`);
      setPaymentModalOpen(true);
      return;
    }

    const sesion = needsCashForSale ? await refreshCashSession() : cashSession;

    if (needsCashForSale && !sesion) {
      setError('Debe abrir la caja antes de registrar ventas. Vaya a Caja y abra un turno.');
      setPaymentModalOpen(true);
      return;
    }

    if (
      selectedPaymentMethod?.requiere_monto_recibido &&
      Number(montoRecibido) < total
    ) {
      setError('El monto recibido debe ser mayor o igual al total');
      setPaymentModalOpen(true);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const venta = await saleService.create({
        cliente_id: clienteId ? Number(clienteId) : null,
        observaciones: observaciones.trim() || null,
        descuento: descuentoGlobal,
        metodo_pago: metodoPago,
        monto_recibido: selectedPaymentMethod?.requiere_monto_recibido
          ? Number(montoRecibido) || total
          : null,
        tipo_comprobante: tipoComprobante,
        requiere_caja: needsCashForSale,
        items: cart.map((i) => ({
          producto_id: i.producto_id,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario,
          descuento: i.descuento ?? 0,
        })),
      });
      navigate(`/ventas/${venta.id}`, {
        state: {
          justCreated: true,
          message: `${venta.numero} · ${formatCurrency(venta.total)}`,
        },
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="pb-28 xl:pb-8 w-full max-w-7xl mx-auto">
      <header className="flex flex-wrap items-center gap-3 mb-5 sm:mb-6">
        <button
          type="button"
          onClick={handleBackToSales}
          className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 touch-manipulation shrink-0"
          aria-label="Volver a ventas"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 text-brand-600 shrink-0" />
            Nueva venta
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Agregue productos y registre el pago cuando esté listo
          </p>
        </div>
        {requiresOpenCash && (
          <div className="order-last w-full sm:order-none sm:w-auto flex items-center gap-2">
            {cashLoading ? (
              <span className="text-sm text-slate-500">Verificando caja…</span>
            ) : cashSession ? (
              <Badge variant="activo" className="px-3 py-1.5">
                <Wallet className="w-4 h-4 inline mr-1" />
                Caja abierta
              </Badge>
            ) : (
              <Badge variant="inactivo" className="px-3 py-1.5">
                Caja cerrada
              </Badge>
            )}
          </div>
        )}
        {cart.length > 0 && (
          <OnlineOnlyButton
            size="lg"
            className="hidden xl:inline-flex min-h-11 shadow-md"
            onClick={openPaymentModal}
          >
            <CreditCard className="w-5 h-5" />
            Registrar pago
          </OnlineOnlyButton>
        )}
      </header>

      {isOffline && (
        <Alert className="mb-4">
          Sin conexión — la venta no se puede registrar hasta que vuelva internet.
        </Alert>
      )}

      {info && (
        <Alert variant="info" className="mb-4">
          {info}
        </Alert>
      )}
      {error && <Alert className="mb-4">{error}</Alert>}
      {stockWarning && (
        <Alert variant="warning" className="mb-4">
          {stockWarning}
        </Alert>
      )}
      {needsCashWarning && !paymentModalOpen && (
        <Alert variant="info" className="mb-4">
          No tiene caja abierta.{' '}
          <Link to="/caja" className="underline font-medium">
            Abrir caja
          </Link>{' '}
          antes de cobrar en efectivo.
        </Alert>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 xl:gap-6">
        <Card title="Buscar producto" className="!p-4 sm:!p-6 h-fit">
          <SearchInput
            id="buscar-prod-venta"
            label="Código o nombre"
            placeholder="Ej: ga, 001, nombre…"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            hint={`Mínimo ${MIN_SEARCH_CHARS} caracteres`}
            className="mb-3"
          />
          {searchError && <p className="text-sm text-red-600 mb-2">{searchError}</p>}
          <div
            className="space-y-2 overflow-y-auto overscroll-contain -mx-1 px-1"
            style={{ maxHeight: 'min(52vh, 420px)' }}
          >
            {searchLoading && (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            )}
            {!searchLoading && productSearch.trim().length < MIN_SEARCH_CHARS && (
              <p className="text-sm text-slate-500 text-center py-12 px-2">
                Escriba para buscar en el catálogo
              </p>
            )}
            {!searchLoading &&
              productSearch.trim().length >= MIN_SEARCH_CHARS &&
              searchResults.length === 0 &&
              !searchError && (
                <p className="text-sm text-slate-500 text-center py-12">
                  Sin resultados para &quot;{productSearch.trim()}&quot;
                </p>
              )}
            {!searchLoading &&
              searchResults.map((p) => {
                const stock = Number(p.stock ?? 0);
                return (
                  <ProductSearchCard
                    key={p.id}
                    product={p}
                    onClick={() => addToCart(p)}
                    footer={
                      <p
                        className={`text-xs mt-1.5 font-medium ${
                          stock <= 0
                            ? 'text-red-600'
                            : p.stock_bajo
                              ? 'text-amber-700'
                              : 'text-slate-500'
                        }`}
                      >
                        Stock {formatNumber(stock, 2)}
                        {stock < 0 ? ' · Negativo' : stock <= 0 ? ' · Sin stock' : ''}
                        {p.stock_bajo && stock > 0 ? ' · Bajo' : ''}
                      </p>
                    }
                  />
                );
              })}
          </div>
        </Card>

        <div ref={cartSectionRef} className="scroll-mt-4 flex flex-col min-h-0">
          <Card
            title="Carrito"
            subtitle={
              cart.length
                ? `${cart.length} producto${cart.length !== 1 ? 's' : ''}`
                : 'Vacío'
            }
            className="!p-4 sm:!p-6 flex-1 flex flex-col"
            action={
              cart.length > 0 ? (
                <span className="text-sm font-bold text-brand-700 tabular-nums">
                  {formatCurrency(subtotal)}
                </span>
              ) : null
            }
          >
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/80">
                <ShoppingCart className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-slate-600 font-medium">Sin productos</p>
                <p className="text-sm text-slate-500 mt-1 text-center">
                  Busque y toque un producto para agregarlo
                </p>
              </div>
            ) : (
              <>
                <div
                  className="space-y-3 flex-1 overflow-y-auto overscroll-contain -mx-1 px-1 mb-4"
                  style={{ maxHeight: 'min(52vh, 420px)' }}
                >
                  {cart.map((item) => (
                    <SaleCartLine
                      key={item.producto_id}
                      item={item}
                      onUpdate={updateCartItem}
                      onRemove={removeFromCart}
                    />
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-200 space-y-3 shrink-0">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium tabular-nums">{formatCurrency(subtotal)}</span>
                  </div>
                  {descuentoGlobal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Descuento (en pago)</span>
                      <span className="tabular-nums">−{formatCurrency(descuentoGlobal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-800">Total estimado</span>
                    <span className="text-xl font-bold text-brand-700 tabular-nums">
                      {formatCurrency(total)}
                    </span>
                  </div>
                  <OnlineOnlyButton
                    size="lg"
                    className="w-full min-h-12 shadow-md hidden xl:flex"
                    onClick={openPaymentModal}
                  >
                    <CreditCard className="w-5 h-5" />
                    Registrar pago
                  </OnlineOnlyButton>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      <SaleCheckoutModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        clients={clients}
        clienteId={clienteId}
        onClienteChange={handleClienteChange}
        onClientSelect={handleClientSelect}
        observaciones={observaciones}
        onObservacionesChange={setObservaciones}
        descuentoGlobal={descuentoGlobal}
        onDescuentoChange={setDescuentoGlobal}
        paymentMethods={paymentMethods}
        metodoPago={metodoPago}
        onMetodoPagoChange={handleMetodoPagoChange}
        tipoComprobante={tipoComprobante}
        onTipoComprobanteChange={setTipoComprobante}
        tipoComprobanteOptions={TIPOS_COMPROBANTE}
        selectedPaymentMethod={selectedPaymentMethod}
        selectedClient={selectedClient}
        isCuentaCorriente={isCuentaCorriente}
        total={total}
        subtotal={subtotal}
        montoRecibido={montoRecibido}
        onMontoRecibidoChange={setMontoRecibido}
        vuelto={vuelto}
        onSetMontoExacto={() => setMontoRecibido(String(total))}
        onAddMontoExtra={(extra) => setMontoRecibido(String(total + extra))}
        needsCashWarning={needsCashWarning}
        cashSession={cashSession}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitDisabled={submitDisabled}
      />

      <ClientPickerModal
        isOpen={clientPickerOpen}
        onClose={() => setClientPickerOpen(false)}
        onSelect={handleClientPicked}
        title="Cliente — cuenta corriente"
      />

      <SaleMobileCheckoutBar
        cartCount={cart.length}
        total={total}
        submitting={submitting}
        disabled={!cart.length || isOffline}
        paymentLabel={selectedPaymentMethod?.nombre}
        onRegisterPayment={openPaymentModal}
      />
    </div>
  );
};
