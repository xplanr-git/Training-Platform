import { useState, useMemo, useEffect } from 'react';
import { supabase } from '/utils/supabase/client';
import {
  FileCheck2, Search, X, Check, ChevronDown, MoreHorizontal,
  BookOpen, Award, Shield, Clock, CheckCircle2, XCircle,
  AlertCircle, Eye, Send, Download, UserPlus, Layers,
} from 'lucide-react';
import { User } from '@/app/types';

/* ─── Types ─────────────────────────────────────────────────── */
type ApprovalType   = 'registration' | 'enrollment' | 'certificate' | 'role-change' | 'access';
type ApprovalStatus = 'pending' | 'approved' | 'rejected';

interface Approval {
  id: string; type: ApprovalType; status: ApprovalStatus;
  submittedAt: string; resolvedAt?: string; resolvedBy?: string;
  rejectionReason?: string; note?: string;
  userId: string; userName: string; userEmail: string;
  detail: string; detailExtra?: string;
}

/* ─── Config ─────────────────────────────────────────────────── */
const TYPE_META: Record<ApprovalType, { label:string; icon:React.ElementType; color:string; bg:string; light:string }> = {
  registration:  { label:'Registration', icon:UserPlus,  color:'text-blue-600',   bg:'bg-blue-600',   light:'bg-blue-50'   },
  enrollment:    { label:'Enrollment',   icon:BookOpen,  color:'text-violet-600', bg:'bg-violet-600', light:'bg-violet-50' },
  certificate:   { label:'Certificate',  icon:Award,     color:'text-amber-600',  bg:'bg-amber-600',  light:'bg-amber-50'  },
  'role-change': { label:'Role Change',  icon:Shield,    color:'text-indigo-600', bg:'bg-indigo-600', light:'bg-indigo-50' },
  access:        { label:'Access',       icon:Layers,    color:'text-teal-600',   bg:'bg-teal-600',   light:'bg-teal-50'   },
};

const STATUS_META: Record<ApprovalStatus, { label:string; icon:React.ElementType; color:string; bg:string; dot:string }> = {
  pending:  { label:'Pending',  icon:Clock,        color:'text-amber-600',   bg:'bg-amber-50',   dot:'bg-amber-500'   },
  approved: { label:'Approved', icon:CheckCircle2, color:'text-emerald-600', bg:'bg-emerald-50', dot:'bg-emerald-500' },
  rejected: { label:'Rejected', icon:XCircle,      color:'text-red-500',     bg:'bg-red-50',     dot:'bg-red-400'     },
};

