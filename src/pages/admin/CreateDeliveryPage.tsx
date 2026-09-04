import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, User, Truck } from 'lucide-react';
import { PageHeader } from '../../components/layout/TopNav';
import Button from '../../components/ui/Button';
import { FormField, inputClass, selectClass } from '../../components/ui/FormField';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import type { Priority } from '../../types';
import { CITY_COORDS } from '../../data/mockData';

export default function CreateDeliveryPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { customers, drivers, vehicles, addDelivery } = useApp();

  const [form, setForm] = useState({
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
    expectedDelivery: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
  });

  const validate = () => {
    if (!form.customerId || !form.pickup || !form.destination) {
      showToast('Please fill all required fields', 'error');
      return false;
    }
    return true;
  };

  const handleSave = async (assign = false) => {
    if (!validate()) return;
    if (assign && !form.driverId) {
      showToast('Please select a driver to assign', 'error');
      return;
    }
    try {
      const delivery = await addDelivery(
        {
          ...form,
          driverId: form.driverId || undefined,
          vehicleId: form.vehicleId || undefined,
        },
        assign,
      );
      showToast(
        assign ? `Delivery assigned — ${delivery.trackingId}` : `Delivery saved — ${delivery.trackingId}`,
      );
      navigate(`/deliveries/${delivery.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create delivery', 'error');
    }
  };

  const Section = ({ icon: Icon, title, children }: { icon: typeof Package; title: string; children: React.ReactNode }) => (
    <div className="glass-card rainbow-border p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="rounded-xl bg-violet-100 p-2 text-violet-600">
          <Icon size={20} />
        </div>
        <h3 className="text-lg font-semibold text-navy">{title}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Create Delivery"
        description="Register a new shipment for GURUNANAK logistics network"
        actions={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> Cancel
          </Button>
        }
      />

      <div className="space-y-6 max-w-4xl">
        <Section icon={User} title="Customer & Priority">
          <FormField label="Customer" required className="sm:col-span-2">
            <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} className={selectClass}>
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
              ))}
            </select>
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
        </Section>

        <Section icon={MapPin} title="Pickup Details">
          <FormField label="Pickup Address" required className="sm:col-span-2">
            <input value={form.pickup} onChange={(e) => setForm({ ...form, pickup: e.target.value })} className={inputClass} placeholder="e.g. Warehouse 12, Sitapura Industrial Area" />
          </FormField>
          <FormField label="Pickup City" required>
            <select value={form.pickupCity} onChange={(e) => setForm({ ...form, pickupCity: e.target.value })} className={selectClass}>
              {Object.keys(CITY_COORDS).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </FormField>
        </Section>

        <Section icon={MapPin} title="Destination Details">
          <FormField label="Destination Address" required className="sm:col-span-2">
            <input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} className={inputClass} placeholder="e.g. Okhla Phase 2, New Delhi" />
          </FormField>
          <FormField label="Destination City" required>
            <select value={form.destinationCity} onChange={(e) => setForm({ ...form, destinationCity: e.target.value })} className={selectClass}>
              {Object.keys(CITY_COORDS).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </FormField>
        </Section>

        <Section icon={Package} title="Package Details">
          <FormField label="Package Type">
            <select value={form.packageType} onChange={(e) => setForm({ ...form, packageType: e.target.value })} className={selectClass}>
              {['General', 'Electronics', 'Agriculture', 'Textiles', 'Food & Beverages', 'Industrial Parts'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Weight">
            <input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className={inputClass} placeholder="e.g. 250 kg" />
          </FormField>
        </Section>

        <Section icon={Truck} title="Assignment (Optional)">
          <FormField label="Driver">
            <select value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })} className={selectClass}>
              <option value="">Assign later</option>
              {drivers.filter((d) => d.status !== 'offline').map((d) => (
                <option key={d.id} value={d.id}>{d.name} — {d.status === 'available' ? 'Available' : 'On Delivery'}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Vehicle">
            <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className={selectClass}>
              <option value="">Assign later</option>
              {vehicles.filter((v) => v.status !== 'inactive' && v.status !== 'maintenance').map((v) => (
                <option key={v.id} value={v.id}>{v.vehicleNumber} — {v.type} ({v.capacity})</option>
              ))}
            </select>
          </FormField>
        </Section>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button variant="secondary" onClick={() => handleSave(false)}>Save Delivery</Button>
          <Button onClick={() => handleSave(true)}>
            <Truck size={18} /> Save & Assign
          </Button>
        </div>
      </div>
    </div>
  );
}
