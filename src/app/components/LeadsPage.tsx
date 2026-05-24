import { useState } from 'react';
import {
  UserPlus, Search, Download, Filter, X, ChevronDown, ExternalLink,
  Mail, Phone, Building2, Calendar, TrendingUp, Users, Target, Zap,
  Globe, MoreHorizontal, Check, Clock, XCircle, Eye, Trash2, Tag,
  ArrowRight, LayoutTemplate, MousePointerClick, Megaphone,
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: 'landing-page' | 'popup' | 'funnel' | 'form' | 'manual';
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  createdAt: string;
  tags: string[];
  notes?: string;
}

const mockLeads: Lead[] = [
  { id: '1', name: 'James Hartwell',    email: 'james.hartwell@acme.com',     phone: '+1 555 0101', company: 'Acme Corp',         source: 'landing-page', status: 'new',       createdAt: '2026-05-18', tags: ['Hot Lead'],            notes: 'Interested in team plan' },
  { id: '2', name: 'Priya Sharma',      email: 'priya.sharma@techwave.io',    phone: '+1 555 0102', company: 'TechWave',          source: 'funnel',       status: 'contacted', createdAt: '2026-05-17', tags: ['Enterprise'],          notes: '' },
  { id: '3', name: 'Lucas Mendez',      email: 'l.mendez@greenbuilt.com',                           company: 'GreenBuilt',        source: 'popup',        status: 'qualified', createdAt: '2026-05-16', tags: ['SMB', 'Hot Lead'],     notes: 'Requested demo' },
  { id: '4', name: 'Amelia Nguyen',     email: 'amelia.nguyen@brightedge.co', phone: '+1 555 0104', company: 'BrightEdge',        source: 'form',         status: 'converted', createdAt: '2026-05-15', tags: ['Enterprise'],          notes: 'Signed up for annual plan' },
  { id: '5', name: 'Oliver Baxter',     email: 'oliver.b@stratford.net',      phone: '+1 555 0105',                               source: 'manual',       status: 'lost',      createdAt: '2026-05-14', tags: [],                      notes: 'Went with competitor' },
  { id: '6', name: 'Sofia Petrov',      email: 'sofia.petrov@novaworks.eu',                         company: 'NovaWorks',         source: 'landing-page', status: 'new',       createdAt: '2026-05-13', tags: ['Hot Lead'],            notes: '' },
  { id: '7', name: 'Ethan Caldwell',    email: 'ethan@cloudify.io',           phone: '+1 555 0107', company: 'Cloudify',          source: 'funnel',       status: 'contacted', createdAt: '2026-05-12', tags: ['SMB'],                 notes: 'Follow up next week' },
  { id: '8', name: 'Mia Johansson',     email: 'mia.j@nordiclearn.se',        phone: '+46 70 000000', company: 'NordicLearn',     source: 'popup',        status: 'qualified', createdAt: '2026-05-11', tags: ['Enterprise', 'EU'],    notes: '' },
  { id: '9', name: 'Noah Williams',     email: 'noah.w@pinecrest.edu',                              company: 'Pinecrest Inst.',   source: 'form',         status: 'new',       createdAt: '2026-05-10', tags: ['Education'],           notes: 'Academic pricing query' },
  { id: '10', name: 'Isabelle Moreau',  email: 'i.moreau@atelier-design.fr',  phone: '+33 6 00 00 0000', company: 'Atelier Design', source: 'landing-page', status: 'converted', createdAt: '2026-05-09', tags: ['SMB'],                notes: '' },
  { id: '11', name: 'Liam O\'Brien',    email: 'liam.obrien@fastgrowth.io',   phone: '+1 555 0111', company: 'FastGrowth',        source: 'funnel',       status: 'new',       createdAt: '2026-05-08', tags: ['Hot Lead'],            notes: '' },
  { id: '12', name: 'Chloe Martinez',   email: 'chloe.m@sunrisehr.com',                             company: 'Sunrise HR',        source: 'popup',        status: 'contacted', createdAt: '2026-05-07', tags: ['HR', 'SMB'],           notes: 'Needs HR-specific features' },
];

const STATUS_META: Record<Lead['status'], { label: string; color: string; icon: typeof Check }> = {
  new:       { label: 'New',       color: 'bg-blue-100 text-blue-700',   icon: Clock     },
  contacted: { label: 'Contacted', color: 'bg-yellow-100 text-yellow-700', icon: Mail    },
  qualified: { label: 'Qualified', color: 'bg-violet-100 text-violet-700', icon: Check   },
  converted: { label: 'Converted', color: 'bg-green-100 text-green-700', icon: Check     },
  lost:      { label: 'Lost',      color: 'bg-red-100 text-red-600',     icon: XCircle   },
};

const SOURCE_LABEL: Record<Lead['source'], string> = {
  'landing-page': 'Landing Page',
  popup:          'Popup',
  funnel:         'Funnel',
  form:           'Form',
  manual:         'Manual',
};

