import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, UserCircle, Eye, Phone, Mail } from 'lucide-react';
import { PageHeader } from '../../components/layout/TopNav';
import Button from '../../components/ui/Button';
import SearchInput from '../../components/ui/SearchInput';
import Modal, { ModalFooter } from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { FormField, inputClass } from '../../components/ui/FormField';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';

const emptyCustomer = { name: '', phone: '', email: '', address: '' };

export default function CustomersPage() {
  const { showToast } = useToast();
  const { customers, addCustomer } = useApp();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyCustomer);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q),
    );
  }, [customers, search]);

  const handleAdd = () => {
    if (!form.name || !form.phone) {
      showToast('Name and phone are required', 'error');
      return;
    }
    addCustomer(form);
    showToast(`${form.name} added to customer database`);
    setForm(emptyCustomer);
    setModalOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage customer accounts and shipment history"
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={18} /> Add Customer
          </Button>
        }
      />

      <div className="glass-card rainbow-border p-4 mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search customers by name, phone, email..." />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={UserCircle} title="No customers found" action={<Button onClick={() => setModalOpen(true)}><Plus size={18} /> Add Customer</Button>} />
      ) : (
        <div className="glass-card rainbow-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Customer</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Contact</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Address</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Total Deliveries</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Active Orders</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Last Delivery</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-bold text-sm">
                          {c.name.charAt(0)}
                        </div>
                        <p className="font-medium text-navy">{c.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="flex items-center gap-1"><Phone size={12} /> {c.phone}</p>
                      <p className="flex items-center gap-1 text-xs text-slate-500"><Mail size={12} /> {c.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{c.address}</td>
                    <td className="px-4 py-3">{c.totalDeliveries}</td>
                    <td className="px-4 py-3">
                      {c.activeOrders > 0 ? (
                        <span className="text-violet-600 font-medium">{c.activeOrders}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{c.lastDelivery || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/customers/${c.id}`} className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-700 text-xs font-medium">
                        <Eye size={14} /> View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Customer" footer={
        <ModalFooter onCancel={() => setModalOpen(false)} onConfirm={handleAdd} confirmLabel="Add Customer" />
      }>
        <div className="space-y-4">
          <FormField label="Company / Name" required>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Sharma Electronics Pvt Ltd" />
          </FormField>
          <FormField label="Phone" required>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="+91 141 2567890" />
          </FormField>
          <FormField label="Email">
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
          </FormField>
          <FormField label="Address">
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} placeholder="MI Road, Jaipur, Rajasthan" />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
