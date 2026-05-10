import React from 'react';
import { 
  X, Search, PlayCircle, FileText, BookOpen, Presentation, Headphones, Youtube, Music, 
  Video, MonitorPlay, Users, Calendar, MessageCircle, AlignLeft, HelpCircle, List, 
  GraduationCap, DollarSign, Edit, Upload, Camera, Mic, BookMarked, Feather, 
  Target, ShoppingCart, Armchair, Hourglass, Gift, ShieldCheck, ThumbsUp, ClipboardList, 
  UserPlus, Clipboard, Lightbulb, FolderOpen, Code, Link, UserCircle, LayoutList
} from 'lucide-react';
import { Section, Activity } from '@/app/types';

// We need a subset of Activity for the templates since we generate ID and Order in the parent
export type ActivityTemplate = Omit<Activity, 'id' | 'order' | 'sectionId'>;

interface NewActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectActivity: (template: ActivityTemplate, shouldOpenEditor: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

export function NewActivityModal({
  isOpen,
  onClose,
  onSelectActivity,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory
}: NewActivityModalProps) {
  if (!isOpen) return null;

  const handleSelect = (
    type: Activity['type'], 
    title: string, 
    shouldOpenEditor: boolean = true,
    extraProps: Partial<Activity> = {}
  ) => {
    const template: ActivityTemplate = {
      type,
      title,
      duration: '00:00',
      ...extraProps
    };
    onSelectActivity(template, shouldOpenEditor);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-white/30 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Add learning activity</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="size-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for an activity"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Categories */}
          <div className="w-64 border-r border-gray-200 p-4 overflow-y-auto">
            <nav className="space-y-1">
              {['Multimedia', 'Live Sessions', 'Ebook', 'Exams', 'Self-Assessment', 'Forms', 'Certificates', 'Social', 'Embed'].map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === category
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </nav>
          </div>

          {/* Right Content - Activity Types */}
          <div className="flex-1 p-6 overflow-y-auto">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              {selectedCategory}
            </h4>
            <div className="space-y-3">
              {selectedCategory === 'Multimedia' && (
                <>
                  <ActivityOption
                    icon={PlayCircle}
                    iconColor="bg-indigo-600"
                    title="Video"
                    description="Upload your video, add interactivity, auto-create interactive transcripts."
                    onClick={() => handleSelect('video', 'New Video Activity')}
                  />
                  <ActivityOption
                    icon={FileText}
                    iconColor="bg-indigo-600"
                    title="PDF"
                    description="Upload and present PDFs files in the course player."
                    onClick={() => handleSelect('pdf', 'New PDF Activity')}
                  />
                  <ActivityOption
                    icon={BookOpen}
                    iconColor="bg-indigo-600"
                    title="SCORM / HTML5 package"
                    description="Upload a SCORM / HTML 5 package as a learning activity."
                    badge="Coming Soon"
                    badgeColor="text-purple-700 bg-purple-100"
                    onClick={() => handleSelect('scorm', 'New SCORM/HTML5 Package')}
                  />
                  <ActivityOption
                    icon={Presentation}
                    iconColor="bg-indigo-600"
                    title="Presentation"
                    description="Upload presentation files in .ppt, .pptx or .odp formats (e.g. PowerPoint files)."
                    onClick={() => handleSelect('presentation', 'New Presentation')}
                  />
                  <ActivityOption
                    icon={Headphones}
                    iconColor="bg-indigo-600"
                    title="Audio"
                    description="Upload an audio file or set the URL of the related audio file."
                    badge="Coming Soon"
                    badgeColor="text-purple-700 bg-purple-100"
                    onClick={() => handleSelect('audio', 'New Audio')}
                  />
                  <ActivityOption
                    icon={Youtube}
                    iconColor="bg-indigo-600"
                    title="Youtube"
                    description="Add a YouTube video in your course by pasting the embed code."
                    onClick={() => handleSelect('youtube', 'New YouTube Video')}
                  />
                  <ActivityOption
                    icon={Music}
                    iconColor="bg-indigo-600"
                    title="SoundCloud"
                    description="Add a SoundCloud audio file in your course by pasting the embed code."
                    badge="Coming Soon"
                    badgeColor="text-purple-700 bg-purple-100"
                    onClick={() => handleSelect('soundcloud', 'New SoundCloud Audio')}
                  />
                </>
              )}

              {selectedCategory === 'Live Sessions' && (
                <>
                  <ActivityOption
                    icon={Video}
                    iconColor="bg-emerald-600"
                    title="Zoom meeting"
                    description="Set up a Zoom meeting for your course users."
                    onClick={() => handleSelect('live-session', 'New Zoom Meeting', true, { meetingProvider: 'zoom' })}
                  />
                  <ActivityOption
                    icon={MonitorPlay}
                    iconColor="bg-emerald-600"
                    title="Zoom webinar"
                    description="Set up a Zoom webinar for your course users. Better for lecture-type live events."
                    onClick={() => handleSelect('live-session', 'New Zoom Webinar', true, { meetingProvider: 'zoom' })}
                  />
                  <ActivityOption
                    icon={Video}
                    iconColor="bg-emerald-600"
                    title="Webex meeting"
                    description="Set up a Webex meeting for your course users."
                    badge="Coming Soon"
                    badgeColor="text-purple-700 bg-purple-100"
                    onClick={() => handleSelect('live-session', 'New Webex Meeting', true, { meetingProvider: 'webex' })}
                  />
                  <ActivityOption
                    icon={Users}
                    iconColor="bg-emerald-600"
                    title="Microsoft Teams meeting"
                    description="Set up a Microsoft Teams meeting for your course users."
                    onClick={() => handleSelect('live-session', 'New Microsoft Teams Meeting', true, { meetingProvider: 'teams' })}
                  />
                  <ActivityOption
                    icon={Video}
                    iconColor="bg-emerald-600"
                    title="Google Meet"
                    description="Set up a Google Meet live session for your course users."
                    onClick={() => handleSelect('live-session', 'New Google Meet', true, { meetingProvider: 'google_meet' })}
                  />
                  
                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">1:1 & GROUP SESSIONS</h5>
                  
                  <ActivityOption
                    icon={Calendar}
                    iconColor="bg-emerald-600"
                    title="1:1 session"
                    description="Enable your learners schedule a 1:1 session in your connected Calendly account."
                    onClick={() => handleSelect('live-session', 'New 1:1 Session', true, { meetingProvider: 'calendly' })}
                  />
                  <ActivityOption
                    icon={Users}
                    iconColor="bg-emerald-600"
                    title="Group session"
                    description="Enable your learners reserve their spot in a Group session in your connected Calendly account."
                    badge="Coming Soon"
                    badgeColor="text-purple-700 bg-purple-100"
                    onClick={() => handleSelect('live-session', 'New Group Session', true, { meetingProvider: 'calendly' })}
                  />
                </>
              )}

              {selectedCategory === 'Ebook' && (
                <>
                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">START FROM SCRATCH</h5>
                  <ActivityOption
                    icon={FileText}
                    iconColor="bg-gray-700"
                    title="Blank Ebook"
                    description="Build beautiful Ebook pages from scratch using the flexible Ebook builder."
                    onClick={() => handleSelect('ebook', 'New Blank Ebook')}
                  />

                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">WELCOME</h5>
                  <ActivityOption
                    icon={MessageCircle}
                    iconColor="bg-orange-500"
                    title="Welcome"
                    description="Set the tone for your course and establish a connection with your learners."
                    onClick={() => handleSelect('text', 'Welcome')}
                  />
                  <ActivityOption
                    icon={AlignLeft}
                    iconColor="bg-orange-500"
                    title="Course overview"
                    description="Provide learners with a course overview and introduce the instructors."
                    onClick={() => handleSelect('text', 'Course Overview')}
                  />

                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">MAIN CONTENT</h5>
                  <ActivityOption
                    icon={AlignLeft}
                    iconColor="bg-orange-500"
                    title="Main content"
                    description="Build engaging Ebook pages for your course."
                    onClick={() => handleSelect('text', 'Main Content')}
                  />
                  <ActivityOption
                    icon={HelpCircle}
                    iconColor="bg-orange-500"
                    title="FAQ"
                    description="Help learners easily find answers to frequently asked questions and explanations to key terms and concepts."
                    onClick={() => handleSelect('text', 'FAQ')}
                  />
                  <ActivityOption
                    icon={List}
                    iconColor="bg-orange-500"
                    title="Summary"
                    description="Offer a quick summary of the section, highlighting key points and main takeaways."
                    onClick={() => handleSelect('text', 'Summary')}
                  />

                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">COURSE COMPLETION</h5>
                  <ActivityOption
                    icon={GraduationCap}
                    iconColor="bg-orange-500"
                    title="Course completion"
                    description="Congratulate your learners for completing the course."
                    badge="Coming Soon"
                    badgeColor="text-purple-700 bg-purple-100"
                    onClick={() => handleSelect('completion', 'Course Completion')}
                  />
                  <ActivityOption
                    icon={DollarSign}
                    iconColor="bg-orange-500"
                    title="Course completion with offer"
                    description="Congratulate your learners for completing the course and invite them to join the next course at a discounted price."
                    badge="Coming Soon"
                    badgeColor="text-purple-700 bg-purple-100"
                    onClick={() => handleSelect('completion', 'Course Completion with Offer')}
                  />
                </>
              )}

              {selectedCategory === 'Exams' && (
                <>
                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">START FROM SCRATCH</h5>
                  <ActivityOption
                    icon={FileText}
                    iconColor="bg-gray-700"
                    title="Blank exam"
                    description="Create a graded exam with closed and / or open-ended questions."
                    onClick={() => handleSelect('quiz', 'Blank Exam')}
                  />
                  <ActivityOption
                    icon={LayoutList}
                    iconColor="bg-gray-700"
                    title="Graded SCORM"
                    description="Upload a Graded SCORM package as an assessment learning activity."
                    badge="Coming Soon"
                    badgeColor="text-purple-700 bg-purple-100"
                    onClick={() => handleSelect('quiz', 'Graded SCORM')}
                  />

                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">OPEN-ENDED QUESTIONS TEMPLATES</h5>
                  <ActivityOption
                    icon={Edit}
                    iconColor="bg-indigo-600"
                    title="Text assignment"
                    description="Graded exam template with a text assignment question. After submission, you will be asked to grade students' responses and provide feedback."
                    note="1 question"
                    onClick={() => handleSelect('quiz', 'Text Assignment')}
                  />
                  <ActivityOption
                    icon={Upload}
                    iconColor="bg-indigo-600"
                    title="File assignment"
                    description="Graded exam template with a file assignment question. After submission, you will be asked to grade students' files and provide feedback."
                    note="1 question"
                    onClick={() => handleSelect('quiz', 'File Assignment')}
                  />
                  <ActivityOption
                    icon={Camera}
                    iconColor="bg-indigo-600"
                    title="Video assignment"
                    description="Graded exam template with a 'Record Video' question. After submission, you will be asked to grade students' videos and provide feedback."
                    note="1 question"
                    onClick={() => handleSelect('quiz', 'Video Assignment')}
                  />
                  <ActivityOption
                    icon={Mic}
                    iconColor="bg-indigo-600"
                    title="Audio assignment"
                    description="Graded exam template with a 'Record Audio' question. After submission, you will be asked to grade students' audio recordings and provide feedback."
                    note="1 question"
                    onClick={() => handleSelect('quiz', 'Audio Assignment')}
                  />
                </>
              )}

              {selectedCategory === 'Self-Assessment' && (
                <>
                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">START FROM SCRATCH</h5>
                  <ActivityOption
                    icon={FileText}
                    iconColor="bg-gray-700"
                    title="Blank self-assessment"
                    description="Combine the power of forms and exams. Allow your learners to self-assess their knowledge, write down their thoughts or get feedback from you."
                    onClick={() => handleSelect('quiz', 'Blank Self-Assessment')}
                  />

                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">TEST YOUR KNOWLEDGE TEMPLATES</h5>
                  <ActivityOption
                    icon={Target}
                    iconColor="bg-yellow-500"
                    title="Assess your knowledge"
                    description="Create a self-assessment with closed-ended knowledge questions, instant feedback and no scoring."
                    note="1 question"
                    badge="Coming Soon"
                    badgeColor="text-purple-700 bg-purple-100"
                    onClick={() => handleSelect('quiz', 'Assess Your Knowledge')}
                  />

                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">EXPRESS YOURSELF & GET FEEDBACK TEMPLATES</h5>
                  <ActivityOption
                    icon={Edit}
                    iconColor="bg-yellow-500"
                    title="Write your views / goals / emotions"
                    description="Self-assessment template with a text assignment. After submission, you will be asked to provide feedback."
                    note="1 question"
                    onClick={() => handleSelect('quiz', 'Write Your Views / Goals / Emotions')}
                  />
                  <ActivityOption
                    icon={Upload}
                    iconColor="bg-yellow-500"
                    title="Upload your work"
                    description="Self-assessment template with a file assignment question. After submission, you will be asked to provide feedback."
                    note="1 question"
                    onClick={() => handleSelect('quiz', 'Upload Your Work')}
                  />
                  <ActivityOption
                    icon={Camera}
                    iconColor="bg-yellow-500"
                    title="Record your short video"
                    description="Self-assessment template with a 'Record Video' question. After video submission, you will be asked to provide feedback."
                    note="1 question"
                    onClick={() => handleSelect('quiz', 'Record Your Short Video')}
                  />
                  <ActivityOption
                    icon={Mic}
                    iconColor="bg-yellow-500"
                    title="Record your audio"
                    description="Self-assessment template with a 'Record Audio' question. After audio submission, you will be asked to provide feedback."
                    note="1 question"
                    onClick={() => handleSelect('quiz', 'Record Your Audio')}
                  />

                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">REFLECTION / DIARIES TEMPLATES</h5>
                  <ActivityOption
                    icon={BookMarked}
                    iconColor="bg-yellow-500"
                    title="Diary"
                    description="Allow learners to jot down their thoughts and reflection from things that happened, free from outside judgment and feedback."
                    note="1 question"
                    badge="Coming Soon"
                    badgeColor="text-purple-700 bg-purple-100"
                    onClick={() => handleSelect('quiz', 'Diary')}
                  />
                  <ActivityOption
                    icon={Feather}
                    iconColor="bg-yellow-500"
                    title="Reflection journal"
                    description="Give learners the opportunity to reflect and comment on their previous answers / reflections / goals / opinions."
                    note="1 question"
                    badge="Coming Soon"
                    badgeColor="text-purple-700 bg-purple-100"
                    onClick={() => handleSelect('quiz', 'Reflection Journal')}
                  />
                </>
              )}

              {selectedCategory === 'Forms' && (
                <>
                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">START FROM SCRATCH</h5>
                  <ActivityOption
                    icon={FileText}
                    iconColor="bg-gray-700"
                    title="Blank form"
                    description="Create a form from scratch and collect data from your students."
                    onClick={() => handleSelect('quiz', 'Blank Form', false)} // false = add immediately
                  />

                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">COURSE ACTIVITY TEMPLATES</h5>
                  <ActivityOption
                    icon={UserCircle}
                    iconColor="bg-emerald-600"
                    title="Introduce yourself"
                    description="Let your students give you details about themselves, their preferences and learning objectives."
                    note="13 questions"
                    badge="Coming Soon"
                    badgeColor="text-purple-700 bg-purple-100"
                    onClick={() => handleSelect('quiz', 'Introduce Yourself')}
                  />
                  <ActivityOption
                    icon={BookOpen}
                    iconColor="bg-emerald-600"
                    title="Course evaluation (short)"
                    description="A short form to get students to rate your course and make suggestions on improvement."
                    note="3 questions"
                    badge="Coming Soon"
                    badgeColor="text-purple-700 bg-purple-100"
                    onClick={() => handleSelect('quiz', 'Course Evaluation (Short)')}
                  />
                  <ActivityOption
                    icon={BookOpen}
                    iconColor="bg-emerald-600"
                    title="Course evaluation (long)"
                    description="Find out what your students thought about your course, along with its strengths and weaknesses."
                    note="16 questions"
                    badge="Coming Soon"
                    badgeColor="text-purple-700 bg-purple-100"
                    onClick={() => handleSelect('quiz', 'Course Evaluation (Long)')}
                  />
                  <ActivityOption
                    icon={GraduationCap}
                    iconColor="bg-emerald-600"
                    title="Instructor evaluation (short)"
                    description="A short form to get students to rate the course instructor and make suggestions on how they can improve."
                    note="3 questions"
                    badge="Coming Soon"
                    badgeColor="text-purple-700 bg-purple-100"
                    onClick={() => handleSelect('quiz', 'Instructor Evaluation (Short)')}
                  />
                  <ActivityOption
                    icon={GraduationCap}
                    iconColor="bg-emerald-600"
                    title="Instructor evaluation (long)"
                    description="Find out what your students thought about the course instructor and their teaching effectiveness."
                    note="8 questions"
                    badge="Coming Soon"
                    badgeColor="text-purple-700 bg-purple-100"
                    onClick={() => handleSelect('quiz', 'Instructor Evaluation (Long)')}
                  />
                  <ActivityOption
                    icon={Clipboard}
                    iconColor="bg-emerald-600"
                    title="Pre-event feedback form"
                    description="Get information from your attendees about their participation, as well as their expectations from the event"
                    note="14 questions"
                    badge="Coming Soon"
                    badgeColor="text-purple-700 bg-purple-100"
                    onClick={() => handleSelect('quiz', 'Pre-Event Feedback Form')}
                  />
                  <ActivityOption
                    icon={Clipboard}
                    iconColor="bg-emerald-600"
                    title="Post-event feedback form"
                    description="Get feedback regarding your event's effectiveness through a set of rating questions."
                    note="10 questions"
                    onClick={() => handleSelect('quiz', 'Post-Event Feedback Form')}
                  />

                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">ORDER TEMPLATES</h5>
                  <ActivityOption
                    icon={ShoppingCart}
                    iconColor="bg-purple-600"
                    title="Custom order"
                    description="Accept custom orders from your customers."
                    badge="Coming Soon"
                    badgeColor="text-purple-700 bg-purple-100"
                    onClick={() => handleSelect('quiz', 'Custom Order', false)}
                  />
                  <ActivityOption
                    icon={Armchair}
                    iconColor="bg-purple-600"
                    title="Seats order"
                    description="Enable your customers to easily place custom seats orders.."
                    badge="Coming Soon"
                    badgeColor="text-purple-700 bg-purple-100"
                    onClick={() => handleSelect('quiz', 'Seats Order')}
                  />
                  <ActivityOption
                    icon={Hourglass}
                    iconColor="bg-purple-600"
                    title="Trial request"
                    description="Allow potential customers to request a trial period for your courses before committing to a purchase."
                    badge="Coming Soon"
                    badgeColor="text-purple-700 bg-purple-100"
                    onClick={() => handleSelect('quiz', 'Trial Request')}
                  />
                  <ActivityOption
                    icon={Gift}
                    iconColor="bg-purple-600"
                    title="Gift a course"
                    description="Allow customers to request to gift your courses to their friends, family, or colleagues."
                    onClick={() => handleSelect('quiz', 'Gift a Course')}
                  />

                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">OTHER TEMPLATES</h5>
                  <ActivityOption
                    icon={ShieldCheck}
                    iconColor="bg-pink-600"
                    title="Consent form"
                    description="Get your student's consent to store and process their data."
                    note="1 question"
                    onClick={() => handleSelect('quiz', 'Consent Form', false)}
                  />
                  <ActivityOption
                    icon={ThumbsUp}
                    iconColor="bg-pink-600"
                    title="Customer satisfaction"
                    description="Find out how satisfied your customers are with your products and services."
                    note="14 questions"
                    onClick={() => handleSelect('quiz', 'Customer Satisfaction', false)}
                  />
                  <ActivityOption
                    icon={ClipboardList}
                    iconColor="bg-pink-600"
                    title="Self-evaluation"
                    description="Ask your students to evaluate their own contribution to a learning activity/ project."
                    note="6 questions"
                    onClick={() => handleSelect('quiz', 'Self-Evaluation', false)}
                  />
                  <ActivityOption
                    icon={UserPlus}
                    iconColor="bg-pink-600"
                    title="Instructor application"
                    description="Accept applications for course instructors on your website."
                    note="13 questions"
                    onClick={() => handleSelect('quiz', 'Instructor Application', false)}
                  />
                  <ActivityOption
                    icon={Clipboard}
                    iconColor="bg-pink-600"
                    title="Incident report"
                    description="Give your users a way to report incidents that need to be attended to."
                    note="5 questions"
                    onClick={() => handleSelect('quiz', 'Incident Report', false)}
                  />
                  <ActivityOption
                    icon={Users}
                    iconColor="bg-pink-600"
                    title="Customer needs assessment"
                    description="Learn about your customer needs and objectives."
                    note="5 questions"
                    onClick={() => handleSelect('quiz', 'Customer Needs Assessment', false)}
                  />
                </>
              )}

              {selectedCategory === 'Certificates' && (
                <>
                  <ActivityOption
                    icon={GraduationCap}
                    iconColor="bg-teal-600"
                    title="Certificate"
                    description="Award a certificate to your learners upon successful course completion."
                    onClick={() => handleSelect('certificate', 'Certificate')}
                  />
                </>
              )}

              {selectedCategory === 'Social' && (
                <>
                  <ActivityOption
                    icon={UserCircle}
                    iconColor="bg-orange-500"
                    title="Introduce yourself"
                    description="Let your learners introduce themselves to the community."
                    onClick={() => handleSelect('discussion', 'Introduce Yourself')}
                  />
                  <ActivityOption
                    icon={MessageCircle}
                    iconColor="bg-orange-500"
                    title="Think, pair, share"
                    description="Pose a problem or a question, and have your learners work together to solve it or answer it."
                    onClick={() => handleSelect('discussion', 'Think, Pair, Share')}
                  />
                  <ActivityOption
                    icon={Lightbulb}
                    iconColor="bg-orange-500"
                    title="Craft, share and shine"
                    description="Enable your learners to Elevate their creativity, receive Feedback, and collaborate for success in the school community."
                    badge="Coming Soon"
                    badgeColor="text-purple-700 bg-purple-100"
                    onClick={() => handleSelect('discussion', 'Craft, Share and Shine')}
                  />
                  <ActivityOption
                    icon={FolderOpen}
                    iconColor="bg-orange-500"
                    title="Exploring beyond the course"
                    description="Give room to your learners to share helpful resources or material that has helped them deepen their understanding beyond the course content."
                    badge="Coming Soon"
                    badgeColor="text-purple-700 bg-purple-100"
                    onClick={() => handleSelect('discussion', 'Exploring Beyond the Course')}
                  />
                </>
              )}

              {selectedCategory === 'Embed' && (
                <>
                  <ActivityOption
                    icon={Code}
                    iconColor="bg-yellow-500"
                    title="Embed"
                    description="Add content in your course by pasting embed codes."
                    onClick={() => handleSelect('embed', 'Embed')}
                  />
                  <ActivityOption
                    icon={Presentation}
                    iconColor="bg-yellow-500"
                    title="Slideshare"
                    description="Add a Slideshare presentation by pasting the embed code."
                    onClick={() => handleSelect('embed', 'Slideshare')}
                  />
                  <ActivityOption
                    icon={Link}
                    iconColor="bg-yellow-500"
                    title="External link"
                    description="Show an external webpage in the course player."
                    onClick={() => handleSelect('embed', 'External Link')}
                  />
                </>
              )}

              {!['Multimedia', 'Live Sessions', 'Ebook', 'Exams', 'Self-Assessment', 'Forms', 'Certificates', 'Social', 'Embed'].includes(selectedCategory) && (
                <div className="text-center py-12 text-gray-500">
                  <p>Activities for {selectedCategory} will be available soon.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ActivityOptionProps {
  icon: any;
  iconColor: string;
  title: string;
  description: string;
  note?: string;
  badge?: string;
  badgeColor?: string;
  onClick: () => void;
}

function ActivityOption({ icon: Icon, iconColor, title, description, note, badge, badgeColor, onClick }: ActivityOptionProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-teal-500 hover:bg-teal-50 transition-all text-left group mb-3"
    >
      <div className={`flex items-center justify-center size-12 ${iconColor} rounded-lg flex-shrink-0`}>
        <Icon className="size-6 text-white" />
      </div>
      <div className="flex-1">
        <h5 className="font-semibold text-gray-900 mb-1 flex items-center justify-between">
          <span>{title}</span>
          {badge && (
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badgeColor || 'text-gray-600 bg-gray-100'} ml-2`}>
              {badge}
            </span>
          )}
        </h5>
        <p className="text-sm text-gray-500">{description}</p>
        {note && (
          <div className="text-xs text-gray-400 mt-1">{note}</div>
        )}
      </div>
    </button>
  );
}