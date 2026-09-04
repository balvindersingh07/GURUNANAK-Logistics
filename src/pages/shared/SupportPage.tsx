import { useMemo, useState } from 'react';
import {
  HelpCircle,
  Package,
  MapPin,
  Truck,
  User,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Send,
} from 'lucide-react';
import { PageHeader } from '../../components/layout/TopNav';
import SearchInput from '../../components/ui/SearchInput';
import Button from '../../components/ui/Button';
import { FormField, inputClass, selectClass, textareaClass } from '../../components/ui/FormField';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { FAQ_DATA } from '../../data/mockData';

const CATEGORY_ICONS: Record<string, typeof Package> = {
  Deliveries: Package,
  Tracking: MapPin,
  Drivers: Truck,
  Fleet: Truck,
  Account: User,
};

export default function SupportPage() {
  const { addTicket } = useApp();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'General',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const filteredFaqs = useMemo(() => {
    const q = search.toLowerCase().trim();
    return FAQ_DATA.map((cat) => ({
      ...cat,
      questions: cat.questions.filter(
        (item) =>
          !q ||
          item.q.toLowerCase().includes(q) ||
          item.a.toLowerCase().includes(q) ||
          cat.category.toLowerCase().includes(q),
      ),
    })).filter((cat) => cat.questions.length > 0);
  }, [search]);

  const displayCategories = activeCategory
    ? filteredFaqs.filter((c) => c.category === activeCategory)
    : filteredFaqs;

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.subject.trim() || !ticketForm.message.trim()) {
      showToast('Please fill in subject and message', 'error');
      return;
    }
    setSubmitting(true);
    addTicket({
      subject: ticketForm.subject.trim(),
      category: ticketForm.category,
      message: ticketForm.message.trim(),
    });
    setTimeout(() => {
      setSubmitting(false);
      showToast('Support ticket submitted! We will respond within 24 hours.');
      setTicketForm({ subject: '', category: 'General', message: '' });
    }, 600);
  };

  return (
    <div>
      <PageHeader
        title="Help & Support"
        description="Find answers or contact the GURUNANAK support team"
      />

      <div className="glass-card rainbow-border p-5 mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search FAQs..."
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className={`glass-card glass-card-hover p-4 text-left transition-all ${
            activeCategory === null ? 'ring-2 ring-violet-300 bg-violet-50/50' : ''
          }`}
        >
          <HelpCircle className="text-violet-600 mb-2" size={22} />
          <p className="font-medium text-navy text-sm">All Topics</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {FAQ_DATA.reduce((n, c) => n + c.questions.length, 0)} articles
          </p>
        </button>
        {FAQ_DATA.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.category] || HelpCircle;
          const count = cat.questions.length;
          return (
            <button
              key={cat.category}
              type="button"
              onClick={() =>
                setActiveCategory(activeCategory === cat.category ? null : cat.category)
              }
              className={`glass-card glass-card-hover p-4 text-left transition-all ${
                activeCategory === cat.category ? 'ring-2 ring-violet-300 bg-violet-50/50' : ''
              }`}
            >
              <Icon className="text-cyan-600 mb-2" size={22} />
              <p className="font-medium text-navy text-sm">{cat.category}</p>
              <p className="text-xs text-slate-500 mt-0.5">{count} articles</p>
            </button>
          );
        })}
      </div>

      <div className="glass-card rainbow-border p-5 mb-6">
        <h3 className="text-lg font-semibold text-navy mb-4">Frequently Asked Questions</h3>
        {displayCategories.length === 0 ? (
          <p className="text-sm text-slate-500 py-8 text-center">
            No FAQs match your search. Try different keywords or contact support below.
          </p>
        ) : (
          <div className="space-y-6">
            {displayCategories.map((cat) => (
              <div key={cat.category}>
                <h4 className="text-sm font-semibold text-violet-600 mb-3">{cat.category}</h4>
                <div className="space-y-2">
                  {cat.questions.map((item) => {
                    const key = `${cat.category}-${item.q}`;
                    const open = expandedFaq === key;
                    return (
                      <div
                        key={key}
                        className="rounded-xl border border-slate-100 bg-white/60 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedFaq(open ? null : key)}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50/80 transition-colors"
                        >
                          <span className="text-sm font-medium text-navy">{item.q}</span>
                          {open ? (
                            <ChevronUp size={18} className="text-slate-400 shrink-0" />
                          ) : (
                            <ChevronDown size={18} className="text-slate-400 shrink-0" />
                          )}
                        </button>
                        {open && (
                          <div className="px-4 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                            {item.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card rainbow-border p-5">
        <h3 className="text-lg font-semibold text-navy mb-1 flex items-center gap-2">
          <MessageSquare size={20} className="text-violet-600" />
          Contact Support
        </h3>
        <p className="text-sm text-slate-500 mb-5">
          Can&apos;t find what you need? Submit a ticket and our team will get back to you.
        </p>

        <form onSubmit={handleSubmitTicket} className="space-y-4 max-w-xl">
          <FormField label="Subject" required>
            <input
              type="text"
              value={ticketForm.subject}
              onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
              className={inputClass}
              placeholder="Brief description of your issue"
            />
          </FormField>

          <FormField label="Category" required>
            <select
              value={ticketForm.category}
              onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
              className={selectClass}
            >
              <option value="General">General</option>
              <option value="Deliveries">Deliveries</option>
              <option value="Tracking">Tracking</option>
              <option value="Billing">Billing</option>
              <option value="Technical">Technical</option>
            </select>
          </FormField>

          <FormField label="Message" required>
            <textarea
              value={ticketForm.message}
              onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
              className={textareaClass}
              rows={4}
              placeholder="Describe your issue in detail..."
            />
          </FormField>

          {user && (
            <p className="text-xs text-slate-500">
              Submitting as {user.name} ({user.email})
            </p>
          )}

          <Button type="submit" loading={submitting}>
            <Send size={18} />
            Submit Ticket
          </Button>
        </form>
      </div>
    </div>
  );
}
