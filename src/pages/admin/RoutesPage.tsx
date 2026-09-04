import { useState } from 'react';
import { Plus, Route, MapPin, Trash2, Eye } from 'lucide-react';
import { PageHeader } from '../../components/layout/TopNav';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal, { ModalFooter } from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { FormField, inputClass, selectClass } from '../../components/ui/FormField';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import type { RouteStatus } from '../../types';

const emptyRoute = {
  origin: 'Jaipur',
  destination: 'Delhi',
  stops: '',
  distance: 0,
  estimatedTime: '',
  driverId: '',
  vehicleId: '',
  status: 'scheduled' as RouteStatus,
};

export default function RoutesPage() {
  const { showToast } = useToast();
  const { routes, drivers, vehicles, addRoute, deleteRoute, getDriver, getVehicle } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyRoute);
  const [previewRoute, setPreviewRoute] = useState<typeof form | null>(null);

  const handleCreate = () => {
    if (!form.origin || !form.destination || !form.distance) {
      showToast('Origin, destination, and distance are required', 'error');
      return;
    }
    addRoute({
      ...form,
      stops: form.stops.split(',').map((s) => s.trim()).filter(Boolean),
      driverId: form.driverId || undefined,
      vehicleId: form.vehicleId || undefined,
    });
    showToast('Route created successfully');
    setForm(emptyRoute);
    setModalOpen(false);
  };

  const openPreview = (route: typeof form) => {
    setPreviewRoute(route);
    setPreviewOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteRoute(deleteId);
      showToast('Route deleted', 'info');
    }
  };

  const routeForm = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField label="Origin" required>
        <input value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} className={inputClass} />
      </FormField>
      <FormField label="Destination" required>
        <input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} className={inputClass} />
      </FormField>
      <FormField label="Stops (comma-separated)" className="sm:col-span-2">
        <input value={form.stops} onChange={(e) => setForm({ ...form, stops: e.target.value })} className={inputClass} placeholder="Neemrana, Behror, Gurugram" />
      </FormField>
      <FormField label="Distance (km)" required>
        <input type="number" value={form.distance || ''} onChange={(e) => setForm({ ...form, distance: Number(e.target.value) })} className={inputClass} />
      </FormField>
      <FormField label="Estimated Time">
        <input value={form.estimatedTime} onChange={(e) => setForm({ ...form, estimatedTime: e.target.value })} className={inputClass} placeholder="5h 30m" />
      </FormField>
      <FormField label="Driver">
        <select value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })} className={selectClass}>
          <option value="">Unassigned</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Vehicle">
        <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className={selectClass}>
          <option value="">Unassigned</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.vehicleNumber}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Status">
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as RouteStatus })} className={selectClass}>
          {(['active', 'scheduled', 'completed', 'inactive'] as RouteStatus[]).map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </FormField>
      <div className="sm:col-span-2">
        <Button variant="outline" size="sm" onClick={() => openPreview(form)}>
          <Eye size={16} /> Preview Route
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Routes"
        description="Plan and manage logistics routes across North India"
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={18} /> Create Route
          </Button>
        }
      />

      {routes.length === 0 ? (
        <EmptyState icon={Route} title="No routes configured" action={<Button onClick={() => setModalOpen(true)}><Plus size={18} /> Create Route</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routes.map((r) => (
            <div key={r.id} className="glass-card rainbow-border p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono text-xs text-violet-600 font-medium">{r.routeId}</p>
                  <h3 className="text-lg font-semibold text-navy mt-1">
                    {r.origin} → {r.destination}
                  </h3>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <div className="space-y-2 text-sm text-slate-600 mb-4">
                <p className="flex items-center gap-2"><MapPin size={14} /> {r.distance} km · {r.estimatedTime}</p>
                {r.stops.length > 0 && (
                  <p className="text-xs">Stops: {r.stops.join(' → ')}</p>
                )}
                <p>Driver: {getDriver(r.driverId || '')?.name || 'Unassigned'}</p>
                <p>Vehicle: {getVehicle(r.vehicleId || '')?.vehicleNumber || 'Unassigned'}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openPreview({
                  origin: r.origin,
                  destination: r.destination,
                  stops: r.stops.join(', '),
                  distance: r.distance,
                  estimatedTime: r.estimatedTime,
                  driverId: r.driverId || '',
                  vehicleId: r.vehicleId || '',
                  status: r.status,
                })}>
                  <Eye size={14} /> Preview
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteId(r.id)}>
                  <Trash2 size={14} className="text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Route" size="lg" footer={
        <ModalFooter onCancel={() => setModalOpen(false)} onConfirm={handleCreate} confirmLabel="Create Route" />
      }>
        {routeForm}
      </Modal>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Route Preview" size="md" footer={
        <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
      }>
        {previewRoute && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50/80 p-4">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <div>
                  <p className="font-medium text-navy">{previewRoute.origin}</p>
                  <p className="text-xs text-slate-500">Origin</p>
                </div>
              </div>
              {previewRoute.stops.split(',').filter(Boolean).map((stop, i) => (
                <div key={i} className="flex items-center gap-3 ml-1.5 border-l-2 border-dashed border-violet-200 pl-4 py-2">
                  <div className="h-2 w-2 rounded-full bg-violet-400" />
                  <p className="text-sm text-slate-600">{stop.trim()}</p>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div>
                  <p className="font-medium text-navy">{previewRoute.destination}</p>
                  <p className="text-xs text-slate-500">Destination</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-violet-50 p-3">
                <p className="text-slate-500">Distance</p>
                <p className="font-semibold text-navy">{previewRoute.distance} km</p>
              </div>
              <div className="rounded-lg bg-cyan-50 p-3">
                <p className="text-slate-500">Est. Time</p>
                <p className="font-semibold text-navy">{previewRoute.estimatedTime || '—'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Route"
        message="Are you sure you want to delete this route?"
      />
    </div>
  );
}
