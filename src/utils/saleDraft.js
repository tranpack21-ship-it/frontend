const DRAFT_VERSION = 1;

const storageKey = (userId) => `tranpack-sale-draft-${userId}`;

const emptyDraft = () => ({
  v: DRAFT_VERSION,
  updatedAt: null,
  cart: [],
  clienteId: '',
  observaciones: '',
  descuentoGlobal: 0,
  splitPayment: false,
  paymentLines: [],
  tipoComprobante: 'ticket',
});

export const saleDraftHasContent = (draft) => {
  if (!draft) return false;
  return Boolean(
    (draft.cart && draft.cart.length > 0) ||
      draft.clienteId ||
      (draft.observaciones && String(draft.observaciones).trim()) ||
      Number(draft.descuentoGlobal) > 0
  );
};

export const loadSaleDraft = (userId) => {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== DRAFT_VERSION) return null;
    if (!saleDraftHasContent(parsed)) return null;
    return {
      ...emptyDraft(),
      ...parsed,
      cart: Array.isArray(parsed.cart) ? parsed.cart : [],
      paymentLines: Array.isArray(parsed.paymentLines) ? parsed.paymentLines : [],
    };
  } catch {
    return null;
  }
};

export const saveSaleDraft = (userId, draft) => {
  if (!userId) return;
  try {
    const payload = {
      v: DRAFT_VERSION,
      updatedAt: Date.now(),
      cart: draft.cart || [],
      clienteId: draft.clienteId || '',
      observaciones: draft.observaciones || '',
      descuentoGlobal: Number(draft.descuentoGlobal) || 0,
      splitPayment: Boolean(draft.splitPayment),
      paymentLines: draft.paymentLines || [],
      tipoComprobante: draft.tipoComprobante || 'ticket',
    };
    if (!saleDraftHasContent(payload)) {
      localStorage.removeItem(storageKey(userId));
      return;
    }
    localStorage.setItem(storageKey(userId), JSON.stringify(payload));
  } catch {
    // quota / private mode — ignore
  }
};

export const clearSaleDraft = (userId) => {
  if (!userId) return;
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    // ignore
  }
};
