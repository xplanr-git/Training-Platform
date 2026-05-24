import { useState, useMemo } from 'react';
import {
  Layers, Plus, Search, X, Trash2, Edit2, ChevronDown, Check,
  Mail, BookOpen, Users, MoreHorizontal, Copy, Building2,
  AlertCircle, Clock, CheckCircle2, Ban, ExternalLink, Shield,
  Tag, DollarSign, Calendar, Package, ArrowRight, Globe,
  Eye, Archive, Send, UserCheck, RefreshCw, Info,
} from 'lucide-react';
import { User } from '@/app/types';

/* ─── Types ─────────────────────────────────────────────────── */
interface CourseItem { id: string; title: string; category: string }

interface SeatOffer {
  id: string;
  name: string;
  description: string;
  courses: CourseItem[];
  seats: number;
  price: number;
  currency: string;
  validityDays: number;   // how long the deal lasts after activation
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  deals: ClientDeal[];
}

interface ClientDeal {
  id: string;
  clientCompany: string;
  clientAdminName: string;
  clientAdminEmail: string;
  seatsUsed: number;
  status: 'active' | 'pending' | 'expired' | 'revoked';
  startedAt: string;
  expiresAt: string;
  groupManagerEmail: string;
}

/* ─── Seed Data ──────────────────────────────────────────────── */
const MOCK_COURSES: CourseItem[] = [
  { id: 'c1', title: 'Leadership Fundamentals', category: 'Management' },
  { id: 'c2', title: 'Advanced Sales Techniques', category: 'Sales' },
  { id: 'c3', title: 'Cybersecurity Essentials', category: 'IT & Security' },
  { id: 'c4', title: 'Project Management Pro', category: 'Operations' },
  { id: 'c5', title: 'Data Analytics Bootcamp', category: 'Analytics' },
  { id: 'c6', title: 'Effective Communication', category: 'Soft Skills' },
];

const SEED_OFFERS: SeatOffer[] = [
  {
    id: 'off-1',
    name: 'Sales Excellence Bundle',
    description: 'Everything your sales team needs to close more deals, communicate better, and lead effectively.',
    courses: [MOCK_COURSES[1], MOCK_COURSES[0], MOCK_COURSES[5]],
    seats: 50,
    price: 2499,
    currency: 'USD',
    validityDays: 365,
    status: 'active',
    createdAt: '2025-01-10',
    deals: [
      {
        id: 'd1', clientCompany: 'TechCorp Solutions', clientAdminName: 'Amanda Lee',
        clientAdminEmail: 'amanda.lee@techcorp.com', seatsUsed: 38,
        status: 'active', startedAt: '2025-02-01', expiresAt: '2026-02-01',
        groupManagerEmail: 'amanda.lee@techcorp.com',
      },
      {
        id: 'd2', clientCompany: 'Global Industries Ltd', clientAdminName: 'Marcus Roy',
        clientAdminEmail: 'marcus.roy@global.com', seatsUsed: 22,
        status: 'active', startedAt: '2025-03-15', expiresAt: '2026-03-15',
        groupManagerEmail: 'marcus.roy@global.com',
      },
      {
        id: 'd3', clientCompany: 'Innovate Startup Inc', clientAdminName: 'Sara Kim',
        clientAdminEmail: 'sara.kim@innovate.com', seatsUsed: 10,
        status: 'pending', startedAt: '2026-05-01', expiresAt: '2027-05-01',
        groupManagerEmail: 'sara.kim@innovate.com',
      },
    ],
  },
  {
    id: 'off-2',
    name: 'IT Security Starter Pack',
    description: 'Essential cybersecurity training for distributed enterprise teams.',
    courses: [MOCK_COURSES[2], MOCK_COURSES[4]],
    seats: 100,
    price: 4999,
    currency: 'USD',
    validityDays: 365,
    status: 'active',
    createdAt: '2025-03-20',
    deals: [
      {
        id: 'd4', clientCompany: 'Enterprise Solutions Group', clientAdminName: 'David Park',
        clientAdminEmail: 'david.park@enterprise.com', seatsUsed: 91,
        status: 'active', startedAt: '2025-04-01', expiresAt: '2026-04-01',
        groupManagerEmail: 'david.park@enterprise.com',
      },
    ],
  },
  {
    id: 'off-3',
    name: 'Operations Masterclass',
    description: 'Deep-dive into project management and data-driven operations.',
    courses: [MOCK_COURSES[3], MOCK_COURSES[4]],
    seats: 30,
    price: 1799,
    currency: 'USD',
    validityDays: 180,
    status: 'draft',
    createdAt: '2026-04-05',
    deals: [],
  },
  {
    id: 'off-4',
    name: 'Onboarding Essentials',
    description: 'A lightweight bundle for new-hire onboarding programs.',
    courses: [MOCK_COURSES[5], MOCK_COURSES[0]],
    seats: 25,
    price: 999,
    currency: 'USD',
    validityDays: 90,
    status: 'archived',
    createdAt: '2024-06-01',
    deals: [
      {
        id: 'd5', clientCompany: 'Digital Services Co', clientAdminName: 'Nina Patel',
        clientAdminEmail: 'nina.patel@digital.com', seatsUsed: 25,
        status: 'expired', startedAt: '2024-07-01', expiresAt: '2024-10-01',
        groupManagerEmail: 'nina.patel@digital.com',
      },
    ],
  },
];

