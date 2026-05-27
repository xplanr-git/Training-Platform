import { useState, useRef, useEffect, type ElementType, type ReactNode } from 'react';
import { courses as platformCourses } from '@/app/data/courses';
import {
  MessageSquare, Mail, Send, Inbox, Search, Filter, Plus, MoreVertical, Star,
  Trash2, Archive, Check, Bell, Smartphone, UserPlus, Award, CalendarClock,
  RefreshCw, Lock, Hash, BookOpen, AtSign, MessageCircle, Heart, Settings, Eye,
  Download, ChevronDown, ChevronUp, Image, FileText, BarChart2, Smile, Type, LayoutGrid,
  HelpCircle, ArrowUp, AlertTriangle, ListTodo, MailOpen, Pencil, X, Copy,
  ShoppingCart, Megaphone, Tag, CreditCard, Share2,
  GraduationCap, Users, LogIn, ShieldAlert, UserCheck, KeyRound, Gift as GiftIcon,
  RotateCcw, BadgeCheck, Repeat, XCircle, AlertCircle, UserCog, Handshake,
  Bold, Italic, Underline, Strikethrough, Link, List, ListOrdered, Quote, Code, FileCode, MoreHorizontal, Upload, Clock, Video, Mic, Zap,
} from 'lucide-react';
import { User } from '@/app/types';

interface AdminCommunicationsPageProps {
  users: User[];
  currentSubPage?: string;
  onNavigate?: (page: 'admin' | 'admin-courses' | 'user-management' | 'admin-analytics' | 'admin-communications' | 'admin-settings') => void;
  onSubPageChange?: (subPage: string) => void;
}

