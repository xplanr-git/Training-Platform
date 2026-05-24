import React, { useRef, useState } from 'react';
import {
  Upload, ImagePlus, Star, Users, Clock, BookOpen, X,
  Mail, Bell, UserPlus, Award, MessageSquare, Search, Globe,
  ShoppingCart, CreditCard, AlertCircle, CalendarClock,
  RefreshCw, Send, Eye, Edit2, Trash2, ExternalLink, Plus,
} from 'lucide-react';

interface CourseSettings {
  title: string;
  description: string;
  category: string;
  level: string;
  language: string;
  instructor: string;
  duration?: string;
  imageUrl?: string;
  certificateEnabled: boolean;
  allowComments: boolean;
  allowReviews: boolean;
  // Notification email toggles
  notifyEnrollment?: boolean;
  notifyCompletion?: boolean;
  notifyNewComment?: boolean;
  notifyNewReview?: boolean;
  notifyInactivity?: boolean;
  // SEO
  seoTitle?: string;
  seoDescription?: string;
  seoSlug?: string;
}

interface GeneralSettingsProps {
  settings: CourseSettings;
  onUpdate: (settings: CourseSettings) => void;
  onNavigateToEmailTemplates?: () => void;
  onNavigateToPushNotifications?: () => void;
}

const LEVEL_COLORS: Record<string, string> = {
  Beginner:     'bg-green-100 text-green-700',
  Intermediate: 'bg-yellow-100 text-yellow-700',
  Advanced:     'bg-red-100 text-red-700',
};

const NOTIFICATION_OPTIONS: { key: keyof CourseSettings; icon: React.ElementType; label: string; description: string }[] = [
  { key: 'notifyEnrollment', icon: UserPlus,      label: 'New enrolment',       description: 'When a student enrols in this course' },
  { key: 'notifyCompletion', icon: Award,         label: 'Course completion',   description: 'When a student completes the course' },
  { key: 'notifyNewComment', icon: MessageSquare, label: 'New comment',         description: 'When a student posts a comment' },
  { key: 'notifyNewReview',  icon: Star,          label: 'New review',          description: 'When a student submits a rating or review' },
  { key: 'notifyInactivity', icon: Bell,          label: 'Student inactivity',  description: 'When a student has not logged in for 7 days' },
];

// ── Email templates ───────────────────────────────────────────────
interface EmailTemplate {
  id: string;
  icon: React.ElementType;
  label: string;
  trigger: string;
  defaultSubject: string;
  defaultBody: string;
  enabled: boolean;
  subject: string;
  body: string;
}

const MERGE_TAGS = [
  { tag: '{{student_name}}',  hint: 'Student full name' },
  { tag: '{{course_title}}',  hint: 'Course title' },
  { tag: '{{instructor}}',    hint: 'Instructor name' },
  { tag: '{{course_url}}',    hint: 'Link to the course' },
  { tag: '{{amount}}',        hint: 'Payment amount' },
  { tag: '{{due_date}}',      hint: 'Payment due date' },
  { tag: '{{cert_url}}',      hint: 'Certificate download link' },
];

