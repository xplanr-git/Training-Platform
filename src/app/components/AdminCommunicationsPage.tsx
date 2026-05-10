import { useState, useEffect } from 'react';
import { MessageSquare, Mail, Send, Inbox, Users, Search, Filter, Plus, MoreVertical, Star, Trash2, Archive, Check, X } from 'lucide-react';
import { User } from '@/app/types';

interface AdminCommunicationsPageProps {
  users: User[];
  currentSubPage?: string;
}

export function AdminCommunicationsPage({ users, currentSubPage }: AdminCommunicationsPageProps) {
  // Determine the active tab based on currentSubPage or default to 'inbox'
  const getActiveTab = (): 'inbox' | 'compose' | 'templates' => {
    if (currentSubPage === 'email-templates') return 'templates';
    if (currentSubPage === 'send-email') return 'compose';
    if (currentSubPage === 'inbox') return 'inbox';
    return 'inbox';
  };

  const [selectedTab, setSelectedTab] = useState<'inbox' | 'compose' | 'templates'>(getActiveTab());
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Update tab when currentSubPage changes
  useEffect(() => {
    setSelectedTab(getActiveTab());
  }, [currentSubPage]);

  // Mock inbox messages
  const inboxMessages = [
    {
      id: '1',
      from: 'sarah.johnson@example.com',
      subject: 'Question about React Advanced course',
      preview: 'Hi, I have a question about the assignments in module 3...',
      timestamp: '2 hours ago',
      isRead: false,
      isStarred: true,
    },
    {
      id: '2',
      from: 'mike.chen@example.com',
      subject: 'Certificate request',
      preview: 'Could you please send me the completion certificate for...',
      timestamp: '5 hours ago',
      isRead: true,
      isStarred: false,
    },
    {
      id: '3',
      from: 'emma.davis@example.com',
      subject: 'Course enrollment issue',
      preview: 'I am having trouble enrolling in the Python course. Can you help?',
      timestamp: '1 day ago',
      isRead: false,
      isStarred: false,
    },
    {
      id: '4',
      from: 'john.smith@example.com',
      subject: 'Thank you!',
      preview: 'Just wanted to say thanks for the excellent course content...',
      timestamp: '2 days ago',
      isRead: true,
      isStarred: true,
    },
  ];

  // Email templates
  const emailTemplates = [
    {
      id: '1',
      name: 'Welcome Email',
      subject: 'Welcome to Outdure Edge!',
      body: 'Dear {{name}},\n\nWelcome to Outdure Edge! We are excited to have you join our learning community...',
      category: 'Onboarding',
    },
    {
      id: '2',
      name: 'Course Completion',
      subject: 'Congratulations on completing {{course_name}}!',
      body: 'Dear {{name}},\n\nCongratulations on successfully completing {{course_name}}! Your certificate is attached...',
      category: 'Achievements',
    },
    {
      id: '3',
      name: 'Payment Confirmation',
      subject: 'Payment Received - Invoice #{{invoice_number}}',
      body: 'Dear {{name}},\n\nThank you for your payment. This email confirms that we have received your payment...',
      category: 'Billing',
    },
    {
      id: '4',
      name: 'Course Reminder',
      subject: 'Don\'t forget to continue your learning!',
      body: 'Dear {{name}},\n\nWe noticed you haven\'t logged in for a while. Your courses are waiting for you...',
      category: 'Engagement',
    },
  ];

  const handleRecipientToggle = (userId: string) => {
    if (selectedRecipients.includes(userId)) {
      setSelectedRecipients(selectedRecipients.filter(id => id !== userId));
    } else {
      setSelectedRecipients([...selectedRecipients, userId]);
    }
  };

  const handleSelectAllUsers = () => {
    if (selectedRecipients.length === users.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(users.map(u => u.id));
    }
  };

  const handleSendEmail = () => {
    // Mock send email functionality
    alert(`Email sent to ${selectedRecipients.length} recipient(s)!\n\nSubject: ${emailSubject}\n\nThis is a demo - no actual emails were sent.`);
    setEmailSubject('');
    setEmailBody('');
    setSelectedRecipients([]);
  };

  const handleUseTemplate = (template: typeof emailTemplates[0]) => {
    setEmailSubject(template.subject);
    setEmailBody(template.body);
    setSelectedTab('compose');
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Communications</h1>
        <p className="text-gray-600">Send messages and manage communications with users</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex gap-4 px-6">
            <button
              onClick={() => setSelectedTab('inbox')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === 'inbox'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Inbox className="size-4" />
                Inbox
                <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {inboxMessages.filter(m => !m.isRead).length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setSelectedTab('compose')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === 'compose'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Send className="size-4" />
                Compose Email
              </div>
            </button>
            <button
              onClick={() => setSelectedTab('templates')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === 'templates'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Mail className="size-4" />
                Email Templates
              </div>
            </button>
          </nav>
        </div>

        {/* Inbox Tab */}
        {selectedTab === 'inbox' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Filter className="size-4 inline mr-2" />
                  Filter
                </button>
              </div>
            </div>

            {/* Messages List */}
            <div className="space-y-2">
              {inboxMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 border rounded-lg cursor-pointer hover:shadow-sm transition-shadow ${
                    message.isRead ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2">
                      <button className="text-gray-400 hover:text-yellow-500">
                        <Star className={`size-5 ${message.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-medium text-gray-900 ${!message.isRead ? 'font-bold' : ''}`}>
                          {message.from}
                        </h3>
                        <span className="text-xs text-gray-500">{message.timestamp}</span>
                      </div>
                      <p className={`text-sm mb-1 ${!message.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {message.subject}
                      </p>
                      <p className="text-sm text-gray-600 truncate">{message.preview}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-1 text-gray-400 hover:text-green-600">
                        <Check className="size-5" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-blue-600">
                        <Archive className="size-5" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-600">
                        <Trash2 className="size-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compose Tab */}
        {selectedTab === 'compose' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Compose Form */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Enter email subject"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Type your message here..."
                    rows={12}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendEmail}
                    disabled={!emailSubject || !emailBody || selectedRecipients.length === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                  >
                    <Send className="size-4 inline mr-2" />
                    Send to {selectedRecipients.length} recipient(s)
                  </button>
                  <button className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
                    Save Draft
                  </button>
                </div>
              </div>

              {/* Recipients Selection */}
              <div className="lg:col-span-1 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Recipients</h3>
                  <button
                    onClick={handleSelectAllUsers}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {selectedRecipients.length === users.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRecipients.includes(user.id)}
                        onChange={() => handleRecipientToggle(user.id)}
                        className="mt-1 size-4 text-blue-600 rounded focus:ring-blue-500"
                      />
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

        {/* Templates Tab */}
        {selectedTab === 'templates' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Email Templates</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                <Plus className="size-4 inline mr-2" />
                Create Template
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emailTemplates.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">{template.name}</h3>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {template.category}
                      </span>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="size-5" />
                    </button>
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
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      Use Template
                    </button>
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sent</p>
              <p className="text-2xl font-bold text-gray-900">1,248</p>
            </div>
            <Send className="size-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open Rate</p>
              <p className="text-2xl font-bold text-gray-900">64%</p>
            </div>
            <Mail className="size-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unread</p>
              <p className="text-2xl font-bold text-gray-900">{inboxMessages.filter(m => !m.isRead).length}</p>
            </div>
            <Inbox className="size-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Templates</p>
              <p className="text-2xl font-bold text-gray-900">{emailTemplates.length}</p>
            </div>
            <MessageSquare className="size-8 text-orange-600" />
          </div>
        </div>
      </div>
    </div>
  );
}