interface LeadsPageProps {
  onNavigateToWebsite?: () => void;
}

export function LeadsPage({ onNavigateToWebsite }: LeadsPageProps) {
  const [leads, setLeads]               = useState<Lead[]>(mockLeads);
  const [searchQuery, setSearchQuery]   = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [menuOpen, setMenuOpen]         = useState<string | null>(null);
  const [addForm, setAddForm]           = useState({ name: '', email: '', phone: '', company: '', source: 'manual' as Lead['source'], notes: '' });

  // Stats
  const total       = leads.length;
  const newCount    = leads.filter(l => l.status === 'new').length;
  const converted   = leads.filter(l => l.status === 'converted').length;
  const convRate    = total > 0 ? Math.round((converted / total) * 100) : 0;

  // Filtered
  const filteredLeads = leads.filter(l => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || (l.company ?? '').toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || l.status === filterStatus;
    const matchSource = filterSource === 'all' || l.source === filterSource;
    return matchSearch && matchStatus && matchSource;
  });

  const updateStatus = (id: string, status: Lead['status']) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    if (selectedLead?.id === id) setSelectedLead(prev => prev ? { ...prev, status } : prev);
    setMenuOpen(null);
  };

  const deleteLead = (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
    if (selectedLead?.id === id) setSelectedLead(null);
    setMenuOpen(null);
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Source', 'Status', 'Tags', 'Date'];
    const rows = filteredLeads.map(l => [l.name, l.email, l.phone ?? '', l.company ?? '', SOURCE_LABEL[l.source], STATUS_META[l.status].label, l.tags.join('; '), l.createdAt]);
    const csv  = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const addLead = () => {
    const nl: Lead = { id: String(Date.now()), ...addForm, status: 'new', createdAt: new Date().toISOString().split('T')[0], tags: [] };
    setLeads(prev => [nl, ...prev]);
    setAddForm({ name: '', email: '', phone: '', company: '', source: 'manual', notes: '' });
    setShowAddModal(false);
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500 mt-1">Track and manage your lead pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
            <Download className="size-4" /> Export CSV
          </button>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
            <UserPlus className="size-4" /> Add Lead
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads',      value: total,               icon: Users,         color: 'bg-blue-50 text-blue-600' },
          { label: 'New This Month',   value: newCount,            icon: TrendingUp,    color: 'bg-teal-50 text-teal-600' },
          { label: 'Converted',        value: converted,           icon: Target,        color: 'bg-green-50 text-green-600' },
          { label: 'Conversion Rate',  value: `${convRate}%`,      icon: Zap,           color: 'bg-violet-50 text-violet-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{label}</p>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color} bg-opacity-20`}>
                <Icon className={`size-5 ${color.split(' ')[1]}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Website Builder CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Globe className="size-6 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-base">Capture more leads with your website</p>
            <p className="text-blue-100 text-sm mt-0.5">Build landing pages, popups, and funnels to grow your lead pipeline automatically.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {[
            { label: 'Landing Pages', icon: LayoutTemplate },
            { label: 'Popups',        icon: MousePointerClick },
            { label: 'Funnels',       icon: Megaphone },
          ].map(({ label, icon: Icon }) => (
            <button key={label} onClick={onNavigateToWebsite}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-medium rounded-lg transition-colors border border-white/20">
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
          <button onClick={onNavigateToWebsite}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-50 transition-colors">
            Open Website Builder <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input type="text" placeholder="Search leads…" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white text-gray-700 min-w-[130px]">
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white text-gray-700 min-w-[130px]">
            <option value="all">All Sources</option>
            {Object.entries(SOURCE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          {(searchQuery || filterStatus !== 'all' || filterSource !== 'all') && (
            <button onClick={() => { setSearchQuery(''); setFilterStatus('all'); setFilterSource('all'); }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
              <X className="size-3.5" /> Clear
            </button>
          )}
          <p className="ml-auto text-xs text-gray-400">{filteredLeads.length} leads</p>
        </div>

        {/* Click-outside for row menus */}
        {menuOpen && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lead</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Source</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Tags</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                <th className="px-5 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLeads.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-16 text-center text-sm text-gray-400">No leads match your filters.</td></tr>
              ) : filteredLeads.map(lead => {
                const sm = STATUS_META[lead.status];
                const StatusIcon = sm.icon;
                return (
                  <tr key={lead.id} onClick={() => setSelectedLead(lead)}
                    className={`cursor-pointer hover:bg-blue-50/40 transition-colors ${selectedLead?.id === lead.id ? 'bg-blue-50' : ''}`}>
                    {/* Lead info */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {lead.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{lead.name}</p>
                          <p className="text-xs text-gray-500 truncate">{lead.email}</p>
                          {lead.company && <p className="text-xs text-gray-400 truncate">{lead.company}</p>}
                        </div>
                      </div>
                    </td>
                    {/* Source */}
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">{SOURCE_LABEL[lead.source]}</span>
                    </td>
                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sm.color}`}>
                        <StatusIcon className="size-3" /> {sm.label}
                      </span>
                    </td>
                    {/* Tags */}
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {lead.tags.map(t => (
                          <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">{t}</span>
                        ))}
                      </div>
                    </td>
                    {/* Date */}
                    <td className="px-5 py-3.5 text-xs text-gray-400 hidden sm:table-cell whitespace-nowrap">{lead.createdAt}</td>
                    {/* Actions */}
                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                      <div className="relative">
                        <button onClick={() => setMenuOpen(menuOpen === lead.id ? null : lead.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreHorizontal className="size-4" />
                        </button>
                        {menuOpen === lead.id && (
                          <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                            <button onClick={() => { setSelectedLead(lead); setMenuOpen(null); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
                              <Eye className="size-3.5" /> View Details
                            </button>
                            <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-t border-gray-100 mt-1">Change Status</p>
                            {Object.entries(STATUS_META).map(([k, v]) => {
                              const Icon = v.icon;
                              return (
                                <button key={k} onClick={() => updateStatus(lead.id, k as Lead['status'])}
                                  className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                                  <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium ${v.color}`}><Icon className="size-3" />{v.label}</span>
                                  {lead.status === k && <Check className="size-3 text-blue-500" />}
                                </button>
                              );
                            })}
                            <button onClick={() => deleteLead(lead.id)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-600 hover:bg-red-50 border-t border-gray-100 mt-1">
                              <Trash2 className="size-3.5" /> Delete Lead
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Lead Detail Panel ── */}
      {selectedLead && (
        <div className="fixed inset-0 z-40 flex justify-end" onClick={() => setSelectedLead(null)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-white shadow-2xl overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-bold">
                  {selectedLead.name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-lg leading-tight">{selectedLead.name}</h2>
                  <p className="text-xs text-gray-500">{selectedLead.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="size-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 p-6 space-y-5">
              {/* Status badge */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_META[selectedLead.status].color}`}>
                  {(() => { const Icon = STATUS_META[selectedLead.status].icon; return <Icon className="size-3" />; })()}
                  {STATUS_META[selectedLead.status].label}
                </span>
                <span className="text-xs text-gray-400">{selectedLead.createdAt}</span>
              </div>

              {/* Info rows */}
              <div className="space-y-3">
                {[
                  { icon: Mail,      label: 'Email',   value: selectedLead.email },
                  { icon: Phone,     label: 'Phone',   value: selectedLead.phone   || '—' },
                  { icon: Building2, label: 'Company', value: selectedLead.company || '—' },
                  { icon: Globe,     label: 'Source',  value: SOURCE_LABEL[selectedLead.source] },
                  { icon: Calendar,  label: 'Added',   value: selectedLead.createdAt },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <Icon className="size-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-sm font-medium text-gray-800">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tags */}
              {selectedLead.tags.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2 flex items-center gap-1.5"><Tag className="size-3" /> Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedLead.tags.map(t => (
                      <span key={t} className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <p className="text-xs text-gray-400 mb-2">Notes</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 min-h-[60px]">
                  {selectedLead.notes || <span className="text-gray-300 italic">No notes added.</span>}
                </p>
              </div>

              {/* Change status */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(STATUS_META).map(([k, v]) => {
                    const Icon = v.icon;
                    const active = selectedLead.status === k;
                    return (
                      <button key={k} onClick={() => updateStatus(selectedLead.id, k as Lead['status'])}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${active ? `${v.color} border-transparent ring-2 ring-offset-1 ring-blue-400` : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'}`}>
                        <Icon className="size-3.5" /> {v.label}
                        {active && <Check className="size-3 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer CTA */}
            <div className="px-6 py-4 border-t border-gray-100 space-y-2 sticky bottom-0 bg-white">
              <button onClick={onNavigateToWebsite}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                <Globe className="size-4" /> Capture More Leads → Website Builder
              </button>
              <button onClick={() => setSelectedLead(null)}
                className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Lead Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
                  <UserPlus className="size-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Add New Lead</h2>
                  <p className="text-xs text-gray-500">Manually capture a lead</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="size-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Jane Smith"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                  <input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="jane@company.com"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input type="tel" value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+1 555 0000"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Company</label>
                  <input type="text" value={addForm.company} onChange={e => setAddForm(f => ({ ...f, company: e.target.value }))}
                    placeholder="Acme Corp"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Source</label>
                <select value={addForm.source} onChange={e => setAddForm(f => ({ ...f, source: e.target.value as Lead['source'] }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white">
                  {Object.entries(SOURCE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3} placeholder="Any relevant notes…"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button disabled={!addForm.name.trim() || !addForm.email.trim()} onClick={addLead}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                <UserPlus className="size-4" /> Add Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