const DEFAULT_TEMPLATES: Omit<EmailTemplate, 'enabled' | 'subject' | 'body'>[] = [
  {
    id: 'purchase',
    icon: ShoppingCart,
    label: 'Purchase Confirmation',
    trigger: 'Sent immediately after a student purchases the course',
    defaultSubject: 'Welcome to {{course_title}} — you\'re enrolled!',
    defaultBody:
      'Hi {{student_name}},\n\nThank you for purchasing {{course_title}}. You now have full access.\n\nStart learning: {{course_url}}\n\nBest,\n{{instructor}}',
  },
  {
    id: 'completion',
    icon: Award,
    label: 'Course Completion',
    trigger: 'Sent when a student completes all lessons',
    defaultSubject: 'Congratulations — you\'ve completed {{course_title}}!',
    defaultBody:
      'Hi {{student_name}},\n\nAmazing work! You\'ve completed {{course_title}}.\n\nDownload your certificate here: {{cert_url}}\n\nWe hope to see you in the next course!\n\n{{instructor}}',
  },
  {
    id: 'payment_failed',
    icon: AlertCircle,
    label: 'Payment Failed',
    trigger: 'Sent when an instalment payment fails',
    defaultSubject: 'Action required — payment failed for {{course_title}}',
    defaultBody:
      'Hi {{student_name}},\n\nWe were unable to process your payment of {{amount}} for {{course_title}}.\n\nPlease update your payment method to keep your access: {{course_url}}\n\n{{instructor}}',
  },
  {
    id: 'payment_reminder',
    icon: CreditCard,
    label: 'Payment Reminder',
    trigger: 'Sent 3 days before an instalment payment is due',
    defaultSubject: 'Reminder — payment of {{amount}} due on {{due_date}}',
    defaultBody:
      'Hi {{student_name}},\n\nThis is a friendly reminder that your next payment of {{amount}} for {{course_title}} is due on {{due_date}}.\n\n{{instructor}}',
  },
  {
    id: 'inactivity',
    icon: CalendarClock,
    label: 'Inactivity Reminder',
    trigger: 'Sent after 7 days of no course activity',
    defaultSubject: 'We miss you! Continue {{course_title}}',
    defaultBody:
      'Hi {{student_name}},\n\nWe noticed you haven\'t been on {{course_title}} for a while. Pick up where you left off: {{course_url}}\n\n{{instructor}}',
  },
  {
    id: 'new_content',
    icon: RefreshCw,
    label: 'New Lesson Available',
    trigger: 'Sent when new content is published to the course',
    defaultSubject: 'New content added to {{course_title}}',
    defaultBody:
      'Hi {{student_name}},\n\nWe\'ve added new lessons to {{course_title}}. Log in to check them out: {{course_url}}\n\n{{instructor}}',
  },
  {
    id: 'start_soon',
    icon: Bell,
    label: 'Course Starting Soon',
    trigger: 'Sent 24 hours before a scheduled course start date',
    defaultSubject: '{{course_title}} starts tomorrow — are you ready?',
    defaultBody:
      'Hi {{student_name}},\n\n{{course_title}} kicks off tomorrow. Here\'s your link: {{course_url}}\n\nSee you there!\n{{instructor}}',
  },
];

/** Slugify a string for the SEO URL preview */
function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

/** Truncate a string with ellipsis */
function truncate(str: string, max: number): string {
  return str.length <= max ? str : str.slice(0, max - 1) + '…';
}