/* ─── Seed data ──────────────────────────────────────────────── */
const SEED: Approval[] = [
  { id:'a1',  type:'registration',  status:'pending',  submittedAt:'2026-05-18', userId:'u101', userName:'Lena Fischer',     userEmail:'lena.fischer@techcorp.com',     detail:'New user registration',          detailExtra:'TechCorp Solutions' },
  { id:'a2',  type:'enrollment',    status:'pending',  submittedAt:'2026-05-18', userId:'u102', userName:'Marco Diaz',       userEmail:'marco.diaz@globalind.com',      detail:'Leadership Fundamentals',        detailExtra:'Course requires admin approval' },
  { id:'a3',  type:'enrollment',    status:'pending',  submittedAt:'2026-05-17', userId:'u103', userName:'Priya Sharma',     userEmail:'priya.sharma@innovate.com',     detail:'Cybersecurity Essentials',       detailExtra:'Paid course — payment verified' },
  { id:'a4',  type:'certificate',   status:'pending',  submittedAt:'2026-05-17', userId:'u104', userName:'James Okafor',     userEmail:'james.okafor@enterprise.com',   detail:'Project Management Pro',         detailExtra:'Course completed · Score: 91%' },
  { id:'a5',  type:'role-change',   status:'pending',  submittedAt:'2026-05-16', userId:'u105', userName:'Sophie Laurent',   userEmail:'sophie.laurent@digital.com',    detail:'User → Instructor',              detailExtra:'Requested by company admin' },
  { id:'a6',  type:'access',        status:'pending',  submittedAt:'2026-05-16', userId:'u106', userName:'Ali Hassan',       userEmail:'ali.hassan@techcorp.com',       detail:'Advanced Sales Bundle',          detailExtra:'Pending seat allocation' },
  { id:'a7',  type:'registration',  status:'pending',  submittedAt:'2026-05-15', userId:'u107', userName:'Nina Kowalski',    userEmail:'nina.kowalski@globalind.com',   detail:'New user registration',          detailExtra:'Global Industries Ltd' },
  { id:'a8',  type:'enrollment',    status:'pending',  submittedAt:'2026-05-15', userId:'u108', userName:'David Chen',       userEmail:'david.chen@innovate.com',       detail:'Data Analytics Bootcamp',        detailExtra:'Waiting-list enrollment' },
  { id:'a9',  type:'certificate',   status:'pending',  submittedAt:'2026-05-14', userId:'u109', userName:'Rachel Green',     userEmail:'rachel.green@enterprise.com',   detail:'Advanced Sales Techniques',      detailExtra:'Score: 88% · All modules complete' },
  { id:'a10', type:'role-change',   status:'pending',  submittedAt:'2026-05-14', userId:'u110', userName:'Tom Bradley',      userEmail:'tom.bradley@digital.com',       detail:'Employee → Company Admin',       detailExtra:'Delegated by Marcus Roy' },
  { id:'a11', type:'registration',  status:'approved', submittedAt:'2026-05-10', resolvedAt:'2026-05-10', resolvedBy:'Curtis', userId:'u111', userName:'Eva Müller',       userEmail:'eva.muller@techcorp.com',       detail:'New user registration',     detailExtra:'TechCorp Solutions' },
  { id:'a12', type:'enrollment',    status:'approved', submittedAt:'2026-05-09', resolvedAt:'2026-05-09', resolvedBy:'Curtis', userId:'u112', userName:'Carlos Rivera',    userEmail:'carlos.rivera@globalind.com',   detail:'Leadership Fundamentals',   detailExtra:'Approved with priority access' },
  { id:'a13', type:'certificate',   status:'approved', submittedAt:'2026-05-08', resolvedAt:'2026-05-08', resolvedBy:'Curtis', userId:'u113', userName:'Fatima Al-Rashid', userEmail:'fatima@enterprise.com',         detail:'Cybersecurity Essentials',  detailExtra:'Certificate issued' },
  { id:'a14', type:'role-change',   status:'approved', submittedAt:'2026-05-07', resolvedAt:'2026-05-07', resolvedBy:'Curtis', userId:'u114', userName:'Yuki Tanaka',      userEmail:'yuki.tanaka@innovate.com',      detail:'User → Instructor',         detailExtra:'Role updated successfully' },
  { id:'a15', type:'access',        status:'approved', submittedAt:'2026-05-06', resolvedAt:'2026-05-06', resolvedBy:'Curtis', userId:'u115', userName:'Owen Park',        userEmail:'owen.park@digital.com',         detail:'IT Security Bundle',        detailExtra:'3 seats granted' },
  { id:'a16', type:'enrollment',    status:'rejected', submittedAt:'2026-05-12', resolvedAt:'2026-05-13', resolvedBy:'Curtis', rejectionReason:'Prerequisites not met. Complete "Sales Basics" first.',              userId:'u116', userName:'Mia Johnson',  userEmail:'mia.johnson@techcorp.com',      detail:'Advanced Sales Techniques', detailExtra:'Missing prerequisite course' },
  { id:'a17', type:'certificate',   status:'rejected', submittedAt:'2026-05-11', resolvedAt:'2026-05-12', resolvedBy:'Curtis', rejectionReason:'Score below required threshold (minimum 75%, got 62%).',             userId:'u117', userName:'Leo Dubois',   userEmail:'leo.dubois@globalind.com',      detail:'Project Management Pro',    detailExtra:'Score: 62% — below threshold' },
  { id:'a18', type:'role-change',   status:'rejected', submittedAt:'2026-05-10', resolvedAt:'2026-05-11', resolvedBy:'Curtis', rejectionReason:'Role escalation requires HR approval first.',                        userId:'u118', userName:'Zara Ahmed',   userEmail:'zara.ahmed@enterprise.com',     detail:'User → Company Admin',      detailExtra:'Escalation not authorized' },
];