export function AdminCommunicationsPage({ users, currentSubPage, onNavigate, onSubPageChange }: AdminCommunicationsPageProps) {
  // Community subpage gets its own full-page UI
  if (currentSubPage === 'community') {
    return <CommunityPage onNavigate={onNavigate} onSubPageChange={onSubPageChange} />;
  }

  const activeTab: 'inbox' | 'mass-emails' | 'compose' | 'templates' | 'push' | 'school-emails' =
    currentSubPage === 'email-templates'    ? 'templates'     :
    currentSubPage === 'send-email'         ? 'compose'       :
    currentSubPage === 'push-notifications' ? 'push'          :
    currentSubPage === 'mass-emails'        ? 'mass-emails'   :
    currentSubPage === 'school-emails'      ? 'school-emails' :
    'inbox';

  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [emailSubject, setEmailSubject]               = useState('');
  const [emailBody, setEmailBody]                     = useState('');
  const [searchQuery, setSearchQuery]                 = useState('');
  const [schoolTab, setSchoolTab] = useState<'admin' | 'learner' | 'signature'>('admin');

  type InboxMessage = {
    id: string; from: string; fromName: string; subject: string;
    preview: string; body: string; timestamp: string;
    isRead: boolean; isStarred: boolean; isArchived: boolean;
  };
  const [inboxMessages, setInboxMessages] = useState<InboxMessage[]>([
    { id: '1', fromName: 'Sarah Johnson', from: 'sarah.johnson@example.com', subject: 'Question about React Advanced course', preview: 'Hi, I have a question about the assignments in module 3...', body: 'Hi,\n\nI have a question about the assignments in module 3 of the React Advanced course. The instructions say to submit a pull request but I cannot find where to do that.\n\nCould you please clarify the submission process?\n\nThanks,\nSarah', timestamp: '2 hours ago', isRead: false, isStarred: true,  isArchived: false },
    { id: '2', fromName: 'Mike Chen',     from: 'mike.chen@example.com',     subject: 'Certificate request',                  preview: 'Could you please send me the completion certificate for...', body: 'Hello,\n\nI completed the JavaScript Fundamentals course last week but have not yet received my certificate. Could you please check on this and send it through when possible?\n\nMy completion date was 14 May 2026.\n\nBest,\nMike', timestamp: '5 hours ago', isRead: true,  isStarred: false, isArchived: false },
    { id: '3', fromName: 'Emma Davis',    from: 'emma.davis@example.com',    subject: 'Course enrollment issue',              preview: 'I am having trouble enrolling in the Python course. Can you help?', body: "Hi there,\n\nI'm having trouble enrolling in the Python for Data Science course. When I click 'Enroll' I get an error message saying 'Access denied'. I've tried on two different browsers and the issue persists.\n\nPlease help!\nEmma", timestamp: '1 day ago',   isRead: false, isStarred: false, isArchived: false },
    { id: '4', fromName: 'John Smith',    from: 'john.smith@example.com',    subject: 'Thank you!',                           preview: 'Just wanted to say thanks for the excellent course content...', body: "Hi,\n\nJust wanted to drop a quick note to say thank you for the excellent course content. The instructors are fantastic and the platform is really intuitive.\n\nI've already recommended it to three colleagues.\n\nKind regards,\nJohn", timestamp: '2 days ago',  isRead: true,  isStarred: true,  isArchived: false },
    { id: '5', fromName: 'Priya Nair',    from: 'priya.nair@example.com',    subject: 'Bulk enrollment for new hires',        preview: 'We are onboarding 12 new staff next month and would like...', body: "Hi,\n\nWe are onboarding 12 new staff members next month and I'd like to enroll them all into the Onboarding Essentials course at the same time. Is there a bulk import option or CSV upload I can use?\n\nLet me know how to proceed.\n\nPriya", timestamp: '3 days ago',  isRead: true,  isStarred: false, isArchived: false },
    { id: '6', fromName: 'Tom Walsh',     from: 'tom.walsh@example.com',     subject: 'Video not loading on Module 5',        preview: 'The video on lesson 3 of module 5 just spins and never...', body: "Hello support,\n\nThe video on lesson 3 of module 5 in the Leadership Essentials course just spins and never loads. I've waited several minutes and tried refreshing. Other videos work fine.\n\nBrowser: Chrome 124 on Windows 11.\n\nThanks,\nTom", timestamp: '4 days ago',  isRead: false, isStarred: false, isArchived: false },
  ]);

  const [inboxFolder,  setInboxFolder]  = useState<'all' | 'unread' | 'starred' | 'archived'>('all');
  const [selectedMsg,  setSelectedMsg]  = useState<InboxMessage | null>(null);
  const [replyText,       setReplyText]       = useState('');
  const [replySent,       setReplySent]       = useState(false);
  const [inboxSearch,     setInboxSearch]     = useState('');
  const [msgMenuId,       setMsgMenuId]       = useState<string | null>(null);
  const [showFormatting,   setShowFormatting]   = useState(true);
  const [showReplyEmoji,   setShowReplyEmoji]   = useState(false);
  const [showAttachMenu,   setShowAttachMenu]   = useState(false);
  const [showMoreMenu,     setShowMoreMenu]     = useState(false);
  const [emojiCat,        setEmojiCat]        = useState('Smileys');
  const [emojiSearch,     setEmojiSearch]     = useState('');
  const replyEditorRef  = useRef<HTMLDivElement>(null);
  const replyEmojiBtnRef = useRef<HTMLButtonElement>(null);
  const [emojiPickerPos, setEmojiPickerPos] = useState<{ top: number; left: number } | null>(null);

  const markRead = (id: string) =>
    setInboxMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
  const markUnread = (id: string) =>
    setInboxMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: false } : m));
  const toggleStar = (id: string) =>
    setInboxMessages(prev => prev.map(m => m.id === id ? { ...m, isStarred: !m.isStarred } : m));
  const archiveMsg = (id: string) => {
    setInboxMessages(prev => prev.map(m => m.id === id ? { ...m, isArchived: true } : m));
    if (selectedMsg?.id === id) setSelectedMsg(null);
  };
  const deleteMsg = (id: string) => {
    setInboxMessages(prev => prev.filter(m => m.id !== id));
    if (selectedMsg?.id === id) setSelectedMsg(null);
  };
  const handleOpenMsg = (msg: InboxMessage) => {
    setSelectedMsg(msg);
    setReplyText('');
    setReplySent(false);
    markRead(msg.id);
    setTimeout(() => { if (replyEditorRef.current) replyEditorRef.current.innerHTML = ''; }, 0);
  };
  const handleSendReply = () => {
    const html = replyEditorRef.current?.innerHTML ?? '';
    const text = replyEditorRef.current?.innerText?.trim() ?? '';
    if (!text) return;
    setReplySent(true);
    setReplyText('');
    if (replyEditorRef.current) replyEditorRef.current.innerHTML = '';
  };
  const execReplyCmd = (cmd: string, value?: string) => {
    replyEditorRef.current?.focus();
    document.execCommand(cmd, false, value);
    setReplyText(replyEditorRef.current?.innerText ?? '');
  };
  const insertReplyLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) execReplyCmd('createLink', url);
  };
  const insertReplyCodeBlock = () => {
    replyEditorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const pre = document.createElement('pre');
    pre.style.cssText = 'background:#f3f4f6;border-radius:6px;padding:10px 12px;font-family:monospace;font-size:0.8rem;margin:4px 0;white-space:pre-wrap;';
    const code = document.createElement('code');
    code.textContent = sel.toString() || ' ';
    pre.appendChild(code);
    range.deleteContents();
    range.insertNode(pre);
    range.setStartAfter(pre);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    setReplyText(replyEditorRef.current?.innerText ?? '');
  };

  const visibleMessages = inboxMessages.filter(m => {
    if (inboxFolder === 'unread')   return !m.isRead    && !m.isArchived;
    if (inboxFolder === 'starred')  return  m.isStarred && !m.isArchived;
    if (inboxFolder === 'archived') return  m.isArchived;
    return !m.isArchived;
  }).filter(m =>
    !inboxSearch ||
    m.fromName.toLowerCase().includes(inboxSearch.toLowerCase()) ||
    m.subject.toLowerCase().includes(inboxSearch.toLowerCase()) ||
    m.preview.toLowerCase().includes(inboxSearch.toLowerCase())
  );

  const unreadCount = inboxMessages.filter(m => !m.isRead && !m.isArchived).length;

  const emailTemplates = [
    { id: '1', name: 'Welcome Email',        subject: 'Welcome to Outdure Edge!',                          body: 'Dear {{name}},\n\nWelcome to Outdure Edge! We are excited to have you join our learning community...', category: 'Onboarding'   },
    { id: '2', name: 'Course Completion',    subject: 'Congratulations on completing {{course_name}}!',    body: 'Dear {{name}},\n\nCongratulations on successfully completing {{course_name}}! Your certificate is attached...', category: 'Achievements' },
    { id: '3', name: 'Payment Confirmation', subject: 'Payment Received - Invoice #{{invoice_number}}',    body: 'Dear {{name}},\n\nThank you for your payment. This email confirms that we have received your payment...', category: 'Billing'      },
    { id: '4', name: 'Course Reminder',      subject: "Don't forget to continue your learning!",           body: "Dear {{name}},\n\nWe noticed you haven't logged in for a while. Your courses are waiting for you...", category: 'Engagement'   },
  ];

  const handleRecipientToggle = (userId: string) => {
    setSelectedRecipients(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllUsers = () => {
    setSelectedRecipients(selectedRecipients.length === users.length ? [] : users.map(u => u.id));
  };

  const handleSendEmail = () => {
    alert(`Email sent to ${selectedRecipients.length} recipient(s)!\n\nSubject: ${emailSubject}\n\nThis is a demo - no actual emails were sent.`);
    setEmailSubject('');
    setEmailBody('');
    setSelectedRecipients([]);
  };

  const handleUseTemplate = (template: typeof emailTemplates[0]) => {
    setEmailSubject(template.subject);
    setEmailBody(template.body);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {activeTab === 'inbox'         ? 'Inbox'              :
           activeTab === 'mass-emails'  ? 'Mass Emails'        :
           activeTab === 'compose'      ? 'Send Email'         :
           activeTab === 'templates'    ? 'Email Templates'    :
           activeTab === 'push'         ? 'Push Notifications' :
           activeTab === 'school-emails'? 'School Emails'      :
           'Communications'}
        </h1>
        <p className="text-gray-600">
          {activeTab === 'inbox'         ? 'Read and reply to messages from your users'              :
           activeTab === 'mass-emails'  ? 'Create and send broadcast email campaigns to your users' :
           activeTab === 'compose'      ? 'Compose and send emails to your users'                   :
           activeTab === 'templates'    ? 'Manage reusable email templates'                         :
           activeTab === 'push'         ? 'Send push notifications to your users'                   :
           activeTab === 'school-emails'? 'Set up automatic email notifications to alert your users when specific events occur in your school.' :
           'Send messages and manage communications with users'}
        </p>

        {/* School Emails — settings tab bar lives in the header */}
        {activeTab === 'school-emails' && (
          <div className="flex items-center gap-1 mt-4 -mb-6 -mx-6 px-6 border-t border-gray-100 pt-4">
            {([
              { key: 'admin',     label: 'Admin settings'  },
              { key: 'learner',   label: 'Learner settings' },
              { key: 'signature', label: 'Email signature'  },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setSchoolTab(t.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${schoolTab === t.key ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        {activeTab === 'push' && <PushNotificationsTab />}
        {activeTab === 'school-emails' && <SchoolEmailsTab mainTab={schoolTab} />}

        {activeTab === 'inbox' && (
          <div className="flex h-[calc(100vh-220px)] min-h-[500px]">
            {/* ── Left panel: folder list + message list ── */}
            <div className={`flex flex-col border-r border-gray-200 ${selectedMsg ? 'hidden lg:flex w-80 shrink-0' : 'flex flex-1 lg:flex-none lg:w-80 lg:shrink-0'}`}>
              {/* Search */}
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input
                    type="text" value={inboxSearch} onChange={e => setInboxSearch(e.target.value)}
                    placeholder="Search messages…"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              {/* Folder tabs */}
              <div className="flex border-b border-gray-100 px-3 pt-2 gap-1">
                {([
                  { key: 'all',      label: 'All'      },
                  { key: 'unread',   label: 'Unread',  badge: unreadCount },
                  { key: 'starred',  label: 'Starred'  },
                  { key: 'archived', label: 'Archived' },
                ] as const).map(f => (
                  <button key={f.key} onClick={() => { setInboxFolder(f.key); setSelectedMsg(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-t-md border-b-2 transition-colors ${inboxFolder === f.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    {f.label}
                    {'badge' in f && f.badge > 0 && (
                      <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full leading-none">{f.badge}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Message list */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {visibleMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                    <MailOpen className="size-10 text-gray-300 mb-3" />
                    <p className="text-sm font-medium text-gray-500">No messages</p>
                    <p className="text-xs text-gray-400 mt-1">{inboxFolder === 'archived' ? 'Nothing archived yet' : inboxFolder === 'starred' ? 'No starred messages' : inboxFolder === 'unread' ? 'All caught up!' : 'Your inbox is empty'}</p>
                  </div>
                ) : visibleMessages.map(msg => (
                  <div key={msg.id} className={`relative group/msgrow transition-colors ${selectedMsg?.id === msg.id ? 'bg-blue-50' : ''} ${!msg.isRead ? 'bg-blue-50/40' : ''} hover:bg-gray-50`}>
                    {/* Clickable message area */}
                    <button onClick={() => handleOpenMsg(msg)} className="w-full text-left px-4 py-3 pr-10">
                      <div className="flex items-start gap-2">
                        <div className={`mt-1.5 size-2 rounded-full shrink-0 ${!msg.isRead ? 'bg-blue-500' : 'bg-transparent'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm truncate ${!msg.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{msg.fromName}</span>
                            <span className="text-[10px] text-gray-400 shrink-0">{msg.timestamp}</span>
                          </div>
                          <p className={`text-xs truncate mt-0.5 ${!msg.isRead ? 'font-medium text-gray-800' : 'text-gray-600'}`}>{msg.subject}</p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">{msg.preview}</p>
                        </div>
                        {msg.isStarred && <Star className="size-3.5 fill-yellow-400 text-yellow-400 shrink-0 mt-1" />}
                      </div>
                    </button>

                    {/* 3-dot menu button */}
                    <button
                      onClick={e => { e.stopPropagation(); setMsgMenuId(msgMenuId === msg.id ? null : msg.id); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 opacity-0 group-hover/msgrow:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="size-3.5" />
                    </button>

                    {/* Dropdown menu */}
                    {msgMenuId === msg.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMsgMenuId(null)} />
                        <div className="absolute right-2 top-full mt-0.5 z-20 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-sm">
                          <button onClick={() => { msg.isRead ? markUnread(msg.id) : markRead(msg.id); setMsgMenuId(null); }}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 text-xs">
                            <MailOpen className="size-3.5 text-gray-400" />
                            {msg.isRead ? 'Mark as unread' : 'Mark as read'}
                          </button>
                          <button onClick={() => { toggleStar(msg.id); setMsgMenuId(null); }}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 text-xs">
                            <Star className={`size-3.5 ${msg.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                            {msg.isStarred ? 'Unstar' : 'Star'}
                          </button>
                          <button onClick={() => { archiveMsg(msg.id); setMsgMenuId(null); }}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 text-xs">
                            <Archive className="size-3.5 text-gray-400" />
                            {msg.isArchived ? 'Unarchive' : 'Archive'}
                          </button>
                          <div className="h-px bg-gray-100 my-1" />
                          <button onClick={() => { deleteMsg(msg.id); setMsgMenuId(null); }}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-red-600 hover:bg-red-50 text-xs">
                            <Trash2 className="size-3.5" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right panel: message detail ── */}
            {selectedMsg ? (
              <div className="flex-1 flex flex-col min-w-0">
                {/* Detail header */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 gap-4">
                  <button onClick={() => setSelectedMsg(null)} className="lg:hidden text-gray-500 hover:text-gray-700">
                    <ChevronDown className="size-4 rotate-90" />
                  </button>
                  <h2 className="text-base font-semibold text-gray-900 flex-1 truncate">{selectedMsg.subject}</h2>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleStar(selectedMsg.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 transition-colors">
                      <Star className={`size-4 ${selectedMsg.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </button>
                    <button onClick={() => archiveMsg(selectedMsg.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                      <Archive className="size-4" />
                    </button>
                    <button onClick={() => deleteMsg(selectedMsg.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Sender info */}
                <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3">
                  <div className="size-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {selectedMsg.fromName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{selectedMsg.fromName}</p>
                    <p className="text-xs text-gray-400">{selectedMsg.from}</p>
                  </div>
                  <span className="ml-auto text-xs text-gray-400 shrink-0">{selectedMsg.timestamp}</span>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedMsg.body}</p>
                </div>

                {/* Reply box */}
                <div className="border-t border-gray-200 px-6 py-4">
                  {replySent ? (
                    <div className="flex items-center gap-2 text-sm text-green-600 font-medium py-2">
                      <Check className="size-4" /> Reply sent
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-gray-400 font-medium">Reply to {selectedMsg.fromName}</p>

                      {/* Rich text editor container */}
                      <div className="border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-blue-400">
                        {/* Toolbar */}
                        {showFormatting && (() => {
                          const TipBtn = ({ label, onMD, children }: { label: string; onMD: (e: React.MouseEvent) => void; children: React.ReactNode }) => (
                            <div className="relative group/tb">
                              <button type="button" onMouseDown={onMD} className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition-colors">
                                {children}
                              </button>
                              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-800 text-white text-[11px] rounded-md whitespace-nowrap opacity-0 group-hover/tb:opacity-100 transition-opacity duration-150 z-50">
                                {label}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                              </div>
                            </div>
                          );
                          return (
                            <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50 flex-wrap rounded-t-lg">
                              <TipBtn label="Bold"          onMD={e => { e.preventDefault(); execReplyCmd('bold'); }}><Bold className="size-3.5" /></TipBtn>
                              <TipBtn label="Italic"        onMD={e => { e.preventDefault(); execReplyCmd('italic'); }}><Italic className="size-3.5" /></TipBtn>
                              <TipBtn label="Underline"     onMD={e => { e.preventDefault(); execReplyCmd('underline'); }}><Underline className="size-3.5" /></TipBtn>
                              <TipBtn label="Strikethrough" onMD={e => { e.preventDefault(); execReplyCmd('strikeThrough'); }}><Strikethrough className="size-3.5" /></TipBtn>
                              <div className="w-px h-4 bg-gray-200 mx-1" />
                              <TipBtn label="Add link"      onMD={e => { e.preventDefault(); insertReplyLink(); }}><Link className="size-3.5" /></TipBtn>
                              <div className="w-px h-4 bg-gray-200 mx-1" />
                              <TipBtn label="Ordered list"  onMD={e => { e.preventDefault(); execReplyCmd('insertOrderedList'); }}><ListOrdered className="size-3.5" /></TipBtn>
                              <TipBtn label="Bullet list"   onMD={e => { e.preventDefault(); execReplyCmd('insertUnorderedList'); }}><List className="size-3.5" /></TipBtn>
                              <TipBtn label="Blockquote"    onMD={e => { e.preventDefault(); execReplyCmd('formatBlock', 'blockquote'); }}><Quote className="size-3.5" /></TipBtn>
                              <div className="w-px h-4 bg-gray-200 mx-1" />
                              <TipBtn label="Inline code"   onMD={e => { e.preventDefault(); execReplyCmd('formatBlock', 'code'); }}><Code className="size-3.5" /></TipBtn>
                              <TipBtn label="Code block"    onMD={e => { e.preventDefault(); insertReplyCodeBlock(); }}><FileCode className="size-3.5" /></TipBtn>
                            </div>
                          );
                        })()}

                        {/* Editable area */}
                        <div
                          ref={replyEditorRef}
                          contentEditable
                          suppressContentEditableWarning
                          onInput={() => setReplyText(replyEditorRef.current?.innerText ?? '')}
                          data-placeholder="Write a reply…"
                          className="min-h-[80px] max-h-48 overflow-y-auto px-3 py-2 text-sm text-gray-700 focus:outline-none [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-3 [&_blockquote]:text-gray-500 [&_blockquote]:italic [&_pre]:bg-gray-100 [&_pre]:rounded [&_pre]:p-2 [&_pre]:font-mono [&_pre]:text-xs [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none"
                        />

                        {/* Bottom bar */}
                        <div className="relative flex items-center justify-between px-2 py-1.5 border-t border-gray-100 bg-gray-50 rounded-b-lg">
                          <div className="flex items-center gap-0.5">
                            {/* Plus / attach */}
                            <div className="relative">
                              <button type="button"
                                onClick={() => setShowAttachMenu(v => !v)}
                                className={`p-1.5 rounded transition-colors text-gray-500 hover:bg-gray-200 hover:text-gray-700 ${showAttachMenu ? 'bg-gray-200 text-gray-700' : ''}`}>
                                <div className="size-3.5 rounded-full border-[1.5px] border-current flex items-center justify-center">
                                  <Plus className="size-2.5" strokeWidth={2.5} />
                                </div>
                              </button>

                              {showAttachMenu && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setShowAttachMenu(false)} />
                                  <div className="absolute bottom-full left-0 mb-2 z-50 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 overflow-hidden">
                                    {/* Upload */}
                                    <button type="button"
                                      onClick={() => setShowAttachMenu(false)}
                                      className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                      <div className="size-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                        <Upload className="size-3.5 text-blue-500" />
                                      </div>
                                      <div className="text-left">
                                        <p className="text-xs font-medium text-gray-800 leading-tight">Upload from computer</p>
                                        <p className="text-[10px] text-gray-400 leading-tight mt-0.5">Any file up to 25 MB</p>
                                      </div>
                                    </button>
                                    {/* Recent files */}
                                    <button type="button"
                                      onClick={() => setShowAttachMenu(false)}
                                      className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                      <div className="size-7 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                                        <Clock className="size-3.5 text-purple-500" />
                                      </div>
                                      <div className="text-left">
                                        <p className="text-xs font-medium text-gray-800 leading-tight">Recent files</p>
                                        <p className="text-[10px] text-gray-400 leading-tight mt-0.5">Pick from previously uploaded</p>
                                      </div>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>

                            <div className="w-px h-3.5 bg-gray-200 mx-0.5" />

                            {/* Emoji */}
                            <div className="relative group/tip">
                              <button ref={replyEmojiBtnRef} type="button"
                                onClick={() => {
                                  if (showReplyEmoji) {
                                    setShowReplyEmoji(false);
                                    setEmojiPickerPos(null);
                                  } else {
                                    const r = replyEmojiBtnRef.current?.getBoundingClientRect();
                                    if (r) setEmojiPickerPos({ top: r.top - 8, left: r.left });
                                    setShowReplyEmoji(true);
                                  }
                                }}
                                className={`p-1.5 rounded transition-colors text-gray-500 hover:bg-gray-200 hover:text-gray-700 ${showReplyEmoji ? 'bg-gray-200 text-gray-700' : ''}`}>
                                <Smile className="size-3.5" />
                              </button>
                              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-800 text-white text-[11px] rounded-md whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50">
                                Emoji
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                              </div>
                            </div>

                            {/* Hide / Show Formatting */}
                            <div className="relative group/tip">
                              <button type="button" onClick={() => setShowFormatting(v => !v)}
                                className="p-1.5 rounded transition-colors text-gray-500 hover:bg-gray-200 hover:text-gray-700">
                                <Type className="size-3.5" />
                              </button>
                              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-800 text-white text-[11px] rounded-md whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50">
                                {showFormatting ? 'Hide formatting' : 'Show formatting'}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                              </div>
                            </div>

                            {/* More options */}
                            <div className="relative">
                              <button type="button"
                                onClick={() => setShowMoreMenu(v => !v)}
                                className={`p-1.5 rounded transition-colors text-gray-500 hover:bg-gray-200 hover:text-gray-700 ${showMoreMenu ? 'bg-gray-200 text-gray-700' : ''}`}>
                                <MoreHorizontal className="size-4" />
                              </button>

                              {showMoreMenu && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                                  <div className="absolute bottom-full left-0 mb-2 z-50 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 overflow-hidden">
                                    {/* Record Video */}
                                    <button type="button"
                                      onClick={() => setShowMoreMenu(false)}
                                      className="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-50 transition-colors">
                                      <div className="size-7 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                                        <Video className="size-3.5 text-red-500" />
                                      </div>
                                      <div className="text-left">
                                        <p className="text-xs font-medium text-gray-800 leading-tight">Record Video Clip</p>
                                        <p className="text-[10px] text-gray-400 leading-tight mt-0.5">Capture via your camera</p>
                                      </div>
                                    </button>
                                    {/* Record Audio */}
                                    <button type="button"
                                      onClick={() => setShowMoreMenu(false)}
                                      className="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-50 transition-colors">
                                      <div className="size-7 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                                        <Mic className="size-3.5 text-orange-500" />
                                      </div>
                                      <div className="text-left">
                                        <p className="text-xs font-medium text-gray-800 leading-tight">Record Audio Clip</p>
                                        <p className="text-[10px] text-gray-400 leading-tight mt-0.5">Capture via your microphone</p>
                                      </div>
                                    </button>
                                    <div className="h-px bg-gray-100 my-1" />
                                    {/* Run Shortcut */}
                                    <button type="button"
                                      onClick={() => setShowMoreMenu(false)}
                                      className="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-50 transition-colors">
                                      <div className="size-7 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                                        <Zap className="size-3.5 text-teal-500" />
                                      </div>
                                      <div className="text-left">
                                        <p className="text-xs font-medium text-gray-800 leading-tight">Run Shortcut</p>
                                        <p className="text-[10px] text-gray-400 leading-tight mt-0.5">Trigger a saved workflow</p>
                                      </div>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Send Reply */}
                          <button onClick={handleSendReply} disabled={!replyText.trim()}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors">
                            <Send className="size-3" /> Send Reply
                          </button>

                          {/* Emoji panel */}
                          {showReplyEmoji && (() => {
                            const EMOJI_CATS = [
                              { label: 'Smileys',  icon: '😀', emojis: ['😀','😁','😂','🤣','😃','😄','😅','😆','😊','😇','🥰','😍','🤩','😘','😙','😚','🙂','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','😴','😷','🤒','🤕','🤢','🤧','🥵','🥶','😵','🤯','🤠','🥳','😎','🤓','🧐','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','😤','😡','😠','🤬','😈','👿'] },
                              { label: 'Gestures', icon: '👍', emojis: ['👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','💪','🦵','🦶','👂','🦻','👃','🫀','🫁','🧠','🦷','🦴','👁️','👅','👄'] },
                              { label: 'Hearts',   icon: '❤️', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','💌','💋','💯','💢','💥','💫','💦','💨','🕳️','💬','💭','🗯️','💤','🔔','🔕','🎵','🎶','✨','🌟','⭐','🌠','🎇','🎆','🌈','☀️','🌤️','⛅','🌥️','☁️','🌦️','🌧️','⛈️','🌩️','🌨️','❄️','☃️','⛄','🌬️','💨','🌪️'] },
                              { label: 'Objects',  icon: '💡', emojis: ['💡','🔦','🕯️','💰','💸','💳','📈','📉','📊','💼','🗂️','📋','📌','📍','✂️','🗑️','🔒','🔓','🔑','🗝️','🔨','⚒️','🛠️','🔧','🔩','⚙️','🔗','🧲','💣','🧨','🔪','🔭','🔬','💊','💉','🩺','📱','💻','🖥️','🖨️','⌨️','🖱️','🖲️','💾','💿','📀','📷','📸','📹','🎥','📞','☎️','📟','📠','📺','📻','🧭','⏰','⌚','⏱️','📡'] },
                              { label: 'Symbols',  icon: '✅', emojis: ['✅','❌','❎','⭕','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔶','🔷','🔸','🔹','🔺','🔻','💠','🔘','🔲','🔳','⬛','⬜','▪️','▫️','🔱','📛','🔰','⭕','✳️','❇️','🆕','🆓','🆙','🆒','🆗','🔝','🔛','🔜','🔚','⏫','⏬','⏩','⏪','🔀','🔁','🔂','▶️','⏸️','⏹️','⏺️','🔅','🔆','📶','♾️','🔃','🔄','🔙','💱','💲','©️','®️','™️'] },
                            ];
                            const currentCat = EMOJI_CATS.find(c => c.label === emojiCat) ?? EMOJI_CATS[0];
                            const displayEmojis = emojiSearch.trim()
                              ? EMOJI_CATS.flatMap(c => c.emojis).filter((_e, i, arr) => arr.indexOf(_e) === i)
                              : currentCat.emojis;
                            return (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => { setShowReplyEmoji(false); setEmojiPickerPos(null); setEmojiSearch(''); }} />
                                <div className="fixed z-50 bg-white border border-gray-200 rounded-2xl shadow-2xl w-72 overflow-hidden"
                                  style={emojiPickerPos ? { top: emojiPickerPos.top, left: emojiPickerPos.left, transform: 'translateY(-100%)' } : {}}
                                  onClick={e => e.stopPropagation()}>
                                  {/* Search */}
                                  <div className="px-3 pt-3 pb-2">
                                    <div className="relative">
                                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" />
                                      <input
                                        autoFocus
                                        value={emojiSearch}
                                        onChange={e => setEmojiSearch(e.target.value)}
                                        placeholder="Search emoji…"
                                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400"
                                      />
                                    </div>
                                  </div>

                                  {/* Category tabs */}
                                  {!emojiSearch.trim() && (
                                    <div className="flex items-center px-2 pb-1 gap-0.5 border-b border-gray-100">
                                      {EMOJI_CATS.map(cat => (
                                        <button key={cat.label} type="button"
                                          onClick={() => setEmojiCat(cat.label)}
                                          title={cat.label}
                                          className={`flex-1 py-1.5 text-lg rounded-lg transition-colors ${emojiCat === cat.label ? 'bg-blue-50' : 'hover:bg-gray-100'}`}>
                                          {cat.icon}
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {/* Emoji grid */}
                                  <div className="px-2 py-2 h-48 overflow-y-auto">
                                    {!emojiSearch.trim() && (
                                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">{currentCat.label}</p>
                                    )}
                                    <div className="grid grid-cols-8 gap-0.5">
                                      {displayEmojis.map((em, i) => (
                                        <button key={i} type="button"
                                          onClick={() => {
                                            replyEditorRef.current?.focus();
                                            document.execCommand('insertText', false, em);
                                            setReplyText(replyEditorRef.current?.innerText ?? '');
                                            setShowReplyEmoji(false);
                                            setEmojiPickerPos(null);
                                            setEmojiSearch('');
                                          }}
                                          className="text-xl rounded-lg hover:bg-gray-100 transition-colors leading-none aspect-square flex items-center justify-center">
                                          {em}
                                        </button>
                                      ))}
                                      {displayEmojis.length === 0 && (
                                        <p className="col-span-8 text-center text-xs text-gray-400 py-8">No emoji found</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden lg:flex flex-1 items-center justify-center text-center px-8">
                <div>
                  <MailOpen className="size-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500">Select a message to read</p>
                  <p className="text-xs text-gray-400 mt-1">Choose from the list on the left</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'mass-emails' && <MassEmailsTab users={users} />}

        {activeTab === 'compose' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Enter email subject" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} placeholder="Type your message here..." rows={12} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" />
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={handleSendEmail} disabled={!emailSubject || !emailBody || selectedRecipients.length === 0} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium">
                    <Send className="size-4 inline mr-2" />Send to {selectedRecipients.length} recipient(s)
                  </button>
                  <button className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">Save Draft</button>
                </div>
              </div>
              <div className="lg:col-span-1 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Recipients</h3>
                  <button onClick={handleSelectAllUsers} className="text-sm text-blue-600 hover:text-blue-700">
                    {selectedRecipients.length === users.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search users..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredUsers.map(user => (
                    <label key={user.id} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={selectedRecipients.includes(user.id)} onChange={() => handleRecipientToggle(user.id)} className="mt-1 size-4 text-blue-600 rounded focus:ring-blue-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-600 truncate">{user.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Email Templates</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                <Plus className="size-4 inline mr-2" />Create Template
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emailTemplates.map(template => (
                <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">{template.name}</h3>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">{template.category}</span>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600"><MoreVertical className="size-5" /></button>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Subject:</p>
                    <p className="text-sm text-gray-600">{template.subject}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">Body:</p>
                    <p className="text-sm text-gray-600 line-clamp-3">{template.body}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleUseTemplate(template)} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Use Template</button>
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">Edit</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mass Emails Tab
// ─────────────────────────────────────────────────────────────────────────────

type CampaignStatus = 'sent' | 'draft' | 'scheduled';

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  status: CampaignStatus;
  recipients: number;
  sentAt: string | null;
  scheduledFor: string | null;
  openRate: number | null;
  clickRate: number | null;
  segment: string;
  body: string;
}

function MassEmailsTab({ users }: { users: User[] }) {
  const INIT_CAMPAIGNS: EmailCampaign[] = [
    { id: '1', name: 'May Platform Update',        subject: 'New features available on the platform!',            status: 'sent',      recipients: 143, sentAt: '15 May 2026',  scheduledFor: null,          openRate: 68, clickRate: 24, segment: 'All Users',    body: 'Hi {{name}},\n\nWe\'ve just released several exciting new features on the platform including improved course navigation, a new progress dashboard, and faster video streaming.\n\nLog in today to check them out!\n\nThe Team' },
    { id: '2', name: 'Q2 Learning Challenge',      subject: 'Join the Q2 Learning Challenge – win prizes!',        status: 'sent',      recipients: 98,  sentAt: '1 Apr 2026',   scheduledFor: null,          openRate: 72, clickRate: 31, segment: 'Active Learners', body: 'Hi {{name}},\n\nThe Q2 Learning Challenge is here! Complete 5 courses before 30 June and go in the draw to win a $200 gift card.\n\nGood luck!\n\nThe Team' },
    { id: '3', name: 'Inactive User Winback',      subject: 'We miss you – come back and keep learning',           status: 'sent',      recipients: 37,  sentAt: '20 Mar 2026',  scheduledFor: null,          openRate: 41, clickRate: 18, segment: 'Inactive Users', body: 'Hi {{name}},\n\nWe noticed you haven\'t logged in for a while. Your courses are waiting for you and there\'s lots of new content to explore.\n\nCome back today!\n\nThe Team' },
    { id: '4', name: 'June Newsletter',            subject: 'Your June learning digest',                           status: 'scheduled', recipients: 143, sentAt: null,           scheduledFor: '1 Jun 2026',  openRate: null, clickRate: null, segment: 'All Users', body: 'Hi {{name}},\n\nHere is your June learning digest with course recommendations, upcoming live sessions, and team highlights.\n\nThe Team' },
    { id: '5', name: 'New Course Announcement',    subject: 'Introducing: Advanced Data Analysis with Python',     status: 'draft',     recipients: 0,   sentAt: null,           scheduledFor: null,          openRate: null, clickRate: null, segment: 'All Users', body: 'Hi {{name}},\n\nWe\'re excited to announce a brand new course: Advanced Data Analysis with Python. Early enrolment is now open.\n\nEnrol today!\n\nThe Team' },
  ];

  const [campaigns, setCampaigns]         = useState<EmailCampaign[]>(INIT_CAMPAIGNS);
  const [selected, setSelected]           = useState<EmailCampaign | null>(null);
  const [composing, setComposing]         = useState(false);
  const [filterStatus, setFilterStatus]  = useState<CampaignStatus | 'all'>('all');
  const [searchQ, setSearchQ]             = useState('');
  const [sentConfirm, setSentConfirm]     = useState(false);

  // Compose form state
  const [cName,          setCName]          = useState('');
  const [cSubject,       setCSubject]       = useState('');
  const [cBody,          setCBody]          = useState('');
  const [cSegment,       setCSegment]       = useState('All Users');
  const [cSchedule,      setCSchedule]      = useState('');
  const [customUsers,    setCustomUsers]    = useState<string[]>([]);
  const [customSearch,   setCustomSearch]   = useState('');

  const segmentCounts: Record<string, number> = {
    'All Users':      users.length,
    'Active Learners': Math.round(users.length * 0.68),
    'Inactive Users':  Math.round(users.length * 0.32),
    'Admins Only':     users.filter(u => u.role === 'admin').length || 3,
  };

  const visible = campaigns
    .filter(c => filterStatus === 'all' || c.status === filterStatus)
    .filter(c => !searchQ || c.name.toLowerCase().includes(searchQ.toLowerCase()) || c.subject.toLowerCase().includes(searchQ.toLowerCase()));

  const statusBadge = (s: CampaignStatus) => {
    if (s === 'sent')      return <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-green-100 text-green-700">Sent</span>;
    if (s === 'scheduled') return <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-100 text-blue-700">Scheduled</span>;
    return                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 text-gray-500">Draft</span>;
  };

  const handleSend = (asDraft = false, schedule = '') => {
    const now = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const newC: EmailCampaign = {
      id: Date.now().toString(), name: cName || 'Untitled Campaign',
      subject: cSubject, body: cBody, segment: cSegment,
      status: asDraft ? 'draft' : schedule ? 'scheduled' : 'sent',
      recipients: asDraft ? 0 : cSegment === 'Custom Selection' ? customUsers.length : (segmentCounts[cSegment] ?? users.length),
      sentAt: (!asDraft && !schedule) ? now : null,
      scheduledFor: schedule || null,
      openRate: null, clickRate: null,
    };
    setCampaigns(prev => [newC, ...prev]);
    setComposing(false);
    setSentConfirm(!asDraft);
    setSelected(newC);
    setCName(''); setCSubject(''); setCBody(''); setCSegment('All Users'); setCSchedule(''); setCustomUsers([]); setCustomSearch('');
    if (!asDraft) setTimeout(() => setSentConfirm(false), 3000);
  };

  const deleteCampaign = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[500px]">
      {/* ── Left: campaign list ── */}
      <div className={`flex flex-col border-r border-gray-200 ${(selected || composing) ? 'hidden lg:flex w-80 shrink-0' : 'flex flex-1 lg:flex-none lg:w-80 lg:shrink-0'}`}>
        {/* Search + New */}
        <div className="p-3 border-b border-gray-100 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search campaigns…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <button onClick={() => { setComposing(true); setSelected(null); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shrink-0">
            <Plus className="size-3.5" /> New
          </button>
        </div>

        {/* Status filter */}
        <div className="flex gap-1 px-3 pt-2 border-b border-gray-100">
          {(['all', 'sent', 'scheduled', 'draft'] as const).map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-t-md border-b-2 capitalize transition-colors ${filterStatus === f ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
              <Mail className="size-10 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500">No campaigns</p>
            </div>
          ) : visible.map(c => (
            <button key={c.id} onClick={() => { setSelected(c); setComposing(false); }}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${selected?.id === c.id ? 'bg-blue-50' : ''}`}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className={`text-sm font-medium text-gray-800 truncate ${c.status === 'draft' ? 'text-gray-500' : ''}`}>{c.name}</span>
                {statusBadge(c.status)}
              </div>
              <p className="text-xs text-gray-500 truncate mb-1.5">{c.subject}</p>
              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                <span>{c.status === 'sent' ? `${c.recipients} recipients` : c.status === 'scheduled' ? `Sends ${c.scheduledFor}` : 'Draft'}</span>
                {c.status === 'sent' && c.openRate !== null && <span>Opens: {c.openRate}%</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: detail / compose ── */}
      {composing ? (
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
            <button onClick={() => setComposing(false)} className="lg:hidden text-gray-500 hover:text-gray-700">
              <ChevronDown className="size-4 rotate-90" />
            </button>
            <h2 className="text-base font-semibold text-gray-900 flex-1">New Campaign</h2>
            <button onClick={() => setComposing(false)} className="text-gray-400 hover:text-gray-600"><X className="size-4" /></button>
          </div>
          <div className="flex-1 p-6 space-y-4">
            {/* Campaign name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Campaign name</label>
              <input value={cName} onChange={e => setCName(e.target.value)} placeholder="e.g. May Newsletter"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>

            {/* Audience segment */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Audience</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(segmentCounts).map(([seg, count]) => (
                  <button key={seg} type="button" onClick={() => setCSegment(seg)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-colors ${cSegment === seg ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div>
                      <p className={`text-xs font-semibold ${cSegment === seg ? 'text-blue-700' : 'text-gray-700'}`}>{seg}</p>
                      <p className="text-[10px] text-gray-400">{count} users</p>
                    </div>
                    {cSegment === seg && <Check className="size-3.5 text-blue-500 shrink-0" />}
                  </button>
                ))}
                {/* Custom Selection tile */}
                <button type="button" onClick={() => setCSegment('Custom Selection')}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-colors col-span-2 ${cSegment === 'Custom Selection' ? 'border-blue-500 bg-blue-50' : 'border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'}`}>
                  <div>
                    <p className={`text-xs font-semibold ${cSegment === 'Custom Selection' ? 'text-blue-700' : 'text-gray-600'}`}>Custom Selection</p>
                    <p className="text-[10px] text-gray-400">
                      {cSegment === 'Custom Selection' && customUsers.length > 0 ? `${customUsers.length} user${customUsers.length !== 1 ? 's' : ''} selected` : 'Pick specific users manually'}
                    </p>
                  </div>
                  {cSegment === 'Custom Selection' ? <Check className="size-3.5 text-blue-500 shrink-0" /> : <UserPlus className="size-3.5 text-gray-400 shrink-0" />}
                </button>
              </div>

              {/* Custom user picker */}
              {cSegment === 'Custom Selection' && (
                <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden">
                  {/* Picker header */}
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
                    <span className="text-xs font-semibold text-gray-600">{customUsers.length} of {users.length} selected</span>
                    <button type="button"
                      onClick={() => setCustomUsers(customUsers.length === users.length ? [] : users.map(u => u.id))}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-medium">
                      {customUsers.length === users.length ? 'Deselect all' : 'Select all'}
                    </button>
                  </div>
                  {/* Search */}
                  <div className="px-3 py-2 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                      <input value={customSearch} onChange={e => setCustomSearch(e.target.value)}
                        placeholder="Search users…"
                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                  </div>
                  {/* User list */}
                  <div className="max-h-48 overflow-y-auto divide-y divide-gray-50">
                    {users
                      .filter(u => !customSearch || u.name.toLowerCase().includes(customSearch.toLowerCase()) || u.email.toLowerCase().includes(customSearch.toLowerCase()))
                      .map(u => {
                        const checked = customUsers.includes(u.id);
                        return (
                          <label key={u.id}
                            className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${checked ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                            <input type="checkbox" checked={checked}
                              onChange={() => setCustomUsers(prev => checked ? prev.filter(id => id !== u.id) : [...prev, u.id])}
                              className="size-3.5 rounded text-blue-600 focus:ring-blue-400 border-gray-300 shrink-0" />
                            <div className="size-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                              {u.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-medium truncate ${checked ? 'text-blue-700' : 'text-gray-700'}`}>{u.name}</p>
                              <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject line</label>
              <input value={cSubject} onChange={e => setCSubject(e.target.value)} placeholder="Enter email subject…"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message body</label>
              <p className="text-xs text-gray-400 mb-1.5">Use <code className="bg-gray-100 px-1 rounded text-[10px]">{'{{name}}'}</code> to personalise with the recipient's name.</p>
              <textarea value={cBody} onChange={e => setCBody(e.target.value)} rows={10}
                placeholder={'Hi {{name}},\n\nWrite your message here…\n\nThe Team'}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none font-mono" />
            </div>

            {/* Schedule */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Schedule (optional)</label>
              <input type="date" value={cSchedule} onChange={e => setCSchedule(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <p className="text-xs text-gray-400 mt-1">Leave blank to send immediately.</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => handleSend(false, cSchedule)}
                disabled={!cSubject.trim() || !cBody.trim() || (cSegment === 'Custom Selection' && customUsers.length === 0)}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors">
                <Send className="size-3.5" />
                {cSchedule ? 'Schedule Campaign' : `Send to ${cSegment === 'Custom Selection' ? customUsers.length : (segmentCounts[cSegment] ?? users.length)} users`}
              </button>
              <button onClick={() => handleSend(true)}
                className="px-5 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                Save Draft
              </button>
            </div>
          </div>
        </div>
      ) : selected ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 gap-4">
            <button onClick={() => setSelected(null)} className="lg:hidden text-gray-500 hover:text-gray-700">
              <ChevronDown className="size-4 rotate-90" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-gray-900 truncate">{selected.name}</h2>
                {statusBadge(selected.status)}
              </div>
              <p className="text-xs text-gray-400 truncate">{selected.subject}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {selected.status === 'draft' && (
                <button onClick={() => { setCName(selected.name); setCSubject(selected.subject); setCBody(selected.body); setCSegment(selected.segment); setComposing(true); setSelected(null); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                  <Pencil className="size-3" /> Edit
                </button>
              )}
              <button
                onClick={() => {
                  const dupe: EmailCampaign = {
                    ...selected,
                    id: Date.now().toString(),
                    name: `${selected.name} (Copy)`,
                    status: 'draft',
                    recipients: 0,
                    sentAt: null,
                    scheduledFor: null,
                    openRate: null,
                    clickRate: null,
                  };
                  setCampaigns(prev => [dupe, ...prev]);
                  setSelected(dupe);
                }}
                title="Duplicate campaign"
                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                <Copy className="size-4" />
              </button>
              <button onClick={() => deleteCampaign(selected.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>

          {/* Stats row (sent only) */}
          {selected.status === 'sent' && (
            <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
              {[
                { label: 'Recipients', value: selected.recipients.toLocaleString() },
                { label: 'Open rate',  value: `${selected.openRate}%` },
                { label: 'Click rate', value: `${selected.clickRate}%` },
                { label: 'Sent',       value: selected.sentAt ?? '—' },
              ].map(s => (
                <div key={s.label} className="px-5 py-3 text-center">
                  <p className="text-lg font-bold text-gray-900">{s.value}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Scheduled notice */}
          {selected.status === 'scheduled' && (
            <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              <CalendarClock className="size-4 shrink-0" />
              Scheduled to send on <strong>{selected.scheduledFor}</strong> to <strong>{selected.segment}</strong>
            </div>
          )}

          {/* Meta */}
          <div className="px-6 pt-4 pb-2 flex flex-wrap gap-4 text-xs text-gray-500 border-b border-gray-100">
            <span><span className="font-semibold text-gray-700">Audience:</span> {selected.segment}</span>
            {selected.status !== 'sent' && <span><span className="font-semibold text-gray-700">Recipients:</span> {segmentCounts[selected.segment] ?? '—'} users</span>}
          </div>

          {/* Body preview */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Message Preview</p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <p className="text-sm font-semibold text-gray-800 mb-3">{selected.subject}</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selected.body}</p>
            </div>
          </div>

          {/* Send confirmation toast */}
          {sentConfirm && (
            <div className="mx-6 mb-4 flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium">
              <Check className="size-4 shrink-0" /> Campaign sent successfully!
            </div>
          )}
        </div>
      ) : (
        <div className="hidden lg:flex flex-1 items-center justify-center text-center px-8">
          <div>
            <Mail className="size-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">Select a campaign to view</p>
            <p className="text-xs text-gray-400 mt-1">Or create a new one</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Community Page
// ─────────────────────────────────────────────────────────────────────────────

interface PollOption { text: string; votes: number }
interface Poll { question: string; options: PollOption[] }

interface CommunityPost {
  id: string;
  authorName: string;
  authorBadge?: string;
  timestamp: string;
  content: string;
  poll?: Poll;
  likes: number;
  upvotes: number;
  comments: { id: string; author: string; content: string; timestamp: string }[];
}

interface CommunitySpace {
  id: string;
  name: string;
  type: 'locked' | 'public';
  members: number;
  company: string | null;
  industry: string | null;
  plan: string | null;
  joinedDate: string | null;
}

const COMMUNITY_SPACES: CommunitySpace[] = [
  { id: 'outdure',           name: 'Outdure',              type: 'locked', members: 34, company: 'Outdure Pty Ltd',       industry: 'Technology',     plan: 'Enterprise', joinedDate: 'Mar 2022' },
  { id: 'nexus-tech',        name: 'Nexus Technologies',   type: 'locked', members: 52, company: 'Nexus Technologies',   industry: 'Software',       plan: 'Business',   joinedDate: 'Apr 2023' },
  { id: 'bluepeak',          name: 'BluePeak Consulting',  type: 'locked', members: 27, company: 'BluePeak Consulting',  industry: 'Consulting',     plan: 'Business',   joinedDate: 'Jun 2023' },
  { id: 'meridian',          name: 'Meridian Group',       type: 'locked', members: 61, company: 'Meridian Group',       industry: 'Finance',        plan: 'Enterprise', joinedDate: 'Sep 2022' },
  { id: 'stellar-academy',   name: 'Stellar Academy',      type: 'locked', members: 43, company: 'Stellar Academy',      industry: 'Education',      plan: 'Business',   joinedDate: 'Feb 2024' },
  { id: 'ironwood',          name: 'Ironwood Industries',  type: 'locked', members: 89, company: 'Ironwood Industries',  industry: 'Manufacturing',  plan: 'Enterprise', joinedDate: 'Nov 2022' },
  { id: 'crestview',         name: 'Crestview Health',     type: 'locked', members: 31, company: 'Crestview Health',     industry: 'Healthcare',     plan: 'Business',   joinedDate: 'Jul 2023' },
  { id: 'qa',                name: 'Q&A',                  type: 'public', members: 210, company: null,                 industry: null,             plan: null,         joinedDate: null },
];

const INITIAL_POSTS: Record<string, CommunityPost[]> = {
  'outdure': [
    {
      id: 'od-1',
      authorName: 'outdure',
      authorBadge: 'Staff',
      timestamp: '6 months ago',
      content: '🚀 Platform Update v2.4 is live!\n\n- New quiz randomisation engine\n- Bulk certificate export\n- API webhooks for LMS integrations\n\nFull release notes in the Help Centre.',
      likes: 21,
      upvotes: 14,
      comments: [
        { id: 'c3', author: 'admin.nexus', content: 'The webhook support was a long time coming — great work team!', timestamp: '6 months ago' },
        { id: 'c4', author: 'l.chen', content: 'Bulk cert export is a game changer for us. Thank you!', timestamp: '5 months ago' },
      ],
    },
    {
      id: 'od-2',
      authorName: 'outdure',
      authorBadge: 'Staff',
      timestamp: '2 months ago',
      content: '📅 Scheduled maintenance this Saturday 02:00–04:00 AEST. The platform will be briefly unavailable. We apologise for any inconvenience.',
      likes: 3,
      upvotes: 1,
      comments: [],
    },
  ],

  'nexus-tech': [
    {
      id: 'nt-1',
      authorName: 'admin.nexus',
      authorBadge: 'Management',
      timestamp: '5 months ago',
      content: 'Welcome to the Nexus Technologies learning hub! 👋\n\nWe\'ve loaded 14 courses across Software Engineering, Cloud Architecture, and Agile Delivery. Managers — please assign your team\'s learning paths by Friday.',
      likes: 18,
      upvotes: 11,
      comments: [
        { id: 'c5', author: 'dev.ramos', content: 'Already halfway through the AWS Solutions Architect track. Really solid content!', timestamp: '5 months ago' },
      ],
    },
    {
      id: 'nt-2',
      authorName: 'dev.ramos',
      timestamp: '1 month ago',
      content: '🏆 Shoutout to the entire backend team — 100% completion on the Security Fundamentals course! First team in the company to hit full completion.',
      likes: 34,
      upvotes: 22,
      comments: [
        { id: 'c6', author: 'admin.nexus', content: 'Incredible effort everyone! Certificates have been sent to your emails.', timestamp: '1 month ago' },
      ],
    },
  ],

  'bluepeak': [
    {
      id: 'bp-1',
      authorName: 'hr.bluepeak',
      authorBadge: 'Management',
      timestamp: '4 months ago',
      content: 'All consultants joining Q3 projects must complete the Client Engagement Essentials and Business Writing modules before their project kickoff date.',
      likes: 9,
      upvotes: 6,
      comments: [],
    },
    {
      id: 'bp-2',
      authorName: 'l.chen',
      timestamp: '6 weeks ago',
      content: 'Quick tip: The "My Learning" dashboard now shows your estimated completion dates. Really helpful for planning your week around training obligations.',
      likes: 15,
      upvotes: 9,
      comments: [
        { id: 'c7', author: 'r.patel', content: 'Didn\'t know about this — just checked and it\'s exactly what I needed. Thanks!', timestamp: '6 weeks ago' },
      ],
    },
  ],

  'meridian': [
    {
      id: 'mg-1',
      authorName: 'training.meridian',
      authorBadge: 'Management',
      timestamp: '10 months ago',
      content: '🎓 Meridian Learning Week kicks off Monday!\n\nAll staff are encouraged to dedicate 2 hours per day to completing their assigned financial compliance modules. Top 3 completers win a bonus learning budget.',
      likes: 27,
      upvotes: 19,
      comments: [
        { id: 'c8', author: 'a.brooks', content: 'Love this initiative! Already started on the AML module.', timestamp: '10 months ago' },
        { id: 'c9', author: 'j.torres', content: 'Great timing before the ASIC audit season too.', timestamp: '9 months ago' },
      ],
    },
    {
      id: 'mg-2',
      authorName: 'a.brooks',
      timestamp: '2 months ago',
      content: 'Finished the Advanced Risk Management certification. The case studies were incredibly relevant to what we deal with daily. Would recommend to anyone on the risk team.',
      likes: 22,
      upvotes: 16,
      comments: [],
    },
  ],

  'stellar-academy': [
    {
      id: 'sa-1',
      authorName: 'dean.stellar',
      authorBadge: 'Management',
      timestamp: '3 months ago',
      content: 'Stellar Academy educators — our new Instructional Design course bundle is now live! 🎉\n\nThis covers curriculum mapping, assessment design, and learning analytics. Perfect CPD hours for accreditation.',
      likes: 41,
      upvotes: 28,
      comments: [
        { id: 'c10', author: 'ms.wilson', content: 'Finally! The assessment design module fills a real gap in our PD calendar.', timestamp: '3 months ago' },
      ],
    },
  ],

  'ironwood': [
    {
      id: 'iw-1',
      authorName: 'safety.ironwood',
      authorBadge: 'Management',
      timestamp: '7 months ago',
      content: '⚠️ MANDATORY: All floor supervisors and operators must complete the updated Machinery Safety & Lockout/Tagout procedures by 30 June. Non-compliance will be flagged to site managers.',
      likes: 5,
      upvotes: 3,
      comments: [
        { id: 'c11', author: 'g.harris', content: 'Starting this with my team tomorrow morning.', timestamp: '7 months ago' },
        { id: 'c12', author: 't.nguyen', content: 'Shift B crew is 80% done already — finishing up Thursday.', timestamp: '7 months ago' },
      ],
    },
    {
      id: 'iw-2',
      authorName: 'g.harris',
      timestamp: '4 months ago',
      content: '✅ Plant 3 — 100% safety training complete across all three shifts. Proud of the team for turning this around in record time!',
      likes: 53,
      upvotes: 38,
      comments: [
        { id: 'c13', author: 'safety.ironwood', content: 'Fantastic result. You\'ll receive your site safety excellence badge shortly.', timestamp: '4 months ago' },
      ],
    },
  ],

  'crestview': [
    {
      id: 'cv-1',
      authorName: 'hr.crestview',
      authorBadge: 'Management',
      timestamp: '5 months ago',
      content: 'All clinical and admin staff: your annual AHPRA and infection control refreshers are due by the end of this month. Completion records will be submitted to compliance.',
      likes: 8,
      upvotes: 4,
      comments: [],
    },
    {
      id: 'cv-2',
      authorName: 'n.osei',
      timestamp: '2 months ago',
      content: 'The Mental Health First Aid module was outstanding. So relevant for what our reception and triage teams face every day. Highly recommend everyone does it, not just those rostered.',
      likes: 29,
      upvotes: 17,
      comments: [
        { id: 'c14', author: 'hr.crestview', content: 'Thank you for the feedback — we\'re looking at making this mandatory org-wide.', timestamp: '2 months ago' },
      ],
    },
  ],

  'qa': [
    {
      id: 'qa-1',
      authorName: 'dev.ramos',
      timestamp: '2 weeks ago',
      content: 'Is there a way to export quiz results per cohort? We want to compare performance across departments.',
      likes: 6,
      upvotes: 4,
      comments: [
        { id: 'c15', author: 'outdure', content: 'Yes! Go to Reports → Quiz Analytics → Filter by Group → Export CSV. Reach out if you need a walkthrough.', timestamp: '2 weeks ago' },
      ],
    },
    {
      id: 'qa-2',
      authorName: 'ms.wilson',
      timestamp: '1 week ago',
      content: 'Can learners access courses on mobile without the app? Some of our staff don\'t have work phones.',
      likes: 3,
      upvotes: 5,
      comments: [
        { id: 'c16', author: 'outdure', content: 'Absolutely — the platform is fully responsive. Any modern browser on mobile works great. The app just adds push notifications and offline access.', timestamp: '1 week ago' },
        { id: 'c17', author: 'l.chen', content: 'We\'ve been using it browser-only for months with no issues.', timestamp: '1 week ago' },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Course Discussions
// ─────────────────────────────────────────────────────────────────────────────

interface CourseDiscussion {
  id: string;
  courseId: string;
  courseName: string;
  courseColor: string;
  title: string;
  authorName: string;
  authorCompany: string;
  timestamp: string;
  preview: string;
  replyCount: number;
  views: number;
  lastReplyBy?: string;
  lastReplyAt?: string;
  isPinned?: boolean;
  isResolved?: boolean;
  isAnswered?: boolean;
}

// Colour palette cycled per course index
const COURSE_COLOURS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700',
  'bg-orange-100 text-orange-700',
  'bg-yellow-100 text-yellow-700',
  'bg-teal-100 text-teal-700',
  'bg-pink-100 text-pink-700',
  'bg-cyan-100 text-cyan-700',
  'bg-indigo-100 text-indigo-700',
  'bg-red-100 text-red-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
];

// Hex colours keyed by tag name — must stay in sync with TagsPage SEED_TAGS
const TAG_HEX: Record<string, string> = {
  'Staff':      '#10b981',  // t13 — new tag added to TagsPage
  'Management': '#6366f1',  // t6
  'VIP Client': '#f59e0b',  // t1
  'Sales Team': '#8b5cf6',  // t2
  'New Hire':   '#3b82f6',  // t3
  'Enterprise': '#0ea5e9',  // t11
  'At Risk':    '#ef4444',  // t5
  'Inactive':   '#64748b',  // t10
};

// Renders a tag chip identical to the Tags page TagPill (rgba tint + dot + border)
function BadgeChip({ badge, size = 'sm' }: { badge: string; size?: 'xs' | 'sm' }) {
  const hex = TAG_HEX[badge] ?? '#64748b';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const style = {
    backgroundColor: `rgba(${r},${g},${b},0.12)`,
    color: hex,
    border: `1px solid rgba(${r},${g},${b},0.3)`,
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-semibold ${size === 'xs' ? 'text-[10px]' : 'text-xs'}`}
      style={style}
    >
      <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: hex }} />
      {badge}
    </span>
  );
}

// Splits "FirstName Title" → "FirstName (Title)" for member display names
function MemberName({ displayName }: { displayName: string }) {
  const idx = displayName.indexOf(' ');
  if (idx === -1) return <>{displayName}</>;
  return (
    <>
      {displayName.slice(0, idx)}
      <span className="font-normal text-gray-400 ml-0.5">({displayName.slice(idx + 1)})</span>
    </>
  );
}

// Build a lookup from courseId → colour so it's stable
const courseColourMap: Record<string, string> = Object.fromEntries(
  platformCourses.map((c, i) => [c.id, COURSE_COLOURS[i % COURSE_COLOURS.length]])
);

const COURSE_DISCUSSIONS: CourseDiscussion[] = [
  // ── Business Leadership Essentials ───────────────────────────
  {
    id: 'cd-1',
    courseId: 'course-1',
    courseName: 'Business Leadership Essentials',
    courseColor: courseColourMap['course-1'] ?? 'bg-blue-100 text-blue-700',
    title: 'Conflict resolution framework — sharing real-world examples',
    authorName: 'sarah.k',
    authorCompany: 'Meridian Group',
    timestamp: '1 week ago',
    preview: "The module covers the theory really well but I'd love to hear how others have applied the conflict resolution framework in actual team situations. Anyone willing to share a story?",
    replyCount: 11,
    views: 87,
    lastReplyBy: 'training.meridian',
    lastReplyAt: '5 days ago',
    isPinned: true,
    isAnswered: true,
  },
  {
    id: 'cd-2',
    courseId: 'course-1',
    courseName: 'Business Leadership Essentials',
    courseColor: courseColourMap['course-1'] ?? 'bg-blue-100 text-blue-700',
    title: 'Module 4 quiz — question on situational leadership styles',
    authorName: 'a.brooks',
    authorCompany: 'BluePeak Consulting',
    timestamp: '3 days ago',
    preview: "Question 12 in module 4 asks which leadership style suits a highly capable but unmotivated team member. I answered 'Delegating' but got it wrong. The explanation wasn't clear — can someone help?",
    replyCount: 4,
    views: 29,
    lastReplyBy: 'hr.bluepeak',
    lastReplyAt: '2 days ago',
    isAnswered: true,
  },

  // ── Digital Marketing Mastery ─────────────────────────────────
  {
    id: 'cd-3',
    courseId: 'course-2',
    courseName: 'Digital Marketing Mastery',
    courseColor: courseColourMap['course-2'] ?? 'bg-purple-100 text-purple-700',
    title: 'Google Ads assignment — is a $0 budget okay for the simulation?',
    authorName: 'l.chen',
    authorCompany: 'BluePeak Consulting',
    timestamp: '2 days ago',
    preview: "For the Google Ads practical assignment in module 5, the brief says to set up a campaign. Do we use a real budget or is there a sandbox/simulation mode? Don't want to accidentally charge anything.",
    replyCount: 3,
    views: 21,
    lastReplyBy: 'hr.bluepeak',
    lastReplyAt: '1 day ago',
    isAnswered: true,
  },
  {
    id: 'cd-4',
    courseId: 'course-2',
    courseName: 'Digital Marketing Mastery',
    courseColor: courseColourMap['course-2'] ?? 'bg-purple-100 text-purple-700',
    title: 'SEO vs SEM — when does one outperform the other?',
    authorName: 'r.patel',
    authorCompany: 'Nexus Technologies',
    timestamp: '1 week ago',
    preview: "Module 3 explains both channels but I'd love a more practical breakdown. For a B2B software company with a 6-month sales cycle, which should we prioritise and why?",
    replyCount: 8,
    views: 64,
    lastReplyBy: 'admin.nexus',
    lastReplyAt: '5 days ago',
    isPinned: true,
  },

  // ── Sales Excellence Training ──────────────────────────────────
  {
    id: 'cd-5',
    courseId: 'course-3',
    courseName: 'Sales Excellence Training',
    courseColor: courseColourMap['course-3'] ?? 'bg-green-100 text-green-700',
    title: 'SPIN Selling — does it still work in a post-COVID remote environment?',
    authorName: 'j.torres',
    authorCompany: 'Meridian Group',
    timestamp: '4 days ago',
    preview: "The SPIN framework in module 2 is great but it was written for face-to-face sales. Our team is fully remote now — has anyone adapted these techniques for video calls?",
    replyCount: 9,
    views: 73,
    lastReplyBy: 'training.meridian',
    lastReplyAt: '3 days ago',
    isAnswered: true,
  },
  {
    id: 'cd-6',
    courseId: 'course-3',
    courseName: 'Sales Excellence Training',
    courseColor: courseColourMap['course-3'] ?? 'bg-green-100 text-green-700',
    title: 'Role-play assessment — can we record and submit asynchronously?',
    authorName: 'g.harris',
    authorCompany: 'Ironwood Industries',
    timestamp: '6 days ago',
    preview: "Our team is spread across three shifts and scheduling a live role-play session together is really difficult. Is it acceptable to record each person's role-play separately and submit the video?",
    replyCount: 2,
    views: 17,
    lastReplyBy: 'safety.ironwood',
    lastReplyAt: '5 days ago',
    isResolved: true,
  },

  // ── Data Analytics for Business ────────────────────────────────
  {
    id: 'cd-7',
    courseId: 'course-4',
    courseName: 'Data Analytics for Business',
    courseColor: courseColourMap['course-4'] ?? 'bg-orange-100 text-orange-700',
    title: 'Module 6 — Power BI or Tableau for the capstone project?',
    authorName: 'dev.ramos',
    authorCompany: 'Nexus Technologies',
    timestamp: '5 hours ago',
    preview: "The capstone brief says to use 'a BI tool of your choice'. Our company uses Tableau but the course demos are all in Power BI. Will the assessor be okay with Tableau visualisations?",
    replyCount: 1,
    views: 9,
    lastReplyBy: 'outdure',
    lastReplyAt: '4 hours ago',
  },
  {
    id: 'cd-8',
    courseId: 'course-4',
    courseName: 'Data Analytics for Business',
    courseColor: courseColourMap['course-4'] ?? 'bg-orange-100 text-orange-700',
    title: 'Regression analysis — interpreting a negative R² value?',
    authorName: 'ms.wilson',
    authorCompany: 'Stellar Academy',
    timestamp: '2 weeks ago',
    preview: "I'm getting a negative R² in my module 7 regression exercise. The course material says R² ranges from 0 to 1, but mine is showing -0.14. Is this a data error or can this actually happen?",
    replyCount: 6,
    views: 48,
    lastReplyBy: 'dean.stellar',
    lastReplyAt: '10 days ago',
    isAnswered: true,
  },

  // ── Project Management Professional ────────────────────────────
  {
    id: 'cd-9',
    courseId: 'course-5',
    courseName: 'Project Management Professional',
    courseColor: courseColourMap['course-5'] ?? 'bg-yellow-100 text-yellow-700',
    title: 'Agile vs Waterfall — which does the exam favour?',
    authorName: 'n.osei',
    authorCompany: 'Crestview Health',
    timestamp: '3 days ago',
    preview: "Preparing for the PMP exam and I'm getting conflicting signals. Some practice questions seem to strongly prefer Agile answers even for traditional project scenarios. Is this intentional in the current exam format?",
    replyCount: 7,
    views: 55,
    lastReplyBy: 'hr.crestview',
    lastReplyAt: '2 days ago',
    isPinned: true,
    isAnswered: true,
  },
  {
    id: 'cd-10',
    courseId: 'course-5',
    courseName: 'Project Management Professional',
    courseColor: courseColourMap['course-5'] ?? 'bg-yellow-100 text-yellow-700',
    title: 'Risk register template — does anyone have one to share?',
    authorName: 't.nguyen',
    authorCompany: 'Ironwood Industries',
    timestamp: '1 week ago',
    preview: "Module 8 walks through risk registers but doesn't provide a downloadable template. Has anyone built one from the course content they'd be willing to share in this space?",
    replyCount: 5,
    views: 39,
    lastReplyBy: 'safety.ironwood',
    lastReplyAt: '6 days ago',
    isAnswered: true,
  },

  // ── Effective Team Communication ────────────────────────────────
  {
    id: 'cd-11',
    courseId: 'course-6',
    courseName: 'Effective Team Communication',
    courseColor: courseColourMap['course-6'] ?? 'bg-teal-100 text-teal-700',
    title: 'Active listening exercise — is it okay to use existing meeting recordings?',
    authorName: 'j.kim',
    authorCompany: 'Nexus Technologies',
    timestamp: '2 days ago',
    preview: "The module 3 active listening exercise asks us to record a conversation and analyse it. Can we use recordings from real team meetings (with consent) or does it need to be a new recording made for the exercise?",
    replyCount: 2,
    views: 14,
    lastReplyBy: 'admin.nexus',
    lastReplyAt: '1 day ago',
    isResolved: true,
  },
  {
    id: 'cd-12',
    courseId: 'course-6',
    courseName: 'Effective Team Communication',
    courseColor: courseColourMap['course-6'] ?? 'bg-teal-100 text-teal-700',
    title: 'Cross-cultural communication — module 5 seems very Western-centric',
    authorName: 'n.osei',
    authorCompany: 'Crestview Health',
    timestamp: '3 weeks ago',
    preview: "The cross-cultural section of module 5 references mostly US/UK business norms. Our team includes staff from West Africa and Southeast Asia and the examples don't always apply. Is there supplementary content?",
    replyCount: 9,
    views: 68,
    lastReplyBy: 'hr.crestview',
    lastReplyAt: '2 weeks ago',
    isAnswered: true,
  },

  // ── Welcome – Staff ────────────────────────────────────────────
  {
    id: 'cd-13',
    courseId: 'course-welcome-staff',
    courseName: 'Welcome - Staff',
    courseColor: courseColourMap['course-welcome-staff'] ?? 'bg-indigo-100 text-indigo-700',
    title: 'Onboarding checklist — where do I find my IT setup tasks?',
    authorName: 'new.hire.2024',
    authorCompany: 'Outdure Pty Ltd',
    timestamp: '1 day ago',
    preview: "Just started this week and I've completed the Welcome course. The course mentions an IT onboarding checklist but I can't find a link. Has this been updated?",
    replyCount: 1,
    views: 6,
    lastReplyBy: 'outdure',
    lastReplyAt: '22 hours ago',
  },

  // ── Who are we? ────────────────────────────────────────────────
  {
    id: 'cd-14',
    courseId: 'course-who-are-we',
    courseName: 'Who are we?',
    courseColor: courseColourMap['course-who-are-we'] ?? 'bg-pink-100 text-pink-700',
    title: 'Would love more case studies showing real client success stories',
    authorName: 'ms.wilson',
    authorCompany: 'Stellar Academy',
    timestamp: '1 month ago',
    preview: "The 'Who are we?' course gives a great overview of the company vision but I think it would be even stronger with 2–3 real client case studies. Is this planned for a future update?",
    replyCount: 3,
    views: 31,
    lastReplyBy: 'outdure',
    lastReplyAt: '3 weeks ago',
    isAnswered: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Discussion replies & viewers mock data
// ─────────────────────────────────────────────────────────────────────────────

interface DiscReply {
  id: string;
  authorName: string;
  authorCompany: string;
  authorBadge?: string;
  timestamp: string;
  content: string;
  isAnswer?: boolean;
  likes: number;
}

interface DiscViewer {
  name: string;
  company: string;
  viewedAt: string;
}

const DISCUSSION_REPLIES: Record<string, DiscReply[]> = {
  'cd-1': [
    { id: 'r1', authorName: 'safety.ironwood', authorCompany: 'Ironwood Industries', authorBadge: 'Management', timestamp: '1 day ago', content: 'Great question. In scenario B, both isolation points must be locked out per AS/NZS 4024.1602. The quiz only tests the primary isolation but the full procedure requires both. I\'ve flagged this for a module update.', isAnswer: true, likes: 6 },
    { id: 'r2', authorName: 't.nguyen',        authorCompany: 'Ironwood Industries', timestamp: '1 day ago', content: 'Confirmed — our site supervisor clarified the same thing during our toolbox talk this morning.', likes: 2 },
    { id: 'r3', authorName: 'g.harris',        authorCompany: 'Ironwood Industries', timestamp: '23 hours ago', content: 'Thanks both, that makes sense. Should we document our secondary isolation steps separately in our SWMS?', likes: 1 },
    { id: 'r4', authorName: 'safety.ironwood', authorCompany: 'Ironwood Industries', authorBadge: 'Management', timestamp: '22 hours ago', content: 'Yes, absolutely — your SWMS should capture every isolation point regardless of what the quiz tests.', likes: 4 },
    { id: 'r5', authorName: 'j.torres',        authorCompany: 'Ironwood Industries', timestamp: '20 hours ago', content: 'Good to know. I had the same confusion on night shift last week.', likes: 0 },
  ],
  'cd-2': [
    { id: 'r1', authorName: 'training.meridian', authorCompany: 'Meridian Group', authorBadge: 'Management', timestamp: '2 days ago', content: 'Hi Sarah — the answer is "Coaching". Delegating applies when the person is both capable AND motivated. When motivation is low despite high capability, the Coaching style maintains engagement. Great question!', isAnswer: true, likes: 9 },
    { id: 'r2', authorName: 'a.brooks', authorCompany: 'Meridian Group', timestamp: '2 days ago', content: 'I got that one wrong too — the wording is tricky. Thanks for explaining!', likes: 3 },
    { id: 'r3', authorName: 'sarah.k', authorCompany: 'Meridian Group', timestamp: '1 day ago', content: 'That makes total sense now. The explanation in the course feedback said "Coaching" but didn\'t explain why. This clears it up completely.', likes: 2 },
    { id: 'r4', authorName: 'l.chen', authorCompany: 'BluePeak Consulting', timestamp: '1 day ago', content: 'Same confusion here — really helpful thread.', likes: 1 },
  ],
  'cd-3': [
    { id: 'r1', authorName: 'hr.bluepeak', authorCompany: 'BluePeak Consulting', authorBadge: 'Management', timestamp: '1 day ago', content: 'The assignment uses Google Ads\' Keyword Planner and campaign builder in free preview mode — no billing required. You won\'t be charged anything. Full steps in the assignment brief PDF on page 3.', isAnswer: true, likes: 5 },
    { id: 'r2', authorName: 'l.chen', authorCompany: 'BluePeak Consulting', timestamp: '22 hours ago', content: 'Perfect, thank you! Found the PDF — page 3 is very clear about the preview mode steps.', likes: 1 },
    { id: 'r3', authorName: 'r.patel', authorCompany: 'Nexus Technologies', timestamp: '20 hours ago', content: 'Good to know — I had the same concern. Starting the assignment tonight.', likes: 0 },
  ],
  'cd-4': [
    { id: 'r1', authorName: 'admin.nexus', authorCompany: 'Nexus Technologies', authorBadge: 'Management', timestamp: '5 days ago', content: 'Great strategic question. For a B2B SaaS with a 6-month cycle, SEO is almost always the better long-term play. SEM burns budget fast and B2B buyers research extensively before converting — you want to own the organic rankings for high-intent queries.', isAnswer: false, likes: 12 },
    { id: 'r2', authorName: 'dev.ramos', authorCompany: 'Nexus Technologies', timestamp: '5 days ago', content: 'We ran SEM for 6 months and saw very low conversion. Shifted to SEO content strategy and organic leads quadrupled over 12 months. Anecdotal but directionally consistent.', likes: 8 },
    { id: 'r3', authorName: 'j.kim', authorCompany: 'Nexus Technologies', timestamp: '4 days ago', content: 'The module does touch on this in the "Channel mix" section of lesson 4 — worth a re-read with this question in mind.', likes: 3 },
    { id: 'r4', authorName: 'r.patel', authorCompany: 'Nexus Technologies', timestamp: '4 days ago', content: 'Thanks all. I think the nuance is that SEM is still useful for competitive terms while SEO builds. Not either/or.', likes: 5 },
    { id: 'r5', authorName: 'admin.nexus', authorCompany: 'Nexus Technologies', authorBadge: 'Management', timestamp: '3 days ago', content: 'Exactly right — the course calls this "the SEM bridge strategy" in module 4, lesson 6.', isAnswer: true, likes: 7 },
    { id: 'r6', authorName: 'l.chen', authorCompany: 'BluePeak Consulting', timestamp: '3 days ago', content: 'Really valuable discussion — bookmarking this for our Q4 planning.', likes: 2 },
    { id: 'r7', authorName: 'ms.wilson', authorCompany: 'Stellar Academy', timestamp: '2 days ago', content: 'This is the most useful thread I\'ve read all month. Thanks everyone!', likes: 4 },
    { id: 'r8', authorName: 'n.osei', authorCompany: 'Crestview Health', timestamp: '2 days ago', content: 'Saved. Great breakdown.', likes: 1 },
  ],
  'cd-5': [
    { id: 'r1', authorName: 'training.meridian', authorCompany: 'Meridian Group', authorBadge: 'Management', timestamp: '3 days ago', content: 'Absolutely — SPIN works brilliantly on video. The key is to slow down the Implication and Need-payoff questions. On video, silence after a question feels longer, so people tend to rush. Resist that urge and let the prospect think.', isAnswer: true, likes: 8 },
    { id: 'r2', authorName: 'a.brooks', authorCompany: 'Meridian Group', timestamp: '3 days ago', content: 'We\'ve also found that having your camera on a slightly lower angle helps maintain eye contact on video — tiny thing but it changes the dynamic.', likes: 5 },
    { id: 'r3', authorName: 'j.torres', authorCompany: 'Ironwood Industries', timestamp: '2 days ago', content: 'The implication question tip is gold. I\'ve been rushing those and I can feel the conversations losing depth. Trying this today.', likes: 3 },
    { id: 'r4', authorName: 'sarah.k', authorCompany: 'Meridian Group', timestamp: '2 days ago', content: 'Also worth noting: on video you can\'t read body language as easily, so the Problem questions become even more important to establish genuine pain early.', likes: 6 },
    { id: 'r5', authorName: 'g.harris', authorCompany: 'Ironwood Industries', timestamp: '1 day ago', content: 'This thread should be pinned. So much practical value here.', likes: 4 },
    { id: 'r6', authorName: 'r.patel', authorCompany: 'Nexus Technologies', timestamp: '1 day ago', content: 'Completely agree. Pinning the answer and saving this.', likes: 2 },
    { id: 'r7', authorName: 'training.meridian', authorCompany: 'Meridian Group', authorBadge: 'Management', timestamp: '20 hours ago', content: 'Thanks all — I\'ll also flag this to the course author to add a "remote SPIN" supplementary note.', likes: 3 },
    { id: 'r8', authorName: 'l.chen', authorCompany: 'BluePeak Consulting', timestamp: '18 hours ago', content: 'Would love that! A short video walkthrough for remote SPIN would be fantastic.', likes: 1 },
    { id: 'r9', authorName: 'j.kim', authorCompany: 'Nexus Technologies', timestamp: '12 hours ago', content: 'Seconded — great idea.', likes: 0 },
  ],
  'cd-7': [
    { id: 'r1', authorName: 'outdure', authorCompany: 'Outdure Pty Ltd', authorBadge: 'Staff', timestamp: '4 hours ago', content: 'Yes — any BI tool is acceptable for the capstone. Tableau, Power BI, Looker, even Google Data Studio. The rubric assesses your analysis and storytelling, not the specific tool. You\'re fine with Tableau!', isAnswer: true, likes: 3 },
  ],
  'cd-8': [
    { id: 'r1', authorName: 'dean.stellar', authorCompany: 'Stellar Academy', authorBadge: 'Management', timestamp: '10 days ago', content: 'Yes, a negative R² can genuinely happen! It means your model performs worse than a horizontal baseline (the mean). This usually means you\'re fitting the wrong model type to the data — check whether a linear model even makes sense for your variables. Try plotting a scatter first.', isAnswer: true, likes: 9 },
    { id: 'r2', authorName: 'ms.wilson', authorCompany: 'Stellar Academy', timestamp: '10 days ago', content: 'Oh wow — I didn\'t know that was even possible. The course only ever showed examples with positive values. Will re-plot the scatter now.', likes: 3 },
    { id: 'r3', authorName: 'n.osei', authorCompany: 'Crestview Health', timestamp: '9 days ago', content: 'I had the same issue in module 7 — turned out I had an outlier that was wrecking the fit. Removing it brought R² to 0.71.', likes: 4 },
    { id: 'r4', authorName: 'ms.wilson', authorCompany: 'Stellar Academy', timestamp: '9 days ago', content: 'Update: re-plotted and found a clear quadratic pattern. Switched to polynomial regression and R² jumped to 0.83. Thanks so much!', likes: 7 },
    { id: 'r5', authorName: 'dean.stellar', authorCompany: 'Stellar Academy', authorBadge: 'Management', timestamp: '8 days ago', content: 'Perfect outcome — that\'s exactly the diagnostic process the course is trying to teach. Well done!', likes: 5 },
    { id: 'r6', authorName: 'a.brooks', authorCompany: 'Meridian Group', timestamp: '8 days ago', content: 'Bookmarking this thread. Really useful real-world debug session.', likes: 2 },
  ],
  'cd-9': [
    { id: 'r1', authorName: 'hr.crestview', authorCompany: 'Crestview Health', authorBadge: 'Management', timestamp: '2 days ago', content: 'Yes — the current PMP exam (since January 2021) is approximately 50% predictive (waterfall) and 50% agile/hybrid. When in doubt, the exam tends to favour adaptive approaches, stakeholder engagement, and servant leadership. Don\'t treat it as purely waterfall.', isAnswer: true, likes: 11 },
    { id: 'r2', authorName: 'n.osei', authorCompany: 'Crestview Health', timestamp: '2 days ago', content: 'That split is higher than I thought for Agile. Going to re-weight my study time. Thanks!', likes: 3 },
    { id: 'r3', authorName: 'j.torres', authorCompany: 'Ironwood Industries', timestamp: '1 day ago', content: 'Also worth doing the PMI practice exams on their site — they reflect the real balance much better than third-party banks.', likes: 5 },
    { id: 'r4', authorName: 'g.harris', authorCompany: 'Ironwood Industries', timestamp: '1 day ago', content: 'The Agile Practice Guide (free for PMI members) is essential reading alongside this course.', likes: 4 },
    { id: 'r5', authorName: 'dev.ramos', authorCompany: 'Nexus Technologies', timestamp: '22 hours ago', content: 'Sitting the exam next month — this is very helpful. Adjusting my prep accordingly.', likes: 2 },
    { id: 'r6', authorName: 'hr.crestview', authorCompany: 'Crestview Health', authorBadge: 'Management', timestamp: '20 hours ago', content: 'Good luck! Make sure you\'re comfortable with Kanban, Scrum and hybrid scenarios specifically — they come up a lot.', likes: 3 },
    { id: 'r7', authorName: 'n.osei', authorCompany: 'Crestview Health', timestamp: '18 hours ago', content: 'Will do. Fingers crossed!', likes: 1 },
  ],
  'cd-10': [
    { id: 'r1', authorName: 'safety.ironwood', authorCompany: 'Ironwood Industries', authorBadge: 'Management', timestamp: '6 days ago', content: 'Yes! I\'ve built a simple risk register in Google Sheets based on module 8. DM me and I\'ll share the link. It includes probability × impact scoring, RAG status, mitigation fields and owner columns.', isAnswer: true, likes: 8 },
    { id: 'r2', authorName: 't.nguyen', authorCompany: 'Ironwood Industries', timestamp: '6 days ago', content: 'DM sent — thank you!', likes: 1 },
    { id: 'r3', authorName: 'a.brooks', authorCompany: 'Meridian Group', timestamp: '5 days ago', content: 'Is there any chance of sharing this in the space rather than DM? Would be useful for everyone.', likes: 6 },
    { id: 'r4', authorName: 'safety.ironwood', authorCompany: 'Ironwood Industries', authorBadge: 'Management', timestamp: '5 days ago', content: 'Good idea — I\'ll clean it up and post the link here this week.', likes: 4 },
    { id: 'r5', authorName: 'j.kim', authorCompany: 'Nexus Technologies', timestamp: '4 days ago', content: 'Looking forward to it — will save me starting from scratch.', likes: 2 },
  ],
  'cd-11': [
    { id: 'r1', authorName: 'admin.nexus', authorCompany: 'Nexus Technologies', authorBadge: 'Management', timestamp: '1 day ago', content: 'Existing recordings are absolutely fine as long as all participants have consented to the recording being used for educational purposes. Just include a consent note in your submission. New recordings aren\'t required.', isAnswer: true, likes: 4 },
    { id: 'r2', authorName: 'j.kim', authorCompany: 'Nexus Technologies', timestamp: '22 hours ago', content: 'Perfect — we already have consent clauses in our standard meeting agreements. Will note it in the submission. Thanks!', likes: 1 },
  ],
  'cd-12': [
    { id: 'r1', authorName: 'hr.crestview', authorCompany: 'Crestview Health', authorBadge: 'Management', timestamp: '2 weeks ago', content: 'Thank you for raising this — it\'s really important feedback. I\'ve escalated it to the course author. There is a supplementary reading list in the Resources tab that includes Hofstede\'s Cultural Dimensions and Erin Meyer\'s "The Culture Map" which directly addresses non-Western contexts.', likes: 7 },
    { id: 'r2', authorName: 'n.osei', authorCompany: 'Crestview Health', timestamp: '2 weeks ago', content: 'Thanks — found The Culture Map. It\'s exactly what was missing. Would be great if it was integrated into the module itself rather than just a reading list though.', likes: 5 },
    { id: 'r3', authorName: 'outdure', authorCompany: 'Outdure Pty Ltd', authorBadge: 'Staff', timestamp: '13 days ago', content: 'Noted — we\'ve passed this to the content team. A module 5 refresh with broader cultural examples is now on the roadmap for Q3.', isAnswer: true, likes: 8 },
    { id: 'r4', authorName: 'ms.wilson', authorCompany: 'Stellar Academy', timestamp: '12 days ago', content: 'Really glad this was raised and actioned. This is exactly the kind of platform feedback loop that makes courses better.', likes: 4 },
    { id: 'r5', authorName: 'l.chen', authorCompany: 'BluePeak Consulting', timestamp: '11 days ago', content: 'Agreed — and the interim reading list is genuinely excellent. Erin Meyer is a game changer.', likes: 3 },
    { id: 'r6', authorName: 'a.brooks', authorCompany: 'Meridian Group', timestamp: '10 days ago', content: 'Added to our team reading list. Thanks for the recommendation.', likes: 2 },
    { id: 'r7', authorName: 'n.osei', authorCompany: 'Crestview Health', timestamp: '9 days ago', content: 'Looking forward to the Q3 update!', likes: 1 },
    { id: 'r8', authorName: 'dev.ramos', authorCompany: 'Nexus Technologies', timestamp: '8 days ago', content: 'Great thread. Will share with our L&D team.', likes: 0 },
    { id: 'r9', authorName: 'j.torres', authorCompany: 'Ironwood Industries', timestamp: '7 days ago', content: 'Seconded — thanks everyone.', likes: 0 },
  ],
};

const VIEWER_POOL: { name: string; company: string }[] = [
  { name: 'sarah.k',           company: 'Meridian Group'       },
  { name: 'a.brooks',          company: 'Meridian Group'       },
  { name: 'j.torres',          company: 'Ironwood Industries'  },
  { name: 'g.harris',          company: 'Ironwood Industries'  },
  { name: 't.nguyen',          company: 'Ironwood Industries'  },
  { name: 'dev.ramos',         company: 'Nexus Technologies'   },
  { name: 'admin.nexus',       company: 'Nexus Technologies'   },
  { name: 'j.kim',             company: 'Nexus Technologies'   },
  { name: 'l.chen',            company: 'BluePeak Consulting'  },
  { name: 'r.patel',           company: 'BluePeak Consulting'  },
  { name: 'hr.bluepeak',       company: 'BluePeak Consulting'  },
  { name: 'ms.wilson',         company: 'Stellar Academy'      },
  { name: 'dean.stellar',      company: 'Stellar Academy'      },
  { name: 'n.osei',            company: 'Crestview Health'     },
  { name: 'hr.crestview',      company: 'Crestview Health'     },
  { name: 'training.meridian', company: 'Meridian Group'       },
  { name: 'safety.ironwood',   company: 'Ironwood Industries'  },
  { name: 'outdure',           company: 'Outdure Pty Ltd'      },
];

const VIEW_TIMES = ['just now','5 min ago','12 min ago','28 min ago','1 hour ago','2 hours ago','3 hours ago','yesterday','2 days ago','3 days ago','4 days ago','5 days ago','1 week ago','2 weeks ago'];

function getViewers(disc: CourseDiscussion): DiscViewer[] {
  // Deterministic "random" selection based on disc.id so it's stable
  const seed   = disc.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const count  = Math.min(disc.views, VIEWER_POOL.length);
  const result: DiscViewer[] = [];
  for (let i = 0; i < count; i++) {
    const poolIdx = (seed + i * 7) % VIEWER_POOL.length;
    const timeIdx = (seed + i * 3) % VIEW_TIMES.length;
    const v = VIEWER_POOL[poolIdx];
    if (!result.find(r => r.name === v.name)) {
      result.push({ ...v, viewedAt: VIEW_TIMES[timeIdx] });
    }
  }
  return result;
}

type MainTab = 'community' | 'course' | 'collections';
type ActiveView = 'space' | 'discussions' | 'mentions' | 'replies';
type DetailTab = 'post' | 'viewers' | 'replies';

// ─────────────────────────────────────────────────────────────────────────────
// Mentions data
// ─────────────────────────────────────────────────────────────────────────────

interface MentionNotification {
  id: string;
  fromName: string;
  fromCompany: string;
  fromRole: 'admin' | 'manager' | 'employee' | 'staff';
  mentionedName: string;
  mentionedRole: string;
  context: string;          // full snippet; wrap @handle in special marker
  source: 'space' | 'discussion';
  sourceName: string;
  timestamp: string;
  isRead: boolean;
}

const INITIAL_MENTIONS: MentionNotification[] = [
  {
    id: 'm-1',
    fromName: 'g.harris',
    fromCompany: 'Ironwood Industries',
    fromRole: 'employee',
    mentionedName: 'safety.ironwood',
    mentionedRole: 'Admin · Ironwood Industries',
    context: 'Hey @safety.ironwood — can you confirm whether shift B supervisors also need to complete the updated LOTO module, or is it only for floor operators?',
    source: 'space',
    sourceName: 'Ironwood Industries',
    timestamp: '2 hours ago',
    isRead: false,
  },
  {
    id: 'm-2',
    fromName: 'dev.ramos',
    fromCompany: 'Nexus Technologies',
    fromRole: 'employee',
    mentionedName: 'admin.nexus',
    mentionedRole: 'Admin · Nexus Technologies',
    context: '@admin.nexus the AWS lab for module 6 is still timing out for three of us. Can you raise this with the platform team? We\'re blocked on the capstone.',
    source: 'discussion',
    sourceName: 'AWS Solutions Architect',
    timestamp: '4 hours ago',
    isRead: false,
  },
  {
    id: 'm-3',
    fromName: 'r.patel',
    fromCompany: 'BluePeak Consulting',
    fromRole: 'employee',
    mentionedName: 'hr.bluepeak',
    mentionedRole: 'Manager · BluePeak Consulting',
    context: '@hr.bluepeak just a heads up — four consultants on the Meridian account haven\'t started the Client Engagement module yet. Worth sending a nudge before the deadline?',
    source: 'space',
    sourceName: 'BluePeak Consulting',
    timestamp: '6 hours ago',
    isRead: false,
  },
  {
    id: 'm-4',
    fromName: 'ms.wilson',
    fromCompany: 'Stellar Academy',
    fromRole: 'employee',
    mentionedName: 'dean.stellar',
    mentionedRole: 'Admin · Stellar Academy',
    context: 'Loving the new Instructional Design bundle @dean.stellar! Any chance we could get a supplementary reading list added to module 3? The Bloom\'s taxonomy section could really use some extra resources.',
    source: 'discussion',
    sourceName: 'Instructional Design',
    timestamp: '1 day ago',
    isRead: false,
  },
  {
    id: 'm-5',
    fromName: 'a.brooks',
    fromCompany: 'Meridian Group',
    fromRole: 'employee',
    mentionedName: 'training.meridian',
    mentionedRole: 'Manager · Meridian Group',
    context: '@training.meridian our team finished the AML module but the completion certificates haven\'t come through yet. It\'s been 3 days — is there a delay on the system?',
    source: 'space',
    sourceName: 'Meridian Group',
    timestamp: '1 day ago',
    isRead: true,
  },
  {
    id: 'm-6',
    fromName: 'j.torres',
    fromCompany: 'Ironwood Industries',
    fromRole: 'employee',
    mentionedName: 'outdure',
    mentionedRole: 'Staff · Outdure Pty Ltd',
    context: 'Hey @outdure — we\'ve noticed the video player freezes on lesson 4 of the safety module when using Chrome on Windows 11. Can you look into this? It\'s affecting about 12 of our users.',
    source: 'space',
    sourceName: 'Ironwood Industries',
    timestamp: '2 days ago',
    isRead: true,
  },
  {
    id: 'm-7',
    fromName: 'n.osei',
    fromCompany: 'Crestview Health',
    fromRole: 'employee',
    mentionedName: 'hr.crestview',
    mentionedRole: 'Manager · Crestview Health',
    context: '@hr.crestview I\'ve completed the Mental Health First Aid cert but I can\'t find where to submit my CPD evidence form. Can you point me to the right place?',
    source: 'discussion',
    sourceName: 'Mental Health First Aid',
    timestamp: '2 days ago',
    isRead: true,
  },
  {
    id: 'm-8',
    fromName: 'l.chen',
    fromCompany: 'BluePeak Consulting',
    fromRole: 'employee',
    mentionedName: 'admin.nexus',
    mentionedRole: 'Admin · Nexus Technologies',
    context: 'Great breakdown on the SEO vs SEM question @admin.nexus — shared this thread with our whole marketing team. Would you be open to running a short Q&A session on this?',
    source: 'discussion',
    sourceName: 'Digital Marketing Mastery',
    timestamp: '3 days ago',
    isRead: true,
  },
  {
    id: 'm-9',
    fromName: 't.nguyen',
    fromCompany: 'Ironwood Industries',
    fromRole: 'employee',
    mentionedName: 'safety.ironwood',
    mentionedRole: 'Admin · Ironwood Industries',
    context: 'Shift C is at 94% completion on the safety modules @safety.ironwood — 3 people left, targeting 100% by end of week. Should we mark these as priority for this Friday\'s audit?',
    source: 'space',
    sourceName: 'Ironwood Industries',
    timestamp: '4 days ago',
    isRead: true,
  },
  {
    id: 'm-10',
    fromName: 'sarah.k',
    fromCompany: 'Meridian Group',
    fromRole: 'employee',
    mentionedName: 'training.meridian',
    mentionedRole: 'Manager · Meridian Group',
    context: '@training.meridian the conflict resolution case study in module 2 is excellent. Is there any chance of adding a version tailored to remote/hybrid teams? That\'s our biggest pain point right now.',
    source: 'discussion',
    sourceName: 'Business Leadership Essentials',
    timestamp: '5 days ago',
    isRead: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Course Space Posts (keyed by course ID)
// ─────────────────────────────────────────────────────────────────────────────

const COURSE_SPACE_POSTS: Record<string, CommunityPost[]> = {
  'course-1': [
    {
      id: 'csp-1-1', authorName: 'outdure', authorBadge: 'Staff', timestamp: '2 weeks ago',
      content: '📣 Module 5 — Executive Communication is now live!\n\nThis module covers board-level reporting, strategic narrative frameworks, and stakeholder presentations. It includes a graded presentation assignment due at the end of the module. Reach out if you have questions.',
      likes: 18, upvotes: 12,
      comments: [
        { id: 'c1', author: 'training.meridian', content: 'Great timing — we have a board presentation next month. Starting this with the leadership team today.', timestamp: '2 weeks ago' },
        { id: 'c2', author: 'sarah.k', content: 'Love the new format for the assignment brief — much clearer than module 4.', timestamp: '11 days ago' },
      ],
    },
    {
      id: 'csp-1-2', authorName: 'sarah.k', timestamp: '1 week ago',
      content: 'Sharing a resource that really helped me with the Situational Leadership section — Ken Blanchard\'s original 1985 paper is freely available on ResearchGate and goes much deeper than the module summary. Highly recommend reading it alongside lesson 3.',
      likes: 14, upvotes: 9,
      comments: [
        { id: 'c3', author: 'a.brooks', content: 'Just found it — brilliant read. Thank you!', timestamp: '6 days ago' },
      ],
    },
    {
      id: 'csp-1-3', authorName: 'training.meridian', authorBadge: 'Management', timestamp: '3 days ago',
      content: '🏆 Meridian Group has 100% module completion through Module 4! Special shoutout to the risk team for finishing the batch assessment together. Certificates for modules 1–4 are in your inboxes.',
      likes: 31, upvotes: 22,
      comments: [
        { id: 'c4', author: 'a.brooks', content: 'Teamwork makes the dream work! 🎉', timestamp: '3 days ago' },
        { id: 'c5', author: 'j.torres', content: 'Congratulations Meridian! Setting the bar high for the rest of us.', timestamp: '2 days ago' },
      ],
    },
  ],
  'course-2': [
    {
      id: 'csp-2-1', authorName: 'outdure', authorBadge: 'Staff', timestamp: '1 month ago',
      content: '📋 Assignment Brief Update — Module 5 (Google Ads Practical)\n\nWe\'ve updated the assignment brief to clarify that you should use Google Ads\' free preview/simulation mode — no real budget required. The updated PDF is in the Resources tab. Apologies for any confusion.',
      likes: 11, upvotes: 8,
      comments: [
        { id: 'c1', author: 'l.chen', content: 'Thank you for clarifying — I was about to set up a billing account! 😅', timestamp: '1 month ago' },
        { id: 'c2', author: 'r.patel', content: 'Updated brief is much clearer. Great course overall.', timestamp: '4 weeks ago' },
      ],
    },
    {
      id: 'csp-2-2', authorName: 'dev.ramos', timestamp: '3 weeks ago',
      content: 'Pro tip for the SEO audit assignment: use Google Search Console\'s "Coverage" report alongside the Lighthouse audit the module recommends. You get a much richer picture of crawl issues. Saved me hours when doing the assignment for our actual company site.',
      likes: 23, upvotes: 15,
      comments: [
        { id: 'c3', author: 'j.kim', content: 'This is gold — didn\'t know GSC had that view. Adding it to my process.', timestamp: '3 weeks ago' },
        { id: 'c4', author: 'admin.nexus', content: 'Excellent tip. We\'re going to incorporate this into our team\'s monthly reporting.', timestamp: '2 weeks ago' },
      ],
    },
    {
      id: 'csp-2-3', authorName: 'hr.bluepeak', authorBadge: 'Management', timestamp: '1 week ago',
      content: 'Reminder: Module 7 (Analytics & Attribution) quiz closes this Friday. Three consultants still haven\'t attempted it — you know who you are! 😄 Please complete it before the weekend.',
      likes: 5, upvotes: 3,
      comments: [],
    },
  ],
  'course-3': [
    {
      id: 'csp-3-1', authorName: 'outdure', authorBadge: 'Staff', timestamp: '6 weeks ago',
      content: '🎙️ New addition to Sales Excellence — Live Role-Play Sessions!\n\nWe\'re running optional live Zoom role-play sessions every second Thursday at 2pm AEST. These are facilitated by a senior sales coach and count toward your Module 4 assessment. Book via the calendar link in the Resources tab.',
      likes: 27, upvotes: 19,
      comments: [
        { id: 'c1', author: 'j.torres', content: 'Just booked for next Thursday. Really appreciate the live option!', timestamp: '6 weeks ago' },
        { id: 'c2', author: 'g.harris', content: 'Our shift schedule makes it hard to attend live — will there be recordings?', timestamp: '5 weeks ago' },
        { id: 'c3', author: 'outdure', content: 'Yes! All sessions will be recorded and uploaded to the Resources tab within 24 hours.', timestamp: '5 weeks ago' },
      ],
    },
    {
      id: 'csp-3-2', authorName: 'j.torres', timestamp: '2 weeks ago',
      content: 'For anyone doing the negotiation module — I found the "Never Split the Difference" audiobook (Chris Voss) pairs incredibly well with Module 6. It\'s on Audible and covers tactical empathy in a way that directly mirrors the SPIN negotiation section.',
      likes: 19, upvotes: 13,
      comments: [
        { id: 'c4', author: 'sarah.k', content: 'Read that book last year — great recommendation. It definitely unlocks the "Implication questions" section of SPIN.', timestamp: '2 weeks ago' },
      ],
    },
    {
      id: 'csp-3-3', authorName: 'training.meridian', authorBadge: 'Management', timestamp: '4 days ago',
      content: '📊 Q2 Sales Training Results — Meridian Group\n\nWe\'ve seen a 23% improvement in average deal close rates since completing modules 1–4. Sharing this with the group as proof that the training is translating to real outcomes. Keep going everyone!',
      likes: 44, upvotes: 31,
      comments: [
        { id: 'c5', author: 'j.torres', content: '23%!! That\'s incredible. Proof that the investment is worth it.', timestamp: '4 days ago' },
        { id: 'c6', author: 'outdure', content: 'This is exactly the kind of outcome we build these courses for. Thank you for sharing, training.meridian! 🙌', timestamp: '3 days ago' },
      ],
    },
  ],
  'course-4': [
    {
      id: 'csp-4-1', authorName: 'outdure', authorBadge: 'Staff', timestamp: '5 weeks ago',
      content: '📊 Capstone Project — Submission Portal Now Open\n\nYou can now submit your capstone BI dashboard via the Assignments tab. Any BI tool is acceptable (Power BI, Tableau, Looker, Google Data Studio). Rubric is in the Resources tab — please review it before submitting.',
      likes: 15, upvotes: 10,
      comments: [
        { id: 'c1', author: 'dev.ramos', content: 'Quick question — can we submit as a .pbix file or does it need to be a published link?', timestamp: '5 weeks ago' },
        { id: 'c2', author: 'outdure', content: 'Either works! .pbix, Tableau workbook, or a published link — just make sure the assessor can view it without a paid licence.', timestamp: '5 weeks ago' },
      ],
    },
    {
      id: 'csp-4-2', authorName: 'ms.wilson', timestamp: '3 weeks ago',
      content: 'For anyone struggling with the Module 7 regression exercises — I hit a negative R² issue and the thread in Course Discussions has a brilliant walkthrough from dean.stellar. Saved my assignment. Go check it out if you\'re confused by non-linear data!',
      likes: 12, upvotes: 8,
      comments: [
        { id: 'c3', author: 'n.osei', content: 'That thread was great — I had the same issue. Polynomial regression was the fix for me too.', timestamp: '3 weeks ago' },
      ],
    },
    {
      id: 'csp-4-3', authorName: 'dean.stellar', authorBadge: 'Management', timestamp: '1 week ago',
      content: '🎓 Stellar Academy has completed Module 8 — all 43 learners! The data literacy across the team has grown noticeably. We\'re now applying the analytics frameworks to our own course performance metrics.',
      likes: 38, upvotes: 26,
      comments: [
        { id: 'c4', author: 'ms.wilson', content: 'So proud of what this team has achieved. Module 8 was no easy feat!', timestamp: '6 days ago' },
        { id: 'c5', author: 'outdure', content: 'Incredible result — and applying it internally is exactly the right move. Well done Stellar! 🌟', timestamp: '5 days ago' },
      ],
    },
  ],
  'course-5': [
    {
      id: 'csp-5-1', authorName: 'outdure', authorBadge: 'Staff', timestamp: '2 months ago',
      content: '📌 Important — PMP Exam Alignment Update\n\nAs of Jan 2021 the PMP exam is ~50% agile/hybrid. Our Module 9 has been updated to reflect the current exam format with new practice questions and a revised mock exam. If you started Module 9 before March, please re-take the updated mock exam.',
      likes: 22, upvotes: 16,
      comments: [
        { id: 'c1', author: 'n.osei', content: 'Great to know — just re-did the mock and the new questions are much more representative.', timestamp: '2 months ago' },
        { id: 'c2', author: 'hr.crestview', content: 'Thank you for the heads up. Updating our team study schedule accordingly.', timestamp: '2 months ago' },
      ],
    },
    {
      id: 'csp-5-2', authorName: 't.nguyen', timestamp: '3 weeks ago',
      content: 'For the risk register assignment — I built a Google Sheets template based on Module 8 with probability × impact scoring, RAG status, owner columns, and auto-calculated risk scores. Happy to share — drop me a comment and I\'ll post the link.',
      likes: 29, upvotes: 20,
      comments: [
        { id: 'c3', author: 'a.brooks', content: 'Yes please! This is exactly what I\'ve been trying to build.', timestamp: '3 weeks ago' },
        { id: 'c4', author: 'j.kim', content: 'Would love this — DM incoming!', timestamp: '2 weeks ago' },
        { id: 'c5', author: 'safety.ironwood', content: 'Saving this comment for when I get to Module 8. 👍', timestamp: '2 weeks ago' },
      ],
    },
    {
      id: 'csp-5-3', authorName: 'hr.crestview', authorBadge: 'Management', timestamp: '5 days ago',
      content: '🎉 Two Crestview Health team members sat and passed the PMP exam this week! Both scored in the "Above Target" band. This course was instrumental in their preparation. Thank you Outdure team for the quality of content.',
      likes: 51, upvotes: 35,
      comments: [
        { id: 'c6', author: 'n.osei', content: 'AMAZING!! Congratulations to them both!', timestamp: '5 days ago' },
        { id: 'c7', author: 'outdure', content: 'This is the best message we could receive. Congratulations to your team — incredibly well earned! 🏅', timestamp: '4 days ago' },
      ],
    },
  ],
  'course-6': [
    {
      id: 'csp-6-1', authorName: 'outdure', authorBadge: 'Staff', timestamp: '7 weeks ago',
      content: '🌏 Module 5 Update — Cross-Cultural Communication\n\nBased on community feedback we\'ve added supplementary content to Module 5 covering non-Western business communication contexts, including Hofstede\'s dimensions applied to African and Southeast Asian workplace norms. New reading list also added to Resources.',
      likes: 33, upvotes: 24,
      comments: [
        { id: 'c1', author: 'n.osei', content: 'This is exactly what was missing! Thank you for listening to the feedback.', timestamp: '7 weeks ago' },
        { id: 'c2', author: 'l.chen', content: 'The Erin Meyer content in the reading list is excellent. Well worth the read.', timestamp: '6 weeks ago' },
      ],
    },
    {
      id: 'csp-6-2', authorName: 'admin.nexus', authorBadge: 'Management', timestamp: '4 weeks ago',
      content: 'We\'ve been applying the "structured listening" technique from Module 3 in our weekly team standups — giving each person uninterrupted response time before discussion. The quality of our retrospectives has improved noticeably. Small change, big difference.',
      likes: 26, upvotes: 17,
      comments: [
        { id: 'c3', author: 'j.kim', content: 'We tried this in our sprint planning — the quieter team members started contributing so much more.', timestamp: '4 weeks ago' },
        { id: 'c4', author: 'hr.bluepeak', content: 'Stealing this for our next all-hands. Thank you!', timestamp: '3 weeks ago' },
      ],
    },
    {
      id: 'csp-6-3', authorName: 'j.kim', timestamp: '2 days ago',
      content: 'Module 6 wrap-up question — for the active listening assessment, does the recorded conversation need to be work-related, or can it be any conversation? The brief isn\'t totally clear on this.',
      likes: 2, upvotes: 1,
      comments: [
        { id: 'c5', author: 'outdure', content: 'Work conversations are preferred so the feedback is contextually relevant, but personal conversations are fine as long as all participants have consented to the recording being used for assessment purposes.', timestamp: '1 day ago' },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// PostComposer — toolbar with Format / Emoji / Mention / Image / File
// ─────────────────────────────────────────────────────────────────────────────

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  { label: 'Frequently Used', emojis: ['😊','😂','🥰','😎','🤩','🙌','👏','👍','🔥','🎉','✅','💡','📌','🚀','⭐','💯','🙏','❤️','💬','📣'] },
  { label: 'Smileys & People', emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖'] },
  { label: 'Animals & Nature', emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🪲','🦟','🦗','🕷','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🦭','🐊','🐅','🐆','��','🦍','🦧','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐈','🪶','🌸','🌺','🌻','🌹','🌷','🌿','🍀','🌱','🌲','🌳'] },
  { label: 'Food & Drink', emojis: ['🍎','🍊','🍋','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶','🫑','🧄','🧅','🥔','🍠','🫘','🌽','🍞','🥐','🥖','🫓','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🫔','🌮','🌯','🥙','🧆','🥚','🍜','🍝','🍛','🍲','🍱','🥟','🦪','🍣','🍤','🍙','🍚','🍘','🍥','🥮','🍡','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🧃','🥤','☕','🫖','🍵','🧋','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾'] },
  { label: 'Activities', emojis: ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🏓','🏸','🏒','🥊','🥋','🎯','⛳','🎣','🤿','🎽','🎿','🛷','🥌','🪃','🏹','🎪','🎭','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🎷','🎺','🎸','🎮','🕹','🎲','♟','🧩','🎴','🀄','🎰','🎳'] },
  { label: 'Travel & Places', emojis: ['🚗','🚕','🚙','🚌','🚎','🏎','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🛵','🏍','🛺','🚲','🛴','🛹','🛼','🚏','🛣','🛤','⛽','🚨','🚥','🚦','🛑','🚧','⚓','🪝','⛵','🛶','🚤','🛥','🛳','⛴','🚢','✈️','🛩','🛫','🛬','🪂','💺','🚁','🚟','🚠','🚡','🛰','🚀','🛸','🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏨','🏩','🏪','🏫','🏬','🏭','🗼','🗽','⛪','🕌','🛕','🕍','⛩','🕋','⛲','🌋','🗻','🏔','⛰','🏕','🏖','🏗','🌅','🌄','🌠','🎇','🎆','🌇','🌆','🏙','🌃','🌉','🌌','🌁'] },
  { label: 'Objects', emojis: ['⌚','📱','💻','⌨️','🖥','🖨','🖱','🕹','💾','💿','📀','📷','📸','📹','🎥','📽','🎞','📞','☎️','📟','📠','📺','📻','🧭','⏱','⏲','⏰','⌛','⏳','📡','🔋','🪫','🔌','💡','🔦','🕯','🪔','🧯','🛢','💰','💴','💵','💶','💷','💸','💳','🪙','💎','⚖️','🪜','🧰','🔧','🪛','🔩','⚙️','🗜','🔗','⛓','🧲','🪝','🪣','🔑','🗝','🔐','🔒','🔓','🚪','🪞','🪟','🛋','🪑','🚽','🚿','🛁','🧴','🧹','🧺','🧻','🪣','🧼','🫧','🧽','🧹','🪠','🔭','🔬','🩻','🩹','💊','💉','🩸','🧬','🦠','🩺'] },
  { label: 'Symbols', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕','🛑','⛔','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼️','⁉️','🔅','🔆','〽️','⚠️','🔱','♻️','✅','🔰','❎','🌐'] },
];

const MENTION_USERS = [
  'outdure','admin.nexus','l.chen','dev.ramos','r.patel',
  'a.brooks','j.torres','ms.wilson','g.harris','t.nguyen',
  'safety.ironwood','alice.op','bob.manager','carol.hr',
];

interface AttachedFile { name: string; size: string; type: 'image' | 'file'; preview?: string }

function PostComposer({
  onSubmit,
  placeholder = 'Write something…',
  showPoll = false,
}: {
  onSubmit: (html: string, poll?: Poll) => void;
  placeholder?: string;
  showPoll?: boolean;
}) {
  const [showFormatBar,   setShowFormatBar]   = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiSearch,     setEmojiSearch]     = useState('');
  const [emojiPos,        setEmojiPos]        = useState<{ top: number; left: number } | null>(null);
  const [showMentionDrop, setShowMentionDrop] = useState(false);
  const [mentionSearch,   setMentionSearch]   = useState('');
  const [attachments,     setAttachments]     = useState<AttachedFile[]>([]);
  const [isEmpty,         setIsEmpty]         = useState(true);
  const [showPollEditor,  setShowPollEditor]  = useState(false);
  const [pollQuestion,    setPollQuestion]    = useState('');
  const [pollOptions,     setPollOptions]     = useState(['', '']);
  const [activeFormats,   setActiveFormats]   = useState({
    bold: false, italic: false, underline: false,
    strikeThrough: false, h1: false, h2: false, pre: false,
  });

  const editRef     = useRef<HTMLDivElement>(null);
  const imageRef    = useRef<HTMLInputElement>(null);
  const fileRef     = useRef<HTMLInputElement>(null);
  const emojiRef    = useRef<HTMLDivElement>(null);
  const emojiBtnRef = useRef<HTMLButtonElement>(null);
  const mentionRef  = useRef<HTMLDivElement>(null);

  // Re-read active formats whenever the selection moves
  const updateActiveFormats = () => {
    const sel = window.getSelection();
    // Only update if selection is inside our editor
    if (!editRef.current || !sel || sel.rangeCount === 0) return;
    const node = sel.getRangeAt(0).commonAncestorContainer;
    if (!editRef.current.contains(node)) return;
    const block = (document.queryCommandValue('formatBlock') ?? '').toLowerCase();
    setActiveFormats({
      bold:          document.queryCommandState('bold'),
      italic:        document.queryCommandState('italic'),
      underline:     document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      h1:  block === 'h1',
      h2:  block === 'h2',
      pre: block === 'pre',
    });
  };

  // Close pickers on outside click + track selection changes
  useEffect(() => {
    const clickHandler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) { setShowEmojiPicker(false); setEmojiSearch(''); setEmojiPos(null); }
      if (mentionRef.current && !mentionRef.current.contains(e.target as Node)) setShowMentionDrop(false);
    };
    document.addEventListener('mousedown', clickHandler);
    document.addEventListener('selectionchange', updateActiveFormats);
    return () => {
      document.removeEventListener('mousedown', clickHandler);
      document.removeEventListener('selectionchange', updateActiveFormats);
    };
  }, []);

  // Track content changes in the contenteditable
  const handleInput = () => {
    const text = editRef.current?.innerText ?? '';
    setIsEmpty(text.trim() === '');
    // Detect @-mention typing
    const lastAt = text.lastIndexOf('@');
    if (lastAt !== -1) {
      const afterAt = text.slice(lastAt + 1);
      if (!afterAt.includes(' ') && !afterAt.includes('\n')) {
        setMentionSearch(afterAt.toLowerCase());
        setShowMentionDrop(true);
        return;
      }
    }
    setShowMentionDrop(false);
  };

  // Apply rich-text formatting via execCommand (onMouseDown preserves selection)
  const execFormat = (cmd: string, value?: string) => {
    editRef.current?.focus();
    document.execCommand(cmd, false, value);
    setIsEmpty((editRef.current?.innerText ?? '').trim() === '');
    // Re-read active state immediately after toggling
    setTimeout(updateActiveFormats, 0);
  };

  const insertEmoji = (emoji: string) => {
    editRef.current?.focus();
    document.execCommand('insertText', false, emoji);
    setIsEmpty(false);
    setShowEmojiPicker(false);
    setEmojiPos(null);
  };

  const insertMention = (user: string) => {
    editRef.current?.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      // Select back over @query and replace
      const steps = 1 + mentionSearch.length;
      for (let i = 0; i < steps; i++) {
        (sel as any).modify('extend', 'backward', 'character');
      }
      document.execCommand('insertText', false, '@' + user + ' ');
    }
    setShowMentionDrop(false);
    setMentionSearch('');
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setAttachments(prev => [...prev, {
        name: file.name, size: `${(file.size / 1024).toFixed(0)} KB`, type: 'image', preview: ev.target?.result as string,
      }]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach(file =>
      setAttachments(prev => [...prev, { name: file.name, size: `${(file.size / 1024).toFixed(0)} KB`, type: 'file' }])
    );
    e.target.value = '';
  };

  const removeAttachment = (i: number) => setAttachments(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = () => {
    const html = editRef.current?.innerHTML ?? '';
    const hasText = html.replace(/<[^>]*>/g, '').trim() !== '';
    const filledOptions = pollOptions.filter(o => o.trim());
    const hasPoll = showPollEditor && pollQuestion.trim() && filledOptions.length >= 2;
    if (!hasText && attachments.length === 0 && !hasPoll) return;
    const poll: Poll | undefined = hasPoll
      ? { question: pollQuestion.trim(), options: filledOptions.map(o => ({ text: o.trim(), votes: 0 })) }
      : undefined;
    onSubmit(html, poll);
    if (editRef.current) editRef.current.innerHTML = '';
    setIsEmpty(true);
    setAttachments([]);
    setShowFormatBar(false);
    setShowPollEditor(false);
    setPollQuestion('');
    setPollOptions(['', '']);
  };

  const filteredMentions = MENTION_USERS.filter(u => u.toLowerCase().includes(mentionSearch));

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      {/* Format bar */}
      {showFormatBar && (
        <div className="flex items-center gap-0.5 mb-2 pb-2 border-b border-gray-100">
          {([
            { label: 'B',   cmd: 'bold',          val: undefined,  cls: 'font-bold',   active: activeFormats.bold          },
            { label: 'I',   cmd: 'italic',         val: undefined,  cls: 'italic',      active: activeFormats.italic        },
            { label: 'U',   cmd: 'underline',      val: undefined,  cls: 'underline',   active: activeFormats.underline     },
            { label: '<>',  cmd: 'formatBlock',    val: 'pre',      cls: 'font-mono text-xs', active: activeFormats.pre    },
          ] as const).map(f => (
            <button key={f.label}
              onMouseDown={e => { e.preventDefault(); execFormat(f.cmd, f.val); }}
              className={`px-2 py-0.5 text-sm rounded transition-colors ${f.cls} ${f.active ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
              {f.label}
            </button>
          ))}
          <div className="w-px h-4 bg-gray-200 mx-1" />
          {([
            { label: 'H1', cmd: 'formatBlock', val: 'h1', cls: 'font-bold',    active: activeFormats.h1 },
            { label: 'H2', cmd: 'formatBlock', val: 'h2', cls: 'font-semibold', active: activeFormats.h2 },
          ] as const).map(f => (
            <button key={f.label}
              onMouseDown={e => { e.preventDefault(); execFormat(f.cmd, f.val); }}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${f.cls} ${f.active ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
              {f.label}
            </button>
          ))}
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <button
            onMouseDown={e => { e.preventDefault(); execFormat('strikeThrough'); }}
            className={`px-2 py-0.5 text-sm line-through rounded transition-colors ${activeFormats.strikeThrough ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
            S
          </button>
        </div>
      )}

      {/* Editor */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-teal-100 shrink-0 flex items-center justify-center text-teal-700 text-sm mt-0.5">☺</div>
        <div className="flex-1 relative">
          <div
            ref={editRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey && !showMentionDrop) { e.preventDefault(); handleSubmit(); }
              if (e.key === 'Escape') { setShowMentionDrop(false); setShowEmojiPicker(false); setEmojiSearch(''); setEmojiPos(null); }
            }}
            data-placeholder={placeholder}
            className={[
              'w-full min-h-[3rem] text-sm text-gray-700 outline-none bg-transparent',
              'leading-relaxed',
              '[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-1',
              '[&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-0.5',
              '[&_pre]:font-mono [&_pre]:bg-gray-100 [&_pre]:px-2 [&_pre]:py-0.5 [&_pre]:rounded [&_pre]:text-xs',
              '[&_b]:font-bold [&_strong]:font-bold',
              '[&_i]:italic [&_em]:italic',
              '[&_u]:underline',
              '[&_s]:line-through [&_del]:line-through [&_strike]:line-through',
              'before:content-[attr(data-placeholder)] before:text-gray-400 before:pointer-events-none',
              isEmpty ? 'before:block' : 'before:hidden',
            ].join(' ')}
          />

          {/* Mention dropdown */}
          {showMentionDrop && filteredMentions.length > 0 && (
            <div ref={mentionRef} className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-52 max-h-48 overflow-y-auto">
              {filteredMentions.map(u => (
                <button key={u} onMouseDown={e => { e.preventDefault(); insertMention(u); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 shrink-0">☺</div>
                  @{u}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {attachments.map((a, i) => (
            <div key={i} className="relative group">
              {a.type === 'image' && a.preview ? (
                <img src={a.preview} alt={a.name} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 max-w-[160px]">
                  <FileText className="size-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{a.name}</span>
                  <span className="text-gray-400 shrink-0">{a.size}</span>
                </div>
              )}
              <button onMouseDown={e => { e.preventDefault(); removeAttachment(i); }}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-700 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
            </div>
          ))}
        </div>
      )}

      {/* Poll editor */}
      {showPollEditor && (
        <div className="mt-3 border border-gray-200 rounded-lg bg-gray-50 p-3 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Poll</span>
            <button onClick={() => { setShowPollEditor(false); setPollQuestion(''); setPollOptions(['', '']); }}
              className="text-gray-400 hover:text-gray-600 transition-colors"><X className="size-3.5" /></button>
          </div>
          <input
            type="text"
            placeholder="Ask a question…"
            value={pollQuestion}
            onChange={e => setPollQuestion(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 placeholder-gray-400"
          />
          <div className="space-y-1.5">
            {pollOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-4 shrink-0">{i + 1}.</span>
                <input
                  type="text"
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={e => setPollOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                  className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg bg-white outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 placeholder-gray-400"
                />
                {pollOptions.length > 2 && (
                  <button onClick={() => setPollOptions(prev => prev.filter((_, j) => j !== i))}
                    className="text-gray-300 hover:text-red-400 transition-colors shrink-0"><X className="size-3.5" /></button>
                )}
              </div>
            ))}
          </div>
          {pollOptions.length < 5 && (
            <button onClick={() => setPollOptions(prev => [...prev, ''])}
              className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors mt-1">
              <Plus className="size-3.5" /> Add option
            </button>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-0.5">

          {/* Format */}
          <button title="Format text" onClick={() => setShowFormatBar(v => !v)}
            className={`p-1.5 rounded transition-colors ${showFormatBar ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>
            <Type className="size-4" />
          </button>

          {/* Emoji */}
          <div className="relative" ref={emojiRef}>
            <button
              ref={emojiBtnRef}
              title="Emoji"
              onClick={() => {
                if (showEmojiPicker) {
                  setShowEmojiPicker(false);
                  setEmojiSearch('');
                  setEmojiPos(null);
                } else {
                  const rect = emojiBtnRef.current?.getBoundingClientRect();
                  if (rect) {
                    const PICKER_H = 360;
                    const PICKER_W = 320;
                    const spaceAbove = rect.top;
                    const spaceBelow = window.innerHeight - rect.bottom;
                    const top = spaceAbove >= PICKER_H || spaceAbove > spaceBelow
                      ? rect.top - PICKER_H - 8
                      : rect.bottom + 8;
                    const left = Math.min(rect.left, window.innerWidth - PICKER_W - 8);
                    setEmojiPos({ top: Math.max(8, top), left: Math.max(8, left) });
                  }
                  setShowEmojiPicker(true);
                  setShowMentionDrop(false);
                }
              }}
              className={`p-1.5 rounded transition-colors ${showEmojiPicker ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>
              <Smile className="size-4" />
            </button>
            {showEmojiPicker && emojiPos && (
              <div
                style={{ position: 'fixed', top: emojiPos.top, left: emojiPos.left, width: 320, maxHeight: 360, zIndex: 9999 }}
                className="bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col overflow-hidden">
                {/* Search */}
                <div className="px-3 pt-3 pb-2 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search emoji…"
                      value={emojiSearch}
                      onChange={e => setEmojiSearch(e.target.value)}
                      onMouseDown={ev => ev.stopPropagation()}
                      className="w-full bg-gray-50 text-gray-900 text-sm pl-8 pr-3 py-1.5 rounded-lg outline-none placeholder-gray-400 border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* Scrollable emoji area */}
                <div className="overflow-y-auto flex-1 px-3 pb-3" style={{ maxHeight: 268 }}>
                  {(() => {
                    const q = emojiSearch.trim().toLowerCase();
                    if (q) {
                      const allEmojis = EMOJI_CATEGORIES.flatMap(c => c.emojis);
                      const results = allEmojis.filter(e => e.toLowerCase().includes(q));
                      return results.length > 0 ? (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 mt-1">Search results</p>
                          <div className="grid grid-cols-8 gap-0.5">
                            {results.map((e, i) => (
                              <button key={`${e}-${i}`} onMouseDown={ev => { ev.preventDefault(); insertEmoji(e); }}
                                className="w-9 h-9 flex items-center justify-center text-xl hover:bg-gray-100 rounded-lg transition-colors">
                                {e}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 text-center py-6">No emoji found</p>
                      );
                    }
                    return EMOJI_CATEGORIES.map(cat => (
                      <div key={cat.label} className="mb-3 last:mb-0">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 mt-1 sticky top-0 bg-white pb-1">{cat.label}</p>
                        <div className="grid grid-cols-8 gap-0.5">
                          {cat.emojis.map((e, i) => (
                            <button key={`${e}-${i}`} onMouseDown={ev => { ev.preventDefault(); insertEmoji(e); }}
                              className="w-9 h-9 flex items-center justify-center text-xl hover:bg-gray-100 rounded-lg transition-colors">
                              {e}
                            </button>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                {/* Footer */}
                <div className="shrink-0 border-t border-gray-100 px-3 py-2 flex items-center justify-between bg-gray-50 rounded-b-xl">
                  <span className="text-xs text-gray-400">Click to insert</span>
                  <button onMouseDown={ev => { ev.preventDefault(); setShowEmojiPicker(false); setEmojiSearch(''); setEmojiPos(null); }}
                    className="text-xs text-gray-500 hover:text-gray-800 transition-colors font-medium">Close</button>
                </div>
              </div>
            )}
          </div>

          {/* Mention */}
          <button title="Mention" onClick={() => {
              editRef.current?.focus();
              document.execCommand('insertText', false, '@');
              setMentionSearch('');
              setShowMentionDrop(true);
              setShowEmojiPicker(false);
            }}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
            <AtSign className="size-4" />
          </button>

          {/* Image */}
          <button title="Image" onClick={() => imageRef.current?.click()}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
            <Image className="size-4" />
          </button>
          <input ref={imageRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImagePick} />

          {/* File */}
          <button title="File" onClick={() => fileRef.current?.click()}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
            <FileText className="size-4" />
          </button>
          <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFilePick} />

          {showPoll && <>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <button title="Poll" onClick={() => setShowPollEditor(v => !v)}
              className={`p-1.5 rounded transition-colors ${showPollEditor ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>
              <BarChart2 className="size-4" />
            </button>
          </>}
        </div>

        <button onClick={handleSubmit}
          disabled={isEmpty && attachments.length === 0 && !(showPollEditor && pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2)}
          className="px-5 py-1.5 bg-gray-200 text-gray-600 text-sm font-semibold rounded-md hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Share
        </button>
      </div>
    </div>
  );
}

function CommunityPage({ onNavigate, onSubPageChange }: {
  onNavigate?: (page: 'admin' | 'admin-courses' | 'user-management' | 'admin-analytics' | 'admin-communications' | 'admin-settings') => void;
  onSubPageChange?: (subPage: string) => void;
}) {
  const [mainTab,        setMainTab]        = useState<MainTab>('community');
  const [activeView,     setActiveView]     = useState<ActiveView>('space');
  const [selectedSpace,  setSelectedSpace]  = useState('outdure');
  const [spacesExpanded, setSpacesExpanded] = useState(true);
  const [sortBy,         setSortBy]         = useState('Newest first');
  const [showSortMenu,   setShowSortMenu]   = useState(false);
  const [posts,          setPosts]          = useState(INITIAL_POSTS);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [showSearch,     setShowSearch]     = useState(false);
  const [spaces,             setSpaces]             = useState<CommunitySpace[]>(COMMUNITY_SPACES);
  const [showSpaceModal,     setShowSpaceModal]     = useState(false);
  const [editingSpace,       setEditingSpace]       = useState<CommunitySpace | null>(null);
  const [courseSpaceId,      setCourseSpaceId]      = useState<string>(platformCourses[0]?.id ?? '');
  const [courseSpaceSearch,  setCourseSpaceSearch]  = useState('');
  const [courseSpacePosts,   setCourseSpacePosts]   = useState<Record<string, CommunityPost[]>>(COURSE_SPACE_POSTS);
  const [collectionsSearch, setCollectionsSearch] = useState('');
  const [collectionsAccess, setCollectionsAccess] = useState<'all' | 'private' | 'public'>('all');
  const [collectionsPlan,   setCollectionsPlan]   = useState<'all' | 'Enterprise' | 'Business'>('all');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab,       setSettingsTab]       = useState<'access' | 'notifications' | 'moderation'>('access');
  const [accessWhoCanPost,  setAccessWhoCanPost]  = useState<'everyone' | 'members' | 'admins'>('members');
  const [accessWhoCanJoin,  setAccessWhoCanJoin]  = useState<'open' | 'invite' | 'approval'>('approval');
  const [accessVisibility,  setAccessVisibility]  = useState<'public' | 'members' | 'private'>('members');
  const [accessGuestView,   setAccessGuestView]   = useState(false);
  const [accessRequireApproval, setAccessRequireApproval] = useState(true);
  const [accessAllowDMs,    setAccessAllowDMs]    = useState(true);
  const [discSearch,     setDiscSearch]     = useState('');
  const [discFilter,     setDiscFilter]     = useState<string>('all');
  const [selectedDisc,      setSelectedDisc]      = useState<CourseDiscussion | null>(null);
  const [detailTab,         setDetailTab]         = useState<DetailTab>('post');
  const [discussions,       setDiscussions]       = useState<CourseDiscussion[]>(COURSE_DISCUSSIONS);
  const [showNewDiscModal,  setShowNewDiscModal]  = useState(false);
  const [mentions,          setMentions]          = useState<MentionNotification[]>(INITIAL_MENTIONS);
  const [mentionFilter,     setMentionFilter]     = useState<'all' | 'unread'>('all');
  const [openMentionMenu,   setOpenMentionMenu]   = useState<string | null>(null);
  const [starredMentions,   setStarredMentions]   = useState<Set<string>>(new Set());
  const [archivedMentions,  setArchivedMentions]  = useState<Set<string>>(new Set());

  const currentSpace   = spaces.find(s => s.id === selectedSpace) ?? spaces[0]!
  const currentPosts   = posts[selectedSpace] ?? [];
  const filteredPosts  = searchQuery
    ? currentPosts.filter(p => p.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : currentPosts;
  const sortedPosts    = sortBy === 'Newest first' ? [...filteredPosts] : [...filteredPosts].reverse();

  const handleShare = (html: string, poll?: Poll) => {
    const hasText = html.replace(/<[^>]*>/g, '').trim() !== '';
    if (!hasText && !poll) return;
    const newPost: CommunityPost = {
      id: Date.now().toString(),
      authorName: 'Admin',
      authorBadge: 'Staff',
      timestamp: 'just now',
      content: html,
      poll,
      likes: 0,
      upvotes: 0,
      comments: [],
    };
    setPosts(prev => ({ ...prev, [selectedSpace]: [newPost, ...(prev[selectedSpace] ?? [])] }));
  };

  const MAIN_TABS = [
    { id: 'community'   as MainTab, label: 'Community spaces' },
    { id: 'course'      as MainTab, label: 'Course spaces'    },
    { id: 'collections' as MainTab, label: 'Collections'      },
  ];

  const NAV_ITEMS: { icon: typeof BookOpen; label: string; view: ActiveView }[] = [
    { icon: BookOpen,      label: 'Course Discussions', view: 'discussions' },
    { icon: AtSign,        label: 'Mentions',           view: 'mentions'    },
    { icon: MessageCircle, label: 'Replies',            view: 'replies'     },
  ];

  return (
    <div className="flex flex-col h-full bg-white min-h-0">
      {/* ── Page Header ───────────────────────────────────────── */}
      <div className="px-6 pt-6 shrink-0">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Community
              <HelpCircle className="size-5 text-gray-400 cursor-pointer" />
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Effortlessly manage and moderate activity across your community and course spaces.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (onNavigate && onSubPageChange) {
                  onSubPageChange('community-access');
                  onNavigate('admin-settings');
                } else {
                  setShowSettingsModal(true);
                }
              }}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-md hover:bg-teal-700 flex items-center gap-1.5 transition-colors"
            >
              <Settings className="size-4" />
              Settings
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-1.5 transition-colors">
              <Eye className="size-4" />
              Preview
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-1.5 transition-colors">
              <Download className="size-4" />
              Export
              <ChevronDown className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-200">
          {MAIN_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setMainTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                mainTab === tab.id
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Two-panel layout ──────────────────────────────────── */}
      <div className="flex flex-1 mt-4 overflow-hidden min-h-0">

        {/* Left sidebar — hidden on Collections tab */}
        {mainTab !== 'collections' && <div className="w-56 shrink-0 border-r border-gray-200 flex flex-col overflow-y-auto">

          {/* ── Community Spaces sidebar ── */}
          {mainTab === 'community' && (<>
            <nav className="p-3 space-y-0.5 flex-1">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.label}
                  onClick={() => setActiveView(item.view)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors ${
                    activeView === item.view
                      ? 'bg-gray-200 text-gray-900 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="size-4 text-gray-500 shrink-0" />
                  {item.label}
                </button>
              ))}

              <div>
                <button
                  onClick={() => setSpacesExpanded(!spacesExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors rounded-md hover:bg-gray-100"
                >
                  <span className="flex items-center gap-2.5">
                    <LayoutGrid className="size-4 text-gray-500 shrink-0" />
                    Spaces
                  </span>
                  {spacesExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                </button>
                {spacesExpanded && (
                  <div className="mt-0.5 space-y-0.5">
                    {spaces.map(space => (
                      <div key={space.id} className="group relative">
                        <button
                          onClick={() => { setSelectedSpace(space.id); setActiveView('space'); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors ${
                            activeView === 'space' && selectedSpace === space.id
                              ? 'bg-gray-200 text-gray-900 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {space.type === 'locked'
                            ? <Lock className="size-4 text-gray-600 shrink-0" />
                            : <Hash className="size-4 text-gray-600 shrink-0" />
                          }
                          <span className="truncate flex-1 text-left">{space.name}</span>
                          <span className="text-[10px] text-gray-400 tabular-nums shrink-0 group-hover:hidden">{space.members}</span>
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setEditingSpace(space); setShowSpaceModal(true); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center justify-center p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                          title={`Edit ${space.name}`}
                        >
                          <Pencil className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </nav>
            <div className="p-3 pb-5 shrink-0">
              <button
                onClick={() => { setEditingSpace(null); setShowSpaceModal(true); }}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-md hover:bg-teal-700 transition-colors"
              >
                <Plus className="size-4" />
                Add new space
              </button>
            </div>
          </>)}

          {/* ── Course Spaces sidebar ── */}
          {mainTab === 'course' && (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Search */}
              <div className="p-3 shrink-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={courseSpaceSearch}
                    onChange={e => setCourseSpaceSearch(e.target.value)}
                    placeholder="Search courses…"
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Course list */}
              <nav className="px-3 pb-4 space-y-0.5 flex-1 overflow-y-auto">
                {platformCourses
                  .filter(c => !courseSpaceSearch || c.title.toLowerCase().includes(courseSpaceSearch.toLowerCase()))
                  .map((c, i) => {
                    const colour = COURSE_COLOURS[i % COURSE_COLOURS.length];
                    const dot    = colour.split(' ')[0].replace('bg-', 'bg-');
                    const hasPosts = !!(courseSpacePosts[c.id]?.length);
                    return (
                      <button
                        key={c.id}
                        onClick={() => setCourseSpaceId(c.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors text-left ${
                          courseSpaceId === c.id
                            ? 'bg-gray-200 text-gray-900 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                        <span className="truncate flex-1">{c.title}</span>
                        {hasPosts && (
                          <span className="text-[10px] text-gray-400 tabular-nums shrink-0">
                            {courseSpacePosts[c.id].length}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </nav>
            </div>
          )}

        </div>}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-y-auto min-w-0">

          {/* ── Course Spaces main view ── */}
          {mainTab === 'course' && (() => {
            const activeCourse = platformCourses.find(c => c.id === courseSpaceId);
            const activePosts  = courseSpacePosts[courseSpaceId] ?? [];
            const courseIdx    = platformCourses.findIndex(c => c.id === courseSpaceId);
            const courseColour = COURSE_COLOURS[courseIdx % COURSE_COLOURS.length] ?? 'bg-gray-100 text-gray-700';

            const handleCourseShare = (html: string, poll?: Poll) => {
              const hasText = html.replace(/<[^>]*>/g, '').trim() !== '';
              if (!hasText && !poll) return;
              const newPost: CommunityPost = {
                id: `csp-${courseSpaceId}-${Date.now()}`,
                authorName: 'outdure',
                authorBadge: 'Staff',
                timestamp: 'just now',
                content: html,
                poll,
                likes: 0, upvotes: 0, comments: [],
              };
              setCourseSpacePosts(prev => ({
                ...prev,
                [courseSpaceId]: [newPost, ...(prev[courseSpaceId] ?? [])],
              }));
            };

            return (
              <div className="flex flex-col flex-1 min-h-0">
                {/* Course header */}
                <div className="shrink-0">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${courseColour}`}>
                        {activeCourse?.title ?? 'Course'}
                      </span>
                      {activeCourse && (
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span>{activeCourse.level}</span>
                          <span>·</span>
                          <span>{activeCourse.duration}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <MessageCircle className="size-3.5" />
                      <span>{activePosts.length} post{activePosts.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Scrollable feed */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                  {/* Post composer */}
                  <PostComposer
                    onSubmit={handleCourseShare}
                    placeholder={`Post an update in ${activeCourse?.title ?? 'this course'}…`}
                  />

                  {/* Posts feed */}
                  {activePosts.length === 0 ? (
                    <div className="py-16 text-center text-gray-400">
                      <MessageCircle className="size-10 mx-auto mb-3 opacity-40" />
                      <p className="text-sm font-medium">No posts yet</p>
                      <p className="text-xs mt-1">Be the first to share an update in this course space.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activePosts.map(post => <PostCard key={post.id} post={post} />)}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ── Community Spaces views (only when mainTab === 'community') ── */}
          {mainTab === 'community' && (<>

          {/* ── Course Discussions view ── */}
          {activeView === 'discussions' && (() => {
            // Only show courses that actually have discussions
            const usedCourseIds = Array.from(new Set(discussions.map(d => d.courseId)));
            const filteredCourseList = platformCourses.filter(c => usedCourseIds.includes(c.id));
            const filtered  = discussions.filter(d => {
              const matchSearch = !discSearch || d.title.toLowerCase().includes(discSearch.toLowerCase()) || d.authorName.toLowerCase().includes(discSearch.toLowerCase()) || d.courseName.toLowerCase().includes(discSearch.toLowerCase());
              const matchFilter = discFilter === 'all' || d.courseId === discFilter;
              return matchSearch && matchFilter;
            });
            const pinned    = filtered.filter(d => d.isPinned);
            const rest      = filtered.filter(d => !d.isPinned);

            return (
              <div className="flex flex-1 min-h-0 overflow-hidden">
                {/* Thread list */}
                <div className={`flex flex-col overflow-y-auto ${selectedDisc ? 'w-96 shrink-0 border-r border-gray-100' : 'flex-1'}`}>
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-gray-100 shrink-0">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <BookOpen className="size-4 text-gray-700" />
                        Course Discussions
                        <span className="text-xs font-normal text-gray-400 ml-1">{discussions.length} threads</span>
                      </h2>
                      <button
                        onClick={() => setShowNewDiscModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-md hover:bg-teal-700 transition-colors"
                      >
                        <Plus className="size-3.5" />
                        New Discussion
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                        <input
                          type="text"
                          value={discSearch}
                          onChange={e => setDiscSearch(e.target.value)}
                          placeholder="Search discussions…"
                          className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <select
                        value={discFilter}
                        onChange={e => setDiscFilter(e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="all">All courses</option>
                        {filteredCourseList.map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="px-4 py-3 space-y-1.5 flex-1">
                    {pinned.length > 0 && (
                      <>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 pb-1">Pinned</p>
                        {pinned.map(d => (
                          <DiscussionRow key={d.id} disc={d} selected={selectedDisc?.id === d.id} onClick={() => { const next = selectedDisc?.id === d.id ? null : d; setSelectedDisc(next); setDetailTab('post'); }} />
                        ))}
                        <div className="border-t border-gray-100 my-2" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 pb-1">All Discussions</p>
                      </>
                    )}
                    {rest.map(d => (
                      <DiscussionRow key={d.id} disc={d} selected={selectedDisc?.id === d.id} onClick={() => { const next = selectedDisc?.id === d.id ? null : d; setSelectedDisc(next); setDetailTab('post'); }} />
                    ))}
                    {filtered.length === 0 && (
                      <div className="py-16 text-center text-gray-400">
                        <MessageCircle className="size-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No discussions found.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Thread detail panel */}
                {selectedDisc && (() => {
                  const discReplies  = DISCUSSION_REPLIES[selectedDisc.id] ?? [];
                  const discViewers  = getViewers(selectedDisc);
                  const answerReply  = discReplies.find(r => r.isAnswer);

                  return (
                    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                      {/* Detail header */}
                      <div className="px-5 pt-5 pb-0 shrink-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2 ${selectedDisc.courseColor}`}>
                              {selectedDisc.courseName}
                            </span>
                            <h3 className="text-sm font-bold text-gray-900 leading-snug">{selectedDisc.title}</h3>
                            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500 flex-wrap">
                              <span className="font-medium text-gray-700">{selectedDisc.authorName}</span>
                              <span>·</span>
                              <span>{selectedDisc.authorCompany}</span>
                              <span>·</span>
                              <span>{selectedDisc.timestamp}</span>
                              {selectedDisc.isAnswered && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-semibold">Answered</span>}
                              {selectedDisc.isResolved && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-semibold">Resolved</span>}
                            </div>
                          </div>
                          <button onClick={() => { setSelectedDisc(null); setDetailTab('post'); }} className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 ml-3 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          </button>
                        </div>

                        {/* Clickable stats row */}
                        <div className="flex items-center gap-1 border-b border-gray-100">
                          <button
                            onClick={() => setDetailTab('post')}
                            className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${detailTab === 'post' ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                          >
                            Post
                          </button>
                          <button
                            onClick={() => setDetailTab('viewers')}
                            className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors flex items-center gap-1 ${detailTab === 'viewers' ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                          >
                            <Eye className="size-3" />
                            {selectedDisc.views} views
                          </button>
                          <button
                            onClick={() => setDetailTab('replies')}
                            className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors flex items-center gap-1 ${detailTab === 'replies' ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                          >
                            <MessageCircle className="size-3" />
                            {selectedDisc.replyCount} {selectedDisc.replyCount === 1 ? 'reply' : 'replies'}
                          </button>
                        </div>
                      </div>

                      {/* Tab content */}
                      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

                        {/* ── Post tab ── */}
                        {detailTab === 'post' && (
                          <>
                            <div className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center gap-2.5 mb-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-500 shrink-0">☺</div>
                                <div>
                                  <span className="text-sm font-semibold text-gray-900">{selectedDisc.authorName}</span>
                                  <span className="text-xs text-gray-400 ml-2">{selectedDisc.timestamp}</span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed">{selectedDisc.preview}</p>
                            </div>
                            {answerReply && (
                              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M20 6 9 17l-5-5"/></svg>
                                  <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide">Best Answer</span>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center text-xs text-green-700 shrink-0">☺</div>
                                  <span className="text-xs font-semibold text-gray-900">{answerReply.authorName}</span>
                                  {answerReply.authorBadge && <BadgeChip badge={answerReply.authorBadge} size="xs" />}
                                  <span className="text-xs text-gray-400">{answerReply.timestamp}</span>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">{answerReply.content}</p>
                              </div>
                            )}
                            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                              <p className="text-xs font-semibold text-gray-500 mb-2">Reply</p>
                              <textarea rows={3} placeholder="Write a reply…" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none bg-white" />
                              <div className="flex justify-end mt-2">
                                <button className="px-4 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-md hover:bg-teal-700 transition-colors">Post Reply</button>
                              </div>
                            </div>
                          </>
                        )}

                        {/* ── Viewers tab ── */}
                        {detailTab === 'viewers' && (
                          <div>
                            <p className="text-xs text-gray-400 mb-3">{discViewers.length} people viewed this discussion</p>
                            {discViewers.length === 0 ? (
                              <div className="py-10 text-center text-gray-400 text-sm">No views yet.</div>
                            ) : (
                              <div className="space-y-1">
                                {discViewers.map((v, i) => (
                                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50">
                                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 shrink-0">☺</div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900">{v.name}</p>
                                      <p className="text-xs text-gray-400">{v.company}</p>
                                    </div>
                                    <span className="text-xs text-gray-400 shrink-0">{v.viewedAt}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* ── Replies tab ── */}
                        {detailTab === 'replies' && (
                          <div>
                            <p className="text-xs text-gray-400 mb-3">{discReplies.length} {discReplies.length === 1 ? 'reply' : 'replies'}</p>
                            {discReplies.length === 0 ? (
                              <div className="py-10 text-center text-gray-400 text-sm">No replies yet — be the first to respond.</div>
                            ) : (
                              <div className="space-y-3">
                                {discReplies.map(reply => (
                                  <div key={reply.id} className={`rounded-lg p-4 border ${reply.isAnswer ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 shrink-0">☺</div>
                                      <span className="text-sm font-semibold text-gray-900">{reply.authorName}</span>
                                      {reply.authorBadge && <BadgeChip badge={reply.authorBadge} size="xs" />}
                                      {reply.isAnswer && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-green-600 text-white rounded font-semibold flex items-center gap-0.5">
                                          <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                                          Answer
                                        </span>
                                      )}
                                      <span className="text-xs text-gray-400 ml-auto">{reply.timestamp}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed">{reply.content}</p>
                                    <div className="flex items-center gap-1.5 mt-2.5 text-xs text-gray-400">
                                      <Heart className="size-3" />
                                      <span>{reply.likes}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                              <p className="text-xs font-semibold text-gray-500 mb-2">Add a reply</p>
                              <textarea rows={3} placeholder="Write a reply…" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none bg-white" />
                              <div className="flex justify-end mt-2">
                                <button className="px-4 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-md hover:bg-teal-700 transition-colors">Post Reply</button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })()}

          {/* ── Mentions view ── */}
          {activeView === 'mentions' && (() => {
            const unreadCount  = mentions.filter(m => !m.isRead).length;
            const visibleList   = (mentionFilter === 'unread' ? mentions.filter(m => !m.isRead) : mentions)
                                    .filter(m => !archivedMentions.has(m.id));
            const markAllRead   = () => setMentions(prev => prev.map(m => ({ ...m, isRead: true })));
            const markRead      = (id: string) => setMentions(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
            const markUnread    = (id: string) => setMentions(prev => prev.map(m => m.id === id ? { ...m, isRead: false } : m));
            const deleteMention = (id: string) => setMentions(prev => prev.filter(m => m.id !== id));
            const archiveMention= (id: string) => setArchivedMentions(prev => { const n = new Set(prev); n.add(id); return n; });
            const toggleStar    = (id: string) => setStarredMentions(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
            const closeMenu     = () => setOpenMentionMenu(null);

            const roleColour: Record<string, string> = {
              admin:    'bg-purple-100 text-purple-700',
              manager:  'bg-blue-100 text-blue-700',
              employee: 'bg-gray-100 text-gray-600',
              staff:    'bg-teal-100 text-teal-700',
            };

            return (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <AtSign className="size-4 text-gray-700" />
                      Mentions
                      {unreadCount > 0 && (
                        <span className="text-xs font-semibold px-1.5 py-0.5 bg-teal-600 text-white rounded-full">{unreadCount}</span>
                      )}
                    </h2>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors">
                        Mark all as read
                      </button>
                    )}
                  </div>
                  {/* Filter tabs */}
                  <div className="flex gap-1">
                    {(['all', 'unread'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setMentionFilter(f)}
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors capitalize ${
                          mentionFilter === f
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {f === 'all' ? `All (${mentions.length})` : `Unread (${unreadCount})`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {visibleList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                      <AtSign className="size-10 mb-3 opacity-40" />
                      <p className="text-sm font-medium">No unread mentions</p>
                      <p className="text-xs mt-1">You're all caught up!</p>
                    </div>
                  ) : visibleList.map(mention => {
                    // Highlight @handle inside context
                    const handle  = `@${mention.mentionedName}`;
                    const parts   = mention.context.split(handle);

                    const isMenuOpen = openMentionMenu === mention.id;
                    const isStarred  = starredMentions.has(mention.id);

                    const menuItems = [
                      {
                        label: mention.isRead ? 'Mark as unread' : 'Mark as read',
                        icon: mention.isRead ? MailOpen : Check,
                        action: () => { mention.isRead ? markUnread(mention.id) : markRead(mention.id); closeMenu(); },
                        style: 'text-gray-700',
                      },
                      {
                        label: isStarred ? 'Remove star' : 'Add star',
                        icon: Star,
                        action: () => { toggleStar(mention.id); closeMenu(); },
                        style: isStarred ? 'text-yellow-600' : 'text-gray-700',
                      },
                      { label: 'Add to Task', icon: ListTodo, action: () => closeMenu(), style: 'text-gray-700' },
                      { label: 'divider' },
                      { label: 'Archive', icon: Archive, action: () => { archiveMention(mention.id); closeMenu(); }, style: 'text-gray-700' },
                      { label: 'Report as Spam', icon: AlertTriangle, action: () => { deleteMention(mention.id); closeMenu(); }, style: 'text-orange-600' },
                      { label: 'Delete', icon: Trash2, action: () => { deleteMention(mention.id); closeMenu(); }, style: 'text-red-600' },
                    ] as const;

                    return (
                      <div
                        key={mention.id}
                        onClick={() => { markRead(mention.id); closeMenu(); }}
                        className={`relative flex gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${!mention.isRead ? 'bg-blue-50/60' : ''}`}
                      >
                        {/* Unread dot */}
                        <div className="mt-1.5 shrink-0 w-2">
                          {!mention.isRead && <div className="w-2 h-2 rounded-full bg-teal-500" />}
                        </div>

                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-500 shrink-0">☺</div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Who → Who */}
                          <div className="flex items-center gap-1.5 flex-wrap mb-1 pr-7">
                            <span className="text-sm font-semibold text-gray-900">{mention.fromName}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${roleColour[mention.fromRole]}`}>
                              {mention.fromRole}
                            </span>
                            <span className="text-xs text-gray-400">{mention.fromCompany}</span>
                            <span className="text-xs text-gray-400">mentioned</span>
                            <span className="text-xs font-semibold text-teal-700">@{mention.mentionedName}</span>
                            {isStarred && <Star className="size-3 fill-yellow-400 text-yellow-400 ml-0.5" />}
                          </div>

                          {/* Mentioned person role chip */}
                          <p className="text-[10px] text-gray-400 mb-1.5">{mention.mentionedRole}</p>

                          {/* Source badge */}
                          <div className="flex items-center gap-1.5 mb-2">
                            {mention.source === 'space'
                              ? <Lock className="size-3 text-gray-400" />
                              : <BookOpen className="size-3 text-gray-400" />
                            }
                            <span className="text-[11px] text-gray-500 font-medium">{mention.sourceName}</span>
                            <span className="text-[11px] text-gray-400">· {mention.timestamp}</span>
                          </div>

                          {/* Context snippet */}
                          <p className="text-sm text-gray-700 leading-relaxed bg-gray-100 rounded-lg px-3 py-2">
                            {parts.map((part, i) => (
                              <span key={i}>
                                {part}
                                {i < parts.length - 1 && (
                                  <span className="font-semibold text-teal-700 bg-teal-50 px-0.5 rounded">{handle}</span>
                                )}
                              </span>
                            ))}
                          </p>

                          {/* Reply input */}
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="text"
                              placeholder={`Reply to ${mention.fromName}…`}
                              className="flex-1 text-xs px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                              onClick={e => e.stopPropagation()}
                            />
                            <button
                              className="px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-colors"
                              onClick={e => e.stopPropagation()}
                            >
                              Reply
                            </button>
                          </div>
                        </div>

                        {/* 3-dot menu button */}
                        <div className="absolute top-3 right-4" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setOpenMentionMenu(isMenuOpen ? null : mention.id)}
                            className={`p-1.5 rounded-lg transition-colors ${isMenuOpen ? 'bg-gray-200 text-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                          >
                            <MoreVertical className="size-4" />
                          </button>

                          {/* Dropdown */}
                          {isMenuOpen && (
                            <div className="absolute right-0 top-8 z-20 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-1 overflow-hidden">
                              {menuItems.map((item, idx) =>
                                item.label === 'divider' ? (
                                  <div key={idx} className="border-t border-gray-100 my-1" />
                                ) : (
                                  <button
                                    key={item.label}
                                    onClick={() => (item as any).action?.()}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-gray-50 transition-colors ${(item as any).style}`}
                                  >
                                    {(item as any).icon && (() => { const Icon = (item as any).icon; return <Icon className="size-3.5 shrink-0" />; })()}
                                    {item.label}
                                  </button>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* ── Replies view ── */}
          {activeView === 'replies' && (() => {
            // Collect all threads/posts where 'outdure' (the platform staff) has replied
            interface ReplyFeedItem {
              key: string;
              type: 'discussion' | 'space';
              // discussion
              courseName: string;
              courseColor: string;
              discTitle: string;
              discId: string;
              // space
              spaceName: string;
              // shared
              originalAuthor: string;
              originalAuthorBadge?: string;
              originalContent: string;
              originalTimestamp: string;
              myReply: string;
              myReplyTimestamp: string;
              isAnswer: boolean;
            }

            const items: ReplyFeedItem[] = [];

            // Scan discussion replies
            COURSE_DISCUSSIONS.forEach(disc => {
              const replies = DISCUSSION_REPLIES[disc.id] ?? [];
              replies.filter(r => r.authorName === 'outdure').forEach(r => {
                items.push({
                  key: `disc-${disc.id}-${r.id}`,
                  type: 'discussion',
                  courseName: disc.courseName,
                  courseColor: disc.courseColor,
                  discTitle: disc.title,
                  discId: disc.id,
                  spaceName: '',
                  originalAuthor: disc.authorName,
                  originalContent: disc.preview,
                  originalTimestamp: disc.timestamp,
                  myReply: r.content,
                  myReplyTimestamp: r.timestamp,
                  isAnswer: !!r.isAnswer,
                });
              });
            });

            // Scan community space post comments
            Object.entries(INITIAL_POSTS).forEach(([spaceId, spacePosts]) => {
              const space = COMMUNITY_SPACES.find(s => s.id === spaceId);
              spacePosts.forEach(post => {
                post.comments.filter(c => c.author === 'outdure').forEach(c => {
                  items.push({
                    key: `space-${spaceId}-${post.id}-${c.id}`,
                    type: 'space',
                    courseName: '',
                    courseColor: '',
                    discTitle: '',
                    discId: '',
                    spaceName: space?.name ?? spaceId,
                    originalAuthor: post.authorName,
                    originalAuthorBadge: post.authorBadge,
                    originalContent: post.content,
                    originalTimestamp: post.timestamp,
                    myReply: c.content,
                    myReplyTimestamp: c.timestamp,
                    isAnswer: false,
                  });
                });
              });
            });

            return (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 shrink-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <MessageCircle className="size-4 text-gray-700" />
                      Replies
                      <span className="text-xs font-normal text-gray-400 ml-1">{items.length} threads</span>
                    </h2>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Threads where you have posted a reply as a platform representative</p>
                </div>

                {/* Feed */}
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                      <MessageCircle className="size-10 mb-3 opacity-40" />
                      <p className="text-sm font-medium">No replies yet</p>
                      <p className="text-xs mt-1">Threads you reply to will appear here.</p>
                    </div>
                  ) : items.map(item => (
                    <div key={item.key} className="px-6 py-5 hover:bg-gray-50 transition-colors cursor-pointer">

                      {/* Source breadcrumb */}
                      <div className="flex items-center gap-1.5 mb-3">
                        {item.type === 'discussion' ? (
                          <>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.courseColor}`}>
                              {item.courseName}
                            </span>
                            <span className="text-gray-300">›</span>
                            <BookOpen className="size-3 text-gray-400 shrink-0" />
                            <span className="text-[11px] text-gray-600 font-medium truncate max-w-xs">{item.discTitle}</span>
                          </>
                        ) : (
                          <>
                            <Lock className="size-3 text-gray-400 shrink-0" />
                            <span className="text-[11px] text-gray-600 font-medium">{item.spaceName}</span>
                          </>
                        )}
                        <span className="text-[11px] text-gray-400 ml-auto shrink-0">{item.myReplyTimestamp}</span>
                      </div>

                      {/* Original post (indented context) */}
                      <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 mb-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[11px] text-gray-500 shrink-0">☺</div>
                          <span className="text-xs font-semibold text-gray-700">{item.originalAuthor}</span>
                          {item.originalAuthorBadge && (
                            <BadgeChip badge={item.originalAuthorBadge!} size="xs" />
                          )}
                          <span className="text-[11px] text-gray-400">· {item.originalTimestamp}</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 whitespace-pre-line">{item.originalContent}</p>
                      </div>

                      {/* Admin's reply */}
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-sm text-teal-700 shrink-0">☺</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-sm font-semibold text-gray-900">outdure</span>
                            <BadgeChip badge="STAFF" size="xs" />
                            {item.isAnswer && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-green-600 text-white rounded font-semibold flex items-center gap-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                                Best Answer
                              </span>
                            )}
                            <span className="text-xs text-gray-400">{item.myReplyTimestamp}</span>
                          </div>
                          <p className="text-sm text-gray-800 leading-relaxed">{item.myReply}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Space header bar */}
          {activeView === 'space' && (<>
          <div className="shrink-0">
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                {currentSpace.type === 'locked'
                  ? <Lock className="size-4 text-gray-700" />
                  : <Hash className="size-4 text-gray-700" />
                }
                {currentSpace.name}
              </h2>

              {/* Search */}
              <div className="flex items-center gap-2">
                {showSearch
                  ? (
                    <input
                      autoFocus
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onBlur={() => { if (!searchQuery) setShowSearch(false); }}
                      placeholder="Search for posts"
                      className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 w-48"
                    />
                  )
                  : (
                    <button
                      onClick={() => setShowSearch(true)}
                      className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Search for posts
                      <Search className="size-4" />
                    </button>
                  )
                }
              </div>
            </div>

            {/* Company info ribbon */}
            {currentSpace.company && (
              <div className="px-6 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-700">{currentSpace.company}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">Industry:</span>
                  <span className="font-medium text-gray-700">{currentSpace.industry}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">Plan:</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    currentSpace.plan === 'Enterprise'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {currentSpace.plan}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">Members:</span>
                  <span className="font-medium text-gray-700">{currentSpace.members}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">Client since:</span>
                  <span className="font-medium text-gray-700">{currentSpace.joinedDate}</span>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 space-y-4">

            {/* ── Post Composer ── */}
            <PostComposer
              onSubmit={handleShare}
              placeholder="Post an update in Welcome…"
              showPoll
            />

            {/* ── Sort row ── */}
            <div className="relative flex items-center gap-2 text-sm text-gray-500">
              <span>Sort by</span>
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-1 font-semibold text-gray-800 hover:text-gray-900"
              >
                {sortBy}
                <ChevronDown className="size-4" />
              </button>
              {showSortMenu && (
                <div className="absolute top-7 left-14 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px]">
                  {['Newest first', 'Oldest first', 'Most liked'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => { setSortBy(opt); setShowSortMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === opt ? 'font-semibold text-teal-700' : 'text-gray-700'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Posts feed ── */}
            {sortedPosts.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <MessageCircle className="size-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No posts yet. Be the first to share something!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedPosts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        </>)}

          </>)} {/* end mainTab === 'community' */}

          {/* ── Collections view ── */}
          {mainTab === 'collections' && (() => {
            const allRows = spaces.map(space => {
              const posts  = INITIAL_POSTS[space.id] ?? [];
              const count  = posts.length;
              const latest = posts[0]?.timestamp ?? '—';
              return { space, count, latest };
            });

            const q = collectionsSearch.trim().toLowerCase();
            const filteredRows = allRows.filter(({ space }) => {
              const matchSearch = !q
                || space.name.toLowerCase().includes(q)
                || (space.company ?? '').toLowerCase().includes(q)
                || (space.industry ?? '').toLowerCase().includes(q);
              const matchAccess = collectionsAccess === 'all'
                || (collectionsAccess === 'private' && space.type === 'locked')
                || (collectionsAccess === 'public'  && space.type === 'public');
              const matchPlan = collectionsPlan === 'all'
                || space.plan === collectionsPlan;
              return matchSearch && matchAccess && matchPlan;
            });

            const hasActiveFilter = collectionsAccess !== 'all' || collectionsPlan !== 'all';

            return (
              <div className="flex flex-col flex-1 p-6 overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">All workspaces</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {filteredRows.length === spaces.length
                        ? `${spaces.length} spaces`
                        : `${filteredRows.length} of ${spaces.length} spaces`}
                    </p>
                  </div>
                  <button
                    onClick={() => { setEditingSpace(null); setShowSpaceModal(true); setMainTab('community'); }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white text-sm font-semibold rounded-md hover:bg-teal-700 transition-colors"
                  >
                    <Plus className="size-4" />
                    New space
                  </button>
                </div>

                {/* Search + Filters bar */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {/* Search */}
                  <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500">
                    <Search className="size-4 text-gray-400 shrink-0" />
                    <input
                      type="text"
                      value={collectionsSearch}
                      onChange={e => setCollectionsSearch(e.target.value)}
                      placeholder="Search by name, company or industry…"
                      className="flex-1 text-sm outline-none placeholder-gray-400 bg-transparent"
                    />
                    {collectionsSearch && (
                      <button onClick={() => setCollectionsSearch('')} className="text-gray-400 hover:text-gray-600">
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Access filter */}
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    {(['all', 'private', 'public'] as const).map(opt => (
                      <button
                        key={opt}
                        onClick={() => setCollectionsAccess(opt)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                          collectionsAccess === opt
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {opt === 'all' ? 'All access' : opt === 'private' ? '🔒 Private' : '# Public'}
                      </button>
                    ))}
                  </div>

                  {/* Plan filter */}
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    {(['all', 'Enterprise', 'Business'] as const).map(opt => (
                      <button
                        key={opt}
                        onClick={() => setCollectionsPlan(opt)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          collectionsPlan === opt
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {opt === 'all' ? 'All plans' : opt}
                      </button>
                    ))}
                  </div>

                  {/* Clear filters */}
                  {hasActiveFilter && (
                    <button
                      onClick={() => { setCollectionsAccess('all'); setCollectionsPlan('all'); }}
                      className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                    >
                      <X className="size-3" /> Clear filters
                    </button>
                  )}
                </div>

                {/* Table */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/3">Name</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Access</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Members</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Posts</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last post</th>
                        <th className="px-5 py-3 w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredRows.length > 0 ? filteredRows.map(({ space, count, latest }) => (
                        <tr
                          key={space.id}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => { setSelectedSpace(space.id); setEditingSpace(space); setShowSpaceModal(true); }}
                        >
                          {/* Name */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 shrink-0">
                                {space.type === 'locked'
                                  ? <Lock className="size-3.5 text-gray-500" />
                                  : <Hash className="size-3.5 text-gray-500" />}
                              </span>
                              <div>
                                <p className="font-medium text-gray-900">{space.name}</p>
                                {space.company && <p className="text-xs text-gray-400">{space.company}</p>}
                              </div>
                            </div>
                          </td>

                          {/* Access */}
                          <td className="px-5 py-3.5">
                            {space.type === 'locked' ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                                <Lock className="size-2.5" /> Private
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">
                                <Hash className="size-2.5" /> Public
                              </span>
                            )}
                          </td>

                          {/* Members */}
                          <td className="px-5 py-3.5 text-gray-700 tabular-nums">
                            {space.members.toLocaleString()}
                          </td>

                          {/* Posts */}
                          <td className="px-5 py-3.5 tabular-nums">
                            {count > 0
                              ? <span className="font-medium text-gray-900">{count}</span>
                              : <span className="text-gray-400">—</span>}
                          </td>

                          {/* Last post */}
                          <td className="px-5 py-3.5 text-gray-500">{latest}</td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={e => { e.stopPropagation(); setEditingSpace(space); setShowSpaceModal(true); }}
                              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                              title={`Edit ${space.name}`}
                            >
                              <Pencil className="size-3.5" />
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">
                            No workspaces match your search or filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

        </div>
      </div>

      {/* ── Settings Modal ── */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <Settings className="size-5 text-teal-600" />
                <h2 className="text-base font-semibold text-gray-900">Community Settings</h2>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="size-5" />
              </button>
            </div>

            {/* Tab strip */}
            <div className="flex gap-1 px-6 pt-4 border-b border-gray-100 shrink-0">
              {([
                { id: 'access',       label: 'Community Access' },
                { id: 'notifications', label: 'Notifications' },
                { id: 'moderation',   label: 'Moderation' },
              ] as const).map(t => (
                <button
                  key={t.id}
                  onClick={() => setSettingsTab(t.id)}
                  className={`pb-3 px-1 mr-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    settingsTab === t.id
                      ? 'border-teal-600 text-teal-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* ── Community Access tab ── */}
              {settingsTab === 'access' && (<>

                {/* Visibility */}
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-1">Community visibility</p>
                  <p className="text-xs text-gray-500 mb-3">Control who can see this community and its content.</p>
                  <div className="space-y-2">
                    {([
                      { val: 'public',  label: 'Public',          desc: 'Anyone on the platform can find and view this community.' },
                      { val: 'members', label: 'Members only',     desc: 'Only members can see posts and activity.' },
                      { val: 'private', label: 'Private (hidden)', desc: 'Hidden from discovery — accessible by direct invite only.' },
                    ] as const).map(opt => (
                      <label key={opt.val} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${accessVisibility === opt.val ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input type="radio" name="visibility" checked={accessVisibility === opt.val} onChange={() => setAccessVisibility(opt.val)} className="mt-0.5 accent-teal-600 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100" />

                {/* Who can post */}
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-1">Who can post</p>
                  <p className="text-xs text-gray-500 mb-3">Set which members are allowed to create new posts.</p>
                  <div className="space-y-2">
                    {([
                      { val: 'everyone', label: 'Everyone',      desc: 'All community members can post.' },
                      { val: 'members',  label: 'Members only',  desc: 'Only approved members can post.' },
                      { val: 'admins',   label: 'Admins only',   desc: 'Only admins and staff can post; others can reply.' },
                    ] as const).map(opt => (
                      <label key={opt.val} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${accessWhoCanPost === opt.val ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input type="radio" name="whocanpost" checked={accessWhoCanPost === opt.val} onChange={() => setAccessWhoCanPost(opt.val)} className="mt-0.5 accent-teal-600 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100" />

                {/* Membership */}
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-1">Membership</p>
                  <p className="text-xs text-gray-500 mb-3">Choose how new members can join this community.</p>
                  <div className="space-y-2">
                    {([
                      { val: 'open',     label: 'Open',             desc: 'Anyone can join without approval.' },
                      { val: 'approval', label: 'Requires approval', desc: 'Admin must approve membership requests.' },
                      { val: 'invite',   label: 'Invite only',       desc: 'New members can only join via a direct invite.' },
                    ] as const).map(opt => (
                      <label key={opt.val} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${accessWhoCanJoin === opt.val ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input type="radio" name="whocanjoin" checked={accessWhoCanJoin === opt.val} onChange={() => setAccessWhoCanJoin(opt.val)} className="mt-0.5 accent-teal-600 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100" />

                {/* Toggle options */}
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-gray-800">Additional access options</p>

                  {([
                    { state: accessGuestView,       setState: setAccessGuestView,       label: 'Allow guest preview', desc: 'Non-members can browse posts without joining.' },
                    { state: accessRequireApproval, setState: setAccessRequireApproval, label: 'Require post approval', desc: 'New posts from non-admin members are held for review before publishing.' },
                    { state: accessAllowDMs,        setState: setAccessAllowDMs,        label: 'Allow direct messages', desc: 'Members can send direct messages to each other within this space.' },
                  ]).map(opt => (
                    <div key={opt.label} className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                      </div>
                      <button
                        onClick={() => opt.setState(!opt.state)}
                        className={`relative shrink-0 mt-0.5 w-10 h-5.5 rounded-full transition-colors ${opt.state ? 'bg-teal-600' : 'bg-gray-300'}`}
                        style={{ width: 40, height: 22 }}
                      >
                        <span
                          className="absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform"
                          style={{ width: 18, height: 18, transform: opt.state ? 'translateX(18px)' : 'translateX(0)' }}
                        />
                      </button>
                    </div>
                  ))}
                </div>

              </>)}

              {/* ── Notifications tab ── */}
              {settingsTab === 'notifications' && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Bell className="size-10 text-gray-300 mb-3" />
                  <p className="text-sm font-medium text-gray-500">Notification settings</p>
                  <p className="text-xs text-gray-400 mt-1">Configure digest emails, push alerts, and activity summaries.</p>
                  <span className="mt-4 text-xs px-3 py-1 bg-gray-100 text-gray-500 rounded-full">Coming soon</span>
                </div>
              )}

              {/* ── Moderation tab ── */}
              {settingsTab === 'moderation' && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <AlertTriangle className="size-10 text-gray-300 mb-3" />
                  <p className="text-sm font-medium text-gray-500">Moderation settings</p>
                  <p className="text-xs text-gray-400 mt-1">Manage word filters, flagging rules, and auto-moderation actions.</p>
                  <span className="mt-4 text-xs px-3 py-1 bg-gray-100 text-gray-500 rounded-full">Coming soon</span>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
              <button onClick={() => setShowSettingsModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors">
                Cancel
              </button>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Discussion Modal */}
      {showNewDiscModal && (
        <NewDiscussionModal
          onClose={() => setShowNewDiscModal(false)}
          onSubmit={(disc) => {
            setDiscussions(prev => [disc, ...prev]);
            setShowNewDiscModal(false);
            setSelectedDisc(disc);
            setDetailTab('post');
          }}
        />
      )}

      {/* Add / Edit Space Modal */}
      {showSpaceModal && (
        <AddEditSpaceModal
          existing={editingSpace}
          onClose={() => { setShowSpaceModal(false); setEditingSpace(null); }}
          onSubmit={(space) => {
            if (editingSpace) {
              setSpaces(prev => prev.map(s => s.id === space.id ? space : s));
            } else {
              setSpaces(prev => [...prev, space]);
              setSelectedSpace(space.id);
              setActiveView('space');
            }
            setShowSpaceModal(false);
            setEditingSpace(null);
          }}
          onDelete={(id) => {
            setSpaces(prev => prev.filter(s => s.id !== id));
            if (selectedSpace === id) {
              setSelectedSpace(spaces.find(s => s.id !== id)?.id ?? 'outdure');
            }
            setShowSpaceModal(false);
            setEditingSpace(null);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// New Discussion Modal
// ─────────────────────────────────────────────────────────────────────────────

function NewDiscussionModal({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (disc: CourseDiscussion) => void;
}) {
  const [courseId,  setCourseId]  = useState('');
  const [title,     setTitle]     = useState('');
  const [body,      setBody]      = useState('');
  const [errors,    setErrors]    = useState<Record<string, string>>({});

  const selectedCourse = platformCourses.find(c => c.id === courseId);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!courseId) e.course = 'Please select a course.';
    if (!title.trim()) e.title = 'Title is required.';
    else if (title.trim().length < 10) e.title = 'Title must be at least 10 characters.';
    if (!body.trim()) e.body = 'Please describe your question or topic.';
    else if (body.trim().length < 20) e.body = 'Description must be at least 20 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const colour = courseColourMap[courseId] ?? 'bg-gray-100 text-gray-700';
    const newDisc: CourseDiscussion = {
      id: `user-${Date.now()}`,
      courseId,
      courseName: selectedCourse!.title,
      courseColor: colour,
      title: title.trim(),
      authorName: 'Admin',
      authorCompany: 'Outdure Pty Ltd',
      authorBadge: 'Staff',
      timestamp: 'just now',
      preview: body.trim(),
      replyCount: 0,
      views: 1,
      isPinned: false,
      isAnswered: false,
      isResolved: false,
    } as CourseDiscussion & { authorBadge?: string };
    onSubmit(newDisc);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-bold text-gray-900">New Discussion</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {/* Course */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Course <span className="text-red-500">*</span>
            </label>
            <select
              value={courseId}
              onChange={e => { setCourseId(e.target.value); setErrors(p => ({ ...p, course: '' })); }}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white ${errors.course ? 'border-red-400' : 'border-gray-300'}`}
            >
              <option value="">Select a course…</option>
              {platformCourses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            {errors.course && <p className="text-xs text-red-500 mt-1">{errors.course}</p>}
            {selectedCourse && (
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <span className={`px-2 py-0.5 rounded-full font-semibold ${courseColourMap[courseId]}`}>{selectedCourse.title}</span>
                <span>·</span>
                <span>{selectedCourse.level}</span>
                <span>·</span>
                <span>{selectedCourse.duration}</span>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Discussion title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: '' })); }}
              placeholder="Ask a question or introduce a topic…"
              maxLength={120}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.title ? 'border-red-400' : 'border-gray-300'}`}
            />
            <div className="flex justify-between mt-1">
              {errors.title
                ? <p className="text-xs text-red-500">{errors.title}</p>
                : <span />
              }
              <span className={`text-xs ${title.length > 100 ? 'text-orange-500' : 'text-gray-400'}`}>{title.length}/120</span>
            </div>
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={body}
              onChange={e => { setBody(e.target.value); setErrors(p => ({ ...p, body: '' })); }}
              placeholder="Provide context, share what you've tried, or describe the problem in detail…"
              rows={5}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none ${errors.body ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.body && <p className="text-xs text-red-500 mt-1">{errors.body}</p>}
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">Tips for a great discussion:</p>
            <ul className="list-disc list-inside space-y-0.5 text-blue-600">
              <li>Be specific — mention the module or lesson number if relevant</li>
              <li>Share what you've already tried or looked up</li>
              <li>Use a clear, descriptive title so others can find it</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!courseId || !title.trim() || !body.trim()}
            className="px-5 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            <Plus className="size-4" />
            Post Discussion
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add / Edit Space Modal
// ─────────────────────────────────────────────────────────────────────────────

// ─── Space member types & mock data ───────────────────────────────────────────
interface SpaceMember {
  id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'manager' | 'employee' | 'staff';
  email: string;
}

const SPACE_MEMBER_ROLE_COLOUR: Record<string, string> = {
  admin:    'bg-purple-100 text-purple-700',
  manager:  'bg-blue-100 text-blue-700',
  employee: 'bg-gray-100 text-gray-600',
  staff:    'bg-teal-100 text-teal-700',
};

const SPACE_MEMBERS: Record<string, SpaceMember[]> = {
  'outdure': [
    { id: 'sm-od-1', username: 'outdure',    displayName: 'Curtis Admin',    role: 'staff',    email: 'curtis@outdure.com' },
    { id: 'sm-od-2', username: 'alice.op',   displayName: 'Alice Operator',  role: 'staff',    email: 'alice@outdure.com'  },
  ],
  'nexus-tech': [
    { id: 'sm-nt-1', username: 'admin.nexus', displayName: 'Alex Nexus',     role: 'admin',    email: 'admin@nexustech.com'  },
    { id: 'sm-nt-2', username: 'dev.ramos',   displayName: 'Dev Ramos',      role: 'employee', email: 'dev.ramos@nexustech.com' },
    { id: 'sm-nt-3', username: 'j.kim',       displayName: 'Jamie Kim',      role: 'employee', email: 'j.kim@nexustech.com'  },
    { id: 'sm-nt-4', username: 'r.patel',     displayName: 'Raj Patel',      role: 'employee', email: 'r.patel@nexustech.com' },
  ],
  'bluepeak': [
    { id: 'sm-bp-1', username: 'hr.bluepeak', displayName: 'HR BluePeak',    role: 'manager',  email: 'hr@bluepeak.com'    },
    { id: 'sm-bp-2', username: 'l.chen',      displayName: 'Linda Chen',     role: 'employee', email: 'l.chen@bluepeak.com' },
    { id: 'sm-bp-3', username: 'r.patel',     displayName: 'Raj Patel',      role: 'employee', email: 'r.patel@bluepeak.com' },
  ],
  'meridian': [
    { id: 'sm-mg-1', username: 'training.meridian', displayName: 'Training Mgr', role: 'manager',  email: 'training@meridian.com' },
    { id: 'sm-mg-2', username: 'sarah.k',    displayName: 'Sarah K.',        role: 'employee', email: 'sarah@meridian.com'  },
    { id: 'sm-mg-3', username: 'a.brooks',   displayName: 'Alex Brooks',     role: 'employee', email: 'a.brooks@meridian.com' },
    { id: 'sm-mg-4', username: 'j.torres',   displayName: 'Jordan Torres',   role: 'employee', email: 'j.torres@meridian.com' },
  ],
  'stellar-academy': [
    { id: 'sm-sa-1', username: 'dean.stellar', displayName: 'Dean Stellar',  role: 'admin',    email: 'dean@stellaracademy.com' },
    { id: 'sm-sa-2', username: 'ms.wilson',    displayName: 'M. Wilson',     role: 'employee', email: 'ms.wilson@stellaracademy.com' },
  ],
  'ironwood': [
    { id: 'sm-iw-1', username: 'safety.ironwood', displayName: 'Safety Mgr', role: 'admin',    email: 'safety@ironwood.com'  },
    { id: 'sm-iw-2', username: 'g.harris',    displayName: 'G. Harris',      role: 'employee', email: 'g.harris@ironwood.com' },
    { id: 'sm-iw-3', username: 't.nguyen',    displayName: 'T. Nguyen',      role: 'employee', email: 't.nguyen@ironwood.com' },
    { id: 'sm-iw-4', username: 'j.torres',    displayName: 'J. Torres',      role: 'employee', email: 'j.torres@ironwood.com' },
  ],
  'crestview': [
    { id: 'sm-cv-1', username: 'hr.crestview', displayName: 'HR Crestview',  role: 'manager',  email: 'hr@crestviewhealth.com'  },
    { id: 'sm-cv-2', username: 'n.osei',       displayName: 'N. Osei',       role: 'employee', email: 'n.osei@crestviewhealth.com' },
  ],
  'qa': [
    { id: 'sm-qa-1', username: 'outdure',      displayName: 'Curtis Admin',  role: 'staff',    email: 'curtis@outdure.com' },
    { id: 'sm-qa-2', username: 'dev.ramos',    displayName: 'Dev Ramos',     role: 'employee', email: 'dev.ramos@nexustech.com' },
    { id: 'sm-qa-3', username: 'ms.wilson',    displayName: 'M. Wilson',     role: 'employee', email: 'ms.wilson@stellaracademy.com' },
    { id: 'sm-qa-4', username: 'l.chen',       displayName: 'Linda Chen',    role: 'employee', email: 'l.chen@bluepeak.com'  },
  ],
};

// Full pool for invitations — includes everyone not necessarily in a space yet
const ALL_INVITABLE: SpaceMember[] = [
  { id: 'inv-1',  username: 'sarah.k',           displayName: 'Sarah K.',          role: 'employee', email: 'sarah@meridian.com'        },
  { id: 'inv-2',  username: 'a.brooks',           displayName: 'Alex Brooks',       role: 'employee', email: 'a.brooks@meridian.com'     },
  { id: 'inv-3',  username: 'j.torres',           displayName: 'Jordan Torres',     role: 'employee', email: 'j.torres@meridian.com'     },
  { id: 'inv-4',  username: 'training.meridian',  displayName: 'Training Manager',  role: 'manager',  email: 'training@meridian.com'     },
  { id: 'inv-5',  username: 'admin.nexus',        displayName: 'Alex Nexus',        role: 'admin',    email: 'admin@nexustech.com'       },
  { id: 'inv-6',  username: 'dev.ramos',          displayName: 'Dev Ramos',         role: 'employee', email: 'dev.ramos@nexustech.com'   },
  { id: 'inv-7',  username: 'j.kim',              displayName: 'Jamie Kim',         role: 'employee', email: 'j.kim@nexustech.com'       },
  { id: 'inv-8',  username: 'r.patel',            displayName: 'Raj Patel',         role: 'employee', email: 'r.patel@nexustech.com'     },
  { id: 'inv-9',  username: 'hr.bluepeak',        displayName: 'HR BluePeak',       role: 'manager',  email: 'hr@bluepeak.com'           },
  { id: 'inv-10', username: 'l.chen',             displayName: 'Linda Chen',        role: 'employee', email: 'l.chen@bluepeak.com'       },
  { id: 'inv-11', username: 'dean.stellar',       displayName: 'Dean Stellar',      role: 'admin',    email: 'dean@stellaracademy.com'   },
  { id: 'inv-12', username: 'ms.wilson',          displayName: 'M. Wilson',         role: 'employee', email: 'ms.wilson@stellaracademy.com' },
  { id: 'inv-13', username: 'safety.ironwood',    displayName: 'Safety Manager',    role: 'admin',    email: 'safety@ironwood.com'       },
  { id: 'inv-14', username: 'g.harris',           displayName: 'G. Harris',         role: 'employee', email: 'g.harris@ironwood.com'     },
  { id: 'inv-15', username: 't.nguyen',           displayName: 'T. Nguyen',         role: 'employee', email: 't.nguyen@ironwood.com'     },
  { id: 'inv-16', username: 'hr.crestview',       displayName: 'HR Crestview',      role: 'manager',  email: 'hr@crestviewhealth.com'    },
  { id: 'inv-17', username: 'n.osei',             displayName: 'N. Osei',           role: 'employee', email: 'n.osei@crestviewhealth.com' },
  { id: 'inv-18', username: 'new.hire.2024',      displayName: 'New Hire 2024',     role: 'employee', email: 'newhire@outdure.com'       },
  { id: 'inv-19', username: 'p.johnson',          displayName: 'P. Johnson',        role: 'employee', email: 'p.johnson@meridian.com'    },
  { id: 'inv-20', username: 'c.adams',            displayName: 'C. Adams',          role: 'manager',  email: 'c.adams@nexustech.com'     },
];

const INDUSTRIES = [
  'Technology', 'Software', 'Consulting', 'Finance', 'Education',
  'Manufacturing', 'Healthcare', 'Retail', 'Legal', 'Construction',
  'Media & Advertising', 'Logistics', 'Energy', 'Other',
];

function AddEditSpaceModal({ existing, onClose, onSubmit, onDelete }: {
  existing: CommunitySpace | null;
  onClose: () => void;
  onSubmit: (space: CommunitySpace) => void;
  onDelete: (id: string) => void;
}) {
  const isEdit = !!existing;

  const [name,          setName]          = useState(existing?.name       ?? '');
  const [spaceType,     setSpaceType]     = useState<'locked' | 'public'>(existing?.type ?? 'locked');
  const [company,       setCompany]       = useState(existing?.company    ?? '');
  const [industry,      setIndustry]      = useState(existing?.industry   ?? '');
  const [plan,          setPlan]          = useState<'Enterprise' | 'Business'>(
    (existing?.plan as 'Enterprise' | 'Business') ?? 'Business'
  );
  const [joinedDate] = useState(
    existing?.joinedDate ??
    new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  );
  const [errors,        setErrors]        = useState<Record<string, string>>({});
  const [confirmDel,    setConfirmDel]    = useState(false);
  const [activeTab,     setActiveTab]     = useState<'general' | 'access' | 'members'>('general');

  // Preferences state
  const [prefAllowSort,       setPrefAllowSort]       = useState(true);
  const [prefDefaultSort,     setPrefDefaultSort]     = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [prefShowMembers,     setPrefShowMembers]     = useState(true);
  const [prefHideFromCom,     setPrefHideFromCom]     = useState(false);
  const [prefAllowReactions,  setPrefAllowReactions]  = useState(true);
  const [prefAllowAttach,     setPrefAllowAttach]     = useState(true);
  const [prefMembersPost,     setPrefMembersPost]     = useState(true);
  const [prefMembersInvite,   setPrefMembersInvite]   = useState(false);
  const [prefMembersPoll,     setPrefMembersPoll]     = useState(true);
  const [prefMembersComment,  setPrefMembersComment]  = useState(true);
  const [prefMembersMention,  setPrefMembersMention]  = useState(true);
  const [permissionsOpen,     setPermissionsOpen]     = useState(false);
  const [reactionsOpen,       setReactionsOpen]       = useState(false);
  const [prefReactUpvote,     setPrefReactUpvote]     = useState(true);
  const [prefReactLike,       setPrefReactLike]       = useState(true);
  const [prefReactShare,      setPrefReactShare]      = useState(true);
  const [attachmentsOpen,     setAttachmentsOpen]     = useState(false);
  const [prefAttachImages,    setPrefAttachImages]    = useState(true);
  const [prefAttachVideos,    setPrefAttachVideos]    = useState(true);
  const [prefAttachFiles,     setPrefAttachFiles]     = useState(true);

  // Space Access state
  const [accessWhoCanView, setAccessWhoCanView] = useState<'everyone' | 'members' | 'admins'>('members');
  const [accessWhoCanPost, setAccessWhoCanPost] = useState<'everyone' | 'members' | 'admins'>('members');
  const [accessWhoCanJoin, setAccessWhoCanJoin] = useState<'open' | 'invite' | 'approval'>('invite');
  const [accessRequirePostApproval, setAccessRequirePostApproval] = useState(false);
  const [accessShowMemberList,      setAccessShowMemberList]      = useState(true);
  const [accessAllowDMs,            setAccessAllowDMs]            = useState(true);

  // Members state — seeded from mock data for existing spaces
  const [memberList,    setMemberList]    = useState<SpaceMember[]>(() =>
    existing?.id ? (SPACE_MEMBERS[existing.id] ?? []) : []
  );
  const [inviteSearch,  setInviteSearch]  = useState('');
  const [showDropdown,  setShowDropdown]  = useState(false);
  const [pendingInvites,setPendingInvites]= useState<SpaceMember[]>([]);

  const memberCount = memberList.length + pendingInvites.length;

  // Suggestions: users from pool not already in member list or pending
  const currentIds = new Set([...memberList, ...pendingInvites].map(m => m.username));
  const suggestions = inviteSearch.trim()
    ? ALL_INVITABLE.filter(u =>
        !currentIds.has(u.username) &&
        (u.displayName.toLowerCase().includes(inviteSearch.toLowerCase()) ||
         u.username.toLowerCase().includes(inviteSearch.toLowerCase()) ||
         u.email.toLowerCase().includes(inviteSearch.toLowerCase()))
      ).slice(0, 6)
    : [];

  const addPendingInvite = (u: SpaceMember) => {
    setPendingInvites(prev => [...prev, u]);
    setInviteSearch('');
    setShowDropdown(false);
  };
  const removeMember     = (id: string) => setMemberList(prev => prev.filter(m => m.id !== id));
  const removePending    = (id: string) => setPendingInvites(prev => prev.filter(m => m.id !== id));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Space name is required.';
    if (spaceType === 'locked' && !company.trim()) e.company = 'Company name is required for a locked space.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const id = existing?.id ?? name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    onSubmit({
      id,
      name: name.trim(),
      type: spaceType,
      members: memberCount || (existing?.members ?? 0),
      company:    spaceType === 'locked' ? company.trim()    : null,
      industry:   spaceType === 'locked' ? industry || null  : null,
      plan:       spaceType === 'locked' ? plan               : null,
      joinedDate: spaceType === 'locked' ? joinedDate.trim() || null : null,
    });
  };

  const Field = ({ label, error, children }: { label: string; error?: string; children: ReactNode }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">{isEdit ? 'Edit space' : 'Add new space'}</h2>
            {isEdit && <p className="text-xs text-gray-400 mt-0.5">{existing.name}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
            <X className="size-4" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-100 shrink-0 px-6">
          {([
            { id: 'general', label: 'General'       },
            { id: 'access',  label: 'Space Access'  },
            { id: 'members', label: 'Space Members', badge: memberCount },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-1 py-3 mr-5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {tab.label}
              {'badge' in tab && tab.badge > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">

          {/* ── GENERAL TAB ── */}
          {activeTab === 'general' && <>
            <Field label="Space name *" error={errors.name}>
              <input type="text" value={name}
                onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
                placeholder="e.g. Acme Corp" maxLength={60}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
              />
            </Field>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Space type</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'locked', icon: Lock, label: 'Company space', desc: 'Private — invite only' },
                  { value: 'public', icon: Hash, label: 'Public space',  desc: 'Open to all members'  },
                ] as const).map(opt => {
                  const Icon = opt.icon;
                  return (
                    <button key={opt.value} type="button" onClick={() => setSpaceType(opt.value)}
                      className={`flex items-start gap-2.5 p-3 rounded-lg border-2 text-left transition-colors ${spaceType === opt.value ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <Icon className={`size-4 mt-0.5 shrink-0 ${spaceType === opt.value ? 'text-teal-600' : 'text-gray-500'}`} />
                      <div>
                        <p className={`text-xs font-semibold ${spaceType === opt.value ? 'text-teal-700' : 'text-gray-700'}`}>{opt.label}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {spaceType === 'locked' && <>
              <Field label="Company name *" error={errors.company}>
                <input type="text" value={company}
                  onChange={e => { setCompany(e.target.value); setErrors(p => ({ ...p, company: '' })); }}
                  placeholder="e.g. Acme Pty Ltd"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.company ? 'border-red-400' : 'border-gray-300'}`}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Industry">
                  <select value={industry} onChange={e => setIndustry(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                    <option value="">Select…</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </Field>
                <Field label="Plan">
                  <div className="flex gap-2">
                    {(['Business', 'Enterprise'] as const).map(p => (
                      <button key={p} type="button" onClick={() => setPlan(p)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg border-2 transition-colors ${plan === p ? (p === 'Enterprise' ? 'border-purple-400 bg-purple-50 text-purple-700' : 'border-blue-400 bg-blue-50 text-blue-700') : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              <Field label="Client since">
                <div className="flex items-center gap-2 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700 select-none">
                  <Lock className="size-3.5 text-gray-400 shrink-0" />
                  <span className="flex-1">{joinedDate}</span>
                  <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">Auto-set</span>
                </div>
              </Field>
            </>}

            {/* ── Preferences ── */}
            <div className="border-t border-gray-100 pt-4 space-y-1">
              <p className="text-sm font-semibold text-gray-700 mb-3">Preferences</p>

              {/* Default feed sorting — select row */}
              <div className="flex items-center justify-between gap-4 py-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Default feed sorting</p>
                  <p className="text-xs text-gray-400 mt-0.5">How posts are ordered when members open this space</p>
                </div>
                <select value={prefDefaultSort} onChange={e => setPrefDefaultSort(e.target.value as typeof prefDefaultSort)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-teal-400 shrink-0">
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="popular">Most popular</option>
                </select>
              </div>

              {/* Toggle rows */}
              {([
                { label: 'Allow members to sort posts', desc: 'Members can change the feed order themselves',   val: prefAllowSort,   set: setPrefAllowSort   },
                { label: 'Show space members',          desc: 'Display the member list to other members',      val: prefShowMembers, set: setPrefShowMembers },
                { label: 'Hide space from community',   desc: "Space won't appear in the community directory", val: prefHideFromCom, set: setPrefHideFromCom },
              ]).map(row => (
                <div key={row.label} className="flex items-start justify-between gap-4 py-2 border-t border-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{row.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{row.desc}</p>
                  </div>
                  <button type="button" onClick={() => row.set(v => !v)}
                    className={`relative shrink-0 mt-0.5 w-9 h-5 rounded-full transition-colors overflow-hidden ${row.val ? 'bg-teal-500' : 'bg-gray-200'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${row.val ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}

              {/* Attachments — collapsible dropdown */}
              <div className="border-t border-gray-50 pt-0">
                <div className="flex items-start justify-between gap-4 py-2">
                  <button type="button" onClick={() => setAttachmentsOpen(v => !v)}
                    className="flex items-center gap-2 text-left flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-700">Attachments</p>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 tabular-nums">
                          {[prefAttachImages, prefAttachVideos, prefAttachFiles].filter(Boolean).length}/3
                        </span>
                        <ChevronDown className={`size-3.5 text-gray-400 transition-transform duration-200 ${attachmentsOpen ? 'rotate-180' : ''}`} />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">Allow members to attach files to posts</p>
                    </div>
                  </button>
                  <button type="button" onClick={() => setPrefAllowAttach(v => !v)}
                    className={`relative shrink-0 mt-0.5 w-9 h-5 rounded-full transition-colors overflow-hidden ${prefAllowAttach ? 'bg-teal-500' : 'bg-gray-200'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${prefAllowAttach ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                  </button>
                </div>

                {attachmentsOpen && (
                  <div className="mb-1 rounded-lg border border-gray-100 overflow-hidden divide-y divide-gray-50">
                    {([
                      { label: 'Images',  detail: '.png, .jpeg, .gif, .webp, etc.', desc: 'Members can upload image files',             val: prefAttachImages, set: setPrefAttachImages },
                      { label: 'Videos',  detail: '.mp4, .mov, .webm, etc.',        desc: 'Members can upload video files',             val: prefAttachVideos, set: setPrefAttachVideos },
                      { label: 'Files',   detail: '.pdf, .txt, .zip, .docx, etc.',  desc: 'Members can upload documents and archives',  val: prefAttachFiles,  set: setPrefAttachFiles  },
                    ]).map(row => (
                      <div key={row.label} className="flex items-start justify-between gap-4 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-gray-700">{row.label}</p>
                            <span className="text-[10px] text-gray-400 font-mono">{row.detail}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{row.desc}</p>
                        </div>
                        <button type="button" onClick={() => row.set(v => !v)}
                          className={`relative shrink-0 mt-0.5 w-9 h-5 rounded-full transition-colors overflow-hidden ${row.val ? 'bg-teal-500' : 'bg-gray-200'}`}>
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${row.val ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reactions — collapsible dropdown */}
              <div className="border-t border-gray-50 pt-0">
                <div className="flex items-start justify-between gap-4 py-2">
                  <button
                    type="button"
                    onClick={() => setReactionsOpen(v => !v)}
                    className="flex items-center gap-2 text-left group flex-1 min-w-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-700">Reactions</p>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 tabular-nums">
                          {[prefReactUpvote, prefReactLike, prefReactShare].filter(Boolean).length}/3
                        </span>
                        <ChevronDown className={`size-3.5 text-gray-400 transition-transform duration-200 ${reactionsOpen ? 'rotate-180' : ''}`} />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">Allow members to react to posts with emoji</p>
                    </div>
                  </button>
                  <button type="button" onClick={() => setPrefAllowReactions(v => !v)}
                    className={`relative shrink-0 mt-0.5 w-9 h-5 rounded-full transition-colors overflow-hidden ${prefAllowReactions ? 'bg-teal-500' : 'bg-gray-200'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${prefAllowReactions ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                  </button>
                </div>

                {reactionsOpen && (
                  <div className="mb-1 rounded-lg border border-gray-100 overflow-hidden divide-y divide-gray-50">
                    {([
                      { label: 'Upvote a post or a comment', desc: 'Members can upvote posts and comments',         val: prefReactUpvote, set: setPrefReactUpvote },
                      { label: 'Like a post or a comment',   desc: 'Members can like posts and comments',           val: prefReactLike,   set: setPrefReactLike   },
                      { label: 'Share the link of the post', desc: 'Members can copy and share a post link',        val: prefReactShare,  set: setPrefReactShare  },
                    ]).map(row => (
                      <div key={row.label} className="flex items-start justify-between gap-4 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-gray-700">{row.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{row.desc}</p>
                        </div>
                        <button type="button" onClick={() => row.set(v => !v)}
                          className={`relative shrink-0 mt-0.5 w-9 h-5 rounded-full transition-colors overflow-hidden ${row.val ? 'bg-teal-500' : 'bg-gray-200'}`}>
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${row.val ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Permissions — collapsible dropdown */}
              <div className="border-t border-gray-100 pt-2">
                <button
                  type="button"
                  onClick={() => setPermissionsOpen(v => !v)}
                  className="w-full flex items-center justify-between py-2 group"
                >
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-700">Permissions</p>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 tabular-nums">
                      {[prefMembersPost, prefMembersInvite, prefMembersPoll, prefMembersComment, prefMembersMention].filter(Boolean).length}/5
                    </span>
                  </div>
                  <ChevronDown className={`size-4 text-gray-400 transition-transform duration-200 ${permissionsOpen ? 'rotate-180' : ''}`} />
                </button>

                {permissionsOpen && (
                  <div className="mt-1 rounded-lg border border-gray-100 overflow-hidden divide-y divide-gray-50">
                    {([
                      { label: 'Members can post',           desc: 'Allow regular members to create new posts',        val: prefMembersPost,    set: setPrefMembersPost    },
                      { label: 'Members can comment',        desc: 'Allow members to comment on posts',                val: prefMembersComment, set: setPrefMembersComment },
                      { label: 'Members can mention',        desc: 'Allow members to @mention others in posts',        val: prefMembersMention, set: setPrefMembersMention },
                      { label: 'Members can poll',           desc: 'Allow members to create polls',                    val: prefMembersPoll,    set: setPrefMembersPoll    },
                      { label: 'Members can invite others',  desc: 'Allow members to invite new people to the space',  val: prefMembersInvite,  set: setPrefMembersInvite  },
                    ]).map(row => (
                      <div key={row.label} className="flex items-start justify-between gap-4 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-gray-700">{row.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{row.desc}</p>
                        </div>
                        <button type="button" onClick={() => row.set(v => !v)}
                          className={`relative shrink-0 mt-0.5 w-9 h-5 rounded-full transition-colors overflow-hidden ${row.val ? 'bg-teal-500' : 'bg-gray-200'}`}>
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${row.val ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {isEdit && confirmDel && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-xs text-red-700 space-y-2">
                <p className="font-semibold">Delete this space?</p>
                <p>All posts in <span className="font-semibold">{existing.name}</span> will be permanently removed. This cannot be undone.</p>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => onDelete(existing.id)} className="px-3 py-1.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">Yes, delete</button>
                  <button onClick={() => setConfirmDel(false)} className="px-3 py-1.5 border border-red-300 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-colors">Cancel</button>
                </div>
              </div>
            )}
          </>}

          {/* ── SPACE ACCESS TAB ── */}
          {activeTab === 'access' && (
            <div className="divide-y divide-gray-100">
              {/* Select rows */}
              {([
                {
                  label: 'Who can view this space?',
                  desc: 'Controls who can see posts and activity inside this space',
                  value: accessWhoCanView,
                  set: setAccessWhoCanView,
                  options: [
                    { value: 'everyone', label: 'Everyone'     },
                    { value: 'members',  label: 'Members only' },
                    { value: 'admins',   label: 'Admins only'  },
                  ],
                },
                {
                  label: 'Who can post?',
                  desc: 'Controls who can create new posts in this space',
                  value: accessWhoCanPost,
                  set: setAccessWhoCanPost,
                  options: [
                    { value: 'everyone', label: 'Everyone'     },
                    { value: 'members',  label: 'Members only' },
                    { value: 'admins',   label: 'Admins only'  },
                  ],
                },
                {
                  label: 'Membership',
                  desc: 'How new members can join this space',
                  value: accessWhoCanJoin,
                  set: setAccessWhoCanJoin,
                  options: [
                    { value: 'open',     label: 'Open'              },
                    { value: 'invite',   label: 'Invite only'       },
                    { value: 'approval', label: 'Request & approve' },
                  ],
                },
              ]).map(row => (
                <div key={row.label} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-700">{row.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{row.desc}</p>
                  </div>
                  <select
                    value={row.value}
                    onChange={e => (row.set as (v: string) => void)(e.target.value)}
                    className="shrink-0 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-teal-400"
                  >
                    {row.options.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              ))}

              {/* Toggle rows */}
              {([
                { label: 'Require post approval', desc: 'All new posts must be approved by an admin before publishing', val: accessRequirePostApproval, set: setAccessRequirePostApproval },
                { label: 'Allow direct messages',  desc: 'Members can send direct messages to each other',              val: accessAllowDMs,            set: setAccessAllowDMs            },
              ]).map(toggle => (
                <div key={toggle.label} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-700">{toggle.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{toggle.desc}</p>
                  </div>
                  <button type="button" onClick={() => toggle.set(v => !v)}
                    className={`relative shrink-0 w-9 h-5 rounded-full transition-colors overflow-hidden ${toggle.val ? 'bg-teal-500' : 'bg-gray-200'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${toggle.val ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── SPACE MEMBERS TAB ── */}
          {activeTab === 'members' && (
            <div>
              {/* Invite input */}
              <div className="relative mb-4">
                <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 bg-white">
                  <UserPlus className="size-4 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={inviteSearch}
                    onChange={e => { setInviteSearch(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Search by name, username or email…"
                    className="flex-1 text-sm outline-none placeholder-gray-400"
                  />
                  {inviteSearch && (
                    <button onClick={() => { setInviteSearch(''); setShowDropdown(false); }} className="text-gray-400 hover:text-gray-600">
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                {showDropdown && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-white border border-gray-200 rounded-xl shadow-lg py-1 overflow-hidden">
                    {suggestions.map(u => (
                      <button key={u.id} onClick={() => addPendingInvite(u)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 shrink-0">☺</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900"><MemberName displayName={u.displayName} /></p>
                          <p className="text-xs text-gray-400 truncate">{u.email}</p>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${SPACE_MEMBER_ROLE_COLOUR[u.role]}`}>{u.role}</span>
                      </button>
                    ))}
                  </div>
                )}
                {showDropdown && inviteSearch.trim() && suggestions.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs text-gray-400">
                    No users found matching "{inviteSearch}"
                  </div>
                )}
              </div>

              {/* Pending invites */}
              {pendingInvites.length > 0 && (
                <div className="mb-4 space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Pending invite</p>
                  {pendingInvites.map(u => (
                    <div key={u.id} className="flex items-center gap-3 px-3 py-2 bg-teal-50 border border-teal-100 rounded-lg">
                      <div className="w-7 h-7 rounded-full bg-teal-200 flex items-center justify-center text-xs text-teal-700 shrink-0">☺</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900"><MemberName displayName={u.displayName} /></p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${SPACE_MEMBER_ROLE_COLOUR[u.role]}`}>{u.role}</span>
                      <span className="text-[10px] text-teal-600 font-semibold shrink-0">Invite pending</span>
                      <button onClick={() => removePending(u.id)} className="text-gray-400 hover:text-red-500 ml-1"><X className="size-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}

              {/* Current members */}
              {memberList.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Current members</p>
                  {memberList.map(m => (
                    <div key={m.id} className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 shrink-0">☺</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900"><MemberName displayName={m.displayName} /></p>
                        <p className="text-xs text-gray-400 truncate">{m.email}</p>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${SPACE_MEMBER_ROLE_COLOUR[m.role]}`}>{m.role}</span>
                      <button onClick={() => removeMember(m.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all" title="Remove member">
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                !pendingInvites.length && (
                  <div className="py-8 text-center text-gray-400 border border-dashed border-gray-200 rounded-lg">
                    <UserPlus className="size-6 mx-auto mb-1.5 opacity-40" />
                    <p className="text-xs">No members yet — invite someone above</p>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0">
          {isEdit && activeTab === 'general' ? (
            <button onClick={() => setConfirmDel(true)} className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 transition-colors">
              <Trash2 className="size-3.5" />
              Delete space
            </button>
          ) : <span />}

          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || (spaceType === 'locked' && !company.trim())}
              className="px-5 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              {isEdit
                ? <><Pencil className="size-4" />{pendingInvites.length > 0 ? `Save & invite ${pendingInvites.length}` : 'Save changes'}</>
                : <><Plus className="size-4" />Create space</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Discussion Row
// ─────────────────────────────────────────────────────────────────────────────

function DiscussionRow({ disc, selected, onClick }: { disc: CourseDiscussion; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg px-3 py-3 transition-colors border ${
        selected ? 'border-teal-200 bg-teal-50' : 'border-transparent hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs shrink-0 mt-0.5">☺</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            {disc.isPinned && (
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400 shrink-0"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            )}
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${disc.courseColor}`}>{disc.courseName}</span>
            {disc.isAnswered && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">Answered</span>}
            {disc.isResolved && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">Resolved</span>}
          </div>
          <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">{disc.title}</p>
          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-400">
            <span className="font-medium text-gray-600">{disc.authorName}</span>
            <span>·</span>
            <span>{disc.timestamp}</span>
            <span>·</span>
            <span className="flex items-center gap-0.5">
              <MessageCircle className="size-3" />
              {disc.replyCount}
            </span>
            <span className="flex items-center gap-0.5">
              <Eye className="size-3" />
              {disc.views}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Post Card
// ─────────────────────────────────────────────────────────────────────────────

function PostCard({ post }: { post: CommunityPost }) {
  const [liked,        setLiked]        = useState(false);
  const [upvoted,      setUpvoted]      = useState(false);
  const [localLikes,   setLocalLikes]   = useState(post.likes);
  const [localUpvotes, setLocalUpvotes] = useState(post.upvotes);
  const [commentText,  setCommentText]  = useState('');
  const [comments,     setComments]     = useState(post.comments);
  const [showComments, setShowComments] = useState(true);
  const [pollVotes,    setPollVotes]    = useState<number[]>(post.poll?.options.map(o => o.votes) ?? []);
  const [votedIndex,   setVotedIndex]   = useState<number | null>(null);

  const handleComment = () => {
    if (!commentText.trim()) return;
    setComments(prev => [...prev, {
      id: Date.now().toString(),
      author: 'Admin',
      content: commentText.trim(),
      timestamp: 'just now',
    }]);
    setCommentText('');
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      {/* Post header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-gray-500 text-base">
          ☺
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-gray-900">{post.authorName}</span>
          {post.authorBadge && <BadgeChip badge={post.authorBadge} />}
          <span className="text-xs text-gray-400">{post.timestamp}</span>
        </div>
      </div>

      {/* Content */}
      <div
        className={[
          'text-sm text-gray-800 leading-relaxed mb-4',
          '[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-1',
          '[&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-0.5',
          '[&_pre]:font-mono [&_pre]:bg-gray-100 [&_pre]:px-2 [&_pre]:py-0.5 [&_pre]:rounded [&_pre]:text-xs',
          '[&_b]:font-bold [&_strong]:font-bold',
          '[&_i]:italic [&_em]:italic',
          '[&_u]:underline',
          '[&_s]:line-through [&_del]:line-through [&_strike]:line-through',
        ].join(' ')}
        dangerouslySetInnerHTML={{ __html: post.content.includes('<') ? post.content : post.content.replace(/\n/g, '<br>') }}
      />

      {/* Poll */}
      {post.poll && (() => {
        const total = pollVotes.reduce((a, b) => a + b, 0);
        return (
          <div className="mb-4 border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-800">{post.poll.question}</p>
              <p className="text-xs text-gray-400 mt-0.5">{total} vote{total !== 1 ? 's' : ''}{votedIndex !== null ? ' · You voted' : ''}</p>
            </div>
            <div className="px-4 py-3 space-y-2">
              {post.poll.options.map((opt, i) => {
                const pct = total > 0 ? Math.round((pollVotes[i] / total) * 100) : 0;
                const isWinner = votedIndex !== null && pollVotes[i] === Math.max(...pollVotes) && pollVotes[i] > 0;
                return (
                  <button key={i} disabled={votedIndex !== null}
                    onClick={() => {
                      if (votedIndex !== null) return;
                      setVotedIndex(i);
                      setPollVotes(prev => prev.map((v, j) => j === i ? v + 1 : v));
                    }}
                    className={`w-full text-left rounded-lg overflow-hidden transition-all ${votedIndex === null ? 'hover:border-teal-400 cursor-pointer' : 'cursor-default'} border ${votedIndex === i ? 'border-teal-500' : 'border-gray-200'}`}>
                    <div className="relative px-3 py-2">
                      {/* progress fill */}
                      {votedIndex !== null && (
                        <div className={`absolute inset-0 rounded-lg transition-all duration-500 ${isWinner ? 'bg-teal-50' : 'bg-gray-50'}`}
                          style={{ width: `${pct}%` }} />
                      )}
                      <div className="relative flex items-center justify-between">
                        <span className={`text-sm ${votedIndex === i ? 'font-semibold text-teal-700' : 'text-gray-700'}`}>{opt.text}</span>
                        {votedIndex !== null && (
                          <span className={`text-xs font-medium tabular-nums ${isWinner ? 'text-teal-600' : 'text-gray-400'}`}>{pct}%</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Reactions bar */}
      <div className="flex items-center gap-4 text-sm text-gray-500 border-t border-gray-100 pt-3">
        <button
          onClick={() => { setLiked(!liked); setLocalLikes(liked ? localLikes - 1 : localLikes + 1); }}
          className={`flex items-center gap-1.5 transition-colors ${liked ? 'text-red-500' : 'hover:text-red-400'}`}
        >
          <Heart className={`size-4 ${liked ? 'fill-red-500' : ''}`} />
          <span>{localLikes}</span>
        </button>

        <button
          onClick={() => { setUpvoted(!upvoted); setLocalUpvotes(upvoted ? localUpvotes - 1 : localUpvotes + 1); }}
          className={`flex items-center gap-1.5 transition-colors ${upvoted ? 'text-blue-500' : 'hover:text-blue-400'}`}
        >
          <span className={`inline-flex items-center justify-center size-4 border rounded text-[10px] font-bold ${upvoted ? 'border-blue-500 text-blue-500' : 'border-gray-400'}`}>
            ↑
          </span>
          <span>{localUpvotes}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 hover:text-blue-400 transition-colors"
        >
          <MessageCircle className="size-4" />
          <span>{comments.length}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <>
          {comments.map(comment => (
            <div key={comment.id} className="flex items-start gap-2.5 mt-3 pt-3 border-t border-gray-100">
              <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-gray-400 text-xs">☺</div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-gray-900 mr-1.5">{comment.author}</span>
                <span className="text-xs text-gray-600">{comment.content}</span>
                <p className="text-[10px] text-gray-400 mt-0.5">{comment.timestamp}</p>
              </div>
            </div>
          ))}

          {/* Add comment */}
          <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-gray-100">
            <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-gray-400 text-xs">☺</div>
            <input
              type="text"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleComment()}
              placeholder="Add a comment"
              className="flex-1 text-sm text-gray-500 placeholder-gray-400 outline-none bg-transparent"
            />
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Push Notifications Tab (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

const PUSH_TEMPLATES = [
  { id: 'enrol',      icon: UserPlus,      label: 'New Enrolment',       description: 'Notify student when they enrol in a course',             defaultTitle: "You're enrolled!",              defaultBody: 'Welcome to {{course_title}}. Start learning now.' },
  { id: 'complete',   icon: Award,         label: 'Course Completion',   description: 'Notify student when they complete a course',             defaultTitle: 'Course complete 🎉',             defaultBody: "You've finished {{course_title}}. Your certificate is ready." },
  { id: 'inactivity', icon: CalendarClock, label: 'Inactivity Reminder', description: "Nudge students who haven't logged in for 7 days",        defaultTitle: 'Miss you, {{student_name}}!',     defaultBody: "It's been a while. Jump back into {{course_title}}." },
  { id: 'new_lesson', icon: RefreshCw,     label: 'New Lesson Added',    description: 'Alert enrolled students when new content is published',   defaultTitle: 'New content in {{course_title}}', defaultBody: 'A new lesson has been added. Check it out now.' },
  { id: 'deadline',   icon: Bell,          label: 'Upcoming Deadline',   description: 'Remind students of an assignment or quiz deadline',       defaultTitle: 'Deadline reminder',              defaultBody: 'Your assignment in {{course_title}} is due tomorrow.' },
  { id: 'new_badge',  icon: Star,          label: 'Badge Earned',        description: 'Celebrate when a student earns a badge or achievement',  defaultTitle: 'New badge unlocked! 🏅',          defaultBody: 'You earned a new badge in {{course_title}}. Keep it up!' },
];

interface PushTemplate {
  id: string;
  icon: ElementType;
  label: string;
  description: string;
  defaultTitle: string;
  defaultBody: string;
  enabled: boolean;
  title: string;
  body: string;
}

function PushNotificationsTab() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
      <div className="relative mb-6">
        <div className="size-20 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
          <Bell className="size-9 text-amber-400" />
        </div>
        <span className="absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-400 text-white shadow">
          Soon
        </span>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Push Notifications — Coming Soon</h2>
      <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
        We're working on push notification support for the mobile app and browser. This feature will let you send real-time alerts directly to your students' devices.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">What's coming</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          {[
            { icon: Smartphone,    title: 'Mobile alerts',     desc: 'Instant notifications on iOS & Android' },
            { icon: Bell,          title: 'Browser push',      desc: 'Web push for desktop and mobile browsers' },
            { icon: CalendarClock, title: 'Scheduled sends',   desc: 'Deliver notifications at the right time' },
          ].map(f => (
            <div key={f.title} className="flex items-start gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="size-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                <f.icon className="size-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700">{f.title}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// School Emails Tab
// ─────────────────────────────────────────────────────────────────────────────

interface SchoolEmail {
  id: string;
  category: string;
  title: string;
  description: string;
  status: 'active' | 'inactive';
  icon: ElementType;
  iconBg: string;
  iconColor: string;
  subject: string;
  body: string;
}

const SCHOOL_EMAILS: SchoolEmail[] = [
  // Affiliates
  { id: 'aff-signup',   category: 'Affiliates',           title: 'New sign up',                              description: 'Send a welcome email to your affiliates when they sign up. You can also allow the admin of your school manually add any affiliates.',                               status: 'active',   icon: Users,       iconBg: 'bg-green-50',   iconColor: 'text-green-600',  subject: 'Welcome to our affiliate program!',           body: 'Hi {{name}},\n\nWelcome to our affiliate program! Your referral link is ready.\n\nThe Team' },
  { id: 'aff-payout',   category: 'Affiliates',           title: 'Payout completed',                         description: 'Send an email to the affiliate to the affiliate you have just paid.',                                                                                               status: 'inactive', icon: CreditCard,  iconBg: 'bg-yellow-50',  iconColor: 'text-yellow-600', subject: 'Your payout has been processed',              body: 'Hi {{name}},\n\nYour affiliate payout of {{amount}} has been sent.\n\nThe Team' },
  // Community
  { id: 'com-message',  category: 'Community',            title: 'Message notification',                     description: 'Update your learners with a notification when a user sends a message.',                                                                                            status: 'active',   icon: MessageCircle, iconBg: 'bg-blue-50',  iconColor: 'text-blue-600',   subject: 'New message in your community',               body: 'Hi {{name}},\n\n{{sender}} sent a message in {{space}}.\n\nThe Team' },
  { id: 'com-mention',  category: 'Community',            title: 'Mention notification',                     description: 'Update your learners with a school message when a user is mentioned in a post/comment.',                                                                          status: 'active',   icon: AtSign,      iconBg: 'bg-purple-50',  iconColor: 'text-purple-600', subject: 'You were mentioned in a post',                body: 'Hi {{name}},\n\n{{sender}} mentioned you in a post.\n\nThe Team' },
  { id: 'com-invite',   category: 'Community',            title: 'Invite notification',                      description: 'Update your learners with a school message when a user is invited to a space.',                                                                                   status: 'active',   icon: UserPlus,    iconBg: 'bg-teal-50',    iconColor: 'text-teal-600',   subject: "You've been invited to a community space",    body: 'Hi {{name}},\n\nYou have been invited to join {{space}}.\n\nThe Team' },
  // Completion
  { id: 'comp-done',    category: 'Completion',           title: 'On completion',                            description: 'Send a message when a student completes a course or program.',                                                                                                    status: 'inactive', icon: BadgeCheck,  iconBg: 'bg-green-50',   iconColor: 'text-green-600',  subject: 'Congratulations on completing {{course}}!',   body: 'Hi {{name}},\n\nCongratulations! You have completed {{course}}.\n\nThe Team' },
  // Purchases
  { id: 'pur-purchase', category: 'Purchases & Refunds',  title: 'On purchase',                              description: 'Send an email notification when a new purchase is completed.',                                                                                                    status: 'inactive', icon: ShoppingCart,iconBg: 'bg-orange-50',  iconColor: 'text-orange-600', subject: 'Your purchase confirmation',                  body: 'Hi {{name}},\n\nThank you for purchasing {{product}}.\n\nThe Team' },
  { id: 'pur-refund',   category: 'Purchases & Refunds',  title: 'On refund',                                description: 'Send an email when a refund is issued.',                                                                                                                          status: 'active',   icon: RotateCcw,   iconBg: 'bg-red-50',     iconColor: 'text-red-500',    subject: 'Your refund has been processed',              body: 'Hi {{name}},\n\nYour refund of {{amount}} has been issued.\n\nThe Team' },
  // Enrollments
  { id: 'enr-enroll',   category: 'Enrollments',          title: 'On enrollment',                            description: 'Send an email when a new enrollment takes place.',                                                                                                                status: 'inactive', icon: BookOpen,    iconBg: 'bg-blue-50',    iconColor: 'text-blue-600',   subject: "You're enrolled in {{course}}",               body: 'Hi {{name}},\n\nYou have been enrolled in {{course}}.\n\nThe Team' },
  { id: 'enr-seat',     category: 'Enrollments',          title: 'User group / Seat offering notification',  description: 'Send a verification message when a learner is enrolled in courses of a Seat offering or a User\'s group.',                                                       status: 'inactive', icon: Users,       iconBg: 'bg-indigo-50',  iconColor: 'text-indigo-600', subject: 'You have been added to a group offering',     body: 'Hi {{name}},\n\nYou have been added to {{group}}.\n\nThe Team' },
  // Log in as user
  { id: 'log-login',    category: 'Log in as user',       title: 'Log in as a User',                         description: 'Send an email to your users when someone activates the "Log in as User" functionality to impersonate their account.',                                             status: 'inactive', icon: LogIn,       iconBg: 'bg-gray-50',    iconColor: 'text-gray-600',   subject: 'Account access notice',                       body: 'Hi {{name}},\n\nAn admin logged into your account on {{date}}.\n\nThe Team' },
  // Payment Plans
  { id: 'pay-paid',     category: 'Payment Plans',        title: 'Installment Paid',                         description: 'Send a message when an installment is paid.',                                                                                                                     status: 'inactive', icon: CreditCard,  iconBg: 'bg-green-50',   iconColor: 'text-green-600',  subject: 'Installment payment received',                body: 'Hi {{name}},\n\nYour installment payment has been received.\n\nThe Team' },
  { id: 'pay-failed',   category: 'Payment Plans',        title: 'Installment Payment Failed',               description: 'Send a message when an installment payment has failed.',                                                                                                          status: 'inactive', icon: AlertCircle, iconBg: 'bg-red-50',     iconColor: 'text-red-500',    subject: 'Action required: installment payment failed', body: 'Hi {{name}},\n\nYour installment payment failed. Please update your payment method.\n\nThe Team' },
  { id: 'pay-complete', category: 'Payment Plans',        title: 'Payment Plan Completed',                   description: 'Send a message when a payment plan is completed.',                                                                                                                status: 'inactive', icon: Check,       iconBg: 'bg-green-50',   iconColor: 'text-green-600',  subject: 'Your payment plan is complete',               body: 'Hi {{name}},\n\nYour payment plan has been fully paid off.\n\nThe Team' },
  { id: 'pay-cancel',   category: 'Payment Plans',        title: 'Payment Plan Cancelled',                   description: 'Send a message when a payment plan has been cancelled.',                                                                                                          status: 'inactive', icon: XCircle,     iconBg: 'bg-gray-50',    iconColor: 'text-gray-500',   subject: 'Your payment plan has been cancelled',        body: 'Hi {{name}},\n\nYour payment plan has been cancelled.\n\nThe Team' },
  // SCA
  { id: 'sca-action',   category: 'SCA',                  title: 'SCA Action is Required',                   description: 'Send a message when a payment fails due to SCA (Strong Customer Authentication) requirements. SCA requirements are applied when your business is based in the EU or you have a store.',  status: 'inactive', icon: ShieldAlert, iconBg: 'bg-orange-50',  iconColor: 'text-orange-600', subject: 'Action required: payment authentication',     body: 'Hi {{name}},\n\nYour payment requires additional authentication. Please click the link below.\n\nThe Team' },
  // Signup
  { id: 'sig-signup',   category: 'Signup',               title: 'On sign up',                               description: 'Send a welcome email to your users when they sign up.',                                                                                                          status: 'active',   icon: UserCheck,   iconBg: 'bg-teal-50',    iconColor: 'text-teal-600',   subject: 'Welcome to {{school}}!',                      body: 'Hi {{name}},\n\nWelcome! Your account has been created.\n\nThe Team' },
  { id: 'sig-import',   category: 'Signup',               title: 'When a learner is added / imported',       description: 'Send a notification email to manually imported learners.',                                                                                                        status: 'active',   icon: Download,    iconBg: 'bg-blue-50',    iconColor: 'text-blue-600',   subject: 'Your account is ready',                       body: 'Hi {{name}},\n\nAn account has been created for you at {{school}}.\n\nThe Team' },
  { id: 'sig-pwreset',  category: 'Signup',               title: 'On password reset',                        description: 'Send an email when a user wants to reset their password.',                                                                                                       status: 'active',   icon: KeyRound,    iconBg: 'bg-yellow-50',  iconColor: 'text-yellow-600', subject: 'Reset your password',                         body: 'Hi {{name}},\n\nClick the link to reset your password: {{link}}\n\nThe Team' },
  { id: 'sig-pwdone',   category: 'Signup',               title: 'When a password has been reset',           description: 'Send an email when a password has been reset.',                                                                                                                  status: 'active',   icon: Check,       iconBg: 'bg-green-50',   iconColor: 'text-green-600',  subject: 'Your password has been changed',              body: 'Hi {{name}},\n\nYour password was successfully changed.\n\nThe Team' },
  { id: 'sig-verify',   category: 'Signup',               title: 'When email verification is required',      description: 'Send a verification email to users upon signup if you have enabled the Email verification flow under Settings.',                                                 status: 'active',   icon: Mail,        iconBg: 'bg-purple-50',  iconColor: 'text-purple-600', subject: 'Verify your email address',                   body: 'Hi {{name}},\n\nPlease verify your email: {{link}}\n\nThe Team' },
  { id: 'sig-otp',      category: 'Signup',               title: 'When one-time password email is required', description: 'Send users an email with a one-time password.',                                                                                                                  status: 'inactive', icon: Lock,        iconBg: 'bg-gray-50',    iconColor: 'text-gray-600',   subject: 'Your one-time password',                      body: 'Hi {{name}},\n\nYour one-time password is: {{otp}}\n\nThe Team' },
  // Signup Approval
  { id: 'apr-request',  category: 'Signup Approval',      title: 'On signup request',                        description: "Send an email once a user requests to signup to your school if you have enabled the Signup Approval flow.",                                                      status: 'active',   icon: UserCog,     iconBg: 'bg-blue-50',    iconColor: 'text-blue-600',   subject: 'New signup request',                          body: 'Hi Admin,\n\n{{name}} has requested to join {{school}}.\n\nThe Team' },
  { id: 'apr-reject',   category: 'Signup Approval',      title: 'On signup request rejection',              description: "Send an email to a user if their request to signup to your school was rejected.",                                                                               status: 'active',   icon: XCircle,     iconBg: 'bg-red-50',     iconColor: 'text-red-500',    subject: 'Your signup request was not approved',        body: 'Hi {{name}},\n\nUnfortunately your signup request was not approved.\n\nThe Team' },
  // Subscription
  { id: 'sub-trial',    category: 'Subscription',         title: 'Subscription trial starts',                description: 'Send a message when a subscription trial starts.',                                                                                                               status: 'inactive', icon: CalendarClock,iconBg:'bg-blue-50',   iconColor: 'text-blue-600',   subject: 'Your trial has started',                      body: 'Hi {{name}},\n\nYour free trial has started!\n\nThe Team' },
  { id: 'sub-trial3',   category: 'Subscription',         title: 'Subscription trial ends in three days',    description: 'Send a message when a subscription trial ends in three days.',                                                                                                   status: 'inactive', icon: Bell,        iconBg: 'bg-yellow-50',  iconColor: 'text-yellow-600', subject: 'Your trial ends in 3 days',                   body: 'Hi {{name}},\n\nYour free trial ends in 3 days.\n\nThe Team' },
  { id: 'sub-ended',    category: 'Subscription',         title: 'Subscription trial ended',                 description: 'Send a message when a subscription trial ended and there has been no payment.',                                                                                  status: 'inactive', icon: AlertCircle, iconBg: 'bg-orange-50',  iconColor: 'text-orange-600', subject: 'Your trial has ended',                        body: 'Hi {{name}},\n\nYour trial has ended. Subscribe to keep access.\n\nThe Team' },
  { id: 'sub-new',      category: 'Subscription',         title: 'When a user subscribes',                   description: 'Send a message to your users when they subscribe.',                                                                                                              status: 'inactive', icon: Check,       iconBg: 'bg-green-50',   iconColor: 'text-green-600',  subject: 'Subscription confirmed',                      body: 'Hi {{name}},\n\nYour subscription is now active.\n\nThe Team' },
  { id: 'sub-renew',    category: 'Subscription',         title: 'Subscription is renewed',                  description: 'Send a message to a user when their subscription is renewed.',                                                                                                  status: 'inactive', icon: Repeat,      iconBg: 'bg-teal-50',    iconColor: 'text-teal-600',   subject: 'Your subscription has been renewed',          body: 'Hi {{name}},\n\nYour subscription has been successfully renewed.\n\nThe Team' },
  { id: 'sub-cancel',   category: 'Subscription',         title: 'Subscription is cancelled',                description: 'Send a message to a user when their subscription is cancelled.',                                                                                               status: 'inactive', icon: XCircle,     iconBg: 'bg-gray-50',    iconColor: 'text-gray-500',   subject: 'Your subscription has been cancelled',        body: 'Hi {{name}},\n\nYour subscription has been cancelled.\n\nThe Team' },
  { id: 'sub-failed',   category: 'Subscription',         title: 'Subscription fails to be renewed',         description: 'Send a message when a subscription fails to be renewed.',                                                                                                       status: 'inactive', icon: AlertCircle, iconBg: 'bg-red-50',     iconColor: 'text-red-500',    subject: 'Subscription renewal failed',                 body: 'Hi {{name}},\n\nWe could not renew your subscription. Please update your payment method.\n\nThe Team' },
  // Licenses & Gifts
  { id: 'lic-license',  category: 'Licenses & Gifts',     title: 'License invitation',                       description: 'Send an email when an invitation to a course or a gift is sent.',                                                                                               status: 'active',   icon: KeyRound,    iconBg: 'bg-blue-50',    iconColor: 'text-blue-600',   subject: "You've received a course license",            body: 'Hi {{name}},\n\nYou have been gifted access to {{course}}.\n\nThe Team' },
  { id: 'lic-gift',     category: 'Licenses & Gifts',     title: 'Gift invitation',                          description: 'Send an email when an invitation to a gift is sent.',                                                                                                            status: 'active',   icon: GiftIcon,    iconBg: 'bg-pink-50',    iconColor: 'text-pink-600',   subject: "You've received a gift!",                     body: 'Hi {{name}},\n\nSomeone has sent you a gift: {{gift}}.\n\nThe Team' },
];

const SCHOOL_EMAIL_CATEGORIES = ['All', 'Affiliates', 'Community', 'Completion', 'Purchases & Refunds', 'Enrollments', 'Log in as user', 'Payment Plans', 'SCA', 'Signup', 'Signup Approval', 'Subscription', 'Licenses & Gifts'];

function SchoolEmailsTab({ mainTab }: { mainTab: 'admin' | 'learner' | 'signature' }) {
  const [catFilter,   setCatFilter]   = useState('All');
  const [emails,      setEmails]      = useState<SchoolEmail[]>(SCHOOL_EMAILS);
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody,    setEditBody]    = useState('');
  const [signature,   setSignature]   = useState('Best regards,\n\nThe {{school}} Team');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const toggleStatus = (id: string) =>
    setEmails(prev => prev.map(e => e.id === id ? { ...e, status: e.status === 'active' ? 'inactive' : 'active' } : e));

  const openEdit = (e: SchoolEmail) => {
    setEditingId(e.id);
    setEditSubject(e.subject);
    setEditBody(e.body);
  };
  const saveEdit = (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, subject: editSubject, body: editBody } : e));
    setEditingId(null);
  };

  const grouped = SCHOOL_EMAIL_CATEGORIES.filter(c => c !== 'All').reduce<Record<string, SchoolEmail[]>>((acc, cat) => {
    const filtered = emails.filter(e =>
      e.category === cat &&
      (catFilter === 'All' || e.category === catFilter) &&
      (statusFilter === 'all' || e.status === statusFilter)
    );
    if (filtered.length) acc[cat] = filtered;
    return acc;
  }, {});

  const activeCount  = emails.filter(e => e.status === 'active').length;

  const MERGE_TAGS = ['{{name}}', '{{school}}', '{{course}}', '{{link}}', '{{amount}}', '{{date}}'];

  return (
    <div>
      {/* ── School Emails section (always visible) ── */}
      <div className="p-6 border-b border-gray-200">
        {/* Sub-header */}
        <div className="flex items-center gap-2 mb-1">
          <GraduationCap className="size-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">School emails</h3>
          <HelpCircle className="size-3.5 text-gray-400" />
        </div>
        <p className="text-xs text-gray-400 mb-4">Set up automatic email notifications to alert your users when specific events occur in your school.</p>

        {/* Stats row */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-xs text-gray-500">{activeCount} of {emails.length} notifications active</span>
          <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden max-w-xs">
            <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${(activeCount / emails.length) * 100}%` }} />
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" />
            <select
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
              className="pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 appearance-none cursor-pointer"
            >
              {SCHOOL_EMAIL_CATEGORIES.map(cat => {
                const count  = cat === 'All' ? emails.length : emails.filter(e => e.category === cat).length;
                const active = cat === 'All' ? emails.filter(e => e.status === 'active').length : emails.filter(e => e.category === cat && e.status === 'active').length;
                return (
                  <option key={cat} value={cat}>
                    {cat} ({active}/{count} active)
                  </option>
                );
              })}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 appearance-none cursor-pointer"
            >
              <option value="all">All statuses</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" />
          </div>

          <span className="text-xs text-gray-400 ml-auto">
            {Object.values(grouped).flat().length} email{Object.values(grouped).flat().length !== 1 ? 's' : ''}
            {catFilter !== 'All' || statusFilter !== 'all' ? ' shown' : ''}
          </span>
        </div>

        {/* Email groups */}
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, catEmails]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{category} emails</span>
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[10px] text-gray-400">{catEmails.filter(e => e.status === 'active').length}/{catEmails.length} active</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {catEmails.map(email => {
                  const Icon = email.icon;
                  const isEditing = editingId === email.id;
                  return (
                    <div key={email.id}
                      className={`rounded-xl border transition-colors ${isEditing ? 'border-teal-400 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex items-start gap-3 p-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 mb-0.5">{email.title}</p>
                          <p className="text-xs text-gray-500 leading-relaxed">{email.description}</p>
                        </div>
                        <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${email.iconBg}`}>
                          <Icon className={`size-4 ${email.iconColor}`} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between px-4 pb-3 gap-3">
                        <button onClick={() => toggleStatus(email.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${email.status === 'active' ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                          <div className={`size-1.5 rounded-full ${email.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                          {email.status === 'active' ? 'Active' : 'Inactive'}
                        </button>
                        <button onClick={() => isEditing ? setEditingId(null) : openEdit(email)}
                          className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors ${isEditing ? 'border-teal-400 bg-teal-50 text-teal-600' : 'border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700'}`}>
                          <Pencil className="size-3" /> Edit
                        </button>
                      </div>
                      {isEditing && (
                        <div className="border-t border-gray-100 bg-gray-50 rounded-b-xl p-4 space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Subject</label>
                            <input value={editSubject} onChange={e => setEditSubject(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Body</label>
                            <textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={5}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none font-mono" />
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold text-gray-500 mb-1.5">Merge tags</p>
                            <div className="flex flex-wrap gap-1.5">
                              {MERGE_TAGS.map(tag => (
                                <button key={tag} type="button"
                                  onClick={() => setEditBody(b => b + tag)}
                                  className="text-[11px] px-2 py-0.5 rounded-md bg-white border border-gray-200 text-teal-700 hover:bg-teal-50 hover:border-teal-300 font-mono transition-colors">
                                  {tag}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <button onClick={() => { setEditSubject(email.subject); setEditBody(email.body); }}
                              className="text-xs text-gray-500 hover:text-gray-700">Reset to default</button>
                            <div className="flex gap-2">
                              <button onClick={() => setEditingId(null)}
                                className="px-3 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
                              <button onClick={() => saveEdit(email.id)}
                                className="px-3 py-1.5 text-xs bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-colors">Save</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Learner settings ── */}
      {mainTab === 'learner' && (
        <div className="p-6">
          <p className="text-sm font-semibold text-gray-700 mb-1">Learner notification preferences</p>
          <p className="text-xs text-gray-400 mb-6">Control which notifications learners can manage from their own account settings.</p>
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
            {([
              { label: 'Course enrollment confirmation', desc: 'Learners receive a confirmation when enrolled in a course' },
              { label: 'Course completion certificate',  desc: 'Learners are notified when their certificate is ready'   },
              { label: 'Community mentions',             desc: 'Learners are alerted when they are @mentioned'           },
              { label: 'Community messages',             desc: 'Learners receive notifications for new messages'         },
              { label: 'Assignment due reminders',       desc: 'Learners receive reminders before assignment deadlines'  },
              { label: 'Subscription renewals',          desc: 'Learners are notified before their subscription renews'  },
            ]).map((row, i) => (
              <div key={i} className="flex items-center justify-between gap-4 px-4 py-3 bg-white hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-700">{row.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{row.desc}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">Learner-controlled</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Email signature ── */}
      {mainTab === 'signature' && (
        <div className="p-6 max-w-2xl">
          <p className="text-sm font-semibold text-gray-700 mb-1">Email signature</p>
          <p className="text-xs text-gray-400 mb-4">This signature is appended to the bottom of all outgoing school emails.</p>
          <textarea value={signature} onChange={e => setSignature(e.target.value)} rows={6}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 font-mono resize-none mb-3" />
          <div className="flex items-center gap-2 mb-4">
            <p className="text-[11px] font-semibold text-gray-500">Merge tags:</p>
            {['{{school}}', '{{admin_name}}', '{{year}}'].map(tag => (
              <button key={tag} type="button" onClick={() => setSignature(s => s + tag)}
                className="text-[11px] px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-teal-700 hover:bg-teal-50 hover:border-teal-300 font-mono transition-colors">
                {tag}
              </button>
            ))}
          </div>
          <button className="px-4 py-2 bg-teal-500 text-white text-sm font-semibold rounded-lg hover:bg-teal-600 transition-colors">
            Save signature
          </button>
        </div>
      )}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic Coming Soon Page
// ─────────────────────────────────────────────────────────────────────────────

const COMING_SOON_CONFIG: Record<string, {
  icon: ElementType; label: string; description: string;
  features: { icon: ElementType; title: string; desc: string }[];
}> = {
  ecommerce: {
    icon: ShoppingCart,
    label: 'E-commerce',
    description: "We're building a full suite of e-commerce tools — sell courses, memberships, and products directly on your platform.",
    features: [
      { icon: Tag,        title: 'Offers & discounts', desc: 'Create promo codes and limited-time deals'      },
      { icon: CreditCard, title: 'Payments',            desc: 'Accept cards, subscriptions, and invoices'      },
      { icon: LayoutGrid, title: 'Plans & bundles',     desc: 'Package courses into tiered subscription plans' },
    ],
  },
  marketing: {
    icon: Megaphone,
    label: 'Marketing',
    description: "Powerful marketing tools are on the way — grow your audience, capture leads, and measure what's working.",
    features: [
      { icon: Share2,    title: 'Affiliate program', desc: 'Reward partners who refer new students'     },
      { icon: FileText,  title: 'Marketing forms',   desc: 'Embed lead-capture forms across your site'  },
      { icon: ArrowUp,   title: 'NPS surveys',       desc: 'Measure student satisfaction automatically' },
    ],
  },
  mobile: {
    icon: Smartphone,
    label: 'Mobile App',
    description: "A fully branded mobile app experience is coming — let your students learn on iOS and Android.",
    features: [
      { icon: Settings, title: 'Custom design',      desc: 'Brand colours, logos, and splash screens'   },
      { icon: Bell,     title: 'Push notifications', desc: 'Reach students with real-time alerts'        },
      { icon: Send,     title: 'App Store launch',   desc: 'Guided submission to Apple & Google stores' },
    ],
  },
  automations: {
    icon: Zap,
    label: 'Automations',
    description: "Powerful workflow automations are on the way — trigger actions automatically based on user behaviour and events.",
    features: [
      { icon: RefreshCw, title: 'Workflow triggers',    desc: 'Fire actions on enrolment, completion, and more' },
      { icon: Mail,      title: 'Automated emails',     desc: 'Send personalised emails at the right moment'    },
      { icon: BarChart2, title: 'Automation analytics', desc: 'Track performance of every automated workflow'   },
    ],
  },
};

export function ComingSoonPage({ section }: { section: 'ecommerce' | 'marketing' | 'mobile' | 'automations' }) {
  const cfg = COMING_SOON_CONFIG[section];
  const Icon = cfg.icon;
  return (
    <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
      <div className="relative mb-6">
        <div className="size-20 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
          <Icon className="size-9 text-amber-400" />
        </div>
        <span className="absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-400 text-white shadow">
          Soon
        </span>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">{cfg.label} — Coming Soon</h2>
      <p className="text-sm text-gray-500 max-w-sm leading-relaxed">{cfg.description}</p>
      <div className="mt-8 flex flex-col items-center gap-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">What's coming</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          {cfg.features.map(f => (
            <div key={f.title} className="flex items-start gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="size-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                <f.icon className="size-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700">{f.title}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