export function GeneralSettings({ settings, onUpdate, onNavigateToEmailTemplates, onNavigateToPushNotifications }: GeneralSettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Notification options local state (removable)
  const [activeNotifications, setActiveNotifications] = useState(
    NOTIFICATION_OPTIONS.map(o => o.key)
  );
  const visibleNotifications = NOTIFICATION_OPTIONS.filter(o => activeNotifications.includes(o.key));

  // Email templates local state
  const [templates, setTemplates] = useState<EmailTemplate[]>(() =>
    DEFAULT_TEMPLATES.map(t => ({
      ...t,
      enabled: true,
      subject: t.defaultSubject,
      body: t.defaultBody,
    }))
  );
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);

  const updateTemplate = (id: string, patch: Partial<EmailTemplate>) =>
    setTemplates(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));

  const insertMergeTag = (id: string, tag: string) => {
    const t = templates.find(t => t.id === id);
    if (!t) return;
    updateTemplate(id, { body: t.body + tag });
  };

  const resetTemplate = (id: string) => {
    const def = DEFAULT_TEMPLATES.find(d => d.id === id);
    if (def) updateTemplate(id, { subject: def.defaultSubject, body: def.defaultBody });
  };

  // Initialise SEO fields from course data if not yet set
  const seoTitle       = settings.seoTitle       ?? settings.title;
  const seoDescription = settings.seoDescription ?? settings.description;
  const seoSlug        = settings.seoSlug        ?? toSlug(settings.title);

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    onUpdate({ ...settings, imageUrl: url });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  };

  return (
    <div className="flex gap-6 items-start">
      {/* ── Left: form sections ──────────────────────────────────── */}
      <div className="flex-1 space-y-5">

        {/* Course Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course Title</label>
              <input
                type="text"
                value={settings.title}
                onChange={e => onUpdate({ ...settings, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={settings.description}
                onChange={e => onUpdate({ ...settings, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={settings.category}
                  onChange={e => onUpdate({ ...settings, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option>Technology</option>
                  <option>Business</option>
                  <option>Design</option>
                  <option>Marketing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                <select
                  value={settings.level}
                  onChange={e => onUpdate({ ...settings, level: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instructor</label>
                <input
                  type="text"
                  value={settings.instructor}
                  onChange={e => onUpdate({ ...settings, instructor: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select
                  value={settings.language}
                  onChange={e => onUpdate({ ...settings, language: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Course Features</h4>
              <div className="space-y-2">
                {[
                  { key: 'certificateEnabled', label: 'Enable course completion certificate' },
                  { key: 'allowComments',      label: 'Allow student comments' },
                  { key: 'allowReviews',       label: 'Allow course reviews and ratings' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!settings[key as keyof CourseSettings]}
                      onChange={e => onUpdate({ ...settings, [key]: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notification Emails */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="size-4 text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-900">Notification Emails</h3>
          </div>
          <p className="text-sm text-gray-500 mb-5">
            Choose which events trigger an email notification to the course instructor.
          </p>
          <div className="space-y-3">
            {visibleNotifications.map(({ key, icon: Icon, label, description }) => (
              <div
                key={key}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  settings[key] !== false ? 'border-teal-200 bg-teal-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${settings[key] !== false ? 'bg-teal-100' : 'bg-gray-100'}`}>
                    <Icon className={`size-4 ${settings[key] !== false ? 'text-teal-600' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500">{description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Remove */}
                  <button
                    title="Remove notification"
                    onClick={() => setActiveNotifications(prev => prev.filter(k => k !== key))}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                  {/* Toggle */}
                  <button
                    onClick={() => onUpdate({ ...settings, [key]: settings[key] === false ? true : false })}
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none ${settings[key] !== false ? 'bg-teal-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform ${settings[key] !== false ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {visibleNotifications.length} notification{visibleNotifications.length !== 1 ? 's' : ''} active
            </p>
            <button
              onClick={() => onNavigateToPushNotifications?.()}
              className="flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
            >
              <Plus className="size-4" />
              Add notification
              <ExternalLink className="size-3 opacity-60" />
            </button>
          </div>
        </div>

        {/* Email Templates */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-1">
            <Send className="size-4 text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-900">Email Templates</h3>
          </div>
          <p className="text-sm text-gray-500 mb-5">
            Customise automated emails sent from the instructor to enrolled students.
          </p>

          <div className="space-y-3">
            {templates.map(tmpl => {
              const Icon = tmpl.icon;
              const isEditing  = editingTemplateId  === tmpl.id;
              const isPreviewing = previewTemplateId === tmpl.id;

              return (
                <div
                  key={tmpl.id}
                  className={`rounded-lg border transition-colors ${
                    tmpl.enabled ? 'border-gray-200' : 'border-gray-100 opacity-60'
                  }`}
                >
                  {/* Row header */}
                  <div className="flex items-center gap-3 p-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tmpl.enabled ? 'bg-teal-50' : 'bg-gray-100'}`}>
                      <Icon className={`size-4 ${tmpl.enabled ? 'text-teal-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{tmpl.label}</p>
                      <p className="text-xs text-gray-500 truncate">{tmpl.trigger}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Preview */}
                      <button
                        title="Preview"
                        onClick={() => setPreviewTemplateId(isPreviewing ? null : tmpl.id)}
                        className={`p-1.5 rounded-lg transition-colors ${isPreviewing ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                      >
                        <Eye className="size-4" />
                      </button>
                      {/* Edit */}
                      <button
                        title="Edit template"
                        onClick={() => {
                          setEditingTemplateId(isEditing ? null : tmpl.id);
                          setPreviewTemplateId(null);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${isEditing ? 'bg-teal-50 text-teal-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                      >
                        <Edit2 className="size-4" />
                      </button>
                      {/* Remove */}
                      <button
                        title="Remove from course"
                        onClick={() => {
                          setTemplates(prev => prev.filter(t => t.id !== tmpl.id));
                          if (editingTemplateId === tmpl.id) setEditingTemplateId(null);
                          if (previewTemplateId === tmpl.id) setPreviewTemplateId(null);
                        }}
                        className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="size-4" />
                      </button>
                      {/* Toggle */}
                      <button
                        onClick={() => updateTemplate(tmpl.id, { enabled: !tmpl.enabled })}
                        className={`relative inline-flex h-5 w-9 rounded-full transition-colors focus:outline-none ${tmpl.enabled ? 'bg-teal-500' : 'bg-gray-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform ${tmpl.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Inline editor */}
                  {isEditing && (
                    <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50 rounded-b-lg">
                      {/* Subject */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Subject line</label>
                        <input
                          type="text"
                          value={tmpl.subject}
                          onChange={e => updateTemplate(tmpl.id, { subject: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      {/* Body */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Email body</label>
                        <textarea
                          value={tmpl.body}
                          onChange={e => updateTemplate(tmpl.id, { body: e.target.value })}
                          rows={7}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none font-mono"
                        />
                      </div>
                      {/* Merge tags */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1.5">Insert merge tag</p>
                        <div className="flex flex-wrap gap-1.5">
                          {MERGE_TAGS.map(({ tag, hint }) => (
                            <button
                              key={tag}
                              title={hint}
                              onClick={() => insertMergeTag(tmpl.id, tag)}
                              className="text-xs px-2 py-1 rounded-md bg-white border border-gray-200 text-teal-700 hover:bg-teal-50 hover:border-teal-300 transition-colors font-mono"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => resetTemplate(tmpl.id)}
                          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                        >
                          <RefreshCw className="size-3" /> Reset to default
                        </button>
                        <button
                          onClick={() => setEditingTemplateId(null)}
                          className="text-xs px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline preview */}
                  {isPreviewing && !isEditing && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50 rounded-b-lg">
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        {/* Email header bar */}
                        <div className="bg-teal-600 px-4 py-3">
                          <p className="text-white text-xs font-medium opacity-80">From: {settings.instructor || 'Instructor'} · To: Student</p>
                          <p className="text-white text-sm font-semibold mt-0.5 truncate">{tmpl.subject}</p>
                        </div>
                        <div className="px-4 py-4">
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{tmpl.body}</pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add template footer */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {templates.length} template{templates.length !== 1 ? 's' : ''} active on this course
            </p>
            <button
              onClick={() => onNavigateToEmailTemplates?.()}
              className="flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
            >
              <Plus className="size-4" />
              Add template
              <ExternalLink className="size-3 opacity-60" />
            </button>
          </div>
        </div>

        {/* SEO */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-1">
            <Search className="size-4 text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-900">Search Engine Optimisation</h3>
          </div>
          <p className="text-sm text-gray-500 mb-5">
            Control how this course appears in search results.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO Title</label>
              <input
                type="text"
                value={seoTitle}
                onChange={e => onUpdate({ ...settings, seoTitle: e.target.value })}
                maxLength={60}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-400">Recommended: 50–60 characters</p>
                <p className={`text-xs font-medium ${seoTitle.length > 60 ? 'text-red-500' : seoTitle.length >= 50 ? 'text-green-600' : 'text-gray-400'}`}>
                  {seoTitle.length}/60
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
              <textarea
                value={seoDescription}
                onChange={e => onUpdate({ ...settings, seoDescription: e.target.value })}
                rows={3}
                maxLength={160}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-400">Recommended: 120–160 characters</p>
                <p className={`text-xs font-medium ${seoDescription.length > 160 ? 'text-red-500' : seoDescription.length >= 120 ? 'text-green-600' : 'text-gray-400'}`}>
                  {seoDescription.length}/160
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-teal-500">
                <span className="px-3 py-2 bg-gray-50 text-gray-400 text-sm border-r border-gray-300 shrink-0">
                  /courses/
                </span>
                <input
                  type="text"
                  value={seoSlug}
                  onChange={e => onUpdate({ ...settings, seoSlug: toSlug(e.target.value) })}
                  className="flex-1 px-3 py-2 text-sm focus:outline-none"
                />
              </div>
            </div>

            {/* Live Google preview */}
            <div className="mt-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Globe className="size-3.5 text-gray-400" />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Search Preview</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                {/* Favicon row */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center">
                    <span className="text-white text-[7px] font-bold">T</span>
                  </div>
                  <span className="text-xs text-gray-600">teachly.com</span>
                  <span className="text-xs text-gray-400">›</span>
                  <span className="text-xs text-gray-600">courses</span>
                  <span className="text-xs text-gray-400">›</span>
                  <span className="text-xs text-gray-600 truncate">{seoSlug || 'course-slug'}</span>
                </div>
                {/* Title */}
                <p className="text-[#1a0dab] text-lg font-medium leading-snug hover:underline cursor-pointer truncate">
                  {truncate(seoTitle || 'Course Title', 60)}
                </p>
                {/* Description */}
                <p className="text-sm text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">
                  {truncate(seoDescription || 'No description provided.', 160)}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Right: thumbnail + card preview ─────────────────────── */}
      <div className="w-72 shrink-0 space-y-4">
        {/* Image uploader */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Course Thumbnail</h3>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {settings.imageUrl ? (
            <div className="relative group rounded-lg overflow-hidden">
              <img src={settings.imageUrl} alt="Course thumbnail" className="w-full h-40 object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 bg-white text-gray-800 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Upload className="size-3.5" /> Change
                </button>
                <button
                  onClick={() => onUpdate({ ...settings, imageUrl: undefined })}
                  className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
                >
                  <X className="size-3.5" /> Remove
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                dragOver ? 'border-teal-400 bg-teal-50' : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50'
              }`}
            >
              <ImagePlus className="size-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-600">Click or drag to upload</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP · Max 5 MB</p>
            </div>
          )}
        </div>

        {/* Live card preview */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Card Preview</h3>
          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="relative h-36 bg-gradient-to-br from-teal-400 to-teal-600">
              {settings.imageUrl ? (
                <img src={settings.imageUrl} alt={settings.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="size-10 text-white/60" />
                </div>
              )}
              <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full ${LEVEL_COLORS[settings.level] ?? 'bg-gray-100 text-gray-700'}`}>
                {settings.level || 'Beginner'}
              </span>
            </div>
            <div className="p-3 space-y-2">
              <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                {settings.title || 'Course Title'}
              </p>
              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                {settings.description || 'No description yet.'}
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                  <span className="text-teal-700 font-bold text-[9px]">
                    {(settings.instructor || 'I')[0].toUpperCase()}
                  </span>
                </div>
                <span className="truncate">{settings.instructor || 'Instructor'}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Star className="size-3 text-yellow-400 fill-yellow-400" /> 4.8
                </span>
                <span className="flex items-center gap-1">
                  <Users className="size-3" /> 0 students
                </span>
                {settings.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" /> {settings.duration}
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">Updates as you edit</p>
        </div>
      </div>
    </div>
  );
}
