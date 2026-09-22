import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Plus, Pencil, ToggleLeft } from 'lucide-react';
import { inventoryMotiveService } from '../services/inventoryMotiveService';
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
import { InventoryMotiveForm } from '../components/forms/InventoryMotiveForm';
import { getErrorMessage } from '../utils/getErrorMessage';

const tipoLabel = {
  entrada: 'Entrada',
  salida: 'Salida',
  ambos: 'Ambos',
};

export const InventoryMotivesConfigPage = () => {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(PERMISSIONS.INVENTARIO_MOTIVOS_GESTIONAR);

  const [motives, setMotives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [modalMode, setModalMode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchMotives = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await inventoryMotiveService.list({
        estado: estadoFilter,
        tipo: tipoFilter,
      });
      setMotives(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [estadoFilter, tipoFilter]);

  useEffect(() => {
    fetchMotives();
  }, [fetchMotives]);

  useEffect(() => {
    if (!success) return undefined;
    const t = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(t);
  }, [success]);

  const openCreate = () => {
    setEditing(null);
    setModalMode('create');
  };

  const openEdit = (motive) => {
    setEditing({
      id: motive.id,
      values: {
        nombre: motive.nombre,
        tipo: motive.tipo,
        orden: motive.orden,
        estado: motive.estado,
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
        await inventoryMotiveService.update(editing.id, data);
        setSuccess('Motivo actualizado');
      } else {
        await inventoryMotiveService.create(data);
        setSuccess('Motivo creado');
      }
      closeModal();
      fetchMotives();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeactivate = async (motive) => {
    if (!window.confirm(`¿Desactivar el motivo "${motive.nombre}"?`)) return;
    setError('');
    try {
      await inventoryMotiveService.deactivate(motive.id);
      setSuccess('Motivo desactivado');
      fetchMotives();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-brand-600" />
            Motivos de inventario
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Motivos predefinidos para entradas y salidas (ej. Compra de mercadería)
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" /> Nuevo motivo
          </Button>
        )}
      </div>

      {error && <Alert>{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card className="!p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select
            id="filtro-estado-motivo"
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
            id="filtro-tipo-motivo"
            label="Tipo"
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            options={[
              { value: 'todos', label: 'Todos' },
              { value: 'entrada', label: 'Entradas' },
              { value: 'salida', label: 'Salidas' },
              { value: 'ambos', label: 'Ambos' },
            ]}
          />
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : motives.length === 0 ? (
        <EmptyState
          title="Sin motivos"
          description="Cree motivos como Compra de mercadería para conciliar con caja"
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
                {motives.map((m) => (
                  <tr key={m.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{m.nombre}</td>
                    <td className="px-4 py-3 text-slate-600">{tipoLabel[m.tipo] || m.tipo}</td>
                    <td className="px-4 py-3 text-slate-500 tabular-nums">{m.orden}</td>
                    <td className="px-4 py-3">
                      <Badge variant={m.estado === 'activo' ? 'activo' : 'inactivo'}>
                        {m.estado}
                      </Badge>
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(m)}
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {m.estado === 'activo' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="!text-amber-700"
                              onClick={() => handleDeactivate(m)}
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
        title={modalMode === 'edit' ? 'Editar motivo' : 'Nuevo motivo'}
        size="md"
      >
        <InventoryMotiveForm
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