/* ─── Helpers ────────────────────────────────────────────────── */
const offerStatusMeta = {
  active:   { label: 'Active',    bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  draft:    { label: 'Draft',     bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400'    },
  archived: { label: 'Archived',  bg: 'bg-red-50',     text: 'text-red-600',    dot: 'bg-red-400'     },
};
const dealStatusMeta = {
  active:  { label: 'Active',  icon: CheckCircle2, cls: 'text-emerald-600' },
  pending: { label: 'Pending', icon: Clock,        cls: 'text-amber-500'  },
  expired: { label: 'Expired', icon: Ban,          cls: 'text-red-500'    },
  revoked: { label: 'Revoked', icon: Ban,          cls: 'text-red-400'    },
};

const catColor: Record<string, string> = {
  'Management':   'bg-blue-100 text-blue-700',
  'Sales':        'bg-violet-100 text-violet-700',
  'IT & Security':'bg-rose-100 text-rose-700',
  'Operations':   'bg-orange-100 text-orange-700',
  'Analytics':    'bg-cyan-100 text-cyan-700',
  'Soft Skills':  'bg-teal-100 text-teal-700',
  'HR':           'bg-pink-100 text-pink-700',
  'Finance':      'bg-yellow-100 text-yellow-700',
};

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const usd = (n: number) => `$${n.toLocaleString()}`;

/* ─── Create / Edit Offer Modal ─────────────────────────────── */
interface OfferModalProps {
  initial?: SeatOffer | null;
  onClose: () => void;
  onSave: (offer: Omit<SeatOffer, 'id' | 'createdAt' | 'deals'>) => void;
}
function OfferModal({ initial, onClose, onSave }: OfferModalProps) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    seats: initial?.seats ?? 25,
    price: initial?.price ?? 999,
    currency: initial?.currency ?? 'USD',
    validityDays: initial?.validityDays ?? 365,
    status: initial?.status ?? 'draft' as SeatOffer['status'],
    courses: initial?.courses ?? [] as CourseItem[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleCourse = (c: CourseItem) =>
    setForm(f => ({
      ...f,
      courses: f.courses.find(x => x.id === c.id)
        ? f.courses.filter(x => x.id !== c.id)
        : [...f.courses, c],
    }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (form.courses.length === 0) e.courses = 'Select at least one course';
    if (form.seats < 1) e.seats = 'Must be ≥ 1';
    if (form.price < 0) e.price = 'Must be ≥ 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handle = () => { if (validate()) { onSave(form); onClose(); } };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{initial ? 'Edit Seat Offer' : 'Create Seat Offer'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Define a bundle of courses + seats to sell to B2B clients</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X className="size-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Offer Name <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Sales Excellence Bundle"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Briefly describe what's included…"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          {/* Course picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Included Courses <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto">
              {MOCK_COURSES.map(c => {
                const selected = !!form.courses.find(x => x.id === c.id);
                return (
                  <button key={c.id} onClick={() => toggleCourse(c)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                      selected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <div className={`size-5 rounded flex items-center justify-center shrink-0 ${selected ? 'bg-blue-600' : 'border border-gray-300 bg-white'}`}>
                      {selected && <Check className="size-3 text-white" />}
                    </div>
                    <span className="flex-1 font-medium text-gray-800">{c.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColor[c.category] ?? 'bg-gray-100 text-gray-600'}`}>{c.category}</span>
                  </button>
                );
              })}
            </div>
            {errors.courses && <p className="text-xs text-red-500 mt-1">{errors.courses}</p>}
          </div>

          {/* Seats, Price, Validity row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seats <span className="text-red-500">*</span></label>
              <input type="number" min={1} value={form.seats} onChange={e => setForm(f => ({ ...f, seats: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.seats && <p className="text-xs text-red-500 mt-1">{errors.seats}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD)</label>
              <input type="number" min={0} value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Validity (days)</label>
              <input type="number" min={1} value={form.validityDays} onChange={e => setForm(f => ({ ...f, validityDays: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div className="flex gap-2">
              {(['draft', 'active'] as const).map(s => (
                <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    form.status === s ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {s === 'draft' ? 'Save as Draft' : 'Publish & Activate'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={handle} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {initial ? 'Save Changes' : 'Create Offer'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Assign Deal Modal ─────────────────────────────────────── */
interface AssignDealModalProps { offer: SeatOffer; onClose: () => void; onAssign: (offerId: string, deal: Omit<ClientDeal, 'id'>) => void; }
function AssignDealModal({ offer, onClose, onAssign }: AssignDealModalProps) {
  const [form, setForm] = useState({ clientCompany: '', clientAdminName: '', clientAdminEmail: '', groupManagerEmail: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.clientCompany.trim()) e.clientCompany = 'Required';
    if (!form.clientAdminEmail.trim()) e.clientAdminEmail = 'Required';
    if (!form.groupManagerEmail.trim()) e.groupManagerEmail = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handle = () => {
    if (!validate()) return;
    const today = new Date();
    const expiry = new Date(today);
    expiry.setDate(expiry.getDate() + offer.validityDays);
    onAssign(offer.id, {
      ...form,
      seatsUsed: 0,
      status: 'pending',
      startedAt: today.toISOString().slice(0, 10),
      expiresAt: expiry.toISOString().slice(0, 10),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Assign to Client</h2>
            <p className="text-xs text-gray-500 mt-0.5">{offer.name} · {offer.seats} seats</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X className="size-4" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Company <span className="text-red-500">*</span></label>
            <input value={form.clientCompany} onChange={e => setForm(f => ({ ...f, clientCompany: e.target.value }))}
              placeholder="e.g. Acme Corp"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {errors.clientCompany && <p className="text-xs text-red-500 mt-1">{errors.clientCompany}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Admin Name</label>
            <input value={form.clientAdminName} onChange={e => setForm(f => ({ ...f, clientAdminName: e.target.value }))}
              placeholder="Full name"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Admin Email <span className="text-red-500">*</span></label>
            <input type="email" value={form.clientAdminEmail} onChange={e => setForm(f => ({ ...f, clientAdminEmail: e.target.value }))}
              placeholder="admin@clientcompany.com"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {errors.clientAdminEmail && <p className="text-xs text-red-500 mt-1">{errors.clientAdminEmail}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Manager Email <span className="text-red-500">*</span>
              <span className="ml-1 text-xs text-gray-400 font-normal">— who will manage their group</span>
            </label>
            <input type="email" value={form.groupManagerEmail} onChange={e => setForm(f => ({ ...f, groupManagerEmail: e.target.value }))}
              placeholder="manager@clientcompany.com"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {errors.groupManagerEmail && <p className="text-xs text-red-500 mt-1">{errors.groupManagerEmail}</p>}
          </div>

          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <Info className="size-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">
              An invitation will be sent to the Group Manager granting them access to manage their team's {offer.seats} seats across {offer.courses.length} course{offer.courses.length !== 1 ? 's' : ''}.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={handle} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Send Invitation
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export interface MultipleSeatsPageProps { users?: User[] }

export function MultipleSeatsPage({ users = [] }: MultipleSeatsPageProps) {
  const [offers, setOffers] = useState<SeatOffer[]>(SEED_OFFERS);
  const [tab, setTab] = useState<'offers' | 'deals'>('offers');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const [dealFilter, setDealFilter] = useState<'all' | 'active' | 'pending' | 'expired' | 'revoked'>('all');
  const [selectedOffer, setSelectedOffer] = useState<SeatOffer | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editOffer, setEditOffer] = useState<SeatOffer | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState<SeatOffer | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  /* ── Global stats ── */
  const totalOffers  = offers.filter(o => o.status === 'active').length;
  const totalDeals   = offers.flatMap(o => o.deals).length;
  const activeDeals  = offers.flatMap(o => o.deals).filter(d => d.status === 'active').length;
  const totalRevenue = offers.reduce((s, o) =>
    s + o.deals.filter(d => d.status !== 'revoked').length * o.price, 0);

  /* ── All deals (for "Deals" tab) ── */
  const allDeals = useMemo(() =>
    offers.flatMap(o => o.deals.map(d => ({ ...d, offer: o }))), [offers]);

  const filteredDeals = useMemo(() =>
    allDeals.filter(d => {
      if (dealFilter !== 'all' && d.status !== dealFilter) return false;
      if (search && !d.clientCompany.toLowerCase().includes(search.toLowerCase()) &&
          !d.offer.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }), [allDeals, dealFilter, search]);

  /* ── Filtered offers ── */
  const filteredOffers = useMemo(() =>
    offers.filter(o => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (search && !o.name.toLowerCase().includes(search.toLowerCase()) &&
          !o.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }), [offers, statusFilter, search]);

  /* ── Actions ── */
  const handleSaveOffer = (data: Omit<SeatOffer, 'id' | 'createdAt' | 'deals'>) => {
    if (editOffer) {
      setOffers(prev => prev.map(o => o.id === editOffer.id ? { ...o, ...data } : o));
    } else {
      setOffers(prev => [{ ...data, id: `off-${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10), deals: [] }, ...prev]);
    }
    setEditOffer(null);
  };

  const handleArchiveOffer = (id: string) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, status: 'archived' } : o));
    setOpenMenu(null);
  };

  const handleDuplicateOffer = (offer: SeatOffer) => {
    setOffers(prev => [{
      ...offer, id: `off-${Date.now()}`, name: `${offer.name} (Copy)`,
      status: 'draft', createdAt: new Date().toISOString().slice(0, 10), deals: [],
    }, ...prev]);
    setOpenMenu(null);
  };

  const handleAssignDeal = (offerId: string, deal: Omit<ClientDeal, 'id'>) => {
    setOffers(prev => prev.map(o =>
      o.id === offerId
        ? { ...o, deals: [...o.deals, { ...deal, id: `d-${Date.now()}` }] }
        : o
    ));
  };

  const handleRevokeDeal = (offerId: string, dealId: string) => {
    setOffers(prev => prev.map(o =>
      o.id === offerId
        ? { ...o, deals: o.deals.map(d => d.id === dealId ? { ...d, status: 'revoked' as const } : d) }
        : o
    ));
    setOpenMenu(null);
  };

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* ── Page Header ── */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Multiple Seats</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Create seat offers for B2B clients and delegate group management to their admins
            </p>
          </div>
          <button onClick={() => { setEditOffer(null); setShowOfferModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
            <Plus className="size-4" />
            Create Seat Offer
          </button>
        </div>

        {/* How it works strip */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800 mb-4">
          <Info className="size-4 shrink-0 text-blue-500" />
          <span>
            <strong>How it works:</strong> Create a seat offer (course bundle + seats) → assign it to a B2B client → their designated Group Manager gets access to manage their own team's enrolments.
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Active Offers',  value: totalOffers,         icon: Package,    color: 'text-blue-600',   bg: 'bg-blue-50'   },
            { label: 'Total Deals',    value: totalDeals,           icon: Building2,  color: 'text-violet-600', bg: 'bg-violet-50' },
            { label: 'Active Clients', value: activeDeals,          icon: UserCheck,  color: 'text-emerald-600',bg: 'bg-emerald-50' },
            { label: 'Total Revenue',  value: usd(totalRevenue),    icon: DollarSign, color: 'text-amber-600',  bg: 'bg-amber-50'  },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
                <div className={`size-10 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon className={`size-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Tabs + Filter bar ── */}
      <div className="bg-white border-b border-gray-200 px-8">
        <div className="flex items-center justify-between">
          <div className="flex gap-0">
            {(['offers', 'deals'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setSearch(''); setStatusFilter('all'); setDealFilter('all'); }}
                className={`px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {t === 'offers' ? 'Seat Offers' : 'Client Deals'}
                <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full font-medium ${
                  tab === t ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                  {t === 'offers' ? offers.length : allDeals.length}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={tab === 'offers' ? 'Search offers…' : 'Search clients or offers…'}
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
            </div>
            {tab === 'offers' ? (
              <div className="flex gap-1">
                {(['all', 'active', 'draft', 'archived'] as const).map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex gap-1">
                {(['all', 'active', 'pending', 'expired', 'revoked'] as const).map(s => (
                  <button key={s} onClick={() => setDealFilter(s)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      dealFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto p-8">

        {/* ───── SEAT OFFERS TAB ───── */}
        {tab === 'offers' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredOffers.length === 0 && (
              <div className="col-span-3 flex flex-col items-center justify-center py-20 text-center">
                <Package className="size-12 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-500">No seat offers found</p>
                <p className="text-xs text-gray-400 mt-1">Create your first offer to start selling to B2B clients</p>
              </div>
            )}
            {filteredOffers.map(offer => {
              const sm = offerStatusMeta[offer.status];
              const activeCount = offer.deals.filter(d => d.status === 'active').length;
              const isMenuOpen = openMenu === offer.id;

              return (
                <div key={offer.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                  {/* Card header */}
                  <div className="px-5 pt-5 pb-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{offer.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{offer.description}</p>
                      </div>
                      <div className="relative shrink-0">
                        <button onClick={() => setOpenMenu(isMenuOpen ? null : offer.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                          <MoreHorizontal className="size-4" />
                        </button>
                        {isMenuOpen && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                            <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                              <button onClick={() => { setEditOffer(offer); setShowOfferModal(true); setOpenMenu(null); }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                                <Edit2 className="size-3.5" /> Edit Offer
                              </button>
                              <button onClick={() => handleDuplicateOffer(offer)}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                                <Copy className="size-3.5" /> Duplicate
                              </button>
                              {offer.status !== 'archived' && (
                                <button onClick={() => handleArchiveOffer(offer.id)}
                                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                                  <Archive className="size-3.5" /> Archive
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status + price */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${sm.bg} ${sm.text}`}>
                        <span className={`size-1.5 rounded-full ${sm.dot}`} />
                        {sm.label}
                      </span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-sm font-semibold text-gray-800">{usd(offer.price)}</span>
                      <span className="text-xs text-gray-400">/ {offer.seats} seats</span>
                    </div>

                    {/* Courses */}
                    <div className="space-y-1 mb-4">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Included Courses</p>
                      {offer.courses.map(c => (
                        <div key={c.id} className="flex items-center gap-2">
                          <BookOpen className="size-3.5 text-gray-400 shrink-0" />
                          <span className="text-xs text-gray-700 flex-1 truncate">{c.title}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${catColor[c.category] ?? 'bg-gray-100 text-gray-500'}`}>{c.category}</span>
                        </div>
                      ))}
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Users className="size-3" />{offer.seats} seats</span>
                      <span className="flex items-center gap-1"><Calendar className="size-3" />{offer.validityDays}d validity</span>
                      <span className="flex items-center gap-1"><Building2 className="size-3" />{activeCount} client{activeCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
                    <button
                      onClick={() => { setAssignTarget(offer); setShowAssignModal(true); }}
                      disabled={offer.status !== 'active'}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <Send className="size-3.5" /> Assign to Client
                    </button>
                    <button
                      onClick={() => { setTab('deals'); setSearch(''); setDealFilter('all'); }}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Eye className="size-3.5" />
                      {offer.deals.length} deal{offer.deals.length !== 1 ? 's' : ''}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ───── CLIENT DEALS TAB ───── */}
        {tab === 'deals' && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {filteredDeals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Building2 className="size-12 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-500">No client deals yet</p>
                <p className="text-xs text-gray-400 mt-1">Create a seat offer and assign it to a B2B client to get started</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Client</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Offer</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Seat Usage</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Group Manager</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Expires</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDeals.map(d => {
                    const dm = dealStatusMeta[d.status];
                    const DIcon = dm.icon;
                    const pct  = Math.round((d.seatsUsed / d.offer.seats) * 100);
                    const isMenuOpen = openMenu === d.id;

                    return (
                      <tr key={d.id} className="hover:bg-gray-50 group">
                        {/* Client */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {d.clientCompany.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{d.clientCompany}</p>
                              <p className="text-xs text-gray-500">{d.clientAdminEmail}</p>
                            </div>
                          </div>
                        </td>

                        {/* Offer */}
                        <td className="px-4 py-4">
                          <p className="text-sm font-medium text-gray-800 max-w-[180px] truncate">{d.offer.name}</p>
                          <p className="text-xs text-gray-400">{d.offer.courses.length} course{d.offer.courses.length !== 1 ? 's' : ''}</p>
                        </td>

                        {/* Seat Usage */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                              <div className={`h-full rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-blue-500'}`}
                                style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-gray-600">{d.seatsUsed}/{d.offer.seats}</span>
                          </div>
                        </td>

                        {/* Group Manager */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Shield className="size-3.5 text-blue-400 shrink-0" />
                            <span className="truncate max-w-[140px]">{d.groupManagerEmail}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          <span className={`flex items-center gap-1.5 text-xs font-medium ${dm.cls}`}>
                            <DIcon className="size-3.5" />{dm.label}
                          </span>
                        </td>

                        {/* Expires */}
                        <td className="px-4 py-4 text-xs text-gray-500">{fmt(d.expiresAt)}</td>

                        {/* Actions */}
                        <td className="px-4 py-4 relative">
                          {d.status !== 'revoked' && d.status !== 'expired' && (
                            <>
                              <button onClick={() => setOpenMenu(isMenuOpen ? null : d.id)}
                                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-200 text-gray-500 transition-all">
                                <MoreHorizontal className="size-4" />
                              </button>
                              {isMenuOpen && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                                  <div className="absolute right-4 top-full mt-1 z-20 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                                    <button onClick={() => { setOpenMenu(null); }}
                                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                                      <RefreshCw className="size-3.5" /> Resend Invitation
                                    </button>
                                    <button onClick={() => handleRevokeDeal(d.offer.id, d.id)}
                                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                                      <Ban className="size-3.5" /> Revoke Access
                                    </button>
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showOfferModal && (
        <OfferModal
          initial={editOffer}
          onClose={() => { setShowOfferModal(false); setEditOffer(null); }}
          onSave={handleSaveOffer}
        />
      )}
      {showAssignModal && assignTarget && (
        <AssignDealModal
          offer={assignTarget}
          onClose={() => { setShowAssignModal(false); setAssignTarget(null); }}
          onAssign={handleAssignDeal}
        />
      )}
    </div>
  );
}
