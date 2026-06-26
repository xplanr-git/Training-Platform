import { useState, useMemo, useEffect } from 'react';
import { supabase } from '/utils/supabase/client';
import {
  Users, Plus, Search, X, Edit2, Trash2, ChevronDown, Check,
  Mail, BookOpen, UserPlus, MoreHorizontal, Building2, Tag,
  ArrowLeft, Users2, Shield, Bell, BookX, Ban,
} from 'lucide-react';
import { User } from '@/app/types';

interface Group {
  id: string;
  name: string;
  description: string;
  color: string;
  memberIds: string[];
  createdAt: string;
}

const GROUP_COLORS = [
  { id: 'blue',   bg: 'bg-blue-500',   light: 'bg-blue-50',   text: 'text-blue-700',   ring: 'ring-blue-400' },
  { id: 'green',  bg: 'bg-green-500',  light: 'bg-green-50',  text: 'text-green-700',  ring: 'ring-green-400' },
  { id: 'violet', bg: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-400' },
  { id: 'orange', bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-400' },
  { id: 'teal',   bg: 'bg-teal-500',   light: 'bg-teal-50',   text: 'text-teal-700',   ring: 'ring-teal-400' },
  { id: 'rose',   bg: 'bg-rose-500',   light: 'bg-rose-50',   text: 'text-rose-700',   ring: 'ring-rose-400' },
];

const colorMeta = (id: string) => GROUP_COLORS.find(c => c.id === id) ?? GROUP_COLORS[0];

const BULK_ACTIONS = [
  { key: 'enroll',            label: 'Enroll in Course',     icon: BookOpen },
  { key: 'unenroll',          label: 'Unenroll from Course', icon: BookX    },
  { key: 'send-email',        label: 'Send Email',           icon: Mail     },
  { key: 'resend-activation', label: 'Resend Activation',    icon: Bell     },
  { key: 'suspend',           label: 'Suspend All',          icon: Ban      },
  { key: 'tag',               label: 'Apply Tag',            icon: Tag      },
] as const;

const defaultGroup = (): Omit<Group, 'id' | 'createdAt'> => ({
  name: '', description: '', color: 'blue', memberIds: [],
});

interface UserGroupsPageProps {
  users?: User[];
  companyId?: string | null;
}

export function UserGroupsPage({ users = [], companyId = 'global' }: UserGroupsPageProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);

  useEffect(() => {
    setGroupsLoading(true);
    supabase.from('kv_store_d60f2898').select('value').like('key', `user-group:${companyId}:%`)
      .then(({ data }) => {
        if (data && data.length > 0) setGroups(data.map((r: any) => r.value));
        setGroupsLoading(false);
      });
  }, [companyId]);

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchGroups, setSearchGroups]   = useState('');
  const [searchMembers, setSearchMembers] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal]   = useState(false);
  const [editingGroup, setEditingGroup]         = useState<Group | null>(null);
  const [deleteConfirm, setDeleteConfirm]       = useState<Group | null>(null);
  const [showAddMembers, setShowAddMembers]     = useState(false);
  const [showBulkMenu, setShowBulkMenu]         = useState(false);
  const [bulkAction, setBulkAction]             = useState<string | null>(null);
  const [bulkActionInput, setBulkActionInput]   = useState('');
  const [menuOpen, setMenuOpen]                 = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState(defaultGroup());

  // Derived
  const filteredGroups = useMemo(() =>
    groups.filter(g => !searchGroups || g.name.toLowerCase().includes(searchGroups.toLowerCase()) || g.description.toLowerCase().includes(searchGroups.toLowerCase())),
    [groups, searchGroups]);

  const groupMembers = useMemo(() =>
    selectedGroup ? users.filter(u => selectedGroup.memberIds.includes(u.id)) : [],
    [selectedGroup, users]);

  const filteredMembers = useMemo(() =>
    groupMembers.filter(u => !searchMembers || u.name.toLowerCase().includes(searchMembers.toLowerCase()) || u.email.toLowerCase().includes(searchMembers.toLowerCase())),
    [groupMembers, searchMembers]);

  const nonMembers = useMemo(() =>
    selectedGroup ? users.filter(u => !selectedGroup.memberIds.includes(u.id)) : [],
    [selectedGroup, users]);

  // Handlers
  const openCreate = () => { setForm(defaultGroup()); setEditingGroup(null); setShowCreateModal(true); };
  const openEdit   = (g: Group) => { setForm({ name: g.name, description: g.description, color: g.color, memberIds: g.memberIds }); setEditingGroup(g); setShowCreateModal(true); setMenuOpen(null); };

  const saveGroup = async () => {
    if (!form.name.trim()) return;
    if (editingGroup) {
      const updated = { ...editingGroup, ...form };
      setGroups(gs => gs.map(g => g.id === editingGroup.id ? updated : g));
      if (selectedGroup?.id === editingGroup.id) setSelectedGroup(updated);
      await supabase.from('kv_store_d60f2898').upsert({ key: `user-group:${companyId}:${updated.id}`, value: updated });
    } else {
      const ng: Group = { id: `group-${Date.now()}`, ...form, createdAt: new Date().toISOString().split('T')[0] };
      setGroups(gs => [ng, ...gs]);
      await supabase.from('kv_store_d60f2898').upsert({ key: `user-group:${companyId}:${ng.id}`, value: ng });
    }
    setShowCreateModal(false);
  };

  const deleteGroup = async (g: Group) => {
    setGroups(gs => gs.filter(x => x.id !== g.id));
    if (selectedGroup?.id === g.id) setSelectedGroup(null);
    setDeleteConfirm(null);
    setMenuOpen(null);
    await supabase.from('kv_store_d60f2898').delete().eq('key', `user-group:${companyId}:${g.id}`);
  };

  const removeMember = async (userId: string) => {
    if (!selectedGroup) return;
    const updated = { ...selectedGroup, memberIds: selectedGroup.memberIds.filter(id => id !== userId) };
    setGroups(gs => gs.map(g => g.id === selectedGroup.id ? updated : g));
    setSelectedGroup(updated);
    await supabase.from('kv_store_d60f2898').upsert({ key: `user-group:${companyId}:${updated.id}`, value: updated });
  };

  const addMembers = async (ids: string[]) => {
    if (!selectedGroup) return;
    const updated = { ...selectedGroup, memberIds: [...new Set([...selectedGroup.memberIds, ...ids])] };
    setGroups(gs => gs.map(g => g.id === selectedGroup.id ? updated : g));
    setSelectedGroup(updated);
    setShowAddMembers(false);
    await supabase.from('kv_store_d60f2898').upsert({ key: `user-group:${companyId}:${updated.id}`, value: updated });
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">

      {/* ── Two-panel layout ── */}
      <div className="flex gap-6 h-full">

        {/* LEFT — Groups list */}
        <div className={`flex flex-col gap-4 ${selectedGroup ? 'w-80 shrink-0' : 'flex-1'}`}>

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Groups</h1>
              <p className="text-sm text-gray-500 mt-0.5">Organise users into groups for bulk management</p>
            </div>
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shrink-0">
              <Plus className="size-4" /> New Group
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input type="text" placeholder="Search groups…" value={searchGroups}
              onChange={e => setSearchGroups(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            {searchGroups && <button onClick={() => setSearchGroups('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="size-3.5" /></button>}
          </div>

          {/* Groups */}
          {menuOpen && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}
          <div className="space-y-2">
            {filteredGroups.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-100 py-14 text-center">
                <Users2 className="size-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No groups yet. Create your first group!</p>
              </div>
            )}
            {filteredGroups.map(g => {
              const cm = colorMeta(g.color);
              const isSelected = selectedGroup?.id === g.id;
              return (
                <div key={g.id}
                  onClick={() => { setSelectedGroup(isSelected ? null : g); setSearchMembers(''); }}
                  className={`bg-white rounded-xl border transition-all cursor-pointer p-4 flex items-center gap-4 ${isSelected ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}>
                  {/* Color dot + initials */}
                  <div className={`w-10 h-10 rounded-xl ${cm.bg} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                    {g.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{g.name}</p>
                    <p className="text-xs text-gray-500 truncate">{g.description}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cm.light} ${cm.text}`}>
                        {g.memberIds.length} {g.memberIds.length === 1 ? 'member' : 'members'}
                      </span>
                      <span className="text-xs text-gray-400">{g.createdAt}</span>
                    </div>
                  </div>
                  {/* Menu */}
                  <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setMenuOpen(menuOpen === g.id ? null : g.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreHorizontal className="size-4" />
                    </button>
                    {menuOpen === g.id && (
                      <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                        <button onClick={() => openEdit(g)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
                          <Edit2 className="size-3.5" /> Edit Group
                        </button>
                        <button onClick={() => { setSelectedGroup(g); setShowAddMembers(true); setMenuOpen(null); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
                          <UserPlus className="size-3.5" /> Add Members
                        </button>
                        <button onClick={() => { setDeleteConfirm(g); setMenuOpen(null); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-600 hover:bg-red-50 border-t border-gray-100 mt-1">
                          <Trash2 className="size-3.5" /> Delete Group
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Group detail */}
        {selectedGroup && (() => {
          const cm = colorMeta(selectedGroup.color);
          return (
            <div className="flex-1 flex flex-col gap-4 min-w-0">

              {/* Detail header */}
              <div className={`bg-white rounded-xl border border-gray-100 p-5`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl ${cm.bg} flex items-center justify-center text-white text-2xl font-bold shrink-0`}>
                    {selectedGroup.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-gray-900">{selectedGroup.name}</h2>
                    <p className="text-sm text-gray-500">{selectedGroup.description}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cm.light} ${cm.text}`}>
                        {selectedGroup.memberIds.length} members
                      </span>
                      <span className="text-xs text-gray-400">Created {selectedGroup.createdAt}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Bulk Action */}
                    <div className="relative">
                      <button onClick={() => setShowBulkMenu(v => !v)}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-sm font-medium transition-colors">
                        Bulk Action <ChevronDown className="size-3.5" />
                      </button>
                      {showBulkMenu && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowBulkMenu(false)} />
                          <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                            {BULK_ACTIONS.map(({ key, label, icon: Icon }) => (
                              <button key={key}
                                onClick={() => { setBulkAction(key); setBulkActionInput(''); setShowBulkMenu(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                <Icon className="size-4 text-gray-500 shrink-0" /> {label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    <button onClick={() => setShowAddMembers(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
                      <UserPlus className="size-4" /> Add Members
                    </button>
                    <button onClick={() => openEdit(selectedGroup)}
                      className="p-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors">
                      <Edit2 className="size-4" />
                    </button>
                    <button onClick={() => setSelectedGroup(null)}
                      className="p-2 border border-gray-200 text-gray-400 rounded-lg hover:bg-gray-50 transition-colors">
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Members search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input type="text" placeholder="Search members…" value={searchMembers}
                  onChange={e => setSearchMembers(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                {searchMembers && <button onClick={() => setSearchMembers('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="size-3.5" /></button>}
              </div>

              {/* Members table */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden flex-1">
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Members</p>
                  <p className="text-xs text-gray-400">{filteredMembers.length} shown</p>
                </div>
                {filteredMembers.length === 0 ? (
                  <div className="py-16 text-center">
                    <Users className="size-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">No members yet — add some!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {filteredMembers.map(user => (
                      <div key={user.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors group">
                        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2">
                          {user.company && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Building2 className="size-3" /> {user.company}
                            </span>
                          )}
                        </div>
                        {user.role && (
                          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium hidden md:block">
                            {user.role}
                          </span>
                        )}
                        <button onClick={() => removeMember(user.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                          title="Remove from group">
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Create / Edit Group Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Users2 className="size-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">{editingGroup ? 'Edit Group' : 'New Group'}</h2>
                  <p className="text-xs text-gray-500">{editingGroup ? 'Update group details' : 'Create a new user group'}</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="size-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Group Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. TechCorp Solutions, Onboarding Cohort"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="What is this group for?"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Group Colour</label>
                <div className="flex gap-2.5">
                  {GROUP_COLORS.map(c => (
                    <button key={c.id} type="button" onClick={() => setForm(f => ({ ...f, color: c.id }))}
                      className={`w-8 h-8 rounded-full ${c.bg} transition-all ${form.color === c.id ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`} />
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button disabled={!form.name.trim()} onClick={saveGroup}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                <Check className="size-4" /> {editingGroup ? 'Save Changes' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Members Modal ── */}
      {showAddMembers && selectedGroup && (
        <AddMembersModal
          nonMembers={nonMembers}
          groupName={selectedGroup.name}
          onAdd={addMembers}
          onClose={() => setShowAddMembers(false)}
        />
      )}

      {/* ── Delete Confirm ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
                <Trash2 className="size-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Delete Group</h2>
                <p className="text-xs text-gray-500">This cannot be undone</p>
              </div>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete <span className="font-semibold">"{deleteConfirm.name}"</span>? Members will not be deleted — only the group.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => deleteGroup(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-2">
                <Trash2 className="size-4" /> Delete Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Action Modal ── */}
      {bulkAction && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {(() => {
              const action = BULK_ACTIONS.find(a => a.key === bulkAction);
              if (!action) return null;
              const Icon = action.icon;
              return (
                <>
                  <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Icon className="size-5 text-gray-700" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-gray-900">{action.label}</h2>
                        <p className="text-xs text-gray-500">Applies to all {selectedGroup.memberIds.length} members of <span className="font-medium">{selectedGroup.name}</span></p>
                      </div>
                    </div>
                    <button onClick={() => setBulkAction(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                      <X className="size-5 text-gray-400" />
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    {bulkAction === 'enroll' || bulkAction === 'unenroll' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Course Name / ID</label>
                        <input type="text" value={bulkActionInput} onChange={e => setBulkActionInput(e.target.value)}
                          placeholder="Enter course name or ID"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    ) : bulkAction === 'tag' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tag Name</label>
                        <input type="text" value={bulkActionInput} onChange={e => setBulkActionInput(e.target.value)}
                          placeholder="e.g. VIP, Onboarding, Enterprise"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    ) : bulkAction === 'send-email' ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                          <input type="text" value={bulkActionInput} onChange={e => setBulkActionInput(e.target.value)}
                            placeholder="Email subject…"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                          <textarea rows={4} placeholder="Write your message…"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                        This action will apply to all <strong>{selectedGroup.memberIds.length} members</strong> of <strong>{selectedGroup.name}</strong>. Are you sure?
                      </div>
                    )}
                  </div>
                  <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={() => setBulkAction(null)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                      Cancel
                    </button>
                    <button onClick={() => { alert(`"${action.label}" applied to all members of "${selectedGroup.name}".`); setBulkAction(null); setBulkActionInput(''); }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
                      <Icon className="size-4" /> Apply
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-component: Add Members Modal ── */
function AddMembersModal({ nonMembers, groupName, onAdd, onClose }: {
  nonMembers: User[];
  groupName: string;
  onAdd: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = nonMembers.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(s => s.size === filtered.length ? new Set() : new Set(filtered.map(u => u.id)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Add Members</h2>
            <p className="text-xs text-gray-500">Add users to <span className="font-medium">{groupName}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="size-5 text-gray-400" /></button>
        </div>
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input type="text" placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        {/* Select all */}
        <div className="px-5 py-2 border-b border-gray-50 flex items-center justify-between">
          <button onClick={toggleAll} className="text-xs text-blue-600 hover:underline font-medium">
            {selected.size === filtered.length && filtered.length > 0 ? 'Deselect All' : 'Select All'}
          </button>
          <p className="text-xs text-gray-400">{selected.size} selected</p>
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No users available to add.</p>
          ) : filtered.map(user => {
            const isSelected = selected.has(user.id);
            return (
              <div key={user.id} onClick={() => toggle(user.id)}
                className={`flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-blue-50/40 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                  {isSelected && <Check className="size-3 text-white" />}
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                {user.role && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full shrink-0">{user.role}</span>}
              </div>
            );
          })}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button disabled={selected.size === 0} onClick={() => onAdd(Array.from(selected))}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
            <UserPlus className="size-4" /> Add {selected.size > 0 ? selected.size : ''} Member{selected.size !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
