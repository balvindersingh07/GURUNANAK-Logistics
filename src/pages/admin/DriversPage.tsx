import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Star, Phone, Mail, Eye } from 'lucide-react';
import { PageHeader } from '../../components/layout/TopNav';
import Button from '../../components/ui/Button';
import SearchInput from '../../components/ui/SearchInput';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal, { ModalFooter } from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { FormField, inputClass, selectClass } from '../../components/ui/FormField';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import type { DriverStatus } from '../../types';

const emptyDriver = {
  name: '',
  phone: '',
  email: '',
  licenseNumber: '',
  licenseExpiry: '',
  address: '',
  vehicleId: '',
  experience: 0,
};

export default function DriversPage() {
  const { showToast } = useToast();
  const { drivers, vehicles, addDriver, getVehicle } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyDriver);

  const filtered = useMemo(() => {
    return drivers.filter((d) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.phone.includes(q) ||
        d.email.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || d.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [drivers, search, statusFilter]);

  const handleAdd = () => {
    if (!form.name || !form.phone || !form.licenseNumber) {
      showToast('Name, phone, and license number are required', 'error');
      return;
    }
    addDriver({ ...form, vehicleId: form.vehicleId || undefined });
    showToast(`${form.name} added to driver roster`);
    setForm(emptyDriver);
    setModalOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Drivers"
        description="Manage driver roster for GURUNANAK logistics operations"
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={18} /> Add Driver
          </Button>
        }
      />

      <div className="glass-card rainbow-border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search drivers..." className="flex-1" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${selectClass} sm:w-44`}>
            <option value="all">All Statuses</option>
            {(['available', 'on_delivery', 'offline'] as DriverStatus[]).map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No drivers found" action={<Button onClick={() => setModalOpen(true)}><Plus size={18} /> Add Driver</Button>} />
      ) : (
        <>
          <div className="hidden lg:block glass-card rainbow-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Driver</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Contact</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">License</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Vehicle</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Rating</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Deliveries</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full rainbow-gradient text-sm font-bold text-white">
                            {d.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-navy">{d.name}</p>
                            <p className="text-xs text-slate-500">{d.experience} yrs exp.</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p>{d.phone}</p>
                        <p className="text-xs text-slate-500">{d.email}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{d.licenseNumber}</td>
                      <td className="px-4 py-3">{getVehicle(d.vehicleId || '')?.vehicleNumber || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-amber-600">
                          <Star size={14} fill="currentColor" /> {d.rating}
                        </span>
                      </td>
                      <td className="px-4 py-3">{d.completedDeliveries}/{d.totalDeliveries}</td>
                      <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/drivers/${d.id}`} className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-700 text-xs font-medium">
                          <Eye size={14} /> Profile
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((d) => (
              <div key={d.id} className="glass-card rainbow-border p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full rainbow-gradient text-sm font-bold text-white">
                      {d.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-navy">{d.name}</p>
                      <StatusBadge status={d.status} />
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-amber-600 text-sm">
                    <Star size={14} fill="currentColor" /> {d.rating}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-slate-600 mb-4">
                  <p className="flex items-center gap-2"><Phone size={14} /> {d.phone}</p>
                  <p className="flex items-center gap-2"><Mail size={14} /> {d.email}</p>
                  <p>{d.completedDeliveries} completed deliveries</p>
                </div>
                <Link to={`/drivers/${d.id}`}>
                  <Button variant="outline" size="sm" className="w-full">View Profile</Button>
                </Link>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Driver" size="lg" footer={
        <ModalFooter onCancel={() => setModalOpen(false)} onConfirm={handleAdd} confirmLabel="Add Driver" />
      }>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Full Name" required>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          </FormField>
          <FormField label="Phone" required>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="+91 98765 43210" />
          </FormField>
          <FormField label="Email">
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
          </FormField>
          <FormField label="Experience (years)">
            <input type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: Number(e.target.value) })} className={inputClass} />
          </FormField>
          <FormField label="License Number" required>
            <input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} className={inputClass} placeholder="RJ-2020-XXXXXXX" />
          </FormField>
          <FormField label="License Expiry">
            <input type="date" value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} className={inputClass} />
          </FormField>
          <FormField label="Address" className="sm:col-span-2">
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} />
          </FormField>
          <FormField label="Assign Vehicle">
            <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className={selectClass}>
              <option value="">None</option>
              {vehicles.filter((v) => v.status === 'available').map((v) => (
                <option key={v.id} value={v.id}>{v.vehicleNumber}</option>
              ))}
            </select>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
