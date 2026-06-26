import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Tag, Plus, Search, X, Trash2, Edit2, Check, MoreHorizontal,
  Users, BookOpen, Zap, Copy, Hash,
  ChevronDown, AlertTriangle, Pipette,
} from 'lucide-react';
import { User } from '@/app/types';
import { supabase } from '/utils/supabase/client';

/* ══════════════════════════════════════════════════════════════
   Color conversion utilities
══════════════════════════════════════════════════════════════ */
function hsvToHex(h: number, s: number, v: number): string {
  // h: 0-360, s: 0-1, v: 0-1
  const f = (n: number, k = (n + h / 60) % 6) =>
    Math.round((v - v * s * Math.max(Math.min(k, 4 - k, 1), 0)) * 255);
  const r = f(5).toString(16).padStart(2, '0');
  const g = f(3).toString(16).padStart(2, '0');
  const b = f(1).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

function hexToHsv(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return [210, 0.8, 0.9];
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return [Math.round(h), max === 0 ? 0 : d / max, max];
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function isValidHex(h: string) { return /^#[0-9a-fA-F]{6}$/.test(h); }

// Luminance helper — returns black or white for contrast text
function contrastText(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const l = 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);
  return l > 0.45 ? '#1a1a1a' : '#ffffff';
}

// Tag pill inline style (light tint background + colored text)
function tagStyle(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  return {
    backgroundColor: `rgba(${r},${g},${b},0.12)`,
    color: hex,
    border: `1px solid rgba(${r},${g},${b},0.3)`,
  };
}

/* ══════════════════════════════════════════════════════════════
   Pantone / preset swatches
══════════════════════════════════════════════════════════════ */
const PANTONE_SWATCHES = [
  { name: 'Peach Fuzz 2024',    hex: '#FFBE98' },
  { name: 'Viva Magenta 2023',  hex: '#BB2649' },
  { name: 'Very Peri 2022',     hex: '#6667AB' },
  { name: 'Illuminating 2021',  hex: '#F5DF4D' },
  { name: 'Ultimate Gray 2021', hex: '#939597' },
  { name: 'Classic Blue 2020',  hex: '#0F4C81' },
  { name: 'Living Coral 2019',  hex: '#FF6B6B' },
  { name: 'Ultra Violet 2018',  hex: '#5F4B8B' },
  { name: 'Greenery 2017',      hex: '#88B04B' },
  { name: 'Rose Quartz 2016',   hex: '#F7CAC9' },
  { name: 'Serenity 2016',      hex: '#92A8D1' },
  { name: 'Marsala 2015',       hex: '#964F4C' },
];

const QUICK_SWATCHES = [
  '#ef4444','#f97316','#f59e0b','#eab308','#84cc16','#22c55e',
  '#14b8a6','#06b6d4','#3b82f6','#6366f1','#8b5cf6','#ec4899',
  '#64748b','#1e293b','#f8fafc','#7c3aed','#0ea5e9','#d946ef',
];

/* ══════════════════════════════════════════════════════════════
   ColorPicker component
══════════════════════════════════════════════════════════════ */
interface ColorPickerProps {
  color: string;          // hex string
  onChange: (hex: string) => void;
}

function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [hsv, setHsv] = useState<[number, number, number]>(() => hexToHsv(color));
  const [hexInput, setHexInput] = useState(color.toUpperCase());
  const initRgb = () => { const [r,g,b]=hexToRgb(color); return { r: String(r), g: String(g), b: String(b) }; };
  const [rgbInput, setRgbInput] = useState<{ r:string; g:string; b:string }>(initRgb);
  const [activeTab, setActiveTab] = useState<'quick'|'pantone'>('quick');
  const [dragging, setDragging] = useState<'sv'|'hue'|null>(null);

  const svRef  = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  const [h, s, v] = hsv;

  /* sync outward */
  const applyHsv = useCallback((newHsv: [number, number, number]) => {
    setHsv(newHsv);
    const hex = hsvToHex(...newHsv);
    setHexInput(hex.toUpperCase());
    const [r,g,b] = hexToRgb(hex);
    setRgbInput({ r: String(r), g: String(g), b: String(b) });
    onChange(hex);
  }, [onChange]);

  /* sync inward when parent changes (preset click) */
  useEffect(() => {
    if (!isValidHex(color)) return;
    const newHsv = hexToHsv(color);
    setHsv(newHsv);
    setHexInput(color.toUpperCase());
    const [r,g,b]=hexToRgb(color);
    setRgbInput({ r: String(r), g: String(g), b: String(b) });
  }, [color]);

  /* SV square interaction */
  const updateSV = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!svRef.current) return;
    const rect = svRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left)  / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top)   / rect.height));
    applyHsv([h, x, 1 - y]);
  }, [h, applyHsv]);

  /* Hue ring interaction */
  const updateHue = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const dx = e.clientX - rect.left - rect.width  / 2;
    const dy = e.clientY - rect.top  - rect.height / 2;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const newH = ((angle + 90) + 360) % 360;
    applyHsv([newH, s, v]);
  }, [s, v, applyHsv]);

  /* Global mouse listeners for drag */
  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => dragging === 'sv' ? updateSV(e) : updateHue(e);
    const up   = () => setDragging(null);
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup',   up);
    return () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
  }, [dragging, updateSV, updateHue]);

  /* Hex input commit */
  const commitHex = (raw: string) => {
    const val = raw.startsWith('#') ? raw : `#${raw}`;
    if (isValidHex(val)) applyHsv(hexToHsv(val));
    else setHexInput(hsvToHex(h, s, v).toUpperCase());
  };

  /* RGB channel commit */
  const commitRgbChannel = (channel: 'r'|'g'|'b', raw: string) => {
    const val = parseInt(raw, 10);
    const clamped = isNaN(val) ? 0 : Math.max(0, Math.min(255, val));
    const next = { ...rgbInput, [channel]: String(clamped) };
    setRgbInput(next);
    const hex = `#${['r','g','b'].map(k => Number(next[k as 'r'|'g'|'b']).toString(16).padStart(2,'0')).join('')}`;
    applyHsv(hexToHsv(hex));
  };

  /* Hue ring geometry */
  const RING_SIZE      = 148;
  const RING_OUTER_R   = RING_SIZE / 2;
  const RING_THICKNESS = 18;
  const RING_MID_R     = RING_OUTER_R - RING_THICKNESS / 2;
  const hueAngleRad    = (h - 90) * (Math.PI / 180);
  const ptrX           = RING_OUTER_R + RING_MID_R * Math.cos(hueAngleRad);
  const ptrY           = RING_OUTER_R + RING_MID_R * Math.sin(hueAngleRad);

  const currentHex = hsvToHex(h, s, v);

  return (
    <div className="space-y-4">
      {/* ── Pickers row ── */}
      <div className="flex gap-4">

        {/* SV Square */}
        <div
          ref={svRef}
          className="rounded-xl overflow-hidden cursor-crosshair shrink-0 shadow-inner"
          style={{ width: RING_SIZE, height: RING_SIZE, position: 'relative' }}
          onMouseDown={e => { updateSV(e); setDragging('sv'); }}
        >
          {/* Hue base */}
          <div style={{ position:'absolute', inset:0, backgroundColor: `hsl(${h},100%,50%)` }} />
          {/* White gradient (saturation) */}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, #fff, transparent)' }} />
          {/* Black gradient (value) */}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent, #000)' }} />
          {/* Pointer */}
          <div style={{
            position:'absolute',
            left: s * RING_SIZE - 7, top: (1-v) * RING_SIZE - 7,
            width:14, height:14, borderRadius:'50%',
            border:'2px solid #fff',
            boxShadow:'0 0 0 1px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.4)',
            backgroundColor: currentHex,
            pointerEvents:'none',
          }} />
        </div>

        {/* Hue Wheel */}
        <div
          ref={hueRef}
          className="shrink-0 cursor-pointer select-none"
          style={{ width: RING_SIZE, height: RING_SIZE, position:'relative', borderRadius:'50%' }}
          onMouseDown={e => { updateHue(e); setDragging('hue'); }}
        >
          {/* Conic ring */}
          <div style={{
            width:'100%', height:'100%', borderRadius:'50%',
            background: `conic-gradient(
              hsl(0,100%,50%), hsl(30,100%,50%), hsl(60,100%,50%),
              hsl(90,100%,50%), hsl(120,100%,50%), hsl(150,100%,50%),
              hsl(180,100%,50%), hsl(210,100%,50%), hsl(240,100%,50%),
              hsl(270,100%,50%), hsl(300,100%,50%), hsl(330,100%,50%),
              hsl(360,100%,50%))`,
          }} />
          {/* Inner mask → donut */}
          <div style={{
            position:'absolute',
            top: RING_THICKNESS, left: RING_THICKNESS,
            right: RING_THICKNESS, bottom: RING_THICKNESS,
            borderRadius:'50%', backgroundColor:'#f9fafb',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            {/* Mini color preview in centre */}
            <div style={{
              width: 36, height: 36, borderRadius:'50%',
              backgroundColor: currentHex,
              boxShadow:'inset 0 0 0 2px rgba(255,255,255,0.6), 0 0 0 1px rgba(0,0,0,0.15)',
            }} />
          </div>
          {/* Hue pointer dot */}
          <div style={{
            position:'absolute',
            left: ptrX - 8, top: ptrY - 8,
            width:16, height:16, borderRadius:'50%',
            backgroundColor: `hsl(${h},100%,50%)`,
            border:'2.5px solid #fff',
            boxShadow:'0 0 0 1px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.3)',
            pointerEvents:'none',
          }} />
        </div>
      </div>

      {/* ── Inputs row ── */}
      <div className="flex gap-2">
        {/* Hex input */}
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">HEX</label>
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
            <div className="w-7 h-7 shrink-0 ml-1.5 rounded" style={{ backgroundColor: currentHex }} />
            <input
              value={hexInput}
              onChange={e => setHexInput(e.target.value.toUpperCase())}
              onBlur={e => commitHex(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && commitHex(hexInput)}
              className="flex-1 py-1.5 pr-2 text-sm font-mono text-gray-800 focus:outline-none bg-transparent"
              maxLength={7}
              spellCheck={false}
            />
          </div>
        </div>
        {/* RGB inputs — separate R / G / B */}
        {(['r','g','b'] as const).map(ch => (
          <div key={ch} className="w-16 shrink-0">
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">{ch}</label>
            <input
              type="number" min={0} max={255}
              value={rgbInput[ch]}
              onChange={e => setRgbInput(prev => ({ ...prev, [ch]: e.target.value }))}
              onBlur={e  => commitRgbChannel(ch, e.target.value)}
              onKeyDown={e => e.key === 'Enter' && commitRgbChannel(ch, rgbInput[ch])}
              className="w-full px-2 py-1.5 text-sm font-mono text-gray-800 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
            />
          </div>
        ))}
      </div>

      {/* ── Swatches ── */}
      <div>
        {/* Tab switcher */}
        <div className="flex gap-1 mb-2">
          {(['quick', 'pantone'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === t ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}>
              {t === 'quick' ? 'Quick Picks' : 'Pantone Colors'}
            </button>
          ))}
        </div>

        {activeTab === 'quick' ? (
          <div className="grid grid-cols-9 gap-1.5">
            {QUICK_SWATCHES.map(hex => (
              <button key={hex} onClick={() => { onChange(hex); applyHsv(hexToHsv(hex)); }}
                title={hex}
                className="size-7 rounded-lg transition-all hover:scale-110 hover:shadow-md"
                style={{
                  backgroundColor: hex,
                  outline: currentHex.toLowerCase() === hex.toLowerCase() ? `2px solid ${hex}` : 'none',
                  outlineOffset: 2,
                  boxShadow: currentHex.toLowerCase() === hex.toLowerCase() ? `0 0 0 1px white inset` : undefined,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {PANTONE_SWATCHES.map(p => (
              <button key={p.hex} onClick={() => { onChange(p.hex); applyHsv(hexToHsv(p.hex)); }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors hover:bg-gray-50 ${
                  currentHex.toLowerCase() === p.hex.toLowerCase() ? 'bg-blue-50 ring-1 ring-blue-200' : ''
                }`}>
                <div className="size-6 rounded-md shrink-0 shadow-sm" style={{ backgroundColor: p.hex }} />
                <span className="flex-1 text-left text-gray-700 font-medium truncate">{p.name}</span>
                <span className="font-mono text-gray-400 text-[10px]">{p.hex.toUpperCase()}</span>
                {currentHex.toLowerCase() === p.hex.toLowerCase() && (
                  <Check className="size-3 text-blue-600 shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Types & seed data (hex-based colors)
══════════════════════════════════════════════════════════════ */
type TagScope = 'user' | 'course' | 'automation';

interface AppTag {
  id: string;
  name: string;
  color: string;        // hex string, e.g. '#3b82f6'
  description: string;
  scope: TagScope[];
  userIds: string[];
  createdAt: string;
}

const SEED_TAGS: AppTag[] = [
  { id:'t1',  name:'VIP Client',        color:'#f59e0b', description:'High-value accounts requiring priority support.',       scope:['user'],               userIds:['u1','u3'],        createdAt:'2025-01-10' },
  { id:'t2',  name:'Sales Team',        color:'#8b5cf6', description:'All members of the sales department.',                  scope:['user','automation'],  userIds:['u2','u3','u5'],   createdAt:'2025-01-15' },
  { id:'t3',  name:'New Hire',          color:'#3b82f6', description:'Recently onboarded employees (< 90 days).',             scope:['user'],               userIds:['u4'],             createdAt:'2025-02-01' },
  { id:'t4',  name:'Completed Onboard', color:'#22c55e', description:'Users who finished the onboarding program.',            scope:['user','automation'],  userIds:['u1','u2'],        createdAt:'2025-02-10' },
  { id:'t5',  name:'At Risk',           color:'#ef4444', description:'Users showing low engagement or at churn risk.',        scope:['user','automation'],  userIds:['u5'],             createdAt:'2025-03-01' },
  { id:'t6',  name:'Management',        color:'#6366f1', description:'Team leads and managers across all departments.',       scope:['user'],               userIds:['u1','u6'],        createdAt:'2025-03-05' },
  { id:'t7',  name:'Beta Tester',       color:'#14b8a6', description:'Users enrolled in early-access feature programs.',     scope:['user','course'],      userIds:['u2','u4'],        createdAt:'2025-04-01' },
  { id:'t8',  name:'Featured',          color:'#f97316', description:'Courses promoted on the landing page.',                 scope:['course'],             userIds:[],                 createdAt:'2025-04-10' },
  { id:'t9',  name:'Certification',     color:'#84cc16', description:'Courses that award a completion certificate.',          scope:['course'],             userIds:[],                 createdAt:'2025-04-15' },
  { id:'t10', name:'Inactive',          color:'#64748b', description:'Users with no login activity in the past 60 days.',    scope:['user','automation'],  userIds:['u6','u7'],        createdAt:'2025-05-01' },
  { id:'t11', name:'Enterprise',        color:'#0ea5e9', description:'Users belonging to enterprise-tier accounts.',         scope:['user'],               userIds:['u1','u3','u6'],   createdAt:'2025-05-10' },
  { id:'t12', name:'Needs Approval',    color:'#ec4899', description:'Accounts pending manual review or approval.',          scope:['user','automation'],  userIds:['u8'],             createdAt:'2025-05-15' },
  { id:'t13', name:'Staff',            color:'#10b981', description:'Platform staff and internal team members.',              scope:['user'],               userIds:[],                 createdAt:'2025-05-20' },
];

/* ─── Scope meta ── */
const SCOPE_META: Record<TagScope, { label: string; icon: React.ElementType; color: string }> = {
  user:       { label: 'Users',       icon: Users,    color: 'text-blue-500'   },
  course:     { label: 'Courses',     icon: BookOpen, color: 'text-violet-500' },
  automation: { label: 'Automations', icon: Zap,      color: 'text-amber-500'  },
};

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });

/* ── Tag pill ── */
function TagPill({ name, color }: { name: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={tagStyle(color)}>
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      {name || 'Tag preview'}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════
   Create / Edit Tag Modal
══════════════════════════════════════════════════════════════ */
interface TagModalProps {
  initial?: AppTag | null;
  allTags: AppTag[];
  onClose: () => void;
  onSave: (tag: Omit<AppTag, 'id' | 'createdAt' | 'userIds'>) => void;
}
function TagModal({ initial, allTags, onClose, onSave }: TagModalProps) {
  const [form, setForm] = useState({
    name:        initial?.name        ?? '',
    color:       initial?.color       ?? '#3b82f6',
    description: initial?.description ?? '',
    scope:       initial?.scope       ?? ['user'] as TagScope[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleScope = (s: TagScope) =>
    setForm(f => ({
      ...f,
      scope: f.scope.includes(s) ? f.scope.filter(x => x !== s) : [...f.scope, s],
    }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) { e.name = 'Tag name is required'; }
    else if (allTags.some(t =>
      t.name.toLowerCase() === form.name.trim().toLowerCase() && t.id !== initial?.id
    )) { e.name = 'A tag with this name already exists'; }
    if (form.scope.length === 0) e.scope = 'Select at least one scope';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handle = () => {
    if (validate()) { onSave({ ...form, name: form.name.trim() }); onClose(); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: form.color + '20' }}>
              <Tag className="size-4" style={{ color: form.color }} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">{initial ? 'Edit Tag' : 'Create Tag'}</h2>
              <p className="text-xs text-gray-500 mt-0.5">Apply to users, courses, and automations</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tag Name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. VIP Client"
              maxLength={40}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            {/* Live preview */}
            {form.name && (
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                <span>Preview:</span>
                <TagPill name={form.name} color={form.color} />
              </div>
            )}
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Color</label>
            <ColorPicker
              color={form.color}
              onChange={hex => setForm(f => ({ ...f, color: hex }))}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What is this tag used for?"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Scope */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apply to <span className="text-red-500">*</span>
              <span className="ml-1 text-xs text-gray-400 font-normal">— where this tag can be used</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {(Object.entries(SCOPE_META) as [TagScope, typeof SCOPE_META[TagScope]][]).map(([key, meta]) => {
                const Icon = meta.icon;
                const active = form.scope.includes(key);
                return (
                  <button key={key} onClick={() => toggleScope(key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                      active ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}>
                    <div className={`size-5 rounded flex items-center justify-center ${active ? 'bg-blue-600' : 'border border-gray-300 bg-white'}`}>
                      {active && <Check className="size-3 text-white" />}
                    </div>
                    <Icon className={`size-4 ${active ? meta.color : 'text-gray-400'}`} />
                    {meta.label}
                  </button>
                );
              })}
            </div>
            {errors.scope && <p className="text-xs text-red-500 mt-1">{errors.scope}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={handle}
            className="px-4 py-2 text-sm text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
            style={{ backgroundColor: form.color }}>
            {initial ? 'Save Changes' : 'Create Tag'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Delete Confirm Modal
══════════════════════════════════════════════════════════════ */
interface DeleteModalProps { tag: AppTag; onClose: () => void; onConfirm: () => void; }
function DeleteModal({ tag, onClose, onConfirm }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 bg-red-100 rounded-xl flex items-center justify-center">
            <Trash2 className="size-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Delete Tag</h3>
            <p className="text-xs text-gray-500">This cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Are you sure you want to delete{' '}
          <TagPill name={tag.name} color={tag.color} />?
        </p>
        {tag.userIds.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl mb-4">
            <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Applied to <strong>{tag.userIds.length} user{tag.userIds.length !== 1 ? 's' : ''}</strong>. Deleting will remove it from all of them.
            </p>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Delete Tag</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Tag Card
══════════════════════════════════════════════════════════════ */
interface TagCardProps {
  tag: AppTag; users: User[];
  onEdit: (t: AppTag) => void; onDelete: (t: AppTag) => void; onDuplicate: (t: AppTag) => void;
}
function TagCard({ tag, users, onEdit, onDelete, onDuplicate }: TagCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const taggedUsers = users.filter(u => tag.userIds.includes(u.id));

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow group relative flex flex-col gap-3">
      {/* Colored accent bar */}
      <div className="absolute top-0 left-5 right-5 h-0.5 rounded-b-full opacity-60" style={{ backgroundColor: tag.color }} />

      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mt-1">
        <div className="flex-1 min-w-0"><TagPill name={tag.name} color={tag.color} /></div>
        <div className="relative shrink-0">
          <button onClick={() => setMenuOpen(m => !m)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 transition-all">
            <MoreHorizontal className="size-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 w-40 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                <button onClick={() => { onEdit(tag); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  <Edit2 className="size-3.5" /> Edit
                </button>
                <button onClick={() => { onDuplicate(tag); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  <Copy className="size-3.5" /> Duplicate
                </button>
                <button onClick={() => { onDelete(tag); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                  <Trash2 className="size-3.5" /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Description */}
      {tag.description
        ? <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{tag.description}</p>
        : <p className="text-xs text-gray-300 italic">No description</p>}

      {/* Scope badges */}
      <div className="flex flex-wrap gap-1.5">
        {tag.scope.map(s => {
          const sm = SCOPE_META[s]; const Icon = sm.icon;
          return (
            <span key={s} className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 font-medium">
              <Icon className={`size-3 ${sm.color}`} />{sm.label}
            </span>
          );
        })}
      </div>

      {/* Avatars + edit */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {taggedUsers.length > 0 ? (
            <>
              <div className="flex -space-x-2">
                {taggedUsers.slice(0, 4).map(u => (
                  <div key={u.id} title={u.name}
                    className="size-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold"
                    style={{ backgroundColor: tag.color, color: contrastText(tag.color) }}>
                    {u.name.charAt(0)}
                  </div>
                ))}
                {taggedUsers.length > 4 && (
                  <div className="size-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] text-gray-600 font-medium">
                    +{taggedUsers.length - 4}
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-500">{taggedUsers.length} user{taggedUsers.length !== 1 ? 's' : ''}</span>
            </>
          ) : (
            <span className="text-xs text-gray-400">No users tagged</span>
          )}
        </div>
        <button onClick={() => onEdit(tag)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 transition-all" title="Edit tag">
          <Edit2 className="size-3.5" />
        </button>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">Created {fmt(tag.createdAt)}</span>
        <span className="text-[10px] font-mono text-gray-300">{tag.color.toUpperCase()}</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main Page
══════════════════════════════════════════════════════════════ */
export interface TagsPageProps { users?: User[]; companyId?: string | null; }

export function TagsPage({ users = [], companyId = 'global' }: TagsPageProps) {
  const [tags, setTags] = useState<AppTag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);

  useEffect(() => {
    setTagsLoading(true);
    const prefix = `tag:${companyId}:`;
    supabase
      .from('kv_store_d60f2898')
      .select('value')
      .like('key', `${prefix}%`)
      .then(({ data }) => {
        if (data && data.length > 0) setTags(data.map((r: any) => r.value));
        else setTags(SEED_TAGS); // fallback to seeds if nothing in DB yet
        setTagsLoading(false);
      });
  }, [companyId]);
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'all' | TagScope>('all');
  const [sortBy, setSortBy] = useState<'name' | 'users' | 'created'>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTag, setEditTag] = useState<AppTag | null>(null);
  const [deleteTag, setDeleteTag] = useState<AppTag | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showBulkMenu, setShowBulkMenu] = useState(false);

  const totalUsers = useMemo(() => new Set(tags.flatMap(t => t.userIds)).size, [tags]);
  const withUsers  = tags.filter(t => t.userIds.length > 0).length;

  const filtered = useMemo(() => {
    let list = [...tags];
    if (search) list = list.filter(t =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
    );
    if (scopeFilter !== 'all') list = list.filter(t => t.scope.includes(scopeFilter));
    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name')    cmp = a.name.localeCompare(b.name);
      if (sortBy === 'users')   cmp = b.userIds.length - a.userIds.length;
      if (sortBy === 'created') cmp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [tags, search, scopeFilter, sortBy, sortAsc]);

  const handleSave = async (data: Omit<AppTag, 'id' | 'createdAt' | 'userIds'>) => {
    if (editTag) {
      const savedTag = { ...editTag, ...data };
      setTags(prev => prev.map(t => t.id === editTag.id ? savedTag : t));
      await supabase.from('kv_store_d60f2898').upsert({ key: `tag:${companyId}:${savedTag.id}`, value: savedTag });
    } else {
      const savedTag: AppTag = {
        ...data, id: `t-${Date.now()}`,
        createdAt: new Date().toISOString().slice(0, 10), userIds: [],
      };
      setTags(prev => [savedTag, ...prev]);
      await supabase.from('kv_store_d60f2898').upsert({ key: `tag:${companyId}:${savedTag.id}`, value: savedTag });
    }
    setEditTag(null);
  };

  const handleDelete = async (tag: AppTag) => {
    setTags(prev => prev.filter(t => t.id !== tag.id));
    setSelected(s => { const n = new Set(s); n.delete(tag.id); return n; });
    setDeleteTag(null);
    await supabase.from('kv_store_d60f2898').delete().eq('key', `tag:${companyId}:${tag.id}`);
  };

  const handleDuplicate = async (tag: AppTag) => {
    const dupTag: AppTag = {
      ...tag, id: `t-${Date.now()}`,
      name: `${tag.name} (Copy)`,
      createdAt: new Date().toISOString().slice(0, 10), userIds: [],
    };
    setTags(prev => [dupTag, ...prev]);
    await supabase.from('kv_store_d60f2898').upsert({ key: `tag:${companyId}:${dupTag.id}`, value: dupTag });
  };

  const toggleSelect = (id: string) =>
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleSelectAll = () =>
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(t => t.id)));

  const cycleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortAsc(a => !a);
    else { setSortBy(col); setSortAsc(true); }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Tags</h1>
            <p className="text-sm text-gray-500 mt-0.5">Organise users, courses and automations with reusable labels</p>
          </div>
          <button onClick={() => { setEditTag(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
            <Plus className="size-4" /> Create Tag
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label:'Total Tags',           value: tags.length,                                   icon: Tag,      color:'text-blue-600',    bg:'bg-blue-50'    },
            { label:'In Use',               value: withUsers,                                     icon: Hash,     color:'text-violet-600',  bg:'bg-violet-50'  },
            { label:'Tagged Users',         value: totalUsers,                                    icon: Users,    color:'text-emerald-600', bg:'bg-emerald-50' },
            { label:'Used in Automations',  value: tags.filter(t=>t.scope.includes('automation')).length, icon: Zap, color:'text-amber-600', bg:'bg-amber-50'  },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
                <div className={`size-10 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon className={`size-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-8 py-3 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tags…"
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-1">
          {([['all','All'],['user','Users'],['course','Courses'],['automation','Automations']] as const).map(([val,lbl]) => (
            <button key={val} onClick={() => setScopeFilter(val)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                scopeFilter === val ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {val==='user'&&<Users className="size-3"/>}{val==='course'&&<BookOpen className="size-3"/>}{val==='automation'&&<Zap className="size-3"/>}
              {lbl}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 ml-auto text-xs text-gray-500">
          <span className="font-medium">Sort:</span>
          {(['name','users','created'] as const).map(col => (
            <button key={col} onClick={() => cycleSort(col)}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors capitalize ${
                sortBy===col ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-500'}`}>
              {col==='users'?'Usage':col}{sortBy===col?(sortAsc?' ↑':' ↓'):''}
            </button>
          ))}
        </div>
        {selected.size > 0 && (
          <div className="relative">
            <button onClick={() => setShowBulkMenu(m => !m)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-gray-800 text-white rounded-lg hover:bg-gray-700">
              {selected.size} selected <ChevronDown className="size-3.5" />
            </button>
            {showBulkMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowBulkMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-40 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  <button onClick={() => { setTags(prev => prev.filter(t => !selected.has(t.id))); setSelected(new Set()); setShowBulkMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                    <Trash2 className="size-3.5" /> Delete All
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="size-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Tag className="size-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-600 mb-1">No tags found</h3>
            <p className="text-sm text-gray-400 max-w-xs mb-4">
              {search || scopeFilter !== 'all' ? 'Try adjusting your search or filter.' : 'Create your first tag to start organising users and courses.'}
            </p>
            {!search && scopeFilter === 'all' && (
              <button onClick={() => { setEditTag(null); setShowModal(true); }}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700">
                <Plus className="size-4" /> Create Tag
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
              <button onClick={toggleSelectAll}
                className={`size-4 rounded border-2 flex items-center justify-center transition-colors ${
                  selected.size===filtered.length && filtered.length>0 ? 'border-blue-600 bg-blue-600' : 'border-gray-300 hover:border-blue-400'}`}>
                {selected.size===filtered.length && filtered.length>0 && <Check className="size-3 text-white" />}
              </button>
              <span>{filtered.length} tag{filtered.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(tag => (
                <div key={tag.id} className="relative group">
                  <button onClick={() => toggleSelect(tag.id)}
                    className={`absolute top-3 left-3 z-10 size-4 rounded border-2 flex items-center justify-center transition-all ${
                      selected.has(tag.id) ? 'border-blue-600 bg-blue-600 opacity-100' : 'border-gray-300 opacity-0 group-hover:opacity-100 bg-white'}`}>
                    {selected.has(tag.id) && <Check className="size-3 text-white" />}
                  </button>
                  <TagCard tag={tag} users={users}
                    onEdit={t => { setEditTag(t); setShowModal(true); }}
                    onDelete={setDeleteTag} onDuplicate={handleDuplicate} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showModal && (
        <TagModal initial={editTag} allTags={tags}
          onClose={() => { setShowModal(false); setEditTag(null); }}
          onSave={handleSave} />
      )}
      {deleteTag && (
        <DeleteModal tag={deleteTag} onClose={() => setDeleteTag(null)} onConfirm={() => handleDelete(deleteTag)} />
      )}
    </div>
  );
}