const fmt = (d: string) => new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const relative = (d: string) => { const n=Math.floor((Date.now()-new Date(d).getTime())/86400000); return n===0?'Today':n===1?'Yesterday':n<7?`${n}d ago`:fmt(d); };

/* ─── Resolve Modal ──────────────────────────────────────────── */
interface ResolveModalProps { approval:Approval; action:'approve'|'reject'; onClose:()=>void; onConfirm:(id:string,action:'approve'|'reject',note:string)=>void }
function ResolveModal({ approval, action, onClose, onConfirm }: ResolveModalProps) {
  const [note, setNote] = useState('');
  const tm = TYPE_META[approval.type];
  const Icon = tm.icon;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className={`px-6 py-4 flex items-center gap-3 ${action==='approve'?'bg-emerald-50':'bg-red-50'}`}>
          <div className={`size-10 rounded-xl flex items-center justify-center ${action==='approve'?'bg-emerald-100':'bg-red-100'}`}>
            {action==='approve'?<Check className="size-5 text-emerald-600"/>:<X className="size-5 text-red-600"/>}
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">{action==='approve'?'Approve Request':'Reject Request'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{approval.userName} · {approval.detail}</p>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className={`flex items-center gap-3 p-3 ${tm.light} rounded-xl`}>
            <div className="size-8 bg-white rounded-lg flex items-center justify-center shrink-0"><Icon className={`size-4 ${tm.color}`}/></div>
            <div>
              <p className="text-sm font-medium text-gray-800">{approval.detail}</p>
              {approval.detailExtra && <p className="text-xs text-gray-500">{approval.detailExtra}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {action==='approve'?'Note (optional)':'Rejection Reason'}{action==='reject'&&<span className="text-red-500 ml-0.5">*</span>}
            </label>
            <textarea rows={3} value={note} onChange={e=>setNote(e.target.value)}
              placeholder={action==='approve'?'Add a note for the user…':'Explain why this request is rejected…'}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button
            onClick={() => { if(action==='reject'&&!note.trim()) return; onConfirm(approval.id,action,note); onClose(); }}
            disabled={action==='reject'&&!note.trim()}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed ${
              action==='approve'?'bg-emerald-600 hover:bg-emerald-700':'bg-red-600 hover:bg-red-700'}`}>
            {action==='approve'?'Approve':'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Detail Panel ───────────────────────────────────────────── */
interface DetailPanelProps { approval:Approval; onClose:()=>void; onApprove:(a:Approval)=>void; onReject:(a:Approval)=>void }
function DetailPanel({ approval, onClose, onApprove, onReject }: DetailPanelProps) {
  const tm = TYPE_META[approval.type];
  const sm = STATUS_META[approval.status];
  const TypeIcon = tm.icon;
  const StatusIcon = sm.icon;
  return (
    <div className="w-80 shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Request Details</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="size-4"/></button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {approval.userName.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{approval.userName}</p>
            <p className="text-xs text-gray-500">{approval.userEmail}</p>
          </div>
        </div>
        {/* Type + Status */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Type</p>
            <div className="flex items-center gap-1.5">
              <div className={`size-6 ${tm.light} rounded-lg flex items-center justify-center`}><TypeIcon className={`size-3.5 ${tm.color}`}/></div>
              <span className="text-xs font-medium text-gray-700">{tm.label}</span>
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Status</p>
            <div className="flex items-center gap-1.5">
              <StatusIcon className={`size-4 ${sm.color}`}/>
              <span className={`text-xs font-medium ${sm.color}`}>{sm.label}</span>
            </div>
          </div>
        </div>
        {/* Request detail */}
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Request</p>
          <div className={`p-3 ${tm.light} rounded-xl`}>
            <p className="text-sm font-medium text-gray-800">{approval.detail}</p>
            {approval.detailExtra && <p className="text-xs text-gray-500 mt-0.5">{approval.detailExtra}</p>}
          </div>
        </div>
        {/* Timeline */}
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Timeline</p>
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="size-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5"><Send className="size-3 text-blue-600"/></div>
              <div><p className="text-xs font-medium text-gray-700">Submitted</p><p className="text-[11px] text-gray-400">{fmt(approval.submittedAt)}</p></div>
            </div>
            {approval.resolvedAt && (
              <div className="flex items-start gap-2.5">
                <div className={`size-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${approval.status==='approved'?'bg-emerald-100':'bg-red-100'}`}>
                  {approval.status==='approved'?<Check className="size-3 text-emerald-600"/>:<X className="size-3 text-red-500"/>}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700">{approval.status==='approved'?'Approved':'Rejected'} by {approval.resolvedBy}</p>
                  <p className="text-[11px] text-gray-400">{fmt(approval.resolvedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Rejection reason */}
        {approval.rejectionReason && (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Rejection Reason</p>
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-xs text-red-700">{approval.rejectionReason}</p>
            </div>
          </div>
        )}
        {approval.note && (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Admin Note</p>
            <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-600">{approval.note}</p></div>
          </div>
        )}
      </div>
      {approval.status==='pending' && (
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
          <button onClick={()=>onReject(approval)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
            <X className="size-4"/> Reject
          </button>
          <button onClick={()=>onApprove(approval)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors">
            <Check className="size-4"/> Approve
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export interface ApprovalsPageProps { users?: User[]; companyId?: string | null }

export function ApprovalsPage({ users = [], companyId = 'global' }: ApprovalsPageProps) {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [approvalsLoading, setApprovalsLoading] = useState(true);

  useEffect(() => {
    setApprovalsLoading(true);
    supabase.from('kv_store_d60f2898').select('value').like('key', `approval:${companyId}:%`)
      .then(({ data }) => {
        if (data && data.length > 0) setApprovals(data.map((r: any) => r.value));
        else setApprovals(SEED);
        setApprovalsLoading(false);
      });
  }, [companyId]);
  const [activeTab, setActiveTab] = useState<ApprovalStatus>('pending');
  const [typeFilter, setTypeFilter] = useState<'all'|ApprovalType>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedApproval, setSelectedApproval] = useState<Approval|null>(null);
  const [resolveModal, setResolveModal] = useState<{approval:Approval;action:'approve'|'reject'}|null>(null);
  const [openMenu, setOpenMenu] = useState<string|null>(null);

  const counts = useMemo(()=>({
    pending:  approvals.filter(a=>a.status==='pending').length,
    approved: approvals.filter(a=>a.status==='approved').length,
    rejected: approvals.filter(a=>a.status==='rejected').length,
  }),[approvals]);

  const filtered = useMemo(()=>
    approvals.filter(a=>{
      if (a.status!==activeTab) return false;
      if (typeFilter!=='all'&&a.type!==typeFilter) return false;
      if (search) { const q=search.toLowerCase(); return a.userName.toLowerCase().includes(q)||a.userEmail.toLowerCase().includes(q)||a.detail.toLowerCase().includes(q); }
      return true;
    }).sort((a,b)=>new Date(b.submittedAt).getTime()-new Date(a.submittedAt).getTime())
  ,[approvals,activeTab,typeFilter,search]);

  const typeBreakdown = useMemo(()=>{
    const pending=approvals.filter(a=>a.status==='pending');
    return (Object.entries(TYPE_META) as [ApprovalType,typeof TYPE_META[ApprovalType]][])
      .map(([type,meta])=>({type,meta,count:pending.filter(a=>a.type===type).length}))
      .filter(x=>x.count>0);
  },[approvals]);

  const resolve = async (id: string, action: 'approve'|'reject', note: string) => {
    const updated = approvals.map(a=>a.id!==id?a:{
      ...a, status:action==='approve'?'approved':'rejected' as ApprovalStatus,
      resolvedAt:new Date().toISOString().slice(0,10), resolvedBy:'Curtis',
      ...(action==='reject'?{rejectionReason:note}:{note}),
    });
    setApprovals(updated);
    if (selectedApproval?.id===id) setSelectedApproval(null);
    setSelected(s=>{const n=new Set(s);n.delete(id);return n;});
    const resolvedApproval = updated.find(a => a.id === id);
    if (resolvedApproval) {
      await supabase.from('kv_store_d60f2898').upsert({ key: `approval:${companyId}:${id}`, value: resolvedApproval });
    }
  };

  const bulkResolve = (action:'approve'|'reject') => {
    Array.from(selected).forEach(id=>resolve(id,action,action==='approve'?'Bulk approved':'Bulk rejected'));
    setSelected(new Set());
  };

  const toggleSelect = (id:string)=>setSelected(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;});
  const toggleAll = ()=>setSelected(selected.size===filtered.length?new Set():new Set(filtered.map(a=>a.id)));

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Approvals</h1>
            <p className="text-sm text-gray-500 mt-0.5">Review registrations, enrollments, certificates, role changes, and access requests</p>
          </div>
          <div className="flex items-center gap-2">
            {counts.pending>0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium rounded-xl">
                <Clock className="size-4"/>{counts.pending} pending review
              </span>
            )}
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
              <Download className="size-4"/> Export
            </button>
          </div>
        </div>

        {/* Type breakdown chips */}
        {typeBreakdown.length>0 && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {typeBreakdown.map(({type,meta,count})=>{
              const Icon=meta.icon; const isActive=typeFilter===type;
              return (
                <button key={type} onClick={()=>setTypeFilter(isActive?'all':type)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shrink-0 transition-all ${
                    isActive?`border-transparent ${meta.light} shadow-sm`:'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <div className={`size-8 ${isActive?'bg-white':meta.light} rounded-lg flex items-center justify-center`}>
                    <Icon className={`size-4 ${meta.color}`}/>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">{count}</p>
                    <p className="text-xs text-gray-500">{meta.label}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Tabs + Search */}
      <div className="bg-white border-b border-gray-200 px-8 flex items-center justify-between">
        <div className="flex gap-0">
          {([
            ['pending','Pending','border-amber-500','text-amber-600','bg-amber-100 text-amber-700'],
            ['approved','Approved','border-emerald-500','text-emerald-600','bg-emerald-100 text-emerald-700'],
            ['rejected','Rejected','border-red-400','text-red-500','bg-red-100 text-red-600'],
          ] as const).map(([val,lbl,brd,cls,badgeCls])=>(
            <button key={val} onClick={()=>{setActiveTab(val);setSelected(new Set());setSelectedApproval(null);}}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab===val?`${brd} ${cls}`:'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {lbl}
              <span className={`px-1.5 py-0.5 text-xs rounded-full font-medium ${activeTab===val?badgeCls:'bg-gray-100 text-gray-500'}`}>{counts[val]}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search requests…"
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"/>
            {search&&<button onClick={()=>setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"><X className="size-3.5"/></button>}
          </div>
          <div className="relative">
            <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value as any)}
              className="appearance-none pl-3 pr-7 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700">
              <option value="all">All Types</option>
              {(Object.entries(TYPE_META) as [ApprovalType,typeof TYPE_META[ApprovalType]][]).map(([k,v])=>(
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none"/>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Bulk bar */}
          {selected.size>0&&activeTab==='pending'&&(
            <div className="flex items-center gap-3 px-6 py-2.5 bg-blue-50 border-b border-blue-100">
              <span className="text-sm font-medium text-blue-700">{selected.size} selected</span>
              <button onClick={()=>bulkResolve('approve')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                <Check className="size-3.5"/> Approve All
              </button>
              <button onClick={()=>bulkResolve('reject')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600">
                <X className="size-3.5"/> Reject All
              </button>
              <button onClick={()=>setSelected(new Set())} className="text-xs text-blue-600 hover:underline ml-auto">Deselect</button>
            </div>
          )}

          {/* Column headers */}
          <div className="flex items-center gap-3 px-6 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {activeTab==='pending'&&(
              <button onClick={toggleAll}
                className={`size-4 rounded border-2 flex items-center justify-center shrink-0 ${selected.size===filtered.length&&filtered.length>0?'border-blue-600 bg-blue-600':'border-gray-300 hover:border-blue-400'}`}>
                {selected.size===filtered.length&&filtered.length>0&&<Check className="size-3 text-white"/>}
              </button>
            )}
            <div className="flex-1">Requester</div>
            <div className="w-32 shrink-0">Type</div>
            <div className="flex-1">Details</div>
            <div className="w-28 shrink-0">Submitted</div>
            {activeTab!=='pending'&&<div className="w-28 shrink-0">Resolved</div>}
            <div className="w-28 shrink-0"/>
          </div>

          {/* Rows */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length===0?(
              <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                <div className="size-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <FileCheck2 className="size-8 text-gray-400"/>
                </div>
                <h3 className="text-base font-semibold text-gray-500 mb-1">
                  {activeTab==='pending'?'All caught up!':activeTab==='approved'?'No approved requests':'No rejected requests'}
                </h3>
                <p className="text-sm text-gray-400">
                  {activeTab==='pending'?'No requests are awaiting review.':`${activeTab==='approved'?'Approved':'Rejected'} requests will appear here.`}
                </p>
              </div>
            ):filtered.map(a=>{
              const tm=TYPE_META[a.type];
              const sm=STATUS_META[a.status];
              const TypeIcon=tm.icon;
              const isSelected=selected.has(a.id);
              const isActive=selectedApproval?.id===a.id;
              const isMenuOpen=openMenu===a.id;
              return (
                <div key={a.id} onClick={()=>setSelectedApproval(isActive?null:a)}
                  className={`flex items-center gap-3 px-6 py-3.5 border-b border-gray-100 cursor-pointer transition-colors group ${
                    isActive?'bg-blue-50 border-l-4 border-l-blue-500':'hover:bg-gray-50'}`}>

                  {activeTab==='pending'&&(
                    <button onClick={e=>{e.stopPropagation();toggleSelect(a.id);}}
                      className={`size-4 rounded border-2 flex items-center justify-center shrink-0 ${isSelected?'border-blue-600 bg-blue-600':'border-gray-300 hover:border-blue-400'}`}>
                      {isSelected&&<Check className="size-3 text-white"/>}
                    </button>
                  )}

                  <div className="size-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {a.userName.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{a.userName}</p>
                    <p className="text-xs text-gray-500 truncate">{a.userEmail}</p>
                  </div>

                  <div className="w-32 shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${tm.light} ${tm.color}`}>
                      <TypeIcon className="size-3"/>{tm.label}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{a.detail}</p>
                    {a.detailExtra&&<p className="text-xs text-gray-400 truncate">{a.detailExtra}</p>}
                  </div>

                  <div className="w-28 shrink-0 text-xs text-gray-500">{relative(a.submittedAt)}</div>
                  {activeTab!=='pending'&&<div className="w-28 shrink-0 text-xs text-gray-500">{a.resolvedAt?fmt(a.resolvedAt):'—'}</div>}

                  <div className="w-28 shrink-0 flex items-center justify-end gap-1" onClick={e=>e.stopPropagation()}>
                    {a.status==='pending'?(
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={()=>setResolveModal({approval:a,action:'reject'})} title="Reject"
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"><X className="size-4"/></button>
                        <button onClick={()=>setResolveModal({approval:a,action:'approve'})} title="Approve"
                          className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700"><Check className="size-4"/></button>
                      </div>
                    ):(
                      <span className={`flex items-center gap-1 text-xs font-medium ${sm.color}`}>
                        <span className={`size-1.5 rounded-full ${sm.dot}`}/>{sm.label}
                      </span>
                    )}
                    <div className="relative">
                      <button onClick={()=>setOpenMenu(isMenuOpen?null:a.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-all">
                        <MoreHorizontal className="size-4"/>
                      </button>
                      {isMenuOpen&&(
                        <>
                          <div className="fixed inset-0 z-10" onClick={()=>setOpenMenu(null)}/>
                          <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                            <button onClick={()=>{setSelectedApproval(a);setOpenMenu(null);}}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                              <Eye className="size-3.5"/> View Details
                            </button>
                            {a.status==='pending'&&<>
                              <button onClick={()=>{setResolveModal({approval:a,action:'approve'});setOpenMenu(null);}}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50">
                                <Check className="size-3.5"/> Approve
                              </button>
                              <button onClick={()=>{setResolveModal({approval:a,action:'reject'});setOpenMenu(null);}}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                                <X className="size-3.5"/> Reject
                              </button>
                            </>}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        {selectedApproval&&(
          <DetailPanel approval={selectedApproval} onClose={()=>setSelectedApproval(null)}
            onApprove={a=>setResolveModal({approval:a,action:'approve'})}
            onReject={a=>setResolveModal({approval:a,action:'reject'})}/>
        )}
      </div>

      {resolveModal&&(
        <ResolveModal approval={resolveModal.approval} action={resolveModal.action}
          onClose={()=>setResolveModal(null)} onConfirm={resolve}/>
      )}
    </div>
  );
}
