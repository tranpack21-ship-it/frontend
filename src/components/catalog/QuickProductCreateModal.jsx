import { useEffect, useState } from 'react';
import { PackagePlus } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Spinner } from '../ui/Spinner';
import { ProductForm } from '../forms/ProductForm';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { getErrorMessage } from '../../utils/getErrorMessage';

export const QuickProductCreateModal = ({
  isOpen,
  onClose,
  initialNombre = '',
  onCreated,
}) => {
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setFormKey((k) => k + 1);
    let cancelled = false;
    setLoadingCats(true);
    categoryService
      .listActive()
      .then((cats) => {
        if (!cancelled) setCategories(Array.isArray(cats) ? cats : []);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoadingCats(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handleCategoryCreated = (categoria) => {
    setCategories((prev) =>
      prev.some((c) => c.id === categoria.id) ? prev : [...prev, categoria]
    );
  };

  const handleSubmit = async (data) => {
    setSubmitting(true);
    setError('');
    try {
      const producto = await productService.create(data);
      onCreated?.(producto);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear producto rápido"
      size="3xl"
      stickyFooter
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="quick-product-form"
            isLoading={submitting}
            disabled={submitting || loadingCats}
          >
            <PackagePlus className="w-4 h-4" />
            Crear y agregar a la venta
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          El producto se crea en el catálogo y se agrega al carrito sin perder la venta en curso.
        </p>
        {error && <Alert>{error}</Alert>}
        {loadingCats ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <ProductForm
            key={formKey}
            formId="quick-product-form"
            categories={categories}
            onCategoryCreated={handleCategoryCreated}
            defaultValues={{
              codigo: '',
              nombre: initialNombre.trim(),
              descripcion: '',
              imagen_url: '',
              color: '',
              talle: '',
              categoria_id: categories[0]?.id ? String(categories[0].id) : '',
              precio_venta: 0,
              venta_por_paquete: false,
              precio_venta_paquete: 0,
              unidades_por_paquete: 1,
              precio_costo: 0,
              stock: 0,
              stock_minimo: 0,
              unidad_medida: 'unidad',
              estado: 'activo',
            }}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </Modal>
  );
};
