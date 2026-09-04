import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Wrench, Truck, Eye } from 'lucide-react';
import { PageHeader } from '../../components/layout/TopNav';
import Button from '../../components/ui/Button';
import KPICard from '../../components/ui/KPICard';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal, { ModalFooter } from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { FormField, inputClass, selectClass } from '../../components/ui/FormField';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import type { Vehicle, VehicleType } from '../../types';

const emptyVehicle = {
  vehicleNumber: '',
  registration: '',
  type: 'Truck' as VehicleType,
  capacity: '5 Ton',
  driverId: '',
  mileage: 0,
  insuranceExpiry: '',
  lastService: '',
  nextService: '',
};

export default function FleetPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { vehicles, drivers, addVehicle, updateVehicle, deleteVehicle, getDriver } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyVehicle);

  const available = vehicles.filter((v) => v.status === 'available').length;
  const onTrip = vehicles.filter((v) => v.status === 'on_trip').length;
  const maintenance = vehicles.filter((v) => v.status === 'maintenance').length;

  const openAdd = () => {
    setEditing(null);
    setForm(emptyVehicle);
    setModalOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setForm({
      vehicleNumber: v.vehicleNumber,
      registration: v.registration,
      type: v.type,
      capacity: v.capacity,
      driverId: v.driverId || '',
      mileage: v.mileage,
      insuranceExpiry: v.insuranceExpiry,
      lastService: v.lastService,
      nextService: v.nextService,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.vehicleNumber || !form.registration) {
      showToast('Vehicle number and registration are required', 'error');
      return;
    }
    const data = { ...form, driverId: form.driverId || undefined };
    if (editing) {
      updateVehicle(editing.id, data);
      showToast('Vehicle updated successfully');
    } else {
      addVehicle(data);
      showToast('Vehicle added to fleet');
    }
    setModalOpen(false);
  };

  const handleMaintenance = (v: Vehicle) => {
    updateVehicle(v.id, { status: 'maintenance', nextService: new Date(Date.now() + 86400000 * 90).toISOString().split('T')[0] });
    showToast(`${v.vehicleNumber} marked for maintenance`, 'info');
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteVehicle(deleteId);
      showToast('Vehicle removed from fleet', 'info');
    }
  };

  return (
    <div>
      <PageHeader
        title="Fleet Management"
        description="Monitor and manage GURUNANAK vehicle fleet across North India"
        actions={
          <Button onClick={openAdd}>
            <Plus size={18} /> Add Vehicle
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KPICard title="Available" value={available} icon={Truck} accent={3} />
        <KPICard title="On Trip" value={onTrip} icon={Truck} accent={1} />
        <KPICard title="Maintenance" value={maintenance} icon={Wrench} accent={4} />
      </div>

      {vehicles.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No vehicles in fleet"
          action={<Button onClick={openAdd}><Plus size={18} /> Add Vehicle</Button>}
        />
      ) : (
        <div className="glass-card rainbow-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Vehicle No.</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Registration</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Capacity</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Driver</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Mileage</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Next Service</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-navy">{v.vehicleNumber}</td>
                    <td className="px-4 py-3 font-mono text-xs">{v.registration}</td>
                    <td className="px-4 py-3">{v.type}</td>
                    <td className="px-4 py-3">{v.capacity}</td>
                    <td className="px-4 py-3">{getDriver(v.driverId || '')?.name || '—'}</td>
                    <td className="px-4 py-3">{v.mileage.toLocaleString('en-IN')} km</td>
                    <td className="px-4 py-3 text-slate-500">{v.nextService}</td>
                    <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => navigate(`/fleet/${v.id}`)} className="p-1.5 rounded-lg hover:bg-violet-50 text-violet-600" title="View">
                          <Eye size={16} />
                        </button>
                        <button type="button" onClick={() => handleMaintenance(v)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600" title="Maintenance">
                          <Wrench size={16} />
                        </button>
                        <button type="button" onClick={() => openEdit(v)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button type="button" onClick={() => setDeleteId(v.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Vehicle' : 'Add Vehicle'}
        size="lg"
        footer={<ModalFooter onCancel={() => setModalOpen(false)} onConfirm={handleSave} confirmLabel={editing ? 'Save' : 'Add'} />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Vehicle Number" required>
            <input value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} className={inputClass} placeholder="GNK-TRK-007" />
          </FormField>
          <FormField label="Registration" required>
            <input value={form.registration} onChange={(e) => setForm({ ...form, registration: e.target.value })} className={inputClass} placeholder="RJ-14-XX-0000" />
          </FormField>
          <FormField label="Type">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as VehicleType })} className={selectClass}>
              {(['Truck', 'Van', 'Mini Truck', 'Tempo'] as VehicleType[]).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Capacity">
            <input value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className={inputClass} />
          </FormField>
          <FormField label="Assigned Driver">
            <select value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })} className={selectClass}>
              <option value="">None</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Mileage (km)">
            <input type="number" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: Number(e.target.value) })} className={inputClass} />
          </FormField>
          <FormField label="Insurance Expiry">
            <input type="date" value={form.insuranceExpiry} onChange={(e) => setForm({ ...form, insuranceExpiry: e.target.value })} className={inputClass} />
          </FormField>
          <FormField label="Last Service">
            <input type="date" value={form.lastService} onChange={(e) => setForm({ ...form, lastService: e.target.value })} className={inputClass} />
          </FormField>
          <FormField label="Next Service">
            <input type="date" value={form.nextService} onChange={(e) => setForm({ ...form, nextService: e.target.value })} className={inputClass} />
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Remove Vehicle"
        message="Are you sure you want to remove this vehicle from the fleet?"
      />
    </div>
  );
}
