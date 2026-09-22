import { useState, useEffect, useCallback } from 'react';
import { Tags, Plus, Pencil, ToggleLeft } from 'lucide-react';
import { cashConceptService } from '../services/cashConceptService';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../constants/permissions';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { EmptyState } from '../components/common/EmptyState';
import { CashConceptForm } from '../components/forms/CashConceptForm';
import { getErrorMessage } from '../utils/getErrorMessage';

const tipoLabel = {
  ingreso: 'Ingreso',
  egreso: 'Egreso',
  ambos: 'Ambos',
};

export const CashConceptsConfigPage = () => {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(PERMISSIONS.CAJA_CONCEPTOS_GESTIONAR);

  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [modalMode, setModalMode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchConcepts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await cashConceptService.list({
        estado: estadoFilter,
        tipo: tipoFilter,
      });
      setConcepts(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [estadoFilter, tipoFilter]);

  useEffect(() => {
    fetchConcepts();
  }, [fetchConcepts]);

  useEffect(() => {
    if (!success) return undefined;
    const t = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(t);
  }, [success]);

  const openCreate = () => {
    setEditing(null);
    setModalMode('create');
  };

  const openEdit = (concept) => {
    setEditing({
      id: concept.id,
      values: {
        nombre: concept.nombre,
        tipo: concept.tipo,
        orden: concept.orden,
        estado: concept.estado,
      },
    });
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditing(null);
  };

  const handleSubmit = async (data) => {
    setFormLoading(true);
    setError('');
    try {
      if (modalMode === 'edit') {
        await cashConceptService.update(editing.id, data);
        setSuccess('Concepto actualizado');
      } else {
        await cashConceptService.create(data);
        setSuccess('Concepto creado');
      }
      closeModal();
      fetchConcepts();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeactivate = async (concept) => {
    if (!window.confirm(`¿Desactivar el concepto "${concept.nombre}"?`)) return;
    setError('');
    try {
      await cashConceptService.deactivate(concept.id);
      setSuccess('Concepto desactivado');
      fetchConcepts();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Tags className="w-7 h-7 text-brand-600" />
            Conceptos de caja
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Descripciones predefinidas para ingresos y egresos
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" /> Nuevo concepto
          </Button>
        )}
      </div>

      {error && <Alert>{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card className="!p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select
            id="filtro-estado-concepto"
            label="Estado"
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            options={[
              { value: 'todos', label: 'Todos' },
              { value: 'activo', label: 'Activos' },
              { value: 'inactivo', label: 'Inactivos' },
            ]}
          />
          <Select
            id="filtro-tipo-concepto"
            label="Tipo"
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            options={[
              { value: 'todos', label: 'Todos' },
              { value: 'egreso', label: 'Egresos' },
              { value: 'ingreso', label: 'Ingresos' },
              { value: 'ambos', label: 'Ambos' },
            ]}
          />
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : concepts.length === 0 ? (
        <EmptyState
          title="Sin conceptos"
          description="Cree descripciones como Sueldos o Compra de mercadería"
        />
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500 bg-slate-50/80">
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Orden</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  {canManage && <th className="px-4 py-3 font-medium text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {concepts.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{c.nombre}</td>
                    <td className="px-4 py-3 text-slate-600">{tipoLabel[c.tipo] || c.tipo}</td>
                    <td className="px-4 py-3 text-slate-500 tabular-nums">{c.orden}</td>
                    <td className="px-4 py-3">
                      <Badge variant={c.estado === 'activo' ? 'activo' : 'inactivo'}>
                        {c.estado}
                      </Badge>
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(c)}
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {c.estado === 'activo' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="!text-amber-700"
                              onClick={() => handleDeactivate(c)}
                              title="Desactivar"
                            >
                              <ToggleLeft className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        isOpen={Boolean(modalMode)}
        onClose={closeModal}
        title={modalMode === 'edit' ? 'Editar concepto' : 'Nuevo concepto'}
        size="md"
      >
        <CashConceptForm
          mode={modalMode === 'edit' ? 'edit' : 'create'}
          defaultValues={editing?.values}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isLoading={formLoading}
        />
      </Modal>
    </div>
  );
};
