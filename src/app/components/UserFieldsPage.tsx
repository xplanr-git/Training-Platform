import { useState, useMemo } from 'react';
import {
  ClipboardList, Plus, Search, X, Trash2, Edit2, Check, MoreHorizontal,
  GripVertical, Type, Hash, Mail, Phone, Calendar, ChevronDown,
  CheckSquare, List, Link, AlignLeft, Star, Upload, ToggleLeft,
  Eye, EyeOff, Lock, Unlock, AlertCircle, Users, UserPlus,
  Settings, ChevronRight, Copy, ArrowUpDown, Shield,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   Types
══════════════════════════════════════════════════════════════ */
type FieldType =
  | 'text' | 'number' | 'email' | 'phone' | 'date'
  | 'dropdown' | 'checkbox' | 'multi-select' | 'url'
  | 'textarea' | 'file' | 'rating' | 'toggle';

type AppliesTo = 'users' | 'leads' | 'both';

interface FieldOption { id: string; label: string }

interface UserField {
  id: string;
  label: string;
  key: string;            // API / database key
  type: FieldType;
  groupId: string;
  appliesTo: AppliesTo;
  description: string;
  placeholder: string;
  defaultValue: string;
  options: FieldOption[]; // for dropdown / multi-select
  required: boolean;
  visibleInProfile: boolean;
  editableByUser: boolean;
  searchable: boolean;
  system: boolean;        // system fields can't be deleted
  order: number;
  createdAt: string;
}

interface FieldGroup {
  id: string;
  label: string;
  system: boolean;
}

/* ══════════════════════════════════════════════════════════════
   Field type meta
══════════════════════════════════════════════════════════════ */
const FIELD_TYPES: { type: FieldType; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { type:'text',         label:'Text',         icon: Type,         color:'text-blue-600',   bg:'bg-blue-50'   },
  { type:'textarea',     label:'Long Text',    icon: AlignLeft,    color:'text-blue-500',   bg:'bg-blue-50'   },
  { type:'number',       label:'Number',       icon: Hash,         color:'text-violet-600', bg:'bg-violet-50' },
  { type:'email',        label:'Email',        icon: Mail,         color:'text-rose-500',   bg:'bg-rose-50'   },
  { type:'phone',        label:'Phone',        icon: Phone,        color:'text-green-600',  bg:'bg-green-50'  },
  { type:'date',         label:'Date',         icon: Calendar,     color:'text-amber-600',  bg:'bg-amber-50'  },
  { type:'dropdown',     label:'Dropdown',     icon: ChevronDown,  color:'text-indigo-600', bg:'bg-indigo-50' },
  { type:'multi-select', label:'Multi-Select', icon: List,         color:'text-cyan-600',   bg:'bg-cyan-50'   },
  { type:'checkbox',     label:'Checkbox',     icon: CheckSquare,  color:'text-teal-600',   bg:'bg-teal-50'   },
  { type:'toggle',       label:'Toggle',       icon: ToggleLeft,   color:'text-emerald-600',bg:'bg-emerald-50'},
  { type:'url',          label:'URL / Link',   icon: Link,         color:'text-sky-600',    bg:'bg-sky-50'    },
  { type:'file',         label:'File Upload',  icon: Upload,       color:'text-orange-600', bg:'bg-orange-50' },
  { type:'rating',       label:'Rating',       icon: Star,         color:'text-yellow-500', bg:'bg-yellow-50' },
];

const typeMeta = (t: FieldType) => FIELD_TYPES.find(f => f.type === t) ?? FIELD_TYPES[0];

/* ══════════════════════════════════════════════════════════════
   Seed data
══════════════════════════════════════════════════════════════ */
const SEED_GROUPS: FieldGroup[] = [
  { id:'g-personal',     label:'Personal Info',    system: true  },
  { id:'g-professional', label:'Professional Info', system: true  },
  { id:'g-preferences',  label:'Preferences',      system: false },
  { id:'g-custom',       label:'Custom Fields',    system: false },
];

const SEED_FIELDS: UserField[] = [
  // Personal Info
  { id:'f1',  label:'First Name',       key:'first_name',       type:'text',         groupId:'g-personal',     appliesTo:'both',  description:'',                              placeholder:'John',           defaultValue:'', options:[], required:true,  visibleInProfile:true,  editableByUser:true,  searchable:true,  system:true,  order:1, createdAt:'2024-01-01' },
  { id:'f2',  label:'Last Name',        key:'last_name',        type:'text',         groupId:'g-personal',     appliesTo:'both',  description:'',                              placeholder:'Doe',            defaultValue:'', options:[], required:true,  visibleInProfile:true,  editableByUser:true,  searchable:true,  system:true,  order:2, createdAt:'2024-01-01' },
  { id:'f3',  label:'Email Address',    key:'email',            type:'email',        groupId:'g-personal',     appliesTo:'both',  description:'Primary contact email.',        placeholder:'john@email.com', defaultValue:'', options:[], required:true,  visibleInProfile:true,  editableByUser:false, searchable:true,  system:true,  order:3, createdAt:'2024-01-01' },
  { id:'f4',  label:'Phone Number',     key:'phone',            type:'phone',        groupId:'g-personal',     appliesTo:'both',  description:'',                              placeholder:'+1 (555) 000-0000', defaultValue:'', options:[], required:false, visibleInProfile:true,  editableByUser:true,  searchable:false, system:true,  order:4, createdAt:'2024-01-01' },
  { id:'f5',  label:'Date of Birth',    key:'date_of_birth',    type:'date',         groupId:'g-personal',     appliesTo:'users', description:'',                              placeholder:'',               defaultValue:'', options:[], required:false, visibleInProfile:false, editableByUser:true,  searchable:false, system:false, order:5, createdAt:'2024-01-01' },
  { id:'f6',  label:'Profile Photo',    key:'avatar',           type:'file',         groupId:'g-personal',     appliesTo:'users', description:'JPG or PNG, max 2 MB.',        placeholder:'',               defaultValue:'', options:[], required:false, visibleInProfile:true,  editableByUser:true,  searchable:false, system:true,  order:6, createdAt:'2024-01-01' },
  // Professional Info
  { id:'f7',  label:'Job Title',        key:'job_title',        type:'text',         groupId:'g-professional', appliesTo:'both',  description:'',                              placeholder:'Software Engineer', defaultValue:'', options:[], required:false, visibleInProfile:true,  editableByUser:true,  searchable:true,  system:false, order:1, createdAt:'2024-01-01' },
  { id:'f8',  label:'Department',       key:'department',       type:'dropdown',     groupId:'g-professional', appliesTo:'users', description:'',                              placeholder:'',               defaultValue:'', options:[{id:'o1',label:'Engineering'},{id:'o2',label:'Sales'},{id:'o3',label:'HR'},{id:'o4',label:'Operations'}], required:false, visibleInProfile:true,  editableByUser:false, searchable:true,  system:false, order:2, createdAt:'2024-01-01' },
  { id:'f9',  label:'Company Name',     key:'company',          type:'text',         groupId:'g-professional', appliesTo:'both',  description:'',                              placeholder:'Acme Corp',      defaultValue:'', options:[], required:false, visibleInProfile:true,  editableByUser:true,  searchable:true,  system:true,  order:3, createdAt:'2024-01-01' },
  { id:'f10', label:'LinkedIn URL',     key:'linkedin_url',     type:'url',          groupId:'g-professional', appliesTo:'both',  description:'',                              placeholder:'https://linkedin.com/in/...', defaultValue:'', options:[], required:false, visibleInProfile:true,  editableByUser:true,  searchable:false, system:false, order:4, createdAt:'2024-01-01' },
  { id:'f11', label:'Years of Experience', key:'years_exp',     type:'number',       groupId:'g-professional', appliesTo:'leads', description:'Total years in the industry.',  placeholder:'5',              defaultValue:'', options:[], required:false, visibleInProfile:false, editableByUser:true,  searchable:false, system:false, order:5, createdAt:'2025-01-15' },
  // Preferences
  { id:'f12', label:'Preferred Language', key:'language',       type:'dropdown',     groupId:'g-preferences',  appliesTo:'users', description:'',                              placeholder:'',               defaultValue:'en', options:[{id:'p1',label:'English'},{id:'p2',label:'Spanish'},{id:'p3',label:'French'},{id:'p4',label:'German'}], required:false, visibleInProfile:true, editableByUser:true, searchable:false, system:false, order:1, createdAt:'2024-06-01' },
  { id:'f13', label:'Email Notifications', key:'email_notif',   type:'toggle',       groupId:'g-preferences',  appliesTo:'users', description:'Receive email updates.',        placeholder:'',               defaultValue:'true', options:[], required:false, visibleInProfile:false, editableByUser:true, searchable:false, system:false, order:2, createdAt:'2024-06-01' },
  { id:'f14', label:'Interests',         key:'interests',        type:'multi-select', groupId:'g-preferences',  appliesTo:'both',  description:'Topics the user is interested in.', placeholder:'',          defaultValue:'', options:[{id:'i1',label:'Leadership'},{id:'i2',label:'Sales'},{id:'i3',label:'Tech'},{id:'i4',label:'Marketing'}], required:false, visibleInProfile:true, editableByUser:true, searchable:true, system:false, order:3, createdAt:'2024-06-01' },
  // Custom
  { id:'f15', label:'NPS Score',         key:'nps_score',        type:'rating',       groupId:'g-custom',       appliesTo:'users', description:'Net Promoter Score (0–10).',    placeholder:'',               defaultValue:'', options:[], required:false, visibleInProfile:false, editableByUser:false, searchable:false, system:false, order:1, createdAt:'2025-03-01' },
  { id:'f16', label:'Lead Source',       key:'lead_source',      type:'dropdown',     groupId:'g-custom',       appliesTo:'leads', description:'Where this lead came from.',    placeholder:'',               defaultValue:'', options:[{id:'ls1',label:'Website'},{id:'ls2',label:'Referral'},{id:'ls3',label:'Social'},{id:'ls4',label:'Event'}], required:false, visibleInProfile:false, editableByUser:false, searchable:true, system:false, order:2, createdAt:'2025-03-01' },
  { id:'f17', label:'Consent Given',     key:'gdpr_consent',     type:'checkbox',     groupId:'g-custom',       appliesTo:'both',  description:'GDPR marketing consent.',       placeholder:'',               defaultValue:'', options:[], required:true,  visibleInProfile:false, editableByUser:true,  searchable:false, system:false, order:3, createdAt:'2025-04-01' },
];

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

/* ══════════════════════════════════════════════════════════════
   Field Type Picker (used inside modal)
══════════════════════════════════════════════════════════════ */
function FieldTypePicker({ value, onChange }: { value: FieldType; onChange: (t: FieldType) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {FIELD_TYPES.map(ft => {
        const Icon = ft.icon;
        const active = value === ft.type;
        return (
          <button key={ft.type} onClick={() => onChange(ft.type)}
            className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left transition-colors ${
              active ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
            }`}>
            <div className={`size-6 rounded-lg ${active ? ft.bg : 'bg-gray-100'} flex items-center justify-center shrink-0`}>
              <Icon className={`size-3.5 ${active ? ft.color : 'text-gray-400'}`} />
            </div>
            <span className={`text-xs font-medium truncate ${active ? 'text-blue-700' : 'text-gray-600'}`}>{ft.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Options Editor (dropdown / multi-select)
══════════════════════════════════════════════════════════════ */
function OptionsEditor({ options, onChange }: { options: FieldOption[]; onChange: (o: FieldOption[]) => void }) {
  const [newLabel, setNewLabel] = useState('');
  const add = () => {
    if (!newLabel.trim()) return;
    onChange([...options, { id: `o-${Date.now()}`, label: newLabel.trim() }]);
    setNewLabel('');
  };
  return (
    <div className="space-y-2">
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {options.map((o, i) => (
          <div key={o.id} className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded-lg">
            <GripVertical className="size-3 text-gray-300 shrink-0" />
            <input value={o.label} onChange={e => onChange(options.map((x,j)=>j===i?{...x,label:e.target.value}:x))}
              className="flex-1 text-sm bg-transparent focus:outline-none text-gray-700" />
            <button onClick={() => onChange(options.filter((_,j)=>j!==i))}
              className="text-gray-400 hover:text-red-500 transition-colors"><X className="size-3" /></button>
          </div>
        ))}
        {options.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No options yet</p>}
      </div>
      <div className="flex gap-1.5">
        <input value={newLabel} onChange={e=>setNewLabel(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&add()}
          placeholder="Add option…"
          className="flex-1 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button onClick={add} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Create / Edit Field Modal
══════════════════════════════════════════════════════════════ */
interface FieldModalProps {
  initial?: UserField | null;
  groups: FieldGroup[];
  activeTab: 'users' | 'leads';
  onClose: () => void;
  onSave: (f: Omit<UserField, 'id' | 'createdAt' | 'order'>) => void;
}
function FieldModal({ initial, groups, activeTab, onClose, onSave }: FieldModalProps) {
  const [step, setStep] = useState<'type' | 'details'>(initial ? 'details' : 'type');
  const [form, setForm] = useState<Omit<UserField,'id'|'createdAt'|'order'>>({
    label: initial?.label ?? '',
    key: initial?.key ?? '',
    type: initial?.type ?? 'text',
    groupId: initial?.groupId ?? groups[0]?.id ?? '',
    appliesTo: initial?.appliesTo ?? (activeTab === 'leads' ? 'leads' : 'users'),
    description: initial?.description ?? '',
    placeholder: initial?.placeholder ?? '',
    defaultValue: initial?.defaultValue ?? '',
    options: initial?.options ?? [],
    required: initial?.required ?? false,
    visibleInProfile: initial?.visibleInProfile ?? true,
    editableByUser: initial?.editableByUser ?? true,
    searchable: initial?.searchable ?? false,
    system: initial?.system ?? false,
  });
  const [errors, setErrors] = useState<Record<string,string>>({});

  const needsOptions = form.type === 'dropdown' || form.type === 'multi-select';
  const tm = typeMeta(form.type);

  const validate = () => {
    const e: Record<string,string> = {};
    if (!form.label.trim()) e.label = 'Label is required';
    if (!form.key.trim()) e.key = 'Field key is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handle = () => { if (validate()) { onSave(form); onClose(); } };

  const TypeIcon = tm.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[92vh] overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {step === 'details' && !initial && (
              <button onClick={() => setStep('type')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <ChevronRight className="size-4 rotate-180" />
              </button>
            )}
            <div className={`size-9 ${tm.bg} rounded-xl flex items-center justify-center`}>
              <TypeIcon className={`size-5 ${tm.color}`} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {initial ? 'Edit Field' : step === 'type' ? 'Choose Field Type' : `New ${tm.label} Field`}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {initial ? 'Update field settings' : step === 'type' ? 'Select the type of data to collect' : 'Configure field details'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X className="size-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* Step 1 — Type picker */}
          {step === 'type' && (
            <div className="space-y-4">
              <FieldTypePicker value={form.type} onChange={t => setForm(f=>({...f, type:t}))} />
              <div className="flex justify-end pt-2">
                <button onClick={() => setStep('details')}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700">
                  Continue <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Details */}
          {step === 'details' && (
            <div className="space-y-5">
              {/* Label + Key */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Label <span className="text-red-500">*</span></label>
                  <input value={form.label}
                    onChange={e => setForm(f => ({ ...f, label: e.target.value, key: initial ? f.key : slugify(e.target.value) }))}
                    placeholder="e.g. Job Title"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {errors.label && <p className="text-xs text-red-500 mt-1">{errors.label}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field Key <span className="text-red-500">*</span>
                    <span className="ml-1 text-xs text-gray-400 font-normal">— API identifier</span>
                  </label>
                  <input value={form.key}
                    onChange={e => setForm(f => ({ ...f, key: slugify(e.target.value) }))}
                    placeholder="job_title"
                    disabled={form.system}
                    className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                  {errors.key && <p className="text-xs text-red-500 mt-1">{errors.key}</p>}
                </div>
              </div>

              {/* Description + Placeholder */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional help text)</span></label>
                <input value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))}
                  placeholder="Shown below the field label"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {form.type !== 'checkbox' && form.type !== 'toggle' && form.type !== 'file' && form.type !== 'rating' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
                    <input value={form.placeholder} onChange={e=>setForm(f=>({...f,placeholder:e.target.value}))}
                      placeholder="e.g. Enter value…"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  {!needsOptions && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Default Value</label>
                      <input value={form.defaultValue} onChange={e=>setForm(f=>({...f,defaultValue:e.target.value}))}
                        placeholder="Leave blank for none"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  )}
                </div>
              )}

              {/* Options (dropdown / multi-select) */}
              {needsOptions && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                  <OptionsEditor options={form.options} onChange={opts=>setForm(f=>({...f,options:opts}))} />
                </div>
              )}

              {/* Group + Applies To */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group / Section</label>
                  <select value={form.groupId} onChange={e=>setForm(f=>({...f,groupId:e.target.value}))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    {groups.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Applies To</label>
                  <select value={form.appliesTo} onChange={e=>setForm(f=>({...f,appliesTo:e.target.value as AppliesTo}))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="users">Users only</option>
                    <option value="leads">Leads only</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>

              {/* Toggle properties */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Field Properties</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key:'required',         label:'Required',              icon: AlertCircle, desc:'Must be filled in' },
                    { key:'visibleInProfile', label:'Visible in Profile',    icon: Eye,         desc:'Shown on the profile page' },
                    { key:'editableByUser',   label:'User Can Edit',         icon: Unlock,      desc:'User can update this field' },
                    { key:'searchable',       label:'Searchable',            icon: Search,      desc:'Included in search filters' },
                  ].map(p => {
                    const Icon = p.icon;
                    const active = form[p.key as keyof typeof form] as boolean;
                    return (
                      <button key={p.key}
                        onClick={() => setForm(f=>({...f,[p.key]:!f[p.key as keyof typeof f]}))}
                        disabled={form.system && p.key === 'required'}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                          active ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}>
                        <div className={`size-5 rounded flex items-center justify-center shrink-0 ${active ? 'bg-blue-600' : 'border border-gray-300 bg-white'}`}>
                          {active && <Check className="size-3 text-white" />}
                        </div>
                        <div>
                          <p className={`text-xs font-medium ${active ? 'text-blue-700' : 'text-gray-700'}`}>{p.label}</p>
                          <p className="text-[10px] text-gray-400">{p.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {step === 'details' && (
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 shrink-0">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button onClick={handle} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              {initial ? 'Save Changes' : 'Create Field'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Field Row
══════════════════════════════════════════════════════════════ */
interface FieldRowProps {
  field: UserField;
  onEdit: (f: UserField) => void;
  onDelete: (f: UserField) => void;
  onDuplicate: (f: UserField) => void;
  onToggle: (id: string, prop: 'required'|'visibleInProfile'|'editableByUser'|'searchable') => void;
}
function FieldRow({ field, onEdit, onDelete, onDuplicate, onToggle }: FieldRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const tm = typeMeta(field.type);
  const TypeIcon = tm.icon;

  return (
    <div className={`group flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${field.system ? 'bg-gray-50/50' : ''}`}>
      {/* Drag handle */}
      <GripVertical className={`size-4 shrink-0 ${field.system ? 'text-gray-200' : 'text-gray-300 cursor-grab group-hover:text-gray-400'}`} />

      {/* Type icon */}
      <div className={`size-8 ${tm.bg} rounded-lg flex items-center justify-center shrink-0`}>
        <TypeIcon className={`size-4 ${tm.color}`} />
      </div>

      {/* Label + key */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 truncate">{field.label}</span>
          {field.system && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded-full">
              <Lock className="size-2.5" /> System
            </span>
          )}
          {field.required && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-50 text-red-600 rounded-full">Required</span>
          )}
        </div>
        <p className="text-xs text-gray-400 font-mono">{field.key}</p>
      </div>

      {/* Type label */}
      <span className="hidden md:block text-xs text-gray-500 w-24 shrink-0">{tm.label}</span>

      {/* Applies to */}
      <span className={`hidden lg:flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
        field.appliesTo==='users' ? 'bg-blue-50 text-blue-600' :
        field.appliesTo==='leads' ? 'bg-violet-50 text-violet-600' :
        'bg-gray-100 text-gray-600'
      }`}>
        {field.appliesTo==='users' && <Users className="size-3"/>}
        {field.appliesTo==='leads' && <UserPlus className="size-3"/>}
        {field.appliesTo==='both' && <ArrowUpDown className="size-3"/>}
        {field.appliesTo==='both'?'Both':field.appliesTo==='users'?'Users':'Leads'}
      </span>

      {/* Toggle icons */}
      <div className="hidden lg:flex items-center gap-1 shrink-0">
        {([
          { prop:'visibleInProfile' as const, title:'Visible in profile', on: Eye,    off: EyeOff },
          { prop:'editableByUser'   as const, title:'User can edit',      on: Unlock, off: Lock   },
          { prop:'searchable'       as const, title:'Searchable',         on: Search, off: Search  },
        ]).map(({ prop, title, on: On, off: Off }) => {
          const active = field[prop];
          return (
            <button key={prop} title={title}
              onClick={() => onToggle(field.id, prop)}
              className={`p-1.5 rounded-lg transition-colors ${active ? 'text-blue-500 hover:bg-blue-50' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}`}>
              {active ? <On className="size-3.5" /> : <Off className="size-3.5" />}
            </button>
          );
        })}
      </div>

      {/* Options count (dropdown / multi-select) */}
      {(field.type==='dropdown'||field.type==='multi-select') && (
        <span className="hidden xl:block text-xs text-gray-400 shrink-0">{field.options.length} option{field.options.length!==1?'s':''}</span>
      )}

      {/* Actions menu */}
      <div className="relative shrink-0">
        <button onClick={() => setMenuOpen(m=>!m)}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-all">
          <MoreHorizontal className="size-4" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              <button onClick={()=>{onEdit(field);setMenuOpen(false);}}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <Edit2 className="size-3.5"/> Edit Field
              </button>
              <button onClick={()=>{onDuplicate(field);setMenuOpen(false);}}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <Copy className="size-3.5"/> Duplicate
              </button>
              {!field.system && (
                <button onClick={()=>{onDelete(field);setMenuOpen(false);}}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                  <Trash2 className="size-3.5"/> Delete
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main Page
══════════════════════════════════════════════════════════════ */
export function UserFieldsPage() {
  const [fields, setFields] = useState<UserField[]>(SEED_FIELDS);
  const [groups, setGroups] = useState<FieldGroup[]>(SEED_GROUPS);
  const [activeTab, setActiveTab] = useState<'users'|'leads'>('users');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editField, setEditField] = useState<UserField|null>(null);
  const [deleteField, setDeleteField] = useState<UserField|null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [showGroupInput, setShowGroupInput] = useState(false);

  /* ── Derived ── */
  const tabFields = useMemo(() =>
    fields.filter(f => f.appliesTo === activeTab || f.appliesTo === 'both'), [fields, activeTab]);

  const displayFields = useMemo(() => {
    let list = tabFields;
    if (selectedGroupId !== 'all') list = list.filter(f => f.groupId === selectedGroupId);
    if (search) list = list.filter(f =>
      f.label.toLowerCase().includes(search.toLowerCase()) ||
      f.key.toLowerCase().includes(search.toLowerCase())
    );
    return [...list].sort((a,b) => a.order - b.order);
  }, [tabFields, selectedGroupId, search]);

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tabFields.forEach(f => { counts[f.groupId] = (counts[f.groupId]??0)+1; });
    return counts;
  }, [tabFields]);

  /* ── Actions ── */
  const handleSave = (data: Omit<UserField,'id'|'createdAt'|'order'>) => {
    if (editField) {
      setFields(prev => prev.map(f => f.id===editField.id ? {...f,...data} : f));
    } else {
      const maxOrder = Math.max(0, ...fields.filter(f=>f.groupId===data.groupId).map(f=>f.order));
      setFields(prev => [...prev, {
        ...data, id:`f-${Date.now()}`, createdAt: new Date().toISOString().slice(0,10), order: maxOrder+1,
      }]);
    }
    setEditField(null);
  };

  const handleDelete = (f: UserField) => {
    setFields(prev => prev.filter(x => x.id !== f.id));
    setDeleteField(null);
  };

  const handleDuplicate = (f: UserField) => {
    const maxOrder = Math.max(0, ...fields.filter(x=>x.groupId===f.groupId).map(x=>x.order));
    setFields(prev => [...prev, {
      ...f, id:`f-${Date.now()}`, label:`${f.label} (Copy)`,
      key:`${f.key}_copy`, system:false, order: maxOrder+1,
      createdAt: new Date().toISOString().slice(0,10),
    }]);
  };

  const handleToggle = (id: string, prop: 'required'|'visibleInProfile'|'editableByUser'|'searchable') => {
    setFields(prev => prev.map(f => f.id===id ? {...f,[prop]:!f[prop]} : f));
  };

  const addGroup = () => {
    if (!newGroupName.trim()) return;
    const id = `g-${Date.now()}`;
    setGroups(prev => [...prev, { id, label: newGroupName.trim(), system: false }]);
    setNewGroupName(''); setShowGroupInput(false);
    setSelectedGroupId(id);
  };

  /* ── Stats ── */
  const totalFields   = tabFields.length;
  const requiredCount = tabFields.filter(f=>f.required).length;
  const systemCount   = tabFields.filter(f=>f.system).length;
  const customCount   = tabFields.filter(f=>!f.system).length;

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">User Fields</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage custom profile fields for users and leads — used in forms, filters and segmentation
            </p>
          </div>
          <button onClick={() => { setEditField(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
            <Plus className="size-4" /> Add Field
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-0 border-b border-gray-200 -mb-5">
          {([['users','Users','text-blue-600'],['leads','Leads','text-violet-600']] as const).map(([val,lbl,cls]) => (
            <button key={val} onClick={() => { setActiveTab(val); setSelectedGroupId('all'); }}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab===val ? `border-blue-600 ${cls}` : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {val==='users' ? <Users className="size-4"/> : <UserPlus className="size-4"/>}
              {lbl}
              <span className={`px-1.5 py-0.5 text-xs rounded-full font-medium ${
                activeTab===val ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
              }`}>{tabFields.length}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="bg-white border-b border-gray-200 px-8 py-3 flex items-center gap-6">
        {[
          { label:'Total Fields',   value: totalFields,   color:'text-gray-700' },
          { label:'Required',       value: requiredCount, color:'text-red-600'  },
          { label:'System Fields',  value: systemCount,   color:'text-gray-500' },
          { label:'Custom Fields',  value: customCount,   color:'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 text-sm">
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="text-gray-400">{s.label}</span>
          </div>
        ))}
        <div className="ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search fields…"
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
            {search && <button onClick={()=>setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"><X className="size-3.5"/></button>}
          </div>
        </div>
      </div>

      {/* ── Two-panel body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left — Group list */}
        <div className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
            {/* All fields */}
            <button onClick={()=>setSelectedGroupId('all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedGroupId==='all' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              <span>All Fields</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{tabFields.length}</span>
            </button>

            <div className="pt-2 pb-1">
              <p className="px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Groups</p>
            </div>

            {groups.map(g => {
              const count = groupCounts[g.id] ?? 0;
              const active = selectedGroupId === g.id;
              return (
                <button key={g.id} onClick={()=>setSelectedGroupId(g.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    {g.system ? <Lock className="size-3 text-gray-400 shrink-0"/> : <Settings className="size-3 text-gray-400 shrink-0"/>}
                    <span className="truncate">{g.label}</span>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${active?'bg-blue-100 text-blue-600':'bg-gray-100 text-gray-500'}`}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Add group */}
          <div className="p-3 border-t border-gray-100">
            {showGroupInput ? (
              <div className="space-y-1.5">
                <input value={newGroupName} onChange={e=>setNewGroupName(e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Enter') addGroup(); if(e.key==='Escape') setShowGroupInput(false); }}
                  autoFocus placeholder="Group name…"
                  className="w-full px-2.5 py-1.5 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="flex gap-1">
                  <button onClick={addGroup} className="flex-1 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add</button>
                  <button onClick={()=>{setShowGroupInput(false);setNewGroupName('');}} className="flex-1 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={()=>setShowGroupInput(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <Plus className="size-3.5"/> New Group
              </button>
            )}
          </div>
        </div>

        {/* Right — Field list */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Column headers */}
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
            <div className="w-4 shrink-0"/>
            <div className="w-8 shrink-0"/>
            <div className="flex-1">Field</div>
            <div className="hidden md:block w-24 shrink-0">Type</div>
            <div className="hidden lg:block w-20 shrink-0">Scope</div>
            <div className="hidden lg:flex items-center gap-1 shrink-0 w-24">
              <Eye className="size-3"/> <Unlock className="size-3"/> <Search className="size-3"/>
            </div>
            <div className="hidden xl:block w-16 shrink-0">Options</div>
            <div className="w-8 shrink-0"/>
          </div>

          {/* Rows */}
          <div className="flex-1 overflow-y-auto">
            {displayFields.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                <div className="size-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <ClipboardList className="size-8 text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-500 mb-1">No fields found</h3>
                <p className="text-sm text-gray-400 max-w-xs mb-4">
                  {search ? 'Try a different search term.' : 'Add a field to this group to start collecting data.'}
                </p>
                {!search && (
                  <button onClick={() => { setEditField(null); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700">
                    <Plus className="size-4"/> Add Field
                  </button>
                )}
              </div>
            ) : (
              displayFields.map(f => (
                <FieldRow key={f.id} field={f}
                  onEdit={x => { setEditField(x); setShowModal(true); }}
                  onDelete={setDeleteField}
                  onDuplicate={handleDuplicate}
                  onToggle={handleToggle}
                />
              ))
            )}
          </div>

          {/* Footer hint */}
          {displayFields.length > 0 && (
            <div className="px-6 py-2 border-t border-gray-100 bg-white flex items-center gap-2 text-xs text-gray-400">
              <GripVertical className="size-3.5"/>
              Drag rows to reorder &nbsp;·&nbsp;
              <Eye className="size-3.5"/> visible &nbsp;
              <Unlock className="size-3.5"/> user-editable &nbsp;
              <Search className="size-3.5"/> searchable
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {showModal && (
        <FieldModal initial={editField} groups={groups} activeTab={activeTab}
          onClose={() => { setShowModal(false); setEditField(null); }}
          onSave={handleSave} />
      )}

      {deleteField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 bg-red-100 rounded-xl flex items-center justify-center">
                <Trash2 className="size-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Delete Field</h3>
                <p className="text-xs text-gray-500">This cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Delete <strong>{deleteField.label}</strong>? Any stored data for this field will be permanently removed from all {deleteField.appliesTo === 'both' ? 'users and leads' : deleteField.appliesTo}.
            </p>
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl mb-4">
              <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">API key <code className="font-mono">{deleteField.key}</code> will stop returning data.</p>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteField(null)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={() => handleDelete(deleteField)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Delete Field</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
