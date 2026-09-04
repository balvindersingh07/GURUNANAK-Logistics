import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, RefreshCw, Package, Eye } from 'lucide-react';
import { PageHeader } from '../../components/layout/TopNav';
import Button from '../../components/ui/Button';
import SearchInput from '../../components/ui/SearchInput';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal, { ModalFooter } from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import Pagination, { usePagination } from '../../components/ui/Pagination';
import { FormField, inputClass, selectClass } from '../../components/ui/FormField';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import type { Delivery, DeliveryStatus, Priority } from '../../types';
import { DELIVERY_STATUSES, STATUS_LABELS } from '../../types';
import { CITY_COORDS } from '../../data/mockData';

const emptyForm = {
  customerId: '',
  pickup: '',
  pickupCity: 'Jaipur',
  destination: '',
  destinationCity: 'Delhi',
  packageType: 'General',
  weight: '100 kg',
  priority: 'normal' as Priority,
  driverId: '',
  vehicleId: '',
  expectedDelivery: '',
};

export default function DeliveriesPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    deliveries,
    customers,
    drivers,
    vehicles,
    addDelivery,
    updateDelivery,
    deleteDelivery,
    updateDeliveryStatus,
    getCustomer,
    getDriver,
    getVehicle,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Delivery | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [newStatus, setNewStatus] = useState<DeliveryStatus>('pending');

  const filtered = useMemo(() => {
    return deliveries.filter((d) => {
      const customer = getCustomer(d.customerId);
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        d.trackingId.toLowerCase().includes(q) ||
        d.pickupCity.toLowerCase().includes(q) ||
        d.destinationCity.toLowerCase().includes(q) ||
        customer?.name.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || d.status === statusFilter;
      const matchPriority = priorityFilter === 'all' || d.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [deliveries, search, statusFilter, priorityFilter, getCustomer]);

  const { page, setPage, totalPages, paginated, pageSize } = usePagination(filtered, 8);

  const openCreate = () => {
    setForm(emptyForm);
    setCreateOpen(true);
  };

  const openEdit = (d: Delivery) => {
    setSelected(d);
    setForm({
      customerId: d.customerId,
      pickup: d.pickup,
      pickupCity: d.pickupCity,
      destination: d.destination,
      destinationCity: d.destinationCity,
      packageType: d.packageType,
      weight: d.weight,
      priority: d.priority,
      driverId: d.driverId || '',
      vehicleId: d.vehicleId || '',
      expectedDelivery: d.expectedDelivery,
    });
    setEditOpen(true);
  };

  const openStatus = (d: Delivery) => {
    setSelected(d);
    setNewStatus(d.status);
    setStatusOpen(true);
  };

  const handleCreate = async () => {
    if (!form.customerId || !form.pickup || !form.destination) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    try {
      await addDelivery(
        {
          ...form,
          driverId: form.driverId || undefined,
          vehicleId: form.vehicleId || undefined,
        },
        !!form.driverId,
      );
      showToast('Delivery created successfully');
      setCreateOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create delivery', 'error');
    }
  };

  const handleEdit = async () => {
    if (!selected) return;
    try {
      await updateDelivery(selected.id, {
        ...form,
        driverId: form.driverId || undefined,
        vehicleId: form.vehicleId || undefined,
      });
      showToast('Delivery updated successfully');
      setEditOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update delivery', 'error');
    }
  };

  const handleStatusUpdate = async () => {
    if (!selected) return;
    try {
      await updateDeliveryStatus(selected.id, newStatus);
      showToast(`Status updated to ${STATUS_LABELS[newStatus]}`);
      setStatusOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Invalid status transition', 'error');
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteDelivery(deleteId);
        showToast('Delivery deleted', 'info');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to delete', 'error');
      }
    }
  };

  const formFields = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField label="Customer" required className="sm:col-span-2">
        <select
          value={form.customerId}
          onChange={(e) => setForm({ ...form, customerId: e.target.value })}
          className={selectClass}
        >
          <option value="">Select customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Pickup Address" required>
        <input value={form.pickup} onChange={(e) => setForm({ ...form, pickup: e.target.value })} className={inputClass} placeholder="Warehouse address" />
      </FormField>
      <FormField label="Pickup City" required>
        <select value={form.pickupCity} onChange={(e) => setForm({ ...form, pickupCity: e.target.value })} className={selectClass}>
          {Object.keys(CITY_COORDS).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Destination Address" required>
        <input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} className={inputClass} />
      </FormField>
      <FormField label="Destination City" required>
        <select value={form.destinationCity} onChange={(e) => setForm({ ...form, destinationCity: e.target.value })} className={selectClass}>
          {Object.keys(CITY_COORDS).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Package Type">
        <select value={form.packageType} onChange={(e) => setForm({ ...form, packageType: e.target.value })} className={selectClass}>
          {['General', 'Electronics', 'Agriculture', 'Textiles', 'Food & Beverages', 'Industrial Parts'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Weight">
        <input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className={inputClass} />
      </FormField>
      <FormField label="Priority">
        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })} className={selectClass}>
          {(['low', 'normal', 'high', 'urgent'] as Priority[]).map((p) => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Expected Delivery">
        <input type="date" value={form.expectedDelivery} onChange={(e) => setForm({ ...form, expectedDelivery: e.target.value })} className={inputClass} />
      </FormField>
      <FormField label="Driver">
        <select value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })} className={selectClass}>
          <option value="">Unassigned</option>
          {drivers.filter((d) => d.status !== 'offline').map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Vehicle">
        <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className={selectClass}>
          <option value="">Unassigned</option>
          {vehicles.filter((v) => v.status !== 'inactive').map((v) => (
            <option key={v.id} value={v.id}>{v.vehicleNumber}</option>
          ))}
        </select>
      </FormField>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Deliveries"
        description="Manage all shipments across Rajasthan, Punjab & Delhi NCR"
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/deliveries/create')}>
              <Plus size={18} /> Full Form
            </Button>
            <Button onClick={openCreate}>
              <Plus size={18} /> Create Delivery
            </Button>
          </>
        }
      />

      <div className="glass-card rainbow-border p-4 mb-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search tracking ID, customer, city..." className="flex-1" />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className={`${selectClass} lg:w-44`}>
            <option value="all">All Statuses</option>
            {DELIVERY_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }} className={`${selectClass} lg:w-40`}>
            <option value="all">All Priorities</option>
            {(['low', 'normal', 'high', 'urgent'] as Priority[]).map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No deliveries found"
          description="Try adjusting your search or filters, or create a new delivery."
          action={<Button onClick={openCreate}><Plus size={18} /> Create Delivery</Button>}
        />
      ) : (
        <div className="glass-card rainbow-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Tracking ID</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Customer</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Route</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Package</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Driver</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Vehicle</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Priority</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Expected</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{d.trackingId}</td>
                    <td className="px-4 py-3">{getCustomer(d.customerId)?.name || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{d.pickupCity} → {d.destinationCity}</td>
                    <td className="px-4 py-3">{d.packageType}<br /><span className="text-xs text-slate-400">{d.weight}</span></td>
                    <td className="px-4 py-3">{getDriver(d.driverId || '')?.name || '—'}</td>
                    <td className="px-4 py-3">{getVehicle(d.vehicleId || '')?.vehicleNumber || '—'}</td>
                    <td className="px-4 py-3 capitalize">{d.priority}</td>
                    <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                    <td className="px-4 py-3 text-slate-500">{d.expectedDelivery}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/deliveries/${d.id}`} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" title="View">
                          <Eye size={16} />
                        </Link>
                        <button type="button" onClick={() => openStatus(d)} className="p-1.5 rounded-lg hover:bg-violet-50 text-violet-600" title="Update Status">
                          <RefreshCw size={16} />
                        </button>
                        <button type="button" onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button type="button" onClick={() => setDeleteId(d.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={pageSize} />
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Delivery" size="lg" footer={
        <ModalFooter onCancel={() => setCreateOpen(false)} onConfirm={handleCreate} confirmLabel="Create" />
      }>
        {formFields}
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Delivery" size="lg" footer={
        <ModalFooter onCancel={() => setEditOpen(false)} onConfirm={handleEdit} confirmLabel="Save Changes" />
      }>
        {formFields}
      </Modal>

      <Modal open={statusOpen} onClose={() => setStatusOpen(false)} title="Update Status" footer={
        <ModalFooter onCancel={() => setStatusOpen(false)} onConfirm={handleStatusUpdate} confirmLabel="Update Status" />
      }>
        <FormField label="New Status">
          <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as DeliveryStatus)} className={selectClass}>
            {DELIVERY_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </FormField>
        {selected && (
          <p className="mt-3 text-sm text-slate-500">
            Updating {selected.trackingId} — currently <StatusBadge status={selected.status} />
          </p>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Delivery"
        message="Are you sure you want to delete this delivery? This action cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
}
