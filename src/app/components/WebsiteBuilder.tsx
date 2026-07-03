import { useState, useEffect, useRef } from 'react';
import { Course } from '@/app/types';
import { EditableContent } from './EditableContent';
import { Plus, Grip, Eye, EyeOff, Trash2, ChevronUp, ChevronDown, ChevronRight, Palette, Type, Image as ImageIcon, Monitor, Smartphone, Check, Users, DollarSign, HelpCircle, TrendingUp, Building2, Video, Copy, Settings, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, List, Link2, Sparkles, ArrowLeft, Loader2, Layout, PanelTop, FileText, Globe, MousePointerClick, Maximize, Filter, BookOpen, Layers, Zap, MessageSquare, Rss, Upload, X } from 'lucide-react';
import { supabase, authHeaders } from '/utils/supabase/client';
import { projectId } from '/utils/supabase/info';
import { courses as availableCourses } from '../data/courses';
import { CoursePlayerPreviewModal } from './course-builder/CoursePlayerPreviewModal';
import { defaultPlayerSettings } from './course-builder/coursePlayerSettings';
import type { CoursePlayerSettings } from './course-builder/coursePlayerSettings';

type SectionType = 'navbar' | 'hero' | 'course-grid' | 'features' | 'cta' | 'testimonials' | 'footer' | 'team' | 'pricing' | 'faq' | 'stats' | 'logos' | 'video' | 'rich-text' | 'image' | 'custom';

// Always-unique ID: timestamp + auto-incrementing counter avoids collisions
// when multiple IDs are generated within the same millisecond.
let _uidSeq = 0;
const uid = () => `${Date.now()}-${++_uidSeq}`;

interface WebsiteBlock {
  id: string;
  type: 'text' | 'heading' | 'paragraph' | 'button' | 'image' | 'video' | 'spacer' | 'features-grid' | 'course-grid' | 'team-grid' | 'pricing-grid' | 'stats-grid' | 'faq-list' | 'logos-grid' | 'footer-content';
  content: any;
  style?: any;
}

interface WebsiteSection {
  id: string;
  type: SectionType;
  title: string;
  visible: boolean;
  config: any;
  blocks?: WebsiteBlock[]; // Blocks can be added to any section, though mainly 'custom' uses them
}

interface WebsitePage {
  id: string;
  name: string;
  slug: string;
  sections: WebsiteSection[];
  subpages?: WebsitePage[];
  isOpen?: boolean;
  hidden?: boolean;   // when true the page is hidden from nav dropdowns & preview
}

interface WebsiteBuilderProps {
  companyName: string;
  courses?: Course[];
  companyId?: string;
}

export function WebsiteBuilder({ companyName, courses: propCourses, companyId: propCompanyId }: WebsiteBuilderProps) {
  // Derive a company ID for the API
  const companyId = propCompanyId || companyName.replace(/\s+/g, '-').toLowerCase();

  // Filter courses to show only those belonging to the company
  const availableCoursesList = (propCourses || availableCourses).filter(c => {
    if (!companyId) return true;
    return c.companyId === companyId;
  });

  // ── Standard nav config shared by all pages ──────────────────────────────
  const stdNavConfig = {
    logoText: companyName,
    links: [
      { text: 'Home',      url: '/'          },
      { text: 'Courses',   url: '/courses'   },
      { text: 'Resources', url: '/resources' },
      { text: 'Support',   url: '/support'   },
    ],
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    paddingTop: '1rem',
    paddingBottom: '1rem',
    sticky: true,
    showButton: true,
    buttonText: 'Get Started',
  };

  const makeNavSection = (id = 'nav-0'): WebsiteSection => ({
    id,
    type: 'navbar',
    title: 'Navigation Bar',
    visible: true,
    config: stdNavConfig,
  });

  const makeSimpleHeroSection = (
    id: string,
    headline: string,
    subheadline: string,
    ctaText: string
  ): WebsiteSection => ({
    id,
    type: 'hero',
    title: 'Hero Section',
    visible: true,
    config: {
      headline, subheadline, ctaText,
      backgroundImage: '', backgroundColor: '#134e4a', textColor: '#ffffff',
      alignment: 'center', paddingTop: '4rem', paddingBottom: '4rem',
      minHeight: '400px', animation: 'fade-in', fontSize: 'large',
    },
    blocks: [
      { id: `${id}-h`, type: 'heading',   content: { html: `<h1 class="text-4xl md:text-5xl font-bold mb-4">${headline}</h1>` }, style: {} },
      { id: `${id}-p`, type: 'paragraph', content: { html: `<p class="text-xl opacity-90 mb-8">${subheadline}</p>` }, style: {} },
      { id: `${id}-b`, type: 'button',    content: { text: ctaText, url: '#' }, style: {} },
    ],
  });

  const buildStandardPages = (): WebsitePage[] => [
    /* ── HOME ── */
    {
      id: 'home', name: 'Home', slug: '/', subpages: [],
      sections: [
        makeNavSection('0'),
        {
          id: '1', type: 'hero', title: 'Hero Section', visible: true,
          config: {
            headline: 'Transform Your Team with Expert Training',
            subheadline: 'Access professional courses designed for modern businesses',
            ctaText: 'Browse Courses', backgroundImage: '',
            backgroundColor: '#134e4a', textColor: '#ffffff',
            alignment: 'center', paddingTop: '4rem', paddingBottom: '4rem',
            minHeight: '600px', animation: 'fade-in', fontSize: 'large',
          },
          blocks: [
            { id: 'hero-h1',  type: 'heading',   content: { html: '<h1 class="text-4xl md:text-5xl font-bold mb-4">Transform Your Team with Expert Training</h1>' }, style: {} },
            { id: 'hero-p1',  type: 'paragraph', content: { html: '<p class="text-xl opacity-90 mb-8">Access professional courses designed for modern businesses</p>' }, style: {} },
            { id: 'hero-btn', type: 'button',    content: { text: 'Browse Courses', url: '#' }, style: {} },
          ],
        },
        {
          id: '2', type: 'course-grid', title: 'Course Showcase', visible: true,
          config: { heading: 'Our Training Programs', showCategories: true, coursesPerRow: 3, backgroundColor: '#f9fafb', paddingTop: '3rem', paddingBottom: '3rem' },
          blocks: [
            { id: 'course-h1',     type: 'heading',     content: { html: '<h2 class="text-3xl font-bold mb-8 text-center">Our Training Programs</h2>' }, style: {} },
            { id: 'course-grid-1', type: 'course-grid', content: {}, style: {} },
          ],
        },
      ],
    },
    /* ── COURSES ── */
    {
      id: 'courses', name: 'Courses', slug: '/courses', subpages: [],
      sections: [
        makeNavSection('0'),
        makeSimpleHeroSection('1', 'Our Courses', 'Browse our full catalog of professional training programs', 'View All Courses'),
      ],
    },
    /* ── RESOURCES ── */
    {
      id: 'resources', name: 'Resources', slug: '/resources', subpages: [],
      sections: [
        makeNavSection('0'),
        makeSimpleHeroSection('1', 'Resources', 'Guides, templates and tools to accelerate your learning', 'Explore Resources'),
      ],
    },
    /* ── SUPPORT ── */
    {
      id: 'support', name: 'Support', slug: '/support', subpages: [],
      sections: [
        makeNavSection('0'),
        makeSimpleHeroSection('1', 'Support', "We're here to help — find answers or get in touch", 'Contact Us'),
      ],
    },
  ];

  const [pages, setPages] = useState<WebsitePage[]>(() => buildStandardPages());
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _UNUSED_DEAD_CODE_SENTINEL = null; void(
    {
      id: '1',
      type: 'hero',
      title: 'Hero Section',
      visible: true,
      config: {
        headline: 'Transform Your Team with Expert Training',
        subheadline: 'Access professional courses designed for modern businesses',
        ctaText: 'Browse Courses',
        backgroundImage: '',
        backgroundColor: '#134e4a',
        textColor: '#ffffff',
        alignment: 'center',
        paddingTop: '4rem',
        paddingBottom: '4rem',
        minHeight: '600px',
        animation: 'fade-in',
        fontSize: 'large',
      },
      blocks: [
        { 
          id: 'hero-h1', 
          type: 'heading', 
          content: { html: '<h1 class="text-4xl md:text-5xl font-bold mb-4">Transform Your Team with Expert Training</h1>' }, 
          style: {} 
        },
        { 
          id: 'hero-p1', 
          type: 'paragraph', 
          content: { html: '<p class="text-xl opacity-90 mb-8">Access professional courses designed for modern businesses</p>' }, 
          style: {} 
        },
        { 
          id: 'hero-btn', 
          type: 'button', 
          content: { text: 'Browse Courses', url: '#' }, 
          style: {} 
        }
      ]
    },
    {
      id: '2',
      type: 'course-grid',
      title: 'Course Showcase',
      visible: true,
      config: {
        heading: 'Our Training Programs',
        showCategories: true,
        coursesPerRow: 3,
        backgroundColor: '#f9fafb',
        paddingTop: '3rem',
        paddingBottom: '3rem',
      },
      blocks: [
        { 
          id: 'course-h1', 
          type: 'heading', 
          content: { html: '<h2 class="text-3xl font-bold mb-8 text-center">Our Training Programs</h2>' }, 
          style: {} 
        },
        { id: 'course-grid-1', type: 'course-grid', content: {}, style: {} }
      ]
    }
  );
  const [activePageId, setActivePageId] = useState<string>('home');
  const [sidebarView, setSidebarView] = useState<'pages' | 'sections' | 'customize'>('pages');
  const [sidebarMainTab, setSidebarMainTab] = useState<'pages' | 'funnel' | 'popups' | 'blog'>('pages');

  // Helper to find a page by ID recursively
  const findPageById = (pages: WebsitePage[], id: string): WebsitePage | undefined => {
    for (const page of pages) {
      if (page.id === id) return page;
      if (page.subpages) {
        const found = findPageById(page.subpages, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  // Helper to update page sections recursively
  const updatePageSections = (pages: WebsitePage[], id: string, newSections: WebsiteSection[]): WebsitePage[] => {
    return pages.map(page => {
      if (page.id === id) {
        return { ...page, sections: newSections };
      }
      if (page.subpages) {
        return { ...page, subpages: updatePageSections(page.subpages, id, newSections) };
      }
      return page;
    });
  };

  // Derived state for sections
  const activePage = findPageById(pages, activePageId);
  const sections = activePage?.sections || [];

  // Custom setter for sections that updates the pages state directly
  const setSections = (newSectionsOrUpdater: WebsiteSection[] | ((current: WebsiteSection[]) => WebsiteSection[])) => {
    setPages(prevPages => {
      // Find current page in the previous state to get the most up-to-date sections
      const activePage = findPageById(prevPages, activePageId);
      const currentSections = activePage?.sections || [];
      
      let newSections: WebsiteSection[];
      if (typeof newSectionsOrUpdater === 'function') {
        newSections = newSectionsOrUpdater(currentSections);
      } else {
        newSections = newSectionsOrUpdater;
      }
      
      return updatePageSections(prevPages, activePageId, newSections);
    });
  };

  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedTemplateType, setDraggedTemplateType] = useState<string | null>(null);
  const [draggedElementType, setDraggedElementType] = useState<string | null>(null);
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<{sectionId: string, index: number} | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [activeCustomTab, setActiveCustomTab] = useState<'content' | 'style' | 'layout'>('content');
  const [activeAddTab, setActiveAddTab] = useState<'sections' | 'elements'>('sections');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [activeFunnelPopup, setActiveFunnelPopup] = useState<string | null>(null);
  const [blogWizard, setBlogWizard] = useState<{
    type: 'new-article' | 'categories' | 'blog-settings';
    label: string; desc: string; icon: any; color: string;
    step: 1 | 2;
    // new-article
    title: string;
    category: string;
    tags: string;
    allowComments: boolean;
    seoDescription: string;
    // categories
    catName: string;
    catSlug: string;
    catDescription: string;
    catColor: string;
    // blog-settings
    blogTitle: string;
    blogDescription: string;
    postsPerPage: number;
    commentsEnabled: boolean;
    rssEnabled: boolean;
    analyticsId: string;
  } | null>(null);
  const [popupWizard, setPopupWizard] = useState<{
    type: 'exit-intent' | 'welcome-banner' | 'lead-magnet';
    label: string; desc: string; icon: any; color: string;
    step: 1 | 2;
    name: string;
    headline: string;
    body: string;
    cta: string;
    // exit-intent
    triggerDelay: 'immediate' | '5s' | '10s';
    // welcome-banner
    position: 'top' | 'bottom' | 'modal';
    // lead-magnet
    offerType: 'free-course' | 'ebook' | 'checklist' | 'webinar';
    emailPlaceholder: string;
    // shared
    showTo: 'everyone' | 'new-visitors';
  } | null>(null);
  const [funnelWizard, setFunnelWizard] = useState<{
    label: string; desc: string; icon: any; color: string;
    step: 1 | 2;
    name: string;
    emailCapture: boolean;
    tracking: boolean;
  } | null>(null);

  // Course player preview state
  const [playerPreviewCourse, setPlayerPreviewCourse] = useState<{ title: string; description?: string } | null>(null);
  const [playerPreviewSections, setPlayerPreviewSections] = useState<any[]>([]);
  const [playerPreviewSettings, setPlayerPreviewSettings] = useState<CoursePlayerSettings>(defaultPlayerSettings);
  const [isLoadingPlayerPreview, setIsLoadingPlayerPreview] = useState(false);

  const updateBlockContent = (sectionId: string, blockId: string, newContent: any) => {
    setSections(prevSections => prevSections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          blocks: section.blocks?.map(block => 
            block.id === blockId ? { ...block, content: newContent } : block
          )
        };
      }
      return section;
    }));
  };

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data: configRow, error } = await supabase
          .from('website_config')
          .select('pages')
          .eq('company_id', companyId)
          .maybeSingle();

        if (error) {
          console.error('Failed to load website config:', error.message);
        } else if (configRow) {
          const savedPages = configRow.pages;
          if (Array.isArray(savedPages) && savedPages.length > 0) {
            const standardLinks = [
              { text: 'Home', url: '/' },
              { text: 'Courses', url: '/courses' },
              { text: 'Resources', url: '/resources' },
              { text: 'Support', url: '/support' }
            ];

            const updatePageRecursive = (pageList: any[]): any[] => {
              return pageList.map(page => ({
                ...page,
                sections: (page.sections || []).map((section: any) => {
                  if (section.type === 'navbar') {
                    return {
                      ...section,
                      config: {
                        ...section.config,
                        links: standardLinks
                      }
                    };
                  }
                  return section;
                }),
                subpages: page.subpages ? updatePageRecursive(page.subpages) : []
              }));
            };

            const updatedPages = updatePageRecursive(savedPages);

            // ── Step 1: Ensure all four standard top-level pages exist ──────
            const defaults = buildStandardPages();
            const standardIds = ['home', 'courses', 'resources', 'support'];
            let mergedPages: any[] = [...updatedPages];
            for (const stdId of standardIds) {
              if (!mergedPages.find((p: any) => p.id === stdId)) {
                const fallback = defaults.find(p => p.id === stdId);
                if (fallback) mergedPages.push(fallback);
              }
            }

            // ── Step 2: Migrate Home subpages to their correct parent ────────
            // Older configs stored ALL subpages under Home. Redistribute them
            // to the correct standard page based on name-prefix so they appear
            // under the right navbar dropdown.
            const prefixMap: Record<string, string[]> = {
              courses:   ['course'],
              resources: ['resource'],
              support:   ['support', 'help', 'faq'],
            };
            const homeNode: any = mergedPages.find((p: any) => p.id === 'home');
            if (homeNode?.subpages?.length) {
              const toAdd: Record<string, any[]> = {};
              const remainingHome: any[] = [];
              for (const sub of homeNode.subpages) {
                const lc = (sub.name || '').toLowerCase();
                let placed = false;
                for (const [parentId, prefixes] of Object.entries(prefixMap)) {
                  if (prefixes.some(pref => lc.startsWith(pref))) {
                    (toAdd[parentId] = toAdd[parentId] || []).push(sub);
                    placed = true;
                    break;
                  }
                }
                if (!placed) remainingHome.push(sub);
              }
              mergedPages = mergedPages.map((p: any) => {
                if (p.id === 'home') return { ...p, subpages: remainingHome };
                if (toAdd[p.id])     return { ...p, subpages: [...(p.subpages || []), ...toAdd[p.id]] };
                return p;
              });
            }

            // ── Step 3: Deduplicate section IDs (fixes Date.now() collisions) ─
            // Sections saved before the uid() fix may share the same timestamp ID.
            // A duplicate ID causes React reconciliation to misidentify elements so
            // removeSection appears to do nothing even though the filter ran.
            const seenSectionIds = new Set<string>();
            const dedupePageSections = (pageList: any[]): any[] =>
              pageList.map(page => ({
                ...page,
                sections: (page.sections || []).map((section: any) => {
                  if (seenSectionIds.has(section.id)) {
                    return { ...section, id: uid() };
                  }
                  seenSectionIds.add(section.id);
                  return section;
                }),
                subpages: page.subpages ? dedupePageSections(page.subpages) : []
              }));
            mergedPages = dedupePageSections(mergedPages);

            setPages(mergedPages);

            const activePage = mergedPages.find((p: any) => p.id === 'home') || mergedPages[0];
            if (activePage) setActivePageId(activePage.id);
          }
        }
      } catch (error) {
        console.error('Error loading website config:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadConfig();
  }, [companyId]);

  const switchPage = (pageId: string) => {
    if (pageId === activePageId) return;

    const targetPage = findPageById(pages, pageId);
    if (targetPage) {
      setActivePageId(pageId);
      setSelectedSection(null);
    }
  };

  const addPage = (parentId?: string) => {
    const newPageId = `page-${uid()}`;
    const newPage: WebsitePage = {
      id: newPageId,
      name: 'New Page',
      slug: `/new-page-${uid()}`,
      sections: [
        {
          id: '0',
          type: 'navbar',
          title: 'Navigation Bar',
          visible: true,
          config: sections.find(s => s.type === 'navbar')?.config || { /* Default navbar config */ 
             logoText: companyName,
             links: [
               { text: 'Home', url: '/' },
               { text: 'Courses', url: '/courses' },
               { text: 'Resources', url: '/resources' },
               { text: 'Support', url: '/support' }
             ],
             backgroundColor: '#ffffff',
             textColor: '#1f2937'
          }
        },
        {
          id: '1',
          type: 'hero',
          title: 'Hero Section',
          visible: true,
          config: {
             headline: 'New Page Title',
             subheadline: 'Add your content here',
             backgroundColor: '#ffffff',
             textColor: '#000000',
             paddingTop: '4rem',
             paddingBottom: '4rem'
          }
        }
      ],
      subpages: []
    };

    if (parentId) {
      const addPageRecursive = (currentPages: WebsitePage[]): WebsitePage[] => {
        return currentPages.map(page => {
          if (page.id === parentId) {
            return { ...page, subpages: [...(page.subpages || []), newPage], isOpen: true };
          }
          if (page.subpages) {
            return { ...page, subpages: addPageRecursive(page.subpages) };
          }
          return page;
        });
      };
      setPages(prev => addPageRecursive(prev));
    } else {
      setPages(prev => [...prev, newPage]);
    }

    setActivePageId(newPageId);
    setSelectedSection(null);
  };
  
  const deletePage = (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation();
    
    const deleteRecursive = (list: WebsitePage[]): WebsitePage[] => {
      return list
        .filter(p => p.id !== pageId)
        .map(p => ({
          ...p,
          subpages: p.subpages ? deleteRecursive(p.subpages) : undefined
        }));
    };

    const newPages = deleteRecursive(pages);
    
    if (newPages.length === 0) return; 

    setPages(newPages);
    
    if (activePageId === pageId || !findPageById(newPages, activePageId)) {
      if (newPages[0]) {
        switchPage(newPages[0].id);
      }
    }
  };

  const togglePageVisibility = (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation();
    const toggleRecursive = (list: WebsitePage[]): WebsitePage[] =>
      list.map(p => {
        if (p.id === pageId) return { ...p, hidden: !p.hidden };
        if (p.subpages) return { ...p, subpages: toggleRecursive(p.subpages) };
        return p;
      });
    setPages(prev => toggleRecursive(prev));
  };

  const updatePageMeta = (id: string, field: 'name' | 'slug', value: string) => {
    const updateRecursive = (list: WebsitePage[]): WebsitePage[] => {
      return list.map(p => {
        if (p.id === id) return { ...p, [field]: value };
        if (p.subpages) return { ...p, subpages: updateRecursive(p.subpages) };
        return p;
      });
    };
    setPages(prev => updateRecursive(prev));
  };

  const movePage = (e: React.MouseEvent, pageId: string, direction: 'up' | 'down') => {
    e.stopPropagation();
    
    const moveRecursive = (list: WebsitePage[]): WebsitePage[] => {
      const index = list.findIndex(p => p.id === pageId);
      if (index !== -1) {
        const newList = [...list];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        
        if (targetIndex >= 0 && targetIndex < list.length) {
          [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
          return newList;
        }
        return list;
      }
      
      return list.map(p => ({
        ...p,
        subpages: p.subpages ? moveRecursive(p.subpages) : undefined
      }));
    };

    setPages(prev => moveRecursive(prev));
  };

  const togglePageExpanded = (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation();
    const toggleRecursive = (list: WebsitePage[]): WebsitePage[] => {
      return list.map(p => {
        if (p.id === pageId) return { ...p, isOpen: !p.isOpen };
        if (p.subpages) return { ...p, subpages: toggleRecursive(p.subpages) };
        return p;
      });
    };
    setPages(prev => toggleRecursive(prev));
  };

  const sectionTemplates = [
    { type: 'custom', label: 'Custom Section', icon: Layout, category: 'structure' },
    { type: 'navbar', label: 'Header Navigation', icon: PanelTop, category: 'header' },
    { type: 'hero', label: 'Hero Section', icon: Monitor, category: 'header' },
    { type: 'course-grid', label: 'Course Showcase', icon: ImageIcon, category: 'content' },
    { type: 'features', label: 'Features Grid', icon: Plus, category: 'content' },
    { type: 'team', label: 'Team Section', icon: Users, category: 'content' },
    { type: 'pricing', label: 'Pricing Table', icon: DollarSign, category: 'content' },
    { type: 'stats', label: 'Statistics', icon: TrendingUp, category: 'content' },
    { type: 'logos', label: 'Logo Grid', icon: Building2, category: 'content' },
    { type: 'image', label: 'Image', icon: ImageIcon, category: 'media' },
    { type: 'video', label: 'Video Section', icon: Video, category: 'media' },
    { type: 'rich-text', label: 'Rich Text', icon: Type, category: 'content' },
    { type: 'testimonials', label: 'Testimonials', icon: Type, category: 'social' },
    { type: 'faq', label: 'FAQ Accordion', icon: HelpCircle, category: 'content' },
    { type: 'cta', label: 'Call to Action', icon: Palette, category: 'conversion' },
    { type: 'footer', label: 'Footer', icon: Monitor, category: 'footer' },
  ];

  const icons = ['⭐', '🎯', '🚀', '💡', '✓', '💼', '📊', '🎓', '🏆', '💪', '🔥', '⚡'];

  const elementTemplates = [
    { type: 'heading', label: 'Heading', icon: Type },
    { type: 'paragraph', label: 'Paragraph', icon: AlignLeft },
    { type: 'button', label: 'Button', icon: MousePointerClick },
    { type: 'image', label: 'Image', icon: ImageIcon },
    { type: 'spacer', label: 'Spacer', icon: Maximize },
  ];

  const createSectionObject = (type: string): WebsiteSection => {
    const template = sectionTemplates.find(t => t.type === type);
    
    // Initialize blocks for block-based sections
    let initialBlocks: WebsiteBlock[] = [];
    const timestamp = uid();
    
    if (type === 'hero') {
      initialBlocks = [
        { id: `b-${timestamp}-1`, type: 'heading', content: { html: '<h1 class="text-4xl md:text-5xl font-bold mb-4">Hero Headline</h1>' }, style: {} },
        { id: `b-${timestamp}-2`, type: 'paragraph', content: { html: '<p class="text-xl opacity-90 mb-8">Subheadline text goes here</p>' }, style: {} },
        { id: `b-${timestamp}-3`, type: 'button', content: { text: 'Get Started', url: '#' }, style: {} }
      ];
    } else if (type === 'rich-text') {
      initialBlocks = [
        { id: `b-${timestamp}-1`, type: 'heading', content: { html: '<h2>Your Content Here</h2>' }, style: {} },
        { id: `b-${timestamp}-2`, type: 'paragraph', content: { html: '<p>Start editing this section to add your content. You can add headings, paragraphs, lists, and more.</p>' }, style: {} }
      ];
    } else if (type === 'image') {
       initialBlocks = [
          { 
             id: `b-${timestamp}-1`, 
             type: 'image', 
             content: { 
                url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1471&q=80', 
                alt: 'Section Image' 
             }, 
             style: {} 
          },
          { id: `b-${timestamp}-2`, type: 'paragraph', content: { html: '<p class="text-center text-sm text-gray-500 mt-4">Image Caption</p>' }, style: {} }
       ];
    } else if (type === 'video') {
       initialBlocks = [
          { id: `b-${timestamp}-1`, type: 'heading', content: { html: '<h2 class="text-3xl font-bold mb-4">Watch Our Introduction</h2>' }, style: {} },
          { id: `b-${timestamp}-2`, type: 'paragraph', content: { html: '<p class="text-gray-600 mb-8">Learn more about what we offer</p>' }, style: {} },
          { id: `b-${timestamp}-3`, type: 'video', content: { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }, style: {} }
       ];
    } else if (type === 'cta') {
       initialBlocks = [
          { id: `b-${timestamp}-1`, type: 'heading', content: { html: '<h2 class="text-3xl font-bold mb-4">Ready to Get Started?</h2>' }, style: {} },
          { id: `b-${timestamp}-2`, type: 'paragraph', content: { html: '<p class="text-xl opacity-90 mb-8">Join thousands of students today.</p>' }, style: {} },
          { id: `b-${timestamp}-3`, type: 'button', content: { text: 'Sign Up Now', url: '#' }, style: {} }
       ];
    } else if (type === 'features') {
       initialBlocks = [
          { id: `b-${timestamp}-1`, type: 'heading', content: { html: '<h2 class="text-3xl font-bold mb-8 text-center">Why Choose Us</h2>' }, style: {} },
          { id: `b-${timestamp}-2`, type: 'features-grid' as any, content: {}, style: {} }
       ];
    } else if (type === 'course-grid') {
       initialBlocks = [
          { id: `b-${timestamp}-1`, type: 'heading', content: { html: '<h2 class="text-3xl font-bold mb-8 text-center">Our Courses</h2>' }, style: {} },
          { id: `b-${timestamp}-2`, type: 'course-grid' as any, content: {}, style: {} }
       ];
    } else if (type === 'team') {
       initialBlocks = [
          { id: `b-${timestamp}-1`, type: 'heading', content: { html: '<h2 class="text-3xl font-bold mb-8 text-center">Meet Our Team</h2>' }, style: {} },
          { id: `b-${timestamp}-2`, type: 'team-grid' as any, content: {}, style: {} }
       ];
    } else if (type === 'pricing') {
       initialBlocks = [
          { id: `b-${timestamp}-1`, type: 'heading', content: { html: '<h2 class="text-3xl font-bold mb-8 text-center">Choose Your Plan</h2>' }, style: {} },
          { id: `b-${timestamp}-2`, type: 'pricing-grid' as any, content: {}, style: {} }
       ];
    } else if (type === 'stats') {
       initialBlocks = [
          { id: `b-${timestamp}-1`, type: 'heading', content: { html: '<h2 class="text-3xl font-bold mb-12 text-center text-white">Our Impact</h2>' }, style: {} },
          { id: `b-${timestamp}-2`, type: 'stats-grid' as any, content: {}, style: {} }
       ];
    } else if (type === 'faq') {
       initialBlocks = [
          { id: `b-${timestamp}-1`, type: 'heading', content: { html: '<h2 class="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>' }, style: {} },
          { id: `b-${timestamp}-2`, type: 'faq-list' as any, content: {}, style: {} }
       ];
    } else if (type === 'logos') {
       initialBlocks = [
          { id: `b-${timestamp}-1`, type: 'heading', content: { html: '<h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8 text-center">Trusted By Leading Companies</h3>' }, style: {} },
          { id: `b-${timestamp}-2`, type: 'logos-grid' as any, content: {}, style: {} }
       ];
    } else if (type === 'footer') {
       initialBlocks = [
          { id: `b-${timestamp}-1`, type: 'footer-content' as any, content: {}, style: {} }
       ];
    }

    const defaultConfigs: Record<string, any> = {
      custom: {
         backgroundColor: '#ffffff',
         paddingTop: '3rem',
         paddingBottom: '3rem',
         minHeight: '200px',
         layout: 'column'
      },
      navbar: {
        logoText: companyName || 'Brand',
        logoImage: '',
        links: [
          { text: 'Home', url: '/' },
          { text: 'Courses', url: '/courses' },
          { text: 'About', url: '/about' },
          { text: 'Support', url: '#' },
        ],
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        paddingTop: '1rem',
        paddingBottom: '1rem',
        sticky: true,
        showButton: true,
        buttonText: 'Get Started',
        buttonUrl: '#'
      },
      hero: {
        headline: 'Your Headline Here',
        subheadline: 'Subheadline text',
        ctaText: 'Get Started',
        backgroundColor: '#134e4a',
        textColor: '#ffffff',
        alignment: 'center',
        paddingTop: '4rem',
        paddingBottom: '4rem',
        minHeight: '600px',
        animation: 'fade-in',
        fontSize: 'large',
      },
      team: {
        heading: 'Meet Our Team',
        members: [
          { name: 'Team Member 1', role: 'Role', image: '', bio: 'Brief bio' },
          { name: 'Team Member 2', role: 'Role', image: '', bio: 'Brief bio' },
          { name: 'Team Member 3', role: 'Role', image: '', bio: 'Brief bio' },
        ],
        backgroundColor: '#ffffff',
        paddingTop: '3rem',
        paddingBottom: '3rem',
      },
      pricing: {
        heading: 'Choose Your Plan',
        plans: [
          { name: 'Basic', price: '$29', period: '/month', features: ['Feature 1', 'Feature 2', 'Feature 3'], highlighted: false },
          { name: 'Pro', price: '$79', period: '/month', features: ['Everything in Basic', 'Feature 4', 'Feature 5', 'Feature 6'], highlighted: true },
          { name: 'Enterprise', price: '$149', period: '/month', features: ['Everything in Pro', 'Feature 7', 'Feature 8', 'Priority Support'], highlighted: false },
        ],
        backgroundColor: '#f9fafb',
        paddingTop: '3rem',
        paddingBottom: '3rem',
      },
      faq: {
        heading: 'Frequently Asked Questions',
        questions: [
          { question: 'What is included in the course?', answer: 'Our courses include video lessons, downloadable resources, quizzes, and certificates upon completion.' },
          { question: 'How long do I have access?', answer: 'You have lifetime access to all course materials once enrolled.' },
          { question: 'Is there a refund policy?', answer: 'Yes, we offer a 30-day money-back guarantee if you\'re not satisfied.' },
        ],
        backgroundColor: '#ffffff',
        paddingTop: '3rem',
        paddingBottom: '3rem',
      },
      stats: {
        heading: 'Our Impact',
        statistics: [
          { number: '10,000+', label: 'Students Trained', icon: '👥' },
          { number: '500+', label: 'Courses Available', icon: '📚' },
          { number: '95%', label: 'Satisfaction Rate', icon: '⭐' },
          { number: '50+', label: 'Expert Instructors', icon: '🎓' },
        ],
        backgroundColor: '#134e4a',
        textColor: '#ffffff',
        paddingTop: '3rem',
        paddingBottom: '3rem',
      },
      logos: {
        heading: 'Trusted By Leading Companies',
        logos: [
          { name: 'Company 1', image: '' },
          { name: 'Company 2', image: '' },
          { name: 'Company 3', image: '' },
          { name: 'Company 4', image: '' },
          { name: 'Company 5', image: '' },
          { name: 'Company 6', image: '' },
        ],
        backgroundColor: '#f9fafb',
        paddingTop: '2rem',
        paddingBottom: '2rem',
      },
      image: {
        imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1471&q=80',
        altText: 'Section Image',
        caption: '',
        fullWidth: false,
        backgroundColor: '#ffffff',
        paddingTop: '3rem',
        paddingBottom: '3rem',
      },
      video: {
        heading: 'Watch Our Introduction',
        description: 'Learn more about what we offer',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        thumbnailUrl: '',
        backgroundColor: '#ffffff',
        paddingTop: '3rem',
        paddingBottom: '3rem',
      },
      cta: {
        backgroundColor: '#134e4a',
        textColor: '#ffffff',
        paddingTop: '4rem',
        paddingBottom: '4rem',
      },
      'rich-text': {
        content: '<h2>Your Content Here</h2><p>Start editing this section to add your content. You can add headings, paragraphs, lists, and more.</p>',
        backgroundColor: '#ffffff',
        paddingTop: '3rem',
        paddingBottom: '3rem',
        maxWidth: '800px',
      },
      footer: {
        backgroundColor: '#1f2937',
        textColor: '#ffffff',
        paddingTop: '4rem',
        paddingBottom: '2rem',
        companyName: companyName || 'Company Name',
        description: 'Empowering learners worldwide with high-quality education.',
        links: [
          { text: 'About Us', url: '#' },
          { text: 'Courses', url: '#' },
          { text: 'Contact', url: '#' },
          { text: 'Privacy Policy', url: '#' },
        ]
      }
    };

    return {
      id: uid(),
      type: type as SectionType,
      title: template?.label || 'New Section',
      visible: true,
      config: defaultConfigs[type] || {},
      blocks: initialBlocks
    };
  };

  const addSection = (type: string) => {
    const newSection = createSectionObject(type);
    setSections(prev => [...prev, newSection]);
  };

  const removeSection = (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
    if (selectedSection === id) {
      setSelectedSection(null);
    }
  };

  const duplicateSection = (id: string) => {
    setSections(prev => {
      const index = prev.findIndex(s => s.id === id);
      if (index === -1) return prev;
      
      const section = prev[index];
      const newSection: WebsiteSection = {
        ...section,
        id: uid(),
        title: `${section.title} (Copy)`,
      };
      
      const newSections = [...prev];
      newSections.splice(index + 1, 0, newSection);
      return newSections;
    });
  };

  const toggleSectionVisibility = (id: string) => {
    setSections(prev => prev.map(s => 
      s.id === id ? { ...s, visible: !s.visible } : s
    ));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    setSections(prev => {
      const newSections = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (targetIndex >= 0 && targetIndex < newSections.length) {
        [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
        return newSections;
      }
      return prev;
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    // Do not reorder sections if we are dragging an element
    if (draggedElementType) return;

    // Handle dragging a new template
    if (draggedTemplateType) {
      const newSection = createSectionObject(draggedTemplateType);
      
      setSections(prev => {
        const newSections = [...prev];
        newSections.splice(index, 0, newSection);
        return newSections;
      });
      
      setDraggedIndex(index);
      setDraggedTemplateType(null); // Clear it so we are now just dragging the new item
      return;
    }

    if (draggedIndex === null || draggedIndex === index) return;

    setSections(prev => {
      const newSections = [...prev];
      const draggedItem = newSections[draggedIndex];
      // Check if dragged item exists (might have been removed)
      if (!draggedItem) return prev;
      
      newSections.splice(draggedIndex, 1);
      newSections.splice(index, 0, draggedItem);
      return newSections;
    });
    
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleBlockDragStart = (sectionId: string, index: number) => {
    setDraggedBlockIndex({ sectionId, index });
  };

  const handleBlockDragEnd = () => {
    setDraggedBlockIndex(null);
  };

  const addBlockToSection = (sectionId: string, blockType: string, index?: number) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      
      let content = {};
      if (blockType === 'text') content = { html: '<h3>New Text Block</h3><p>Edit this content...</p>' };
      else if (blockType === 'heading') content = { html: '<h2 class="text-3xl font-bold">New Heading</h2>' };
      else if (blockType === 'paragraph') content = { html: '<p class="text-gray-600">Start writing your paragraph here...</p>' };
      else if (blockType === 'button') content = { text: 'Click Me', url: '#' };
      else if (blockType === 'image') content = { url: '', alt: 'Image' };
      else if (blockType === 'spacer') content = { height: '32px' };

      const newBlock: WebsiteBlock = {
        id: `block-${uid()}`,
        type: blockType as any,
        content,
        style: {}
      };

      const currentBlocks = section.blocks || [];
      const newBlocks = [...currentBlocks];
      
      if (typeof index === 'number' && index >= 0) {
        newBlocks.splice(index, 0, newBlock);
      } else {
        newBlocks.push(newBlock);
      }

      return {
        ...section,
        blocks: newBlocks
      };
    }));
    
    setDraggedElementType(null);
  };

  const deleteBlock = (sectionId: string, index: number) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      const newBlocks = [...(section.blocks || [])];
      newBlocks.splice(index, 1);
      return { ...section, blocks: newBlocks };
    }));
  };

  const moveBlock = (sectionId: string, fromIndex: number, toIndex: number) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      const newBlocks = [...(section.blocks || [])];
      
      if (fromIndex < 0 || fromIndex >= newBlocks.length || toIndex < 0 || toIndex > newBlocks.length) {
        return section;
      }

      const [movedBlock] = newBlocks.splice(fromIndex, 1);
      // Adjust index if shifting down
      // If we remove from 0 and want to insert at 2, the array length shrinks by 1.
      // 0, 1, 2, 3 -> remove 0 -> 1, 2, 3 -> insert at 2 -> 1, 2, 0, 3 (Wait)
      // Standard splice logic handles this if we just treat it as "remove then insert".
      
      newBlocks.splice(toIndex, 0, movedBlock);
      
      return { ...section, blocks: newBlocks };
    }));
  };

  const updateSectionConfig = (id: string, field: string, value: any) => {
    setSections(prev => prev.map(s => {
      if (s.id !== id) return s;

      const newConfig = { ...s.config, [field]: value };
      let newBlocks = s.blocks;

      // Sync section inputs with blocks
      if (s.blocks && s.blocks.length > 0) {
        newBlocks = [...s.blocks];
        
        // Generic Heading Sync (for all sections that use 'heading' config)
        if (field === 'heading' || field === 'headline') {
          const idx = newBlocks.findIndex(b => b.type === 'heading');
          if (idx !== -1) {
            newBlocks[idx] = {
              ...newBlocks[idx],
              content: { 
                ...newBlocks[idx].content, 
                // Use h1 for hero, h2 for others
                html: s.type === 'hero' 
                  ? `<h1 class="text-4xl md:text-5xl font-bold mb-4">${value}</h1>`
                  : `<h2 class="text-3xl font-bold mb-8 text-center">${value}</h2>`
              }
            };
          }
        }
        
        // Generic Subheadline/Description Sync
        else if (field === 'subheadline' || field === 'description') {
          const idx = newBlocks.findIndex(b => b.type === 'paragraph');
          if (idx !== -1) {
            newBlocks[idx] = {
              ...newBlocks[idx],
              content: { 
                ...newBlocks[idx].content, 
                html: s.type === 'hero'
                  ? `<p class="text-xl opacity-90 mb-8">${value}</p>`
                  : `<p class="text-gray-600 mb-8 text-center">${value}</p>`
              }
            };
          }
        }

        // Hero specific button sync
        else if (s.type === 'hero') {
           if (field === 'ctaText') {
             const idx = newBlocks.findIndex(b => b.type === 'button');
             if (idx !== -1) {
               newBlocks[idx] = {
                 ...newBlocks[idx],
                 content: { ...newBlocks[idx].content, text: value }
               };
             }
          } else if (field === 'ctaLink') {
             const idx = newBlocks.findIndex(b => b.type === 'button');
             if (idx !== -1) {
               newBlocks[idx] = {
                 ...newBlocks[idx],
                 content: { ...newBlocks[idx].content, url: value }
               };
             }
          }
        }
      }

      return { ...s, config: newConfig, blocks: newBlocks };
    }));
  };

  const selectedSectionData = sections.find(s => s.id === selectedSection);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      console.log('Publishing website configuration:', pages);

      const { error } = await supabase
        .from('website_config')
        .upsert(
          { company_id: companyId, pages },
          { onConflict: 'company_id' }
        );

      if (error) {
        console.error('Failed to publish website:', error.message);
      } else {
        setIsPublished(true);
        setTimeout(() => setIsPublished(false), 3000);
      }
    } catch (error) {
      console.error('Error publishing website:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  // Auto-save changes
  useEffect(() => {
    if (isLoading) return;

    const timeoutId = setTimeout(() => {
      handlePublish();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [pages, isLoading]);

  const renderPageItem = (page: WebsitePage, depth = 0) => {
    const hasChildren = page.subpages && page.subpages.length > 0;
    const isHidden = !!page.hidden;
    
    return (
      <div key={page.id} className="select-none">
        <div 
          onClick={() => switchPage(page.id)}
          className={`group flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors ${
            activePageId === page.id ? 'bg-teal-50 text-teal-900' : 'text-gray-700'
          } ${isHidden ? 'opacity-50' : ''}`}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center w-4 shrink-0">
              {hasChildren && (
                <button 
                  onClick={(e) => togglePageExpanded(e, page.id)} 
                  className="p-0.5 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronDown className={`size-3 transition-transform ${page.isOpen ? '' : '-rotate-90'}`} />
                </button>
              )}
            </div>
            
            <FileText className={`size-4 shrink-0 ${activePageId === page.id ? 'text-teal-600' : 'text-gray-400'}`} />
            <span className={`truncate text-sm font-medium ${isHidden ? 'line-through text-gray-400' : ''}`}>
              {page.name}
            </span>
            {/* Always-visible hidden badge */}
            {isHidden && (
              <span className="shrink-0 flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-400">
                <EyeOff className="size-2.5" />
                Hidden
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Visibility toggle */}
            <button
              onClick={(e) => togglePageVisibility(e, page.id)}
              className={`p-1 rounded transition-colors ${
                isHidden
                  ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title={isHidden ? 'Show page' : 'Hide page'}
            >
              {isHidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
            </button>
            <button
              onClick={(e) => { 
                e.stopPropagation(); 
                addPage(page.id);
                setSidebarView('pages');
              }}
              className="p-1 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded"
              title="Add subpage"
            >
              <Plus className="size-3" />
            </button>
            <button
              onClick={(e) => movePage(e, page.id, 'up')}
              className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Move up"
            >
              <ChevronUp className="size-3" />
            </button>
            <button
              onClick={(e) => movePage(e, page.id, 'down')}
              className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Move down"
            >
              <ChevronDown className="size-3" />
            </button>
            <button
              onClick={(e) => {
                deletePage(e, page.id);
                setSidebarView('pages');
              }}
              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
              title="Delete page"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        </div>
        
        {page.isOpen && page.subpages && (
          <div className="animate-in fade-in slide-in-from-top-1">
            {page.subpages.map(child => renderPageItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderPageManager = () => (
     <div className="p-4 border-b border-gray-200 bg-gray-50/50">
       <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Current Page</label>
       <div className="relative group">
         <button 
           className="w-full flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-sm hover:border-teal-500 hover:ring-1 hover:ring-teal-500 transition-all"
           onClick={() => setSidebarView(sidebarView === 'pages' ? 'sections' : 'pages')}
         >
           <div className="flex items-center gap-2 min-w-0">
             <FileText className="size-4 text-teal-600" />
             <span className="font-medium text-gray-900 truncate">
               {findPageById(pages, activePageId)?.name || 'Unknown Page'}
             </span>
           </div>
           <ChevronDown className={`size-4 text-gray-400 transition-transform ${sidebarView === 'pages' ? 'rotate-180' : ''}`} />
         </button>
         
         {/* Dropdown Menu */}
         {sidebarView === 'pages' && (
           <div className="mt-2 bg-white rounded-xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-top-2">
             <div className="max-h-64 overflow-y-auto py-1">
               {pages.map(page => renderPageItem(page))}
             </div>
             <div className="border-t border-gray-100 p-2 bg-gray-50/50">
               <button
                 onClick={() => {
                   addPage();
                   setSidebarView('pages');
                 }}
                 className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:border-teal-500 hover:text-teal-600 hover:shadow-sm transition-all"
               >
                 <Plus className="size-4" />
                 Create New Page
               </button>
             </div>
           </div>
         )}
       </div>
       
       {/* Page Settings (Name/Slug) */}
       {sidebarView === 'pages' && (
         <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-1">
           <div>
             <label className="block text-xs font-medium text-gray-500 mb-1">Page Name</label>
             <input
               type="text"
               value={findPageById(pages, activePageId)?.name || ''}
               onChange={(e) => updatePageMeta(activePageId, 'name', e.target.value)}
               className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
             />
           </div>
           <div>
             <label className="block text-xs font-medium text-gray-500 mb-1">URL Slug</label>
             <div className="flex items-center">
               <span className="text-gray-400 text-xs mr-1">/</span>
               <input
                 type="text"
                 value={(findPageById(pages, activePageId)?.slug || '').replace(/^\//, '')}
                 onChange={(e) => updatePageMeta(activePageId, 'slug', `/${e.target.value.replace(/^\//, '')}`)}
                 className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                 placeholder="page-url"
               />
             </div>
           </div>
         </div>
       )}
     </div>
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 animate-spin text-teal-600" />
          <p className="text-sm text-gray-500">Loading website configuration...</p>
        </div>
      </div>
    );
  }

  // Fetch sections + player settings then open the course player modal
  const openCoursePlayerPreview = async (courseData: { linkedCourseId: string; title: string; description?: string }) => {
    setIsLoadingPlayerPreview(true);
    setPlayerPreviewCourse({ title: courseData.title, description: courseData.description });
    setPlayerPreviewSections([]);
    setPlayerPreviewSettings(defaultPlayerSettings);
    try {
      const base = `https://${projectId}.supabase.co/functions/v1/make-server-d60f2898`;
      const headers = await authHeaders();
      const [sectionsRes, settingsRes] = await Promise.all([
        fetch(`${base}/courses/${courseData.linkedCourseId}/sections`, { headers }),
        fetch(`${base}/courses/${courseData.linkedCourseId}/player-settings`, { headers }),
      ]);
      const sectionsJson = await sectionsRes.json();
      const settingsJson = await settingsRes.json();
      if (sectionsJson.sections) setPlayerPreviewSections(sectionsJson.sections);
      if (settingsJson.settings) setPlayerPreviewSettings({ ...defaultPlayerSettings, ...settingsJson.settings });
    } catch (err) {
      console.error('Failed to load course preview data:', err);
    } finally {
      setIsLoadingPlayerPreview(false);
    }
  };

  // ── Funnel page definitions ──────────────────────────────────────
  const funnelPageDefs: Record<string, { name: string; slug: string; badge: string; badgeColor: string; sections: string[] }[]> = {
    'Lead Capture Funnel': [
      { name: 'Opt-in Page',    slug: '/opt-in',    badge: 'Step 1', badgeColor: 'bg-amber-100 text-amber-700',   sections: ['hero', 'features', 'cta'] },
      { name: 'Thank You Page', slug: '/thank-you', badge: 'Step 2', badgeColor: 'bg-teal-100 text-teal-700',     sections: ['hero'] },
    ],
    'Webinar Funnel': [
      { name: 'Registration Page',  slug: '/register',     badge: 'Step 1', badgeColor: 'bg-blue-100 text-blue-700',     sections: ['hero', 'features', 'cta'] },
      { name: 'Confirmation Page',  slug: '/confirmation', badge: 'Step 2', badgeColor: 'bg-purple-100 text-purple-700', sections: ['hero', 'cta'] },
      { name: 'Replay Page',        slug: '/replay',       badge: 'Step 3', badgeColor: 'bg-teal-100 text-teal-700',     sections: ['hero'] },
    ],
    'Sales Funnel': [
      { name: 'Sales Page',    slug: '/sales',    badge: 'Step 1', badgeColor: 'bg-green-100 text-green-700',   sections: ['hero', 'features', 'pricing'] },
      { name: 'Order Page',    slug: '/order',    badge: 'Step 2', badgeColor: 'bg-blue-100 text-blue-700',     sections: ['hero', 'cta'] },
      { name: 'Upsell Page',   slug: '/upsell',   badge: 'Step 3', badgeColor: 'bg-amber-100 text-amber-700',   sections: ['hero', 'features', 'cta'] },
      { name: 'Thank You Page',slug: '/thank-you',badge: 'Step 4', badgeColor: 'bg-teal-100 text-teal-700',     sections: ['hero'] },
    ],
  };

  return (
    <div className="flex h-full relative">
      {/* Course Player Preview Modal */}
      {playerPreviewCourse && (
        <CoursePlayerPreviewModal
          course={playerPreviewCourse}
          sections={playerPreviewSections}
          playerSettings={playerPreviewSettings}
          onClose={() => setPlayerPreviewCourse(null)}
        />
      )}

      {funnelWizard && (() => {
        const FunnelIcon = funnelWizard.icon;
        return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setFunnelWizard(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${funnelWizard.color}`}>
                  <FunnelIcon className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{funnelWizard.label}</p>
                  <p className="text-xs text-gray-400">{funnelWizard.desc}</p>
                </div>
              </div>
              <button onClick={() => setFunnelWizard(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="size-4" />
              </button>
            </div>

            {funnelWizard.step === 1 && (
              <>
                <div className="px-6 py-5 space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Funnel Name</label>
                    <input
                      type="text"
                      value={funnelWizard.name}
                      onChange={e => setFunnelWizard(w => w ? { ...w, name: e.target.value } : w)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="e.g. Summer Lead Capture"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pages that will be created</p>
                    <div className="space-y-2">
                      {(funnelPageDefs[funnelWizard.label] ?? []).map((pg, i) => (
                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${pg.badgeColor}`}>{pg.badge}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800">{pg.name}</p>
                            <p className="text-[10px] text-gray-400 truncate">/{funnelWizard.name.toLowerCase().replace(/\s+/g, '-')}{pg.slug}</p>
                          </div>
                          <div className="flex gap-1 flex-wrap justify-end">
                            {pg.sections.map(s => (
                              <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-500 capitalize">{s}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Settings</p>
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-3 p-3 rounded-lg border border-gray-100">
                        <div>
                          <p className="text-xs font-medium text-gray-800">Email capture & integration</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Connect to your email list automatically</p>
                        </div>
                        <div className="cursor-pointer shrink-0 mt-0.5" onClick={() => setFunnelWizard(w => w ? { ...w, emailCapture: !w.emailCapture } : w)}>
                          <div className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${funnelWizard.emailCapture ? 'bg-teal-500' : 'bg-gray-300'}`}>
                            <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform ${funnelWizard.emailCapture ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start justify-between gap-3 p-3 rounded-lg border border-gray-100">
                        <div>
                          <p className="text-xs font-medium text-gray-800">Conversion tracking</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Track funnel performance and drop-off</p>
                        </div>
                        <div className="cursor-pointer shrink-0 mt-0.5" onClick={() => setFunnelWizard(w => w ? { ...w, tracking: !w.tracking } : w)}>
                          <div className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${funnelWizard.tracking ? 'bg-teal-500' : 'bg-gray-300'}`}>
                            <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform ${funnelWizard.tracking ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
                  <button onClick={() => setFunnelWizard(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
                  <button
                    onClick={() => {
                      const pageDefs = funnelPageDefs[funnelWizard.label] ?? [];
                      const baseName = funnelWizard.name.toLowerCase().replace(/\s+/g, '-');
                      pageDefs.forEach(pg => {
                        const newPage = {
                          id: `page-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                          name: pg.name,
                          slug: `/${baseName}${pg.slug}`,
                          sections: pg.sections.map((type, idx) => ({ id: `${idx}`, type, title: type.charAt(0).toUpperCase() + type.slice(1) + ' Section', visible: true, config: {} })),
                          subpages: [],
                        };
                        setPages(prev => [...prev, newPage]);
                      });
                      setFunnelWizard(w => w ? { ...w, step: 2 } : w);
                    }}
                    className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    Create Funnel
                  </button>
                </div>
              </>
            )}

            {funnelWizard.step === 2 && (
              <>
                <div className="px-6 py-6 flex flex-col items-center text-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center">
                    <svg className="w-6 h-6 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-base">Funnel created!</p>
                    <p className="text-sm text-gray-500 mt-1">"{funnelWizard.name}" is ready. {(funnelPageDefs[funnelWizard.label] ?? []).length} pages have been added to your site.</p>
                  </div>
                  <div className="w-full space-y-2 text-left">
                    {(funnelPageDefs[funnelWizard.label] ?? []).map((pg, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-teal-50 border border-teal-100">
                        <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center shrink-0">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-teal-800">{pg.name}</p>
                          <p className="text-[10px] text-teal-600">/{funnelWizard.name.toLowerCase().replace(/\s+/g, '-')}{pg.slug}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${pg.badgeColor}`}>{pg.badge}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
                  <button onClick={() => setFunnelWizard(null)} className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        );
      })()}

      {/* ── Popup Wizard Modal ── */}
      {popupWizard && (() => {
        const PopupIcon = popupWizard.icon;
        const accentBtn =
          popupWizard.type === 'exit-intent'    ? 'bg-red-600 hover:bg-red-700'    :
          popupWizard.type === 'welcome-banner' ? 'bg-purple-600 hover:bg-purple-700' :
                                                   'bg-teal-600 hover:bg-teal-700';
        const accentRing =
          popupWizard.type === 'exit-intent'    ? 'focus:ring-red-500'    :
          popupWizard.type === 'welcome-banner' ? 'focus:ring-purple-500' :
                                                   'focus:ring-teal-500';
        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setPopupWizard(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${popupWizard.color}`}>
                    <PopupIcon className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{popupWizard.label}</p>
                    <p className="text-xs text-gray-400">{popupWizard.desc}</p>
                  </div>
                </div>
                <button onClick={() => setPopupWizard(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="size-4" />
                </button>
              </div>

              {popupWizard.step === 1 && (
                <>
                  <div className="px-6 py-5 space-y-4">

                    {/* Popup name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Popup Name</label>
                      <input
                        type="text"
                        value={popupWizard.name}
                        onChange={e => setPopupWizard(w => w ? { ...w, name: e.target.value } : w)}
                        className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 ${accentRing} focus:border-transparent`}
                      />
                    </div>

                    {/* Headline */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Headline</label>
                      <input
                        type="text"
                        value={popupWizard.headline}
                        onChange={e => setPopupWizard(w => w ? { ...w, headline: e.target.value } : w)}
                        className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 ${accentRing} focus:border-transparent`}
                        placeholder="e.g. Don't miss out…"
                      />
                    </div>

                    {/* Body text */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Body Text</label>
                      <textarea
                        value={popupWizard.body}
                        onChange={e => setPopupWizard(w => w ? { ...w, body: e.target.value } : w)}
                        rows={2}
                        className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 ${accentRing} focus:border-transparent resize-none`}
                        placeholder="Describe your offer…"
                      />
                    </div>

                    {/* CTA */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Button Text</label>
                      <input
                        type="text"
                        value={popupWizard.cta}
                        onChange={e => setPopupWizard(w => w ? { ...w, cta: e.target.value } : w)}
                        className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 ${accentRing} focus:border-transparent`}
                        placeholder="e.g. Get Started"
                      />
                    </div>

                    {/* Lead Magnet: offer type + email placeholder */}
                    {popupWizard.type === 'lead-magnet' && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Offer Type</label>
                          <div className="grid grid-cols-2 gap-2">
                            {(['free-course', 'ebook', 'checklist', 'webinar'] as const).map(ot => (
                              <button
                                key={ot}
                                onClick={() => setPopupWizard(w => w ? { ...w, offerType: ot } : w)}
                                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${popupWizard.offerType === ot ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                              >
                                {ot === 'free-course' ? '🎓 Free Course' : ot === 'ebook' ? '📖 eBook' : ot === 'checklist' ? '✅ Checklist' : '🎥 Webinar'}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email Field Placeholder</label>
                          <input
                            type="text"
                            value={popupWizard.emailPlaceholder}
                            onChange={e => setPopupWizard(w => w ? { ...w, emailPlaceholder: e.target.value } : w)}
                            className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 ${accentRing} focus:border-transparent`}
                            placeholder="Enter your email address"
                          />
                        </div>
                      </>
                    )}

                    {/* Welcome Banner: position */}
                    {popupWizard.type === 'welcome-banner' && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Display Position</label>
                        <div className="grid grid-cols-3 gap-2">
                          {([['top', '⬆ Top Bar'], ['modal', '⬛ Center Modal'], ['bottom', '⬇ Bottom Bar']] as const).map(([val, lbl]) => (
                            <button
                              key={val}
                              onClick={() => setPopupWizard(w => w ? { ...w, position: val } : w)}
                              className={`px-2 py-2 rounded-lg border text-[10px] font-medium transition-colors ${popupWizard.position === val ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                            >
                              {lbl}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Exit-intent: trigger delay */}
                    {popupWizard.type === 'exit-intent' && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Show Popup</label>
                        <div className="grid grid-cols-3 gap-2">
                          {([['immediate', 'Immediately'], ['5s', 'After 5s'], ['10s', 'After 10s']] as const).map(([val, lbl]) => (
                            <button
                              key={val}
                              onClick={() => setPopupWizard(w => w ? { ...w, triggerDelay: val } : w)}
                              className={`px-2 py-2 rounded-lg border text-[10px] font-medium transition-colors ${popupWizard.triggerDelay === val ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                            >
                              {lbl}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Show to */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Show To</label>
                      <div className="grid grid-cols-2 gap-2">
                        {([['everyone', 'Everyone'], ['new-visitors', 'New Visitors Only']] as const).map(([val, lbl]) => (
                          <button
                            key={val}
                            onClick={() => setPopupWizard(w => w ? { ...w, showTo: val } : w)}
                            className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${popupWizard.showTo === val ? `border-teal-500 bg-teal-50 text-teal-700` : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                          >
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
                    <button onClick={() => setPopupWizard(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
                    <button
                      onClick={() => setPopupWizard(w => w ? { ...w, step: 2 } : w)}
                      className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${accentBtn}`}
                    >
                      Create Popup
                    </button>
                  </div>
                </>
              )}

              {popupWizard.step === 2 && (
                <>
                  <div className="px-6 py-6 flex flex-col items-center text-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center">
                      <svg className="w-6 h-6 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-base">Popup created!</p>
                      <p className="text-sm text-gray-500 mt-1">"{popupWizard.name}" is active and ready to engage your visitors.</p>
                    </div>

                    {/* Preview card */}
                    <div className="w-full rounded-xl border border-gray-100 bg-gray-50 p-4 text-left space-y-3">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Preview</p>
                      <div className={`rounded-lg p-3 border ${popupWizard.type === 'exit-intent' ? 'border-red-100 bg-red-50' : popupWizard.type === 'welcome-banner' ? 'border-purple-100 bg-purple-50' : 'border-teal-100 bg-teal-50'}`}>
                        <p className={`text-xs font-semibold mb-1 ${popupWizard.type === 'exit-intent' ? 'text-red-800' : popupWizard.type === 'welcome-banner' ? 'text-purple-800' : 'text-teal-800'}`}>{popupWizard.headline}</p>
                        <p className={`text-[11px] mb-2 ${popupWizard.type === 'exit-intent' ? 'text-red-600' : popupWizard.type === 'welcome-banner' ? 'text-purple-600' : 'text-teal-600'}`}>{popupWizard.body}</p>
                        {popupWizard.type === 'lead-magnet' && (
                          <div className={`text-[10px] text-teal-500 border border-teal-200 rounded px-2 py-1 bg-white mb-2`}>{popupWizard.emailPlaceholder}</div>
                        )}
                        <div className={`inline-block text-[10px] font-semibold px-3 py-1 rounded-full text-white ${popupWizard.type === 'exit-intent' ? 'bg-red-500' : popupWizard.type === 'welcome-banner' ? 'bg-purple-500' : 'bg-teal-500'}`}>{popupWizard.cta}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-gray-400 font-semibold uppercase tracking-wide">Show to</span>
                          <span className="text-gray-700 font-medium">{popupWizard.showTo === 'everyone' ? 'Everyone' : 'New visitors only'}</span>
                        </div>
                        {popupWizard.type === 'exit-intent' && (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-gray-400 font-semibold uppercase tracking-wide">Trigger</span>
                            <span className="text-gray-700 font-medium">{popupWizard.triggerDelay === 'immediate' ? 'On exit intent' : `${popupWizard.triggerDelay} delay + exit intent`}</span>
                          </div>
                        )}
                        {popupWizard.type === 'welcome-banner' && (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-gray-400 font-semibold uppercase tracking-wide">Position</span>
                            <span className="text-gray-700 font-medium capitalize">{popupWizard.position === 'modal' ? 'Center modal' : `${popupWizard.position} bar`}</span>
                          </div>
                        )}
                        {popupWizard.type === 'lead-magnet' && (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-gray-400 font-semibold uppercase tracking-wide">Offer</span>
                            <span className="text-gray-700 font-medium capitalize">{popupWizard.offerType.replace('-', ' ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
                    <button onClick={() => setPopupWizard(null)} className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${accentBtn}`}>
                      Done
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        );
      })()}

      {/* ── Blog Wizard Modal ── */}
      {blogWizard && (() => {
        const BlogIcon = blogWizard.icon;
        const accentBtn =
          blogWizard.type === 'new-article'   ? 'bg-indigo-600 hover:bg-indigo-700' :
          blogWizard.type === 'categories'    ? 'bg-orange-600 hover:bg-orange-700' :
                                                'bg-gray-700 hover:bg-gray-800';
        const accentRing =
          blogWizard.type === 'new-article'   ? 'focus:ring-indigo-500' :
          blogWizard.type === 'categories'    ? 'focus:ring-orange-500' :
                                                'focus:ring-gray-500';
        const toggleColor =
          blogWizard.type === 'new-article'   ? 'bg-indigo-500' :
          blogWizard.type === 'categories'    ? 'bg-orange-500' :
                                                'bg-teal-500';
        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setBlogWizard(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${blogWizard.color}`}>
                    <BlogIcon className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{blogWizard.label}</p>
                    <p className="text-xs text-gray-400">{blogWizard.desc}</p>
                  </div>
                </div>
                <button onClick={() => setBlogWizard(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="size-4" />
                </button>
              </div>

              {blogWizard.step === 1 && (
                <>
                  <div className="px-6 py-5 space-y-4">

                    {/* ── New Article fields ── */}
                    {blogWizard.type === 'new-article' && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Article Title</label>
                          <input
                            type="text"
                            value={blogWizard.title}
                            onChange={e => setBlogWizard(w => w ? { ...w, title: e.target.value } : w)}
                            className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 ${accentRing} focus:border-transparent`}
                            placeholder="e.g. 5 Ways to Build a High-Performance Team"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Category</label>
                          <div className="grid grid-cols-2 gap-2">
                            {['Leadership', 'Technology', 'Business', 'Personal Development'].map(cat => (
                              <button key={cat} onClick={() => setBlogWizard(w => w ? { ...w, category: cat } : w)}
                                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${blogWizard.category === cat ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                {cat}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tags <span className="font-normal text-gray-400 normal-case">(comma separated)</span></label>
                          <input
                            type="text"
                            value={blogWizard.tags}
                            onChange={e => setBlogWizard(w => w ? { ...w, tags: e.target.value } : w)}
                            className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 ${accentRing} focus:border-transparent`}
                            placeholder="e.g. leadership, teamwork, culture"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">SEO Description</label>
                          <textarea
                            value={blogWizard.seoDescription}
                            onChange={e => setBlogWizard(w => w ? { ...w, seoDescription: e.target.value } : w)}
                            rows={2}
                            className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 ${accentRing} focus:border-transparent resize-none`}
                            placeholder="Brief description for search engines (120–160 chars)"
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                          <div>
                            <p className="text-xs font-medium text-gray-800">Allow comments</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Let readers comment on this article</p>
                          </div>
                          <div className="cursor-pointer shrink-0" onClick={() => setBlogWizard(w => w ? { ...w, allowComments: !w.allowComments } : w)}>
                            <div className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${blogWizard.allowComments ? toggleColor : 'bg-gray-300'}`}>
                              <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform ${blogWizard.allowComments ? 'translate-x-4' : 'translate-x-0.5'}`} />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* ── Categories fields ── */}
                    {blogWizard.type === 'categories' && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Category Name</label>
                          <input
                            type="text"
                            value={blogWizard.catName}
                            onChange={e => setBlogWizard(w => w ? { ...w, catName: e.target.value, catSlug: e.target.value.toLowerCase().replace(/\s+/g, '-') } : w)}
                            className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 ${accentRing} focus:border-transparent`}
                            placeholder="e.g. Leadership"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">URL Slug</label>
                          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500">
                            <span className="px-3 py-2 bg-gray-50 text-xs text-gray-400 border-r border-gray-200">/blog/</span>
                            <input
                              type="text"
                              value={blogWizard.catSlug}
                              onChange={e => setBlogWizard(w => w ? { ...w, catSlug: e.target.value } : w)}
                              className="flex-1 px-3 py-2 text-sm focus:outline-none"
                              placeholder="leadership"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
                          <textarea
                            value={blogWizard.catDescription}
                            onChange={e => setBlogWizard(w => w ? { ...w, catDescription: e.target.value } : w)}
                            rows={2}
                            className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 ${accentRing} focus:border-transparent resize-none`}
                            placeholder="What kind of articles are in this category?"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Colour</label>
                          <div className="flex gap-2">
                            {[
                              { key: 'indigo',  bg: 'bg-indigo-500'  },
                              { key: 'orange',  bg: 'bg-orange-500'  },
                              { key: 'teal',    bg: 'bg-teal-500'    },
                              { key: 'purple',  bg: 'bg-purple-500'  },
                              { key: 'red',     bg: 'bg-red-500'     },
                              { key: 'green',   bg: 'bg-green-500'   },
                            ].map(({ key, bg }) => (
                              <button key={key} onClick={() => setBlogWizard(w => w ? { ...w, catColor: key } : w)}
                                className={`w-7 h-7 rounded-full ${bg} transition-transform ${blogWizard.catColor === key ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-110'}`} />
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* ── Blog Settings fields ── */}
                    {blogWizard.type === 'blog-settings' && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Blog Title</label>
                          <input
                            type="text"
                            value={blogWizard.blogTitle}
                            onChange={e => setBlogWizard(w => w ? { ...w, blogTitle: e.target.value } : w)}
                            className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 ${accentRing} focus:border-transparent`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Blog Description <span className="font-normal text-gray-400 normal-case">(SEO)</span></label>
                          <textarea
                            value={blogWizard.blogDescription}
                            onChange={e => setBlogWizard(w => w ? { ...w, blogDescription: e.target.value } : w)}
                            rows={2}
                            className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 ${accentRing} focus:border-transparent resize-none`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Posts Per Page</label>
                          <div className="flex gap-2">
                            {[6, 9, 12, 15].map(n => (
                              <button key={n} onClick={() => setBlogWizard(w => w ? { ...w, postsPerPage: n } : w)}
                                className={`px-4 py-2 rounded-lg border text-xs font-medium transition-colors ${blogWizard.postsPerPage === n ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Features</label>
                          <div className="space-y-2.5">
                            {[
                              { key: 'commentsEnabled' as const, label: 'Comments', sub: 'Allow readers to comment on articles' },
                              { key: 'rssEnabled'      as const, label: 'RSS Feed',  sub: 'Publish an RSS feed for subscribers' },
                            ].map(({ key, label, sub }) => (
                              <div key={key} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-gray-100">
                                <div>
                                  <p className="text-xs font-medium text-gray-800">{label}</p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
                                </div>
                                <div className="cursor-pointer shrink-0 mt-0.5" onClick={() => setBlogWizard(w => w ? { ...w, [key]: !w[key] } : w)}>
                                  <div className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${blogWizard[key] ? 'bg-teal-500' : 'bg-gray-300'}`}>
                                    <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform ${blogWizard[key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Google Analytics ID <span className="font-normal text-gray-400 normal-case">(optional)</span></label>
                          <input
                            type="text"
                            value={blogWizard.analyticsId}
                            onChange={e => setBlogWizard(w => w ? { ...w, analyticsId: e.target.value } : w)}
                            className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 ${accentRing} focus:border-transparent`}
                            placeholder="G-XXXXXXXXXX"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
                    <button onClick={() => setBlogWizard(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
                    <button
                      onClick={() => setBlogWizard(w => w ? { ...w, step: 2 } : w)}
                      disabled={blogWizard.type === 'new-article' && !blogWizard.title.trim()}
                      className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${accentBtn}`}
                    >
                      {blogWizard.type === 'new-article' ? 'Create Article' : blogWizard.type === 'categories' ? 'Create Category' : 'Save Settings'}
                    </button>
                  </div>
                </>
              )}

              {blogWizard.step === 2 && (
                <>
                  <div className="px-6 py-6 flex flex-col items-center text-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center">
                      <svg className="w-6 h-6 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      {blogWizard.type === 'new-article' && (
                        <>
                          <p className="font-semibold text-gray-900 text-base">Article created!</p>
                          <p className="text-sm text-gray-500 mt-1">"{blogWizard.title || 'Untitled'}" has been added to your blog.</p>
                        </>
                      )}
                      {blogWizard.type === 'categories' && (
                        <>
                          <p className="font-semibold text-gray-900 text-base">Category created!</p>
                          <p className="text-sm text-gray-500 mt-1">"{blogWizard.catName || 'New Category'}" is ready for posts.</p>
                        </>
                      )}
                      {blogWizard.type === 'blog-settings' && (
                        <>
                          <p className="font-semibold text-gray-900 text-base">Settings saved!</p>
                          <p className="text-sm text-gray-500 mt-1">Your blog settings have been updated.</p>
                        </>
                      )}
                    </div>

                    {/* Summary card */}
                    <div className="w-full rounded-xl border border-gray-100 bg-gray-50 p-4 text-left space-y-2">
                      {blogWizard.type === 'new-article' && (
                        <>
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-gray-800">{blogWizard.title}</p>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">{blogWizard.category}</span>
                          </div>
                          {blogWizard.tags && <p className="text-[10px] text-gray-400">Tags: {blogWizard.tags}</p>}
                          {blogWizard.seoDescription && <p className="text-[10px] text-gray-500 leading-relaxed">{blogWizard.seoDescription}</p>}
                          <div className="flex items-center gap-3 pt-1 text-[10px] text-gray-500">
                            <span className={`font-medium ${blogWizard.allowComments ? 'text-teal-600' : 'text-gray-400'}`}>
                              {blogWizard.allowComments ? '💬 Comments on' : '💬 Comments off'}
                            </span>
                          </div>
                        </>
                      )}
                      {blogWizard.type === 'categories' && (
                        <>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full bg-${blogWizard.catColor}-500`} />
                            <p className="text-xs font-semibold text-gray-800">{blogWizard.catName || 'New Category'}</p>
                          </div>
                          <p className="text-[10px] text-gray-400">/blog/{blogWizard.catSlug || 'new-category'}</p>
                          {blogWizard.catDescription && <p className="text-[10px] text-gray-500">{blogWizard.catDescription}</p>}
                        </>
                      )}
                      {blogWizard.type === 'blog-settings' && (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                          <div><span className="text-gray-400 uppercase font-semibold tracking-wide block">Title</span><span className="text-gray-700">{blogWizard.blogTitle}</span></div>
                          <div><span className="text-gray-400 uppercase font-semibold tracking-wide block">Posts/page</span><span className="text-gray-700">{blogWizard.postsPerPage}</span></div>
                          <div><span className="text-gray-400 uppercase font-semibold tracking-wide block">Comments</span><span className={blogWizard.commentsEnabled ? 'text-teal-600 font-medium' : 'text-gray-400'}>{blogWizard.commentsEnabled ? 'Enabled' : 'Disabled'}</span></div>
                          <div><span className="text-gray-400 uppercase font-semibold tracking-wide block">RSS Feed</span><span className={blogWizard.rssEnabled ? 'text-teal-600 font-medium' : 'text-gray-400'}>{blogWizard.rssEnabled ? 'Enabled' : 'Disabled'}</span></div>
                          {blogWizard.analyticsId && <div className="col-span-2"><span className="text-gray-400 uppercase font-semibold tracking-wide block">Analytics</span><span className="text-gray-700">{blogWizard.analyticsId}</span></div>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
                    <button onClick={() => setBlogWizard(null)} className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${accentBtn}`}>
                      Done
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        );
      })()}

      {/* Loading overlay while fetching course player data */}
      {isLoadingPlayerPreview && !playerPreviewCourse && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center">
          <div className="bg-white rounded-xl px-8 py-6 flex items-center gap-3 shadow-2xl">
            <Loader2 className="size-5 animate-spin text-teal-600" />
            <span className="text-sm font-medium text-gray-700">Loading course player…</span>
          </div>
        </div>
      )}
      {/* Success Toast */}
      {isPublished && (
        <div className="absolute top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <Check className="size-5" />
          <span className="font-medium">Website published successfully!</span>
        </div>
      )}

      {/* Left Sidebar - Section Management & Customization */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
        {selectedSectionData ? (
          /* Customization View */
          <div className="flex flex-col h-full animate-in slide-in-from-left-4 duration-200">
            <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-white sticky top-0 z-10">
              <button 
                onClick={() => setSelectedSection(null)}
                className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                title="Back to sections"
              >
                <ArrowLeft className="size-5" />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-gray-900 leading-tight">Customize</h2>
                <p className="text-xs text-gray-500 truncate">{selectedSectionData.title}</p>
              </div>
              {/* Duplicate & Delete — accessible directly from the customize panel */}
              <button
                onClick={() => duplicateSection(selectedSection!)}
                className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                title="Duplicate section"
              >
                <Copy className="size-4" />
              </button>
              <button
                onClick={() => {
                  removeSection(selectedSection!);
                  setSelectedSection(null);
                }}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete section"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="px-4 pt-4 bg-white">
              <div className="flex gap-1 bg-gray-100/80 p-1 rounded-lg">
                <button
                  onClick={() => setActiveCustomTab('content')}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    activeCustomTab === 'content'
                      ? 'bg-white text-teal-700 shadow-sm ring-1 ring-black/5'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  Content
                </button>
                <button
                  onClick={() => setActiveCustomTab('style')}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    activeCustomTab === 'style'
                      ? 'bg-white text-teal-700 shadow-sm ring-1 ring-black/5'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  Style
                </button>
                <button
                  onClick={() => setActiveCustomTab('layout')}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    activeCustomTab === 'layout'
                      ? 'bg-white text-teal-700 shadow-sm ring-1 ring-black/5'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  Layout
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {renderSectionCustomization(
                selectedSectionData,
                updateSectionConfig,
                activeCustomTab,
                icons,
                showIconPicker,
                setShowIconPicker,
                pages, // Pass pages to customization
                selectedBlockId,
                setSelectedBlockId,
                availableCoursesList
              )}
            </div>
          </div>
        ) : (
          /* Section List View */
          <div className="flex flex-col h-full animate-in slide-in-from-left-4 duration-200">

            {/* ── Main Tab Bar ── */}
            <div className="flex border-b border-gray-200 bg-white shrink-0">
              {(
                [
                  { id: 'pages',  label: 'Pages',  Icon: FileText      },
                  { id: 'funnel', label: 'Funnel',  Icon: Filter        },
                  { id: 'popups', label: 'Popups',  Icon: Layers        },
                  { id: 'blog',   label: 'Blog',    Icon: Rss           },
                ] as const
              ).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setSidebarMainTab(id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-all border-b-2 ${
                    sidebarMainTab === id
                      ? 'border-teal-500 text-teal-600 bg-teal-50/40'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* ── Pages tab (existing content) ── */}
            {sidebarMainTab === 'pages' && (
              <>
            {/* Page Management Header */}
            {renderPageManager()}
            
            {!sidebarView.includes('pages') && (
              <>
              <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Page Sections</h2>
                  <p className="text-sm text-gray-500 mt-1">Drag to reorder sections</p>
                </div>
                <button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm ${
                    isPublished 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-teal-600 text-white hover:bg-teal-700 hover:shadow border border-transparent'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isPublishing ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : isPublished ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Globe className="size-3.5" />
                  )}
                  {isPublishing ? 'Saving...' : isPublished ? 'Saved' : 'Save'}
                </button>
              </div>

              {/* Section List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {sections.map((section, index) => (
                  <div
                    key={section.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedSection(section.id)}
                    className={`group relative p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      selectedSection === section.id
                        ? 'border-teal-500 bg-teal-50/50 shadow-sm ring-1 ring-teal-500'
                        : 'border-gray-100 bg-white hover:border-teal-200 hover:shadow-md'
                    } ${draggedIndex === index ? 'opacity-50 scale-95' : ''}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-gray-300 group-hover:text-gray-500 transition-colors">
                        <Grip className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{section.title}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{section.type.replace('-', ' ')}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSectionVisibility(section.id);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          section.visible 
                            ? 'text-teal-600 bg-teal-50 hover:bg-teal-100' 
                            : 'text-gray-400 bg-gray-100 hover:bg-gray-200'
                        }`}
                        title={section.visible ? 'Hide section' : 'Show section'}
                      >
                        <Eye className="size-3.5" />
                      </button>
                    </div>
                    
                    <div
                      className="flex items-center gap-1 pl-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onMouseDown={(e) => e.stopPropagation()}
                      onDragStart={(e) => e.preventDefault()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSection(index, 'up');
                        }}
                        disabled={index === 0}
                        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        title="Move up"
                      >
                        <ChevronUp className="size-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSection(index, 'down');
                        }}
                        disabled={index === sections.length - 1}
                        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        title="Move down"
                      >
                        <ChevronDown className="size-3.5" />
                      </button>
                      <div className="w-px h-3 bg-gray-200 mx-1" />
                      
                      {(section.type === 'navbar' || section.type === 'footer') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const isPinned = !!section.config.pinned;
                            const newPinnedState = !isPinned;
                            
                            setPages(prev => prev.map(p => {
                               const newSections = [...p.sections];
                               const existingIndex = newSections.findIndex(s => s.type === section.type);
                               
                               const updatedSection = {
                                  ...section,
                                  config: { ...section.config, pinned: newPinnedState }
                               };
                               
                               if (newPinnedState) {
                                  // Pinning: Overwrite or add to all pages
                                  if (existingIndex >= 0) {
                                     newSections[existingIndex] = updatedSection;
                                  } else {
                                     if (section.type === 'navbar') newSections.unshift(updatedSection);
                                     else newSections.push(updatedSection);
                                  }
                               } else {
                                  // Unpinning: Just update the flag on all pages
                                  if (existingIndex >= 0) {
                                     newSections[existingIndex] = {
                                        ...newSections[existingIndex],
                                        config: { ...newSections[existingIndex].config, pinned: false }
                                     };
                                  }
                               }
                               return { ...p, sections: newSections };
                            }));
                          }}
                          className={`p-1.5 rounded-md transition-colors ${
                            section.config.pinned
                              ? 'text-teal-600 bg-teal-50 hover:bg-teal-100'
                              : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                          title={section.config.pinned ? "Unpin from all pages" : "Pin to all pages"}
                        >
                          <Link2 className="size-3.5" />
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateSection(section.id);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Duplicate section"
                      >
                        <Copy className="size-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSection(section.id);
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md ml-auto transition-colors"
                        title="Delete section"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Section Button */}
              <div className="border-t border-gray-200 max-h-[40vh] overflow-y-auto bg-gray-50/50 backdrop-blur-sm flex flex-col">
                <div className="p-4 space-y-5 flex-1 overflow-y-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-200/60">
                    <div className="flex items-center gap-2 text-gray-900 font-semibold">
                      <div className="size-6 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                        <Plus className="size-3.5 stroke-[3]" />
                      </div>
                      Add Content
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex p-1 bg-gray-100 rounded-lg mb-4">
                    <button
                      onClick={() => setActiveAddTab('sections')}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                        activeAddTab === 'sections' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Sections
                    </button>
                    <button
                      onClick={() => setActiveAddTab('elements')}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                        activeAddTab === 'elements' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Elements
                    </button>
                  </div>
                  
                  {activeAddTab === 'sections' ? (
                    <>
                      {['structure', 'header', 'content', 'media', 'social', 'conversion', 'footer'].map(category => {
                        const categoryTemplates = sectionTemplates.filter(t => t.category === category);
                        if (categoryTemplates.length === 0) return null;
                        
                        return (
                          <div key={category}>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-3 font-bold pl-1">{category}</p>
                            <div className="grid grid-cols-2 gap-3">
                              {categoryTemplates.map((template) => {
                                const Icon = template.icon;
                                return (
                                  <button
                                    key={template.type}
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData('application/json', JSON.stringify({ type: template.type }));
                                      setDraggedTemplateType(template.type);
                                    }}
                                    onDragEnd={() => {
                                      setDraggedTemplateType(null);
                                      setDraggedIndex(null);
                                    }}
                                    onClick={() => addSection(template.type)}
                                    className="group p-3 text-sm border border-gray-200 bg-white rounded-xl hover:border-teal-500 hover:ring-2 hover:ring-teal-500/20 hover:shadow-md transition-all flex flex-col items-center gap-2 relative overflow-hidden cursor-grab active:cursor-grabbing"
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-br from-teal-50/0 to-teal-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Icon className="size-6 text-gray-400 group-hover:text-teal-600 transition-colors relative z-10" />
                                    <span className="text-xs text-center font-medium text-gray-600 group-hover:text-gray-900 relative z-10">{template.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {elementTemplates.map((template) => {
                        const Icon = template.icon;
                        return (
                          <button
                            key={template.type}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('application/json', JSON.stringify({ type: template.type, kind: 'element' }));
                              setDraggedElementType(template.type);
                            }}
                            onDragEnd={() => {
                              setDraggedElementType(null);
                            }}
                            className="group p-3 text-sm border border-gray-200 bg-white rounded-xl hover:border-teal-500 hover:ring-2 hover:ring-teal-500/20 hover:shadow-md transition-all flex flex-col items-center gap-2 relative overflow-hidden cursor-grab active:cursor-grabbing"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-teal-50/0 to-teal-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Icon className="size-6 text-gray-400 group-hover:text-teal-600 transition-colors relative z-10" />
                            <span className="text-xs text-center font-medium text-gray-600 group-hover:text-gray-900 relative z-10">{template.label}</span>
                          </button>
                        );
                      })}
                      <div className="col-span-2 text-xs text-gray-400 text-center italic mt-2">
                        Drag elements into Custom Sections
                      </div>
                    </div>
                  )}
                </div>
              </div>
              </>
            )}
              </>
            )}

            {/* ── Funnel tab ── */}
            {sidebarMainTab === 'funnel' && (
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                <div className="flex flex-col items-center text-center gap-3 mt-8 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                    <Filter className="size-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Sales Funnels</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Build multi-step funnels to convert visitors into paying customers.
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Lead Capture Funnel', desc: 'Collect emails & qualify leads', icon: Zap,        color: 'text-amber-500 bg-amber-50'  },
                    { label: 'Webinar Funnel',      desc: 'Register & nurture attendees',  icon: Users,      color: 'text-blue-500 bg-blue-50'    },
                    { label: 'Sales Funnel',        desc: 'Guide prospects to checkout',   icon: TrendingUp, color: 'text-green-500 bg-green-50'  },
                  ].map(({ label, desc, icon: Icon, color }) => (
                    <button
                      key={label}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:border-teal-400 hover:shadow-sm transition-all text-left group focus:outline-none"
                      onClick={() => setFunnelWizard({ label, desc, icon: Icon, color, step: 1, name: label, emailCapture: true, tracking: true })}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800 group-hover:text-teal-700">{label}</p>
                        <p className="text-xs text-gray-400 truncate">{desc}</p>
                      </div>
                      <Plus className="size-4 text-gray-300 group-hover:text-teal-500 ml-auto shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Popups tab ── */}
            {sidebarMainTab === 'popups' && (
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                <div className="flex flex-col items-center text-center gap-3 mt-8 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                    <Layers className="size-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Popups & Overlays</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Engage visitors with targeted popups, banners, and slide-ins.
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {([
                    { type: 'exit-intent'    as const, label: 'Exit-Intent Popup', desc: 'Capture visitors before they leave', icon: MousePointerClick, color: 'text-red-500 bg-red-50',       defaults: { headline: "Wait! Don't leave yet…", body: 'Get 10% off your first course when you sign up today.', cta: 'Claim My Offer' } },
                    { type: 'welcome-banner' as const, label: 'Welcome Banner',    desc: 'Greet new visitors with an offer',   icon: Sparkles,          color: 'text-purple-500 bg-purple-50', defaults: { headline: `Welcome to ${companyName}!`, body: 'Explore our professional training courses designed for modern teams.', cta: 'Browse Courses' } },
                    { type: 'lead-magnet'    as const, label: 'Lead Magnet',       desc: 'Offer a freebie for email sign-up',  icon: MessageSquare,     color: 'text-teal-500 bg-teal-50',     defaults: { headline: 'Get Your Free Leadership Checklist', body: "Enter your email and we'll send it straight to your inbox.", cta: 'Send Me the Free Guide' } },
                  ]).map(({ type, label, desc, icon: Icon, color, defaults }) => (
                    <button
                      key={label}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:border-teal-400 hover:shadow-sm transition-all text-left group focus:outline-none"
                      onClick={() => setPopupWizard({
                        type, label, desc, icon: Icon, color, step: 1,
                        name: label,
                        headline: defaults.headline,
                        body: defaults.body,
                        cta: defaults.cta,
                        triggerDelay: 'immediate',
                        position: 'modal',
                        offerType: 'checklist',
                        emailPlaceholder: 'Enter your email address',
                        showTo: 'everyone',
                      })}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800 group-hover:text-teal-700">{label}</p>
                        <p className="text-xs text-gray-400 truncate">{desc}</p>
                      </div>
                      <Plus className="size-4 text-gray-300 group-hover:text-teal-500 ml-auto shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Blog tab ── */}
            {sidebarMainTab === 'blog' && (
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                <div className="flex flex-col items-center text-center gap-3 mt-8 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                    <Rss className="size-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Blog & Articles</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Publish content, drive SEO traffic, and build thought leadership.
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {([
                    { type: 'new-article'   as const, label: 'New Article',   desc: 'Write and publish a blog post', icon: BookOpen, color: 'text-indigo-500 bg-indigo-50' },
                    { type: 'categories'    as const, label: 'Categories',    desc: 'Organise posts by topic',        icon: Layout,   color: 'text-orange-500 bg-orange-50' },
                    { type: 'blog-settings' as const, label: 'Blog Settings', desc: 'SEO, comments, and RSS config',  icon: Settings, color: 'text-gray-500 bg-gray-100'    },
                  ]).map(({ type, label, desc, icon: Icon, color }) => (
                    <button
                      key={label}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:border-teal-400 hover:shadow-sm transition-all text-left group focus:outline-none"
                      onClick={() => setBlogWizard({
                        type, label, desc, icon: Icon, color, step: 1,
                        title: '', category: 'Leadership', tags: '', allowComments: true, seoDescription: '',
                        catName: '', catSlug: '', catDescription: '', catColor: 'indigo',
                        blogTitle: `${companyName} Blog`, blogDescription: 'Insights, guides and thought leadership from our team.', postsPerPage: 9, commentsEnabled: true, rssEnabled: true, analyticsId: '',
                      })}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800 group-hover:text-teal-700">{label}</p>
                        <p className="text-xs text-gray-400 truncate">{desc}</p>
                      </div>
                      <Plus className="size-4 text-gray-300 group-hover:text-teal-500 ml-auto shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Center - Preview */}
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        <div className="p-6">
          {/* Preview Controls */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`p-2 rounded ${
                  previewMode === 'desktop'
                    ? 'bg-teal-100 text-teal-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Desktop preview"
              >
                <Monitor className="size-4" />
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`p-2 rounded ${
                  previewMode === 'mobile'
                    ? 'bg-teal-100 text-teal-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Mobile preview"
              >
                <Smartphone className="size-4" />
              </button>
            </div>
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className={`px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 ${
                isPublishing ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Publish Website
                </>
              )}
            </button>
          </div>

          {/* Preview Area */}
          <div
            className={`bg-white rounded-lg shadow-lg overflow-hidden transition-all mx-auto ${
              previewMode === 'mobile' ? 'max-w-md' : 'max-w-7xl'
            }`}
          >
            {sections.filter(s => s.visible).map((section) => {
              const realIndex = sections.findIndex(s => s.id === section.id);
              return (
                <div
                  key={section.id}
                  draggable={!selectedBlockId}
                  onDragStart={(e) => {
                    // Prevent interfering with sidebar drag
                    if (!draggedTemplateType && !selectedBlockId) {
                      handleDragStart(realIndex);
                    }
                  }}
                  onDragOver={(e) => handleDragOver(e, realIndex)}
                  onDrop={(e) => {
                    if (draggedElementType) {
                      e.preventDefault();
                      e.stopPropagation();
                      addBlockToSection(section.id, draggedElementType);
                    }
                  }}
                  onDragEnd={handleDragEnd}
                  onClick={() => setSelectedSection(section.id)}
                  className={`relative cursor-pointer transition-all ${
                    selectedSection === section.id ? 'ring-4 ring-teal-500' : ''
                  }`}
                >
                  {renderSectionPreview(
                    section, 
                    previewMode, 
                    draggedElementType,
                    (sectionId, type, index) => addBlockToSection(sectionId, type, index),
                    (sectionId, from, to) => moveBlock(sectionId, from, to),
                    (sectionId, index) => handleBlockDragStart(sectionId, index),
                    handleBlockDragEnd,
                    draggedBlockIndex,
                    (sectionId, index) => deleteBlock(sectionId, index),
                    selectedBlockId,
                    (blockId) => {
                      setSelectedBlockId(blockId);
                      setSelectedSection(section.id);
                    },
                    updateBlockContent,
                    updateSectionConfig,
                    selectedSection,
                    (linkText: string, linkUrl: string) => {
                      // Find page by name or slug
                      const pageBySlug = findPageById(pages, linkUrl);
                      if (pageBySlug) {
                        switchPage(pageBySlug.id);
                        return;
                      }
                      
                      const pageByName = pages.find(p => p.name.toLowerCase() === linkText.toLowerCase());
                      if (pageByName) {
                        switchPage(pageByName.id);
                        return;
                      }

                      // Recursive search for name
                      const findPageByName = (list: WebsitePage[], name: string): WebsitePage | undefined => {
                        for (const p of list) {
                          if (p.name.toLowerCase() === name.toLowerCase()) return p;
                          if (p.subpages) {
                            const found = findPageByName(p.subpages, name);
                            if (found) return found;
                          }
                        }
                        return undefined;
                      };
                      
                      const pageByNameRec = findPageByName(pages, linkText);
                      if (pageByNameRec) {
                        switchPage(pageByNameRec.id);
                        return;
                      }
                    },
                    pages,
                    openCoursePlayerPreview
                  )}
                </div>
              );
            })}
            {sections.filter(s => s.visible).length === 0 && (
              <div 
                className="p-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg m-4"
                onDragOver={(e) => {
                   e.preventDefault();
                   if (draggedTemplateType) {
                     handleDragOver(e, 0);
                   }
                }}
              >
                <p>No visible sections. Drag a section here to start building.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Navbar dropdown components ──────────────────────────────────────────────

/**
 * A single row inside a first-level dropdown.
 * If the page has its own subpages, hovering it reveals a second-level
 * flyout panel that slides out to the right.
 */
function DropdownSubItem({
  page,
  onLinkClick,
  closeAll,
}: {
  page: WebsitePage;
  onLinkClick?: (text: string, url: string) => void;
  closeAll: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const visibleSubpages = (page.subpages ?? []).filter(p => !p.hidden);
  const hasChildren = visibleSubpages.length > 0;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Row */}
      <a
        href={page.slug}
        onClick={(e) => {
          e.preventDefault();
          closeAll();
          if (onLinkClick) onLinkClick(page.name, page.slug);
        }}
        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors whitespace-nowrap group/sub"
      >
        <FileText className="size-3.5 text-gray-400 group-hover/sub:text-teal-500 shrink-0 transition-colors" />
        <span className="flex-1">{page.name}</span>
        {hasChildren && (
          <ChevronRight
            className={`size-3.5 opacity-50 shrink-0 transition-transform duration-200 ${
              isOpen ? 'translate-x-0.5 opacity-80' : ''
            }`}
          />
        )}
      </a>

      {/* Second-level flyout – opens to the right */}
      {hasChildren && isOpen && (
        <div className="absolute left-full top-0 pl-1 z-50">
          <div className="bg-white border border-gray-100 shadow-xl rounded-xl py-1.5 min-w-[180px]">
            {/* Visual connector dot so the panel feels attached */}
            <div className="absolute -left-1.5 top-3 w-3 h-3 bg-white border-l border-b border-gray-100 rotate-45" />
            {visibleSubpages.map((child) => (
              <a
                key={child.id}
                href={child.slug}
                onClick={(e) => {
                  e.preventDefault();
                  closeAll();
                  if (onLinkClick) onLinkClick(child.name, child.slug);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors whitespace-nowrap group/leaf"
              >
                <FileText className="size-3.5 text-gray-400 group-hover/leaf:text-teal-500 shrink-0 transition-colors" />
                {child.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * A top-level navbar link that opens a first-level dropdown on hover.
 * Each dropdown item delegates to DropdownSubItem for second-level flyouts.
 */
function NavDropdownLink({
  link,
  pages,
  onLinkClick,
}: {
  link: { text: string; url: string };
  pages: WebsitePage[];
  onLinkClick?: (text: string, url: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Search the ENTIRE pages tree recursively so the match works regardless
  // of whether the page is top-level or nested.
  const findPageInTree = (list: WebsitePage[]): WebsitePage | undefined => {
    for (const p of list) {
      if (
        p.name.toLowerCase() === link.text.toLowerCase() ||
        p.slug === link.url
      ) return p;
      if (p.subpages?.length) {
        const found = findPageInTree(p.subpages);
        if (found) return found;
      }
    }
    return undefined;
  };

  const matchingPage = findPageInTree(pages);

  // If the matched page is hidden, remove it entirely from the navbar.
  if (matchingPage?.hidden) return null;

  // Flatten same-name intermediate pages.
  // If any direct subpage has the same name as this nav link (e.g. a "Home"
  // grouping page sitting inside the Home page), skip that intermediate row
  // and surface its children directly in the dropdown instead.
  const flattenSubpages = (raw: WebsitePage[]): WebsitePage[] => {
    const result: WebsitePage[] = [];
    for (const sub of raw) {
      if (sub.name.toLowerCase() === link.text.toLowerCase()) {
        result.push(...(sub.subpages ?? []));
      } else {
        result.push(sub);
      }
    }
    return result;
  };

  const subpages = flattenSubpages(matchingPage?.subpages ?? []).filter(p => !p.hidden);
  const hasDropdown = subpages.length > 0;

  const close = () => setIsOpen(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Primary nav link */}
      <a
        href={link.url}
        onClick={(e) => {
          e.preventDefault();
          if (onLinkClick) onLinkClick(link.text, link.url);
        }}
        className="text-sm font-medium hover:opacity-70 transition-opacity flex items-center gap-0.5"
      >
        {link.text}
        {hasDropdown && (
          <ChevronDown
            className={`size-3.5 opacity-60 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        )}
      </a>

      {/* First-level dropdown – note: no overflow-hidden so flyouts escape */}
      {hasDropdown && isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50">
          <div className="relative bg-white border border-gray-100 shadow-xl rounded-xl py-1.5 min-w-[180px]">
            {/* Top caret arrow */}
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-gray-100 rotate-45" />
            {subpages.map((subpage) => (
              <DropdownSubItem
                key={subpage.id}
                page={subpage}
                onLinkClick={onLinkClick}
                closeAll={close}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

function renderSectionPreview(
  section: WebsiteSection, 
  previewMode: 'desktop' | 'mobile',
  draggedElementType?: string | null,
  onDropBlock?: (sectionId: string, type: string, index?: number) => void,
  onMoveBlock?: (sectionId: string, fromIndex: number, toIndex: number) => void,
  onBlockDragStart?: (sectionId: string, index: number) => void,
  onBlockDragEnd?: () => void,
  draggedBlockIndex?: {sectionId: string, index: number} | null,
  onDeleteBlock?: (sectionId: string, index: number) => void,
  selectedBlockId?: string | null,
  onSelectBlock?: (blockId: string) => void,
  onUpdateBlockContent?: (sectionId: string, blockId: string, content: any) => void,
  onUpdateSectionConfig?: (sectionId: string, field: string, value: any) => void,
  selectedSectionId?: string | null,
  onLinkClick?: (text: string, url: string) => void,
  pages: WebsitePage[] = [],
  onOpenCoursePlayer?: (courseData: { linkedCourseId: string; title: string; description?: string }) => void
) {
  const isMobile = previewMode === 'mobile';
  
  // Default values
  const defaultPadding = isMobile ? '2rem' : '4rem';
  
  const {
    paddingTop = defaultPadding,
    paddingBottom = defaultPadding,
    paddingLeft = '0',
    paddingRight = '0',
    marginTop = '0',
    marginBottom = '0',
    marginLeft = '0',
    marginRight = '0',
    backgroundColor = '#ffffff',
    minHeight
  } = section.config;

  const containerStyle: React.CSSProperties = {
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    backgroundColor,
    minHeight,
    display: minHeight ? 'flex' : 'block',
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'relative'
  };

  const handleBlockDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedElementType && onDropBlock) {
      onDropBlock(section.id, draggedElementType);
    }
  };

  const renderBlocks = () => {
    if (!section.blocks || section.blocks.length === 0) {
      if (section.type === 'custom' || section.type === 'hero' || section.type === 'cta' || section.type === 'image' || section.type === 'video') {
        if (section.type === 'custom') {
           return (
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-400">
              Drop elements here
            </div>
          );
        }
        return null;
      }
      return null;
    }

    return (
      <div className="flex flex-col gap-4">
        {section.blocks.map((block, index) => (
          <div 
            key={block.id} 
            className={`relative group/block transition-all ${
               !selectedBlockId ? 'cursor-grab active:cursor-grabbing' : ''
            } ${
              draggedBlockIndex?.sectionId === section.id && draggedBlockIndex?.index === index ? 'opacity-50' : ''
            }`}
            draggable={!selectedBlockId}
            onDragStart={(e) => {
               e.stopPropagation();
               if (onBlockDragStart) onBlockDragStart(section.id, index);
            }}
            onDragEnd={(e) => {
               e.stopPropagation();
               if (onBlockDragEnd) onBlockDragEnd();
            }}
            onDragOver={(e) => {
               e.preventDefault();
               e.stopPropagation();
            }}
            onDrop={(e) => {
               e.preventDefault();
               e.stopPropagation();
               
               if (draggedBlockIndex && onMoveBlock) {
                  if (draggedBlockIndex.sectionId === section.id) {
                     onMoveBlock(section.id, draggedBlockIndex.index, index);
                  }
                  return;
               }

               if (draggedElementType && onDropBlock) {
                  onDropBlock(section.id, draggedElementType, index);
               }
            }}
          >
            {/* Block content rendering */}
            {(block.type === 'text' || block.type === 'heading' || block.type === 'paragraph') && (
              onUpdateBlockContent ? (
                <EditableContent
                  html={block.content.html || (block.type === 'heading' ? '<h2>Heading</h2>' : '<p>Edit this text...</p>')}
                  isSelected={selectedBlockId === block.id}
                  onSelect={() => onSelectBlock && onSelectBlock(block.id)}
                  onChange={(html) => onUpdateBlockContent(section.id, block.id, { ...block.content, html })}
                />
              ) : (
                <div dangerouslySetInnerHTML={{ __html: block.content.html || '<p>Edit this text...</p>' }} />
              )
            )}
            {block.type === 'button' && (
              <button
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                onClick={() => {
                  // Skip the scroll while the button label is actively being edited
                  if (selectedBlockId === block.id) return;
                  // Course-grid cards are uniquely identified by .grid.gap-6 containing
                  // .overflow-hidden.shadow-sm (pricing cards use border-2 + p-6, no overflow-hidden)
                  const courseSection = Array.from(
                    document.querySelectorAll('[draggable]')
                  ).find(el =>
                    !!el.querySelector('.grid.gap-6 .overflow-hidden.shadow-sm')
                  );
                  courseSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                {onUpdateBlockContent ? (
                  <EditableContent
                    tagName="span"
                    html={block.content.text || 'Click Me'}
                    isSelected={selectedBlockId === block.id}
                    onSelect={() => onSelectBlock && onSelectBlock(block.id)}
                    onChange={(html) => {
                       const text = html.replace(/<[^>]*>?/gm, '');
                       onUpdateBlockContent(section.id, block.id, { ...block.content, text });
                    }}
                  />
                ) : (
                  block.content.text || 'Click Me'
                )}
              </button>
            )}
            {block.type === 'image' && (
              <img 
                src={block.content.url || 'https://via.placeholder.com/300x200'} 
                alt={block.content.alt || 'Image'} 
                className="max-w-full h-auto rounded-lg"
              />
            )}
            {block.type === 'spacer' && (
              <div style={{ height: block.content.height || '32px' }} />
            )}
            {block.type === 'video' && (
               <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-xl">
                 <iframe
                   src={block.content.url || 'https://www.youtube.com/embed/dQw4w9WgXcQ'}
                   className="w-full h-full"
                   allowFullScreen
                   title="Video player"
                 />
               </div>
            )}
            {/* Complex Block Types for Sections */}
            {block.type === 'features-grid' && (
              <div className={`grid gap-8 ${isMobile ? 'grid-cols-1' : `grid-cols-${Math.min((section.config.features || []).length || 3, 3)}`}`}>
                {(section.config.features || ['Expert Instructors', 'Flexible Learning', 'Industry Recognized']).map((feature: any, i: number) => {
                  const featureData = typeof feature === 'string' ? { title: feature, description: 'High-quality content delivered by professionals', icon: '✓' } : feature;
                  const titleId = `${section.id}-feature-${i}-title`;
                  const descId = `${section.id}-feature-${i}-desc`;
                  
                  // Default features for fallback to prevent data loss on first edit
                  const defaultFeatures = ['Expert Instructors', 'Flexible Learning', 'Industry Recognized'].map(f => ({
                    title: f,
                    description: 'High-quality content delivered by professionals',
                    icon: '✓'
                  }));

                  return (
                    <div key={i} className="text-center">
                      <div className="size-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                        {featureData.icon || '✓'}
                      </div>
                      
                      {onUpdateSectionConfig ? (
                        <>
                          <h3 className="font-semibold text-gray-900 mb-2">
                            <EditableContent
                              tagName="span"
                              html={featureData.title || 'Feature Title'}
                              isSelected={selectedBlockId === titleId}
                              onSelect={() => onSelectBlock && onSelectBlock(titleId)}
                              onChange={(html) => {
                                const text = html.replace(/<[^>]*>?/gm, '');
                                // Use existing config or fallback to defaults to preserve all items
                                let newFeatures = [...(section.config.features || defaultFeatures)];
                                // Ensure the array has objects, not strings (migration)
                                newFeatures = newFeatures.map(f => 
                                  typeof f === 'string' 
                                    ? { title: f, description: 'High-quality content delivered by professionals', icon: '✓' } 
                                    : f
                                );
                                
                                newFeatures[i] = { ...newFeatures[i], title: text };
                                onUpdateSectionConfig(section.id, 'features', newFeatures);
                              }}
                            />
                          </h3>
                          <p className="text-sm text-gray-600">
                            <EditableContent
                              tagName="span"
                              html={featureData.description || 'Feature description goes here'}
                              isSelected={selectedBlockId === descId}
                              onSelect={() => onSelectBlock && onSelectBlock(descId)}
                              onChange={(html) => {
                                const text = html.replace(/<[^>]*>?/gm, '');
                                let newFeatures = [...(section.config.features || defaultFeatures)];
                                newFeatures = newFeatures.map(f => 
                                  typeof f === 'string' 
                                    ? { title: f, description: 'High-quality content delivered by professionals', icon: '✓' } 
                                    : f
                                );
                                
                                newFeatures[i] = { ...newFeatures[i], description: text };
                                onUpdateSectionConfig(section.id, 'features', newFeatures);
                              }}
                            />
                          </p>
                        </>
                      ) : (
                        <>
                          <h3 className="font-semibold text-gray-900 mb-2">{featureData.title}</h3>
                          <p className="text-sm text-gray-600">{featureData.description}</p>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {block.type === 'course-grid' && (
              <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : `grid-cols-${section.config.coursesPerRow || 3}`}`}>
                {((section.config.courses || [1, 2, 3])).map((course: any, i: number) => {
                  const isDefault = typeof course === 'number';
                  const courseData = isDefault ? {
                    title: `Course Title ${course}`,
                    description: 'Brief course description explaining what students will learn',
                    meta: '12 lessons • 6 hours'
                  } : course;

                  return (
                    <div 
                      key={i} 
                      className={`bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 relative group cursor-pointer transition-all ${selectedBlockId === `course-${i}` ? 'ring-2 ring-teal-500' : ''} ${!onUpdateSectionConfig && courseData.linkedCourseId ? 'hover:shadow-md hover:-translate-y-0.5' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onUpdateSectionConfig) {
                          if (onSelectBlock) onSelectBlock(`course-${i}`);
                        } else if (courseData.linkedCourseId) {
                          onOpenCoursePlayer?.({ linkedCourseId: courseData.linkedCourseId, title: courseData.title, description: courseData.description });
                        }
                      }}
                    >
                      {selectedSectionId === section.id && (
                        <button 
                          className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50 z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onUpdateSectionConfig) {
                                const currentCourses = (section.config.courses || [1, 2, 3]).map((c: any) => 
                                  typeof c === 'number' ? {
                                    title: `Course Title ${c}`,
                                    description: 'Brief course description explaining what students will learn',
                                    meta: '12 lessons • 6 hours'
                                  } : c
                                );
                                const newCourses = currentCourses.filter((_: any, idx: number) => idx !== i);
                                onUpdateSectionConfig(section.id, 'courses', newCourses);
                            }
                          }}
                          title="Remove course"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                      
                      <div className="h-48 bg-gray-100 relative overflow-hidden">
                        {courseData.imageUrl ? (
                           <img 
                             src={courseData.imageUrl} 
                             alt={courseData.title} 
                             className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                             onError={(e) => {
                               (e.currentTarget as HTMLImageElement).style.display = 'none';
                               if (onUpdateSectionConfig) {
                                 const cur = (section.config.courses || []).map((c: any) =>
                                   typeof c === 'number'
                                     ? { title: `Course Title ${c}`, description: 'Brief course description explaining what students will learn', meta: '12 lessons • 6 hours' }
                                     : c
                                 );
                                 cur[i] = { ...cur[i], imageUrl: '' };
                                 onUpdateSectionConfig(section.id, 'courses', cur);
                               }
                             }}
                           />
                        ) : (
                           <div
                             className={`w-full h-full bg-gradient-to-br from-teal-400 to-purple-500 flex flex-col items-center justify-center text-white/60 relative group/img ${onUpdateSectionConfig ? 'cursor-pointer' : ''}`}
                             onClick={(e) => {
                               if (!onUpdateSectionConfig) return;
                               e.stopPropagation();
                               const input = document.createElement('input');
                               input.type = 'file';
                               input.accept = 'image/*';
                               input.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
                               document.body.appendChild(input);
                               input.onchange = () => {
                                 const file = input.files?.[0];
                                 if (document.body.contains(input)) document.body.removeChild(input);
                                 if (!file) return;
                                 const reader = new FileReader();
                                 reader.onload = (ev) => {
                                   const url = ev.target?.result as string;
                                   const currentCourses = (section.config.courses || [1, 2, 3]).map((c: any) =>
                                     typeof c === 'number'
                                       ? { title: `Course Title ${c}`, description: 'Brief course description explaining what students will learn', meta: '12 lessons • 6 hours' }
                                       : c
                                   );
                                   currentCourses[i] = { ...currentCourses[i], imageUrl: url };
                                   onUpdateSectionConfig(section.id, 'courses', currentCourses);
                                 };
                                 reader.readAsDataURL(file);
                               };
                               input.addEventListener('cancel', () => {
                                 if (document.body.contains(input)) document.body.removeChild(input);
                               });
                               input.click();
                             }}
                             title={onUpdateSectionConfig ? 'Click to upload image' : undefined}
                           >
                             <ImageIcon className="size-10 opacity-50 transition-opacity group-hover/img:opacity-30" />
                             {onUpdateSectionConfig && (
                               <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/20">
                                 <div className="bg-white/90 rounded-xl px-3 py-2 flex flex-col items-center gap-1 shadow">
                                   <Upload className="size-4 text-teal-600" />
                                   <span className="text-[10px] font-semibold text-teal-700 whitespace-nowrap">Upload Image</span>
                                 </div>
                               </div>
                             )}
                           </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2" onClick={(e) => { e.stopPropagation(); if(onSelectBlock) onSelectBlock(`course-${i}-title`); }}>
                          {onUpdateSectionConfig ? (
                              <EditableContent
                                 tagName="span"
                                 html={courseData.title}
                                 onChange={(val) => {
                                   const currentCourses = (section.config.courses || [1, 2, 3]).map((c: any) => 
                                     typeof c === 'number' ? {
                                       title: `Course Title ${c}`,
                                       description: 'Brief course description explaining what students will learn',
                                       meta: '12 lessons • 6 hours'
                                     } : c
                                   );
                                   currentCourses[i] = { ...currentCourses[i], title: val };
                                   onUpdateSectionConfig(section.id, 'courses', currentCourses);
                                 }}
                                 isSelected={selectedBlockId === `course-${i}-title`}
                              />
                          ) : (
                              courseData.title
                          )}
                        </h3>
                        <div className="text-sm text-gray-600 mb-4" onClick={(e) => { e.stopPropagation(); if(onSelectBlock) onSelectBlock(`course-${i}-desc`); }}>
                           {onUpdateSectionConfig ? (
                               <EditableContent
                                 tagName="p"
                                 html={courseData.description}
                                 onChange={(val) => {
                                   const currentCourses = (section.config.courses || [1, 2, 3]).map((c: any) => 
                                     typeof c === 'number' ? {
                                       title: `Course Title ${c}`,
                                       description: 'Brief course description explaining what students will learn',
                                       meta: '12 lessons • 6 hours'
                                     } : c
                                   );
                                   currentCourses[i] = { ...currentCourses[i], description: val };
                                   onUpdateSectionConfig(section.id, 'courses', currentCourses);
                                 }}
                                 isSelected={selectedBlockId === `course-${i}-desc`}
                              />
                           ) : (
                               courseData.description
                           )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500" onClick={(e) => { e.stopPropagation(); if(onSelectBlock) onSelectBlock(`course-${i}-meta`); }}>
                             {onUpdateSectionConfig ? (
                                 <EditableContent
                                   tagName="span"
                                   html={courseData.meta || '12 lessons • 6 hours'}
                                   onChange={(val) => {
                                     const currentCourses = (section.config.courses || [1, 2, 3]).map((c: any) => 
                                       typeof c === 'number' ? {
                                         title: `Course Title ${c}`,
                                         description: 'Brief course description explaining what students will learn',
                                         meta: '12 lessons • 6 hours'
                                       } : c
                                     );
                                     currentCourses[i] = { ...currentCourses[i], meta: val };
                                     onUpdateSectionConfig(section.id, 'courses', currentCourses);
                                   }}
                                   isSelected={selectedBlockId === `course-${i}-meta`}
                                />
                             ) : (
                                 courseData.meta || '12 lessons • 6 hours'
                             )}
                          </span>

                          {/* View / Preview button — shown only when meaningful */}
                          {courseData.linkedCourseId ? (
                            <button
                              className="text-sm font-medium shrink-0 text-teal-600 hover:text-teal-700 hover:underline cursor-pointer transition-colors"
                              title={onUpdateSectionConfig ? 'Preview the linked course player' : 'Open course player'}
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenCoursePlayer?.({
                                  linkedCourseId: courseData.linkedCourseId,
                                  title: courseData.title,
                                  description: courseData.description
                                });
                              }}
                            >
                              {onUpdateSectionConfig ? 'Preview ↗' : 'View →'}
                            </button>
                          ) : onUpdateSectionConfig ? (
                            /* Edit mode, no link — give a clear actionable hint */
                            <span
                              className="text-xs text-amber-500 italic cursor-default select-none"
                              title="Select this card and choose a course in the settings panel to link it"
                            >
                              ⚠ Link a course
                            </span>
                          ) : null /* Preview/live mode, no link — show nothing (clean student UX) */}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {selectedSectionId === section.id && (
                  <button 
                    className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-8 cursor-pointer hover:border-teal-500 hover:bg-teal-50/50 hover:text-teal-600 transition-all min-h-[300px] group"
                    onClick={(e) => {
                       e.stopPropagation();
                       if (onUpdateSectionConfig) {
                           const currentCourses = (section.config.courses || [1, 2, 3]).map((c: any) => 
                             typeof c === 'number' ? {
                               title: `Course Title ${c}`,
                               description: 'Brief course description explaining what students will learn',
                               meta: '12 lessons • 6 hours'
                             } : c
                           );
                           const newCourses = [...currentCourses, { 
                              title: 'New Course', 
                              description: 'Course description goes here', 
                              meta: '0 lessons • 0 hours' 
                           }];
                           onUpdateSectionConfig(section.id, 'courses', newCourses);
                       }
                    }}
                  >
                    <div className="bg-gray-100 group-hover:bg-white p-3 rounded-full mb-3 transition-colors shadow-sm">
                       <Plus className="size-6 text-gray-400 group-hover:text-teal-500" />
                    </div>
                    <span className="text-sm text-gray-500 group-hover:text-teal-700 font-medium">Add Course</span>
                  </button>
                )}
              </div>
            )}
            {block.type === 'team-grid' && (
               <div className={`grid gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
                  {(section.config.members || []).map((member: any, i: number) => {
                    const nameId = `${section.id}-member-${i}-name`;
                    const roleId = `${section.id}-member-${i}-role`;
                    const bioId = `${section.id}-member-${i}-bio`;

                    return (
                      <div key={i} className="text-center">
                        <div className="size-32 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
                          {member.image && <img src={member.image} alt={member.name} className="w-full h-full object-cover" />}
                        </div>
                        
                        {onUpdateSectionConfig ? (
                          <>
                            <h3 className="font-semibold text-gray-900 mb-1">
                              <EditableContent
                                tagName="span"
                                html={member.name || 'Name'}
                                isSelected={selectedBlockId === nameId}
                                onSelect={() => onSelectBlock && onSelectBlock(nameId)}
                                onChange={(html) => {
                                  const text = html.replace(/<[^>]*>?/gm, '');
                                  const newMembers = [...(section.config.members || [])];
                                  newMembers[i] = { ...newMembers[i], name: text };
                                  onUpdateSectionConfig(section.id, 'members', newMembers);
                                }}
                              />
                            </h3>
                            <p className="text-sm text-teal-600 mb-2">
                              <EditableContent
                                tagName="span"
                                html={member.role || 'Role'}
                                isSelected={selectedBlockId === roleId}
                                onSelect={() => onSelectBlock && onSelectBlock(roleId)}
                                onChange={(html) => {
                                  const text = html.replace(/<[^>]*>?/gm, '');
                                  const newMembers = [...(section.config.members || [])];
                                  newMembers[i] = { ...newMembers[i], role: text };
                                  onUpdateSectionConfig(section.id, 'members', newMembers);
                                }}
                              />
                            </p>
                            <p className="text-sm text-gray-600">
                              <EditableContent
                                tagName="span"
                                html={member.bio || 'Bio'}
                                isSelected={selectedBlockId === bioId}
                                onSelect={() => onSelectBlock && onSelectBlock(bioId)}
                                onChange={(html) => {
                                  const text = html.replace(/<[^>]*>?/gm, '');
                                  const newMembers = [...(section.config.members || [])];
                                  newMembers[i] = { ...newMembers[i], bio: text };
                                  onUpdateSectionConfig(section.id, 'members', newMembers);
                                }}
                              />
                            </p>
                          </>
                        ) : (
                          <>
                            <h3 className="font-semibold text-gray-900 mb-1">{member.name}</h3>
                            <p className="text-sm text-teal-600 mb-2">{member.role}</p>
                            <p className="text-sm text-gray-600">{member.bio}</p>
                          </>
                        )}
                      </div>
                    );
                  })}
               </div>
            )}
            {block.type === 'pricing-grid' && (
              <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
                  {(section.config.plans || []).map((plan: any, i: number) => {
                    const nameId = `${section.id}-plan-${i}-name`;
                    const priceId = `${section.id}-plan-${i}-price`;
                    const periodId = `${section.id}-plan-${i}-period`;
                    
                    return (
                      <div
                        key={i}
                        className={`rounded-lg p-6 border-2 ${
                          plan.highlighted
                            ? 'border-teal-500 bg-teal-50 shadow-lg scale-105'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        {plan.highlighted && (
                          <span className="inline-block px-3 py-1 bg-teal-500 text-white text-xs font-semibold rounded-full mb-4">
                            Popular
                          </span>
                        )}
                        
                        {onUpdateSectionConfig ? (
                          <>
                            <h3 className="font-semibold text-gray-900 text-xl mb-2">
                              <EditableContent
                                tagName="span"
                                html={plan.name || 'Plan Name'}
                                isSelected={selectedBlockId === nameId}
                                onSelect={() => onSelectBlock && onSelectBlock(nameId)}
                                onChange={(html) => {
                                  const text = html.replace(/<[^>]*>?/gm, '');
                                  const newPlans = [...(section.config.plans || [])];
                                  newPlans[i] = { ...newPlans[i], name: text };
                                  onUpdateSectionConfig(section.id, 'plans', newPlans);
                                }}
                              />
                            </h3>
                            <div className="mb-4">
                              <span className="text-4xl font-bold text-gray-900">
                                <EditableContent
                                  tagName="span"
                                  html={plan.price || '$0'}
                                  isSelected={selectedBlockId === priceId}
                                  onSelect={() => onSelectBlock && onSelectBlock(priceId)}
                                  onChange={(html) => {
                                    const text = html.replace(/<[^>]*>?/gm, '');
                                    const newPlans = [...(section.config.plans || [])];
                                    newPlans[i] = { ...newPlans[i], price: text };
                                    onUpdateSectionConfig(section.id, 'plans', newPlans);
                                  }}
                                />
                              </span>
                              <span className="text-gray-500 text-sm">
                                <EditableContent
                                  tagName="span"
                                  html={plan.period || '/month'}
                                  isSelected={selectedBlockId === periodId}
                                  onSelect={() => onSelectBlock && onSelectBlock(periodId)}
                                  onChange={(html) => {
                                    const text = html.replace(/<[^>]*>?/gm, '');
                                    const newPlans = [...(section.config.plans || [])];
                                    newPlans[i] = { ...newPlans[i], period: text };
                                    onUpdateSectionConfig(section.id, 'plans', newPlans);
                                  }}
                                />
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <h3 className="font-semibold text-gray-900 text-xl mb-2">{plan.name}</h3>
                            <div className="mb-4">
                              <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                              <span className="text-gray-500 text-sm">{plan.period}</span>
                            </div>
                          </>
                        )}
                        
                        <ul className="space-y-3 mb-8">
                          {plan.features?.map((feature: string, j: number) => {
                            const featureId = `${section.id}-plan-${i}-feature-${j}`;
                            return (
                              <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                                <Check className="size-4 text-teal-500 shrink-0" />
                                {onUpdateSectionConfig ? (
                                  <div className="flex-1">
                                    <EditableContent
                                      tagName="span"
                                      html={feature || 'Feature'}
                                      isSelected={selectedBlockId === featureId}
                                      onSelect={() => onSelectBlock && onSelectBlock(featureId)}
                                      onChange={(html) => {
                                        const text = html.replace(/<[^>]*>?/gm, '');
                                        const newPlans = [...(section.config.plans || [])];
                                        const newFeatures = [...(newPlans[i].features || [])];
                                        newFeatures[j] = text;
                                        newPlans[i] = { ...newPlans[i], features: newFeatures };
                                        onUpdateSectionConfig(section.id, 'plans', newPlans);
                                      }}
                                    />
                                  </div>
                                ) : (
                                  feature
                                )}
                              </li>
                            );
                          })}
                        </ul>
                        <button className={`w-full py-2 rounded-lg font-medium transition-colors ${
                          plan.highlighted
                            ? 'bg-teal-600 text-white hover:bg-teal-700'
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                        }`}>
                          Get Started
                        </button>
                      </div>
                    );
                  })}
               </div>
            )}
            {block.type === 'stats-grid' && (
              <div className={`grid gap-8 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
                  {(section.config.statistics || []).map((stat: any, i: number) => {
                    const numberId = `${section.id}-stat-${i}-number`;
                    const labelId = `${section.id}-stat-${i}-label`;
                    
                    return (
                      <div key={i} className="text-center">
                        <div className="text-4xl font-bold text-white mb-2">
                           {onUpdateSectionConfig ? (
                              <EditableContent
                                tagName="span"
                                html={stat.number || '0'}
                                isSelected={selectedBlockId === numberId}
                                onSelect={() => onSelectBlock && onSelectBlock(numberId)}
                                onChange={(html) => {
                                  const text = html.replace(/<[^>]*>?/gm, '');
                                  const newStats = [...(section.config.statistics || [])];
                                  newStats[i] = { ...newStats[i], number: text };
                                  onUpdateSectionConfig(section.id, 'statistics', newStats);
                                }}
                              />
                           ) : (
                              stat.number
                           )}
                        </div>
                        <div className="text-teal-200 font-medium">
                           {onUpdateSectionConfig ? (
                              <EditableContent
                                tagName="span"
                                html={stat.label || 'Label'}
                                isSelected={selectedBlockId === labelId}
                                onSelect={() => onSelectBlock && onSelectBlock(labelId)}
                                onChange={(html) => {
                                  const text = html.replace(/<[^>]*>?/gm, '');
                                  const newStats = [...(section.config.statistics || [])];
                                  newStats[i] = { ...newStats[i], label: text };
                                  onUpdateSectionConfig(section.id, 'statistics', newStats);
                                }}
                              />
                           ) : (
                              stat.label
                           )}
                        </div>
                      </div>
                    );
                  })}
               </div>
            )}
            {block.type === 'faq-list' && (
              <div className="space-y-4">
                  {(section.config.questions || []).map((q: any, i: number) => {
                    const questionId = `${section.id}-faq-${i}-q`;
                    const answerId = `${section.id}-faq-${i}-a`;
                    
                    return (
                      <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="font-semibold text-gray-900 mb-2">
                           {onUpdateSectionConfig ? (
                              <EditableContent
                                tagName="span"
                                html={q.question || 'Question'}
                                isSelected={selectedBlockId === questionId}
                                onSelect={() => onSelectBlock && onSelectBlock(questionId)}
                                onChange={(html) => {
                                  const text = html.replace(/<[^>]*>?/gm, '');
                                  const newQuestions = [...(section.config.questions || [])];
                                  newQuestions[i] = { ...newQuestions[i], question: text };
                                  onUpdateSectionConfig(section.id, 'questions', newQuestions);
                                }}
                              />
                           ) : (
                              q.question
                           )}
                        </h3>
                        <div className="text-gray-600">
                           {onUpdateSectionConfig ? (
                              <EditableContent
                                tagName="p"
                                html={q.answer || 'Answer'}
                                isSelected={selectedBlockId === answerId}
                                onSelect={() => onSelectBlock && onSelectBlock(answerId)}
                                onChange={(html) => {
                                  const text = html.replace(/<[^>]*>?/gm, '');
                                  const newQuestions = [...(section.config.questions || [])];
                                  newQuestions[i] = { ...newQuestions[i], answer: text };
                                  onUpdateSectionConfig(section.id, 'questions', newQuestions);
                                }}
                              />
                           ) : (
                              q.answer
                           )}
                        </div>
                      </div>
                    );
                  })}
               </div>
            )}
            {block.type === 'logos-grid' && (
               <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale">
                  {(section.config.logos || []).map((logo: any, i: number) => {
                    const logoId = `${section.id}-logo-${i}`;
                    return (
                      <div key={i} className="text-xl font-bold text-gray-400">
                         {onUpdateSectionConfig ? (
                            <EditableContent
                               tagName="span"
                               html={logo.name || 'Logo'}
                               isSelected={selectedBlockId === logoId}
                               onSelect={() => onSelectBlock && onSelectBlock(logoId)}
                               onChange={(html) => {
                                  const text = html.replace(/<[^>]*>?/gm, '');
                                  const newLogos = [...(section.config.logos || [])];
                                  newLogos[i] = { ...newLogos[i], name: text };
                                  onUpdateSectionConfig(section.id, 'logos', newLogos);
                               }}
                            />
                         ) : (
                            logo.name
                         )}
                      </div>
                    );
                  })}
               </div>
            )}
            {block.type === 'footer-content' && (
               <div className={`grid gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-4'}`}>
                  <div className="col-span-1 md:col-span-2">
                    <h3 className="text-xl font-bold mb-4">
                       {onUpdateSectionConfig ? (
                          <EditableContent
                            tagName="span"
                            html={section.config.companyName || 'Company'}
                            isSelected={selectedBlockId === `${section.id}-footer-name`}
                            onSelect={() => onSelectBlock && onSelectBlock(`${section.id}-footer-name`)}
                            onChange={(html) => {
                              const text = html.replace(/<[^>]*>?/gm, '');
                              onUpdateSectionConfig(section.id, 'companyName', text);
                            }}
                          />
                       ) : (
                          section.config.companyName
                       )}
                    </h3>
                    <p className="opacity-80 max-w-sm">
                       {onUpdateSectionConfig ? (
                          <EditableContent
                            tagName="span"
                            html={section.config.description || 'Description'}
                            isSelected={selectedBlockId === `${section.id}-footer-desc`}
                            onSelect={() => onSelectBlock && onSelectBlock(`${section.id}-footer-desc`)}
                            onChange={(html) => {
                              const text = html.replace(/<[^>]*>?/gm, '');
                              onUpdateSectionConfig(section.id, 'description', text);
                            }}
                          />
                       ) : (
                          section.config.description
                       )}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-4">Links</h4>
                    <ul className="space-y-2 opacity-80">
                      {(section.config.links || []).map((link: any, i: number) => {
                        const linkId = `${section.id}-footer-link-${i}`;
                        return (
                          <li key={i}>
                             {onUpdateSectionConfig ? (
                                <EditableContent
                                  tagName="span"
                                  html={link.text || 'Link'}
                                  isSelected={selectedBlockId === linkId}
                                  onSelect={() => onSelectBlock && onSelectBlock(linkId)}
                                  className="hover:underline cursor-text"
                                  onChange={(html) => {
                                    const text = html.replace(/<[^>]*>?/gm, '');
                                    const newLinks = [...(section.config.links || [])];
                                    newLinks[i] = { ...newLinks[i], text: text };
                                    onUpdateSectionConfig(section.id, 'links', newLinks);
                                  }}
                                />
                             ) : (
                                <a href={link.url} className="hover:underline">{link.text}</a>
                             )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-4">Contact</h4>
                    <ul className="space-y-2 opacity-80">
                      <li>contact@example.com</li>
                      <li>+1 (555) 123-4567</li>
                    </ul>
                  </div>
                  <div className="col-span-full border-t border-white/10 mt-4 pt-8 text-center opacity-60 text-sm">
                    © {new Date().getFullYear()} {section.config.companyName}. All rights reserved.
                  </div>
               </div>
            )}
            
            {/* Hover overlay for actions */}
            <div className="absolute -right-2 -top-2 hidden group-hover/block:flex items-center gap-1 bg-white shadow-sm rounded-lg p-1 border border-gray-200 z-10">
               <div className="p-1 cursor-grab text-gray-400 hover:text-gray-600">
                 <Grip className="size-3" />
               </div>
               <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDeleteBlock) onDeleteBlock(section.id, index);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete block"
               >
                  <Trash2 className="size-3" />
               </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Allow dropping on custom sections or any section if we want to support it
  // For now, let's wrap the content in a drop zone if it's a custom section
  const isDroppable = section.type === 'custom';
  
  switch (section.type) {
    case 'custom':
      return (
        <div 
          style={containerStyle}
          onDragOver={(e) => {
            if (draggedElementType) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          onDrop={handleBlockDrop}
          className={`transition-colors ${draggedElementType ? 'hover:bg-teal-50/50 hover:ring-2 hover:ring-teal-500/50 ring-inset' : ''}`}
        >
           <div className="max-w-7xl mx-auto px-6 w-full">
             {renderBlocks()}
           </div>
        </div>
      );

    case 'navbar':
      return (
        <nav 
          className={`w-full z-50 transition-all ${section.config.sticky ? 'sticky top-0' : 'relative'} ${draggedElementType ? 'ring-2 ring-teal-500/50' : ''}`}
          onDragOver={(e) => {
            if (draggedElementType) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          onDrop={handleBlockDrop}
          style={{ 
            ...containerStyle,
            // Navbar specific overrides if needed
            borderBottom: '1px solid rgba(0,0,0,0.1)',
            paddingTop: section.config.paddingTop || '1rem', // Default for navbar
            paddingBottom: section.config.paddingBottom || '1rem',
          }}
        >
          <div className={`max-w-7xl mx-auto px-6 flex items-center justify-between ${section.config.minHeight ? 'w-full' : ''}`}>
            <div className="font-bold text-xl flex items-center gap-2">
              {section.config.logoImage ? (
                <img src={section.config.logoImage} alt="Logo" className="h-8 w-auto object-contain" />
              ) : (
                <div className="flex items-center gap-1">
                  <Layout className="size-6 text-teal-600" />
                  <span>{section.config.logoText || 'Brand'}</span>
                </div>
              )}
            </div>
            
            {!isMobile && (
              <div className="flex items-center gap-8">
                {(section.config.links || []).map((link: any, i: number) => (
                  <NavDropdownLink
                    key={i}
                    link={link}
                    pages={pages}
                    onLinkClick={onLinkClick}
                  />
                ))}
              </div>
            )}
            
            <div className="flex items-center gap-4">
              {!isMobile && section.config.showButton && (
                 <button 
                   onClick={(e) => {
                     e.preventDefault();
                     if (onLinkClick && section.config.buttonUrl) {
                        onLinkClick(section.config.buttonText, section.config.buttonUrl);
                     }
                   }}
                   className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                 >
                   {section.config.buttonText}
                 </button>
              )}
              {isMobile && <List className="size-6" />}
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-6 w-full">
             {renderBlocks()}
          </div>
        </nav>
      );

    case 'hero':
      const alignment = section.config.alignment || 'center';
      const textColor = section.config.textColor || '#ffffff';
      const fontSize = section.config.fontSize || 'large';
      const headlineSizes = { small: 'text-3xl', medium: 'text-4xl', large: 'text-5xl', xlarge: 'text-6xl' };
      
      const hasBlocks = section.blocks && section.blocks.length > 0;

      return (
        <div
          className={`relative ${draggedElementType ? 'ring-2 ring-teal-500/50' : ''}`}
          onDragOver={(e) => {
             if (draggedElementType) {
               e.preventDefault();
               e.stopPropagation();
             }
           }}
           onDrop={handleBlockDrop}
          style={{
            ...containerStyle,
            backgroundImage: section.config.backgroundImage
              ? `url(${section.config.backgroundImage})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: textColor,
            fontFamily: section.config.fontFamily,
          }}
        >
          <div className={`max-w-4xl mx-auto px-6 ${alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left'}`}>
            {hasBlocks ? renderBlocks() : (
              <>
                <h1 
                  className={`font-bold mb-4 ${isMobile ? 'text-3xl' : headlineSizes[fontSize as keyof typeof headlineSizes]}`}
                  style={{ 
                    color: section.config.headlineColor,
                    fontFamily: section.config.headlineFontFamily 
                  }}
                >
                  {section.config.headline || 'Hero Headline'}
                </h1>
                <p 
                  className={`mb-8 opacity-90 ${isMobile ? 'text-base' : 'text-xl'}`}
                  style={{ 
                    color: section.config.subheadlineColor,
                    fontFamily: section.config.subheadlineFontFamily 
                  }}
                >
                  {section.config.subheadline || 'Subheadline text goes here'}
                </p>
                {(section.config.ctaText === undefined || section.config.ctaText !== '') && (
                  <button 
                    className="px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity inline-block shadow-sm"
                    style={{
                      backgroundColor: section.config.buttonColor || '#ffffff',
                      color: section.config.buttonTextColor || '#134e4a',
                      fontFamily: section.config.buttonFontFamily
                    }}
                  >
                    {section.config.ctaText || 'Get Started'}
                  </button>
                )}
                <div className="mt-8">
                   {renderBlocks()}
                </div>
              </>
            )}
          </div>
        </div>
      );

    case 'course-grid':
      return (
        <div 
           style={containerStyle}
           className={`${draggedElementType ? 'ring-2 ring-teal-500/50' : ''}`}
           onDragOver={(e) => {
             if (draggedElementType) {
               e.preventDefault();
               e.stopPropagation();
             }
           }}
           onDrop={handleBlockDrop}
        >
          <div className="max-w-6xl mx-auto px-6">
            {section.blocks && section.blocks.length > 0 ? renderBlocks() : (
              <>
                <h2 className={`font-bold text-gray-900 mb-8 text-center ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
                  {section.config.heading || 'Our Courses'}
                </h2>
                <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : `grid-cols-${section.config.coursesPerRow || 3}`}`}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                      <div className="h-48 bg-gradient-to-br from-teal-400 to-purple-500"></div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Course Title {i}</h3>
                        <p className="text-sm text-gray-600 mb-4">Brief course description explaining what students will learn</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">12 lessons • 6 hours</span>
                          <button className="text-sm text-teal-600 font-medium hover:underline">View →</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  {renderBlocks()}
                </div>
              </>
            )}
          </div>
        </div>
      );

    case 'features':
      return (
        <div 
           style={containerStyle}
           className={`${draggedElementType ? 'ring-2 ring-teal-500/50' : ''}`}
           onDragOver={(e) => {
             if (draggedElementType) {
               e.preventDefault();
               e.stopPropagation();
             }
           }}
           onDrop={handleBlockDrop}
        >
          <div className="max-w-6xl mx-auto px-6">
            {section.blocks && section.blocks.length > 0 ? renderBlocks() : (
              <>
                <h2 className={`font-bold text-gray-900 mb-8 text-center ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
                  {section.config.heading || 'Why Choose Us'}
                </h2>
                <div className={`grid gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
                  {(section.config.features || ['Expert Instructors', 'Flexible Learning', 'Industry Recognized']).slice(0, 3).map((feature: any, i: number) => {
                    const featureData = typeof feature === 'string' ? { title: feature, description: 'High-quality content delivered by professionals', icon: '✓' } : feature;
                    return (
                      <div key={i} className="text-center">
                        <div className="size-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                          {featureData.icon || '✓'}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">{featureData.title}</h3>
                        <p className="text-sm text-gray-600">{featureData.description}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-8">
                  {renderBlocks()}
                </div>
              </>
            )}
          </div>
        </div>
      );

    case 'team':
      return (
        <div 
           style={containerStyle}
           className={`${draggedElementType ? 'ring-2 ring-teal-500/50' : ''}`}
           onDragOver={(e) => {
             if (draggedElementType) {
               e.preventDefault();
               e.stopPropagation();
             }
           }}
           onDrop={handleBlockDrop}
        >
          <div className="max-w-6xl mx-auto px-6">
            {section.blocks && section.blocks.length > 0 ? renderBlocks() : (
              <>
                <h2 className={`font-bold text-gray-900 mb-8 text-center ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
                  {section.config.heading || 'Meet Our Team'}
                </h2>
                <div className={`grid gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
                  {(section.config.members || []).map((member: any, i: number) => (
                    <div key={i} className="text-center">
                      <div className="size-32 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
                        {member.image && <img src={member.image} alt={member.name} className="w-full h-full object-cover" />}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{member.name}</h3>
                      <p className="text-sm text-teal-600 mb-2">{member.role}</p>
                      <p className="text-sm text-gray-600">{member.bio}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      );

    case 'pricing':
      return (
        <div 
           style={containerStyle}
           className={`${draggedElementType ? 'ring-2 ring-teal-500/50' : ''}`}
           onDragOver={(e) => {
             if (draggedElementType) {
               e.preventDefault();
               e.stopPropagation();
             }
           }}
           onDrop={handleBlockDrop}
        >
          <div className="max-w-6xl mx-auto px-6">
            {section.blocks && section.blocks.length > 0 ? renderBlocks() : (
              <>
                <h2 className={`font-bold text-gray-900 mb-8 text-center ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
                  {section.config.heading || 'Choose Your Plan'}
                </h2>
                <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
                  {(section.config.plans || []).map((plan: any, i: number) => (
                    <div
                      key={i}
                      className={`rounded-lg p-6 border-2 ${
                        plan.highlighted
                          ? 'border-teal-500 bg-teal-50 shadow-lg scale-105'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      {plan.highlighted && (
                        <span className="inline-block px-3 py-1 bg-teal-500 text-white text-xs font-semibold rounded-full mb-4">
                          Popular
                        </span>
                      )}
                      <h3 className="font-semibold text-gray-900 text-xl mb-2">{plan.name}</h3>
                      <div className="mb-4">
                        <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                        <span className="text-gray-500 text-sm">{plan.period}</span>
                      </div>
                      <ul className="space-y-3 mb-8">
                        {plan.features?.map((feature: string, j: number) => (
                          <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                            <Check className="size-4 text-teal-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <button className={`w-full py-2 rounded-lg font-medium transition-colors ${
                        plan.highlighted
                          ? 'bg-teal-600 text-white hover:bg-teal-700'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}>
                        Get Started
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                   {renderBlocks()}
                </div>
              </>
            )}
          </div>
        </div>
      );
      
    case 'stats':
      return (
        <div 
           style={containerStyle}
           className={`${draggedElementType ? 'ring-2 ring-teal-500/50' : ''}`}
           onDragOver={(e) => {
             if (draggedElementType) {
               e.preventDefault();
               e.stopPropagation();
             }
           }}
           onDrop={handleBlockDrop}
        >
          <div className="max-w-6xl mx-auto px-6">
            {section.blocks && section.blocks.length > 0 ? renderBlocks() : (
              <>
                <h2 className={`font-bold text-white mb-12 text-center ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
                  {section.config.heading || 'Our Impact'}
                </h2>
                <div className={`grid gap-8 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
                  {(section.config.statistics || []).map((stat: any, i: number) => (
                    <div key={i} className="text-center">
                      <div className="text-4xl font-bold text-white mb-2">{stat.number}</div>
                      <div className="text-teal-200 font-medium">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  {renderBlocks()}
                </div>
              </>
            )}
          </div>
        </div>
      );

    case 'faq':
      return (
        <div 
           style={containerStyle}
           className={`${draggedElementType ? 'ring-2 ring-teal-500/50' : ''}`}
           onDragOver={(e) => {
             if (draggedElementType) {
               e.preventDefault();
               e.stopPropagation();
             }
           }}
           onDrop={handleBlockDrop}
        >
          <div className="max-w-3xl mx-auto px-6">
            {section.blocks && section.blocks.length > 0 ? renderBlocks() : (
              <>
                <h2 className={`font-bold text-gray-900 mb-8 text-center ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
                  {section.config.heading || 'Frequently Asked Questions'}
                </h2>
                <div className="space-y-4">
                  {(section.config.questions || []).map((q: any, i: number) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 mb-2">{q.question}</h3>
                      <p className="text-gray-600">{q.answer}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  {renderBlocks()}
                </div>
              </>
            )}
          </div>
        </div>
      );

    case 'logos':
      return (
        <div 
           style={containerStyle}
           className={`${draggedElementType ? 'ring-2 ring-teal-500/50' : ''}`}
           onDragOver={(e) => {
             if (draggedElementType) {
               e.preventDefault();
               e.stopPropagation();
             }
           }}
           onDrop={handleBlockDrop}
        >
          <div className="max-w-6xl mx-auto px-6 text-center">
            {section.blocks && section.blocks.length > 0 ? renderBlocks() : (
              <>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8">
                  {section.config.heading || 'Trusted By Leading Companies'}
                </h3>
                <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale">
                  {(section.config.logos || []).map((logo: any, i: number) => (
                    <div key={i} className="text-xl font-bold text-gray-400">
                      {logo.name}
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  {renderBlocks()}
                </div>
              </>
            )}
          </div>
        </div>
      );

    case 'image':
      const hasImageBlocks = section.blocks && section.blocks.length > 0;
      return (
        <div 
           style={containerStyle}
           className={`${draggedElementType ? 'ring-2 ring-teal-500/50' : ''}`}
           onDragOver={(e) => {
             if (draggedElementType) {
               e.preventDefault();
               e.stopPropagation();
             }
           }}
           onDrop={handleBlockDrop}
        >
          <div className={`${section.config.fullWidth ? 'w-full' : 'max-w-6xl mx-auto px-6'}`}>
            {hasImageBlocks ? renderBlocks() : (
              <>
                <div className="relative rounded-lg overflow-hidden shadow-sm">
                  <img 
                    src={section.config.imageUrl || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1471&q=80'} 
                    alt={section.config.altText || 'Section Image'} 
                    className="w-full h-auto object-cover"
                    style={{ maxHeight: '600px' }}
                  />
                </div>
                {section.config.caption && (
                  <p className="text-center text-sm text-gray-500 mt-4">{section.config.caption}</p>
                )}
                <div className="mt-8">
                  {renderBlocks()}
                </div>
              </>
            )}
          </div>
        </div>
      );

    case 'video':
      const hasVideoBlocks = section.blocks && section.blocks.length > 0;
      return (
        <div 
           style={containerStyle}
           className={`${draggedElementType ? 'ring-2 ring-teal-500/50' : ''}`}
           onDragOver={(e) => {
             if (draggedElementType) {
               e.preventDefault();
               e.stopPropagation();
             }
           }}
           onDrop={handleBlockDrop}
        >
          <div className="max-w-4xl mx-auto px-6 text-center">
            {hasVideoBlocks ? renderBlocks() : (
              <>
                <h2 className={`font-bold text-gray-900 mb-4 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
                  {section.config.heading}
                </h2>
                <p className="text-gray-600 mb-8">{section.config.description}</p>
                <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-xl">
                  <iframe
                    src={section.config.videoUrl}
                    className="w-full h-full"
                    allowFullScreen
                    title="Video player"
                  />
                </div>
                <div className="mt-8">
                  {renderBlocks()}
                </div>
              </>
            )}
          </div>
        </div>
      );

    case 'cta':
      const hasCtaBlocks = section.blocks && section.blocks.length > 0;
      return (
        <div 
           style={containerStyle}
           className={`${draggedElementType ? 'ring-2 ring-teal-500/50' : ''}`}
           onDragOver={(e) => {
             if (draggedElementType) {
               e.preventDefault();
               e.stopPropagation();
             }
           }}
           onDrop={handleBlockDrop}
        >
          <div className="max-w-4xl mx-auto px-6 text-center">
            {hasCtaBlocks ? renderBlocks() : (
               <>
                  <h2 className="text-3xl font-bold mb-4">{section.config.headline || 'Ready to Get Started?'}</h2>
                  <p className="text-xl opacity-90 mb-8">{section.config.subheadline || 'Join thousands of students today.'}</p>
                  {(section.config.ctaText === undefined || section.config.ctaText !== '') && (
                    <button className="px-8 py-3 bg-white text-teal-900 rounded-lg font-semibold hover:opacity-90 transition-opacity">
                      {section.config.ctaText || 'Sign Up Now'}
                    </button>
                  )}
                  <div className="mt-8">
                    {renderBlocks()}
                  </div>
               </>
            )}
          </div>
        </div>
      );

    case 'rich-text':
      const hasRichTextBlocks = section.blocks && section.blocks.length > 0;
      return (
        <div 
           style={containerStyle}
           className={`${draggedElementType ? 'ring-2 ring-teal-500/50' : ''}`}
           onDragOver={(e) => {
             if (draggedElementType) {
               e.preventDefault();
               e.stopPropagation();
             }
           }}
           onDrop={handleBlockDrop}
        >
          <div className="max-w-4xl mx-auto px-6" style={{ maxWidth: section.config.maxWidth || '800px' }}>
             {hasRichTextBlocks ? renderBlocks() : (
               <>
                 <div dangerouslySetInnerHTML={{ __html: section.config.content || '<p>Start editing...</p>' }} />
                 <div className="mt-8">
                   {renderBlocks()}
                 </div>
               </>
             )}
          </div>
        </div>
      );

    case 'footer':
      return (
        <footer style={{ 
          ...containerStyle,
          color: section.config.textColor, 
        }}
        className={`${draggedElementType ? 'ring-2 ring-teal-500/50' : ''}`}
        onDragOver={(e) => {
          if (draggedElementType) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onDrop={handleBlockDrop}
        >
          <div className={`max-w-6xl mx-auto px-6 ${section.config.minHeight ? 'w-full' : ''}`}>
            {section.blocks && section.blocks.length > 0 ? renderBlocks() : (
              <>
                <div className={`grid gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-4'}`}>
                  <div className="col-span-1 md:col-span-2">
                    <h3 className="text-xl font-bold mb-4">{section.config.companyName}</h3>
                    <p className="opacity-80 max-w-sm">{section.config.description}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-4">Links</h4>
                    <ul className="space-y-2 opacity-80">
                      {(section.config.links || []).map((link: any, i: number) => (
                        <li key={i}><a href={link.url} className="hover:underline">{link.text}</a></li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-4">Contact</h4>
                    <ul className="space-y-2 opacity-80">
                      <li>contact@example.com</li>
                      <li>+1 (555) 123-4567</li>
                    </ul>
                  </div>
                </div>
                <div className="border-t border-white/10 mt-12 pt-8 text-center opacity-60 text-sm">
                  © {new Date().getFullYear()} {section.config.companyName}. All rights reserved.
                </div>
                <div className="mt-8">
                  {renderBlocks()}
                </div>
              </>
            )}
          </div>
        </footer>
      );

    default:
      return (
        <div className="p-12 text-center border-2 border-dashed border-gray-300 rounded-lg m-6">
          <p className="text-gray-500">Preview not available for {section.type}</p>
        </div>
      );
  }
}

function renderSectionCustomization(
  section: WebsiteSection,
  updateConfig: (id: string, field: string, value: any) => void,
  activeTab: 'content' | 'style' | 'layout',
  icons: string[],
  showIconPicker: boolean,
  setShowIconPicker: (show: boolean) => void,
  pages: WebsitePage[] = [], // Optional pages for linking
  selectedBlockId: string | null = null,
  setSelectedBlockId?: (id: string | null) => void,
  availableCoursesList: Course[] = []
) {
  // Helper to flatten pages for dropdowns
  const flattenPages = (list: WebsitePage[], depth = 0): { id: string, name: string, slug: string, depth: number }[] => {
    return list.flatMap(p => [
      { id: p.id, name: p.name, slug: p.slug, depth },
      ...(p.subpages ? flattenPages(p.subpages, depth + 1) : [])
    ]);
  };
  const flatPages = flattenPages(pages);

  // Helper to get block ID by type for Hero/Simple sections
  const getBlockIdByType = (type: string) => section.blocks?.find(b => b.type === type)?.id;

  const renderTextField = (label: string, field: string, placeholder?: string, multiline = false, isHighlighted = false) => (
    <div className={`mb-4 transition-all duration-300 ${isHighlighted ? 'ring-2 ring-teal-500 bg-teal-50 p-2 rounded-lg -mx-2 shadow-sm' : ''}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={section.config[field] || ''}
          onChange={(e) => updateConfig(section.id, field, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          rows={3}
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          value={section.config[field] || ''}
          onChange={(e) => updateConfig(section.id, field, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          placeholder={placeholder}
        />
      )}
    </div>
  );

  const renderLinkControl = (label: string, field: string) => {
    const currentValue = section.config[field] || '#';
    const isInternal = pages.some(p => p.slug === currentValue);
    
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="flex flex-col gap-2">
           <select
             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
             value={isInternal ? currentValue : 'custom'}
             onChange={(e) => {
               if (e.target.value !== 'custom') {
                 updateConfig(section.id, field, e.target.value);
               }
             }}
           >
             <option value="custom">Custom URL...</option>
             <optgroup label="Internal Pages">
               {flatPages.map(p => (
                 <option key={p.id} value={p.slug}>
                   {'\u00A0'.repeat(p.depth * 2)}{p.name} ({p.slug})
                 </option>
               ))}
             </optgroup>
           </select>
           
           {(!isInternal || currentValue === '#') && (
             <div className="relative">
               <input
                 type="text"
                 value={currentValue}
                 onChange={(e) => updateConfig(section.id, field, e.target.value)}
                 className="w-full pl-9 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                 placeholder="https://..."
               />
               <Globe className="absolute left-3 top-2.5 size-4 text-gray-400" />
             </div>
           )}
        </div>
      </div>
    );
  };

  const renderColorPicker = (label: string, field: string) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={section.config[field] || '#000000'}
          onChange={(e) => updateConfig(section.id, field, e.target.value)}
          className="size-8 rounded cursor-pointer border border-gray-300"
        />
        <input
          type="text"
          value={section.config[field] || ''}
          onChange={(e) => updateConfig(section.id, field, e.target.value)}
          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>
    </div>
  );

  const renderFontPicker = (label: string, field: string) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={section.config[field] || 'sans'}
        onChange={(e) => updateConfig(section.id, field, e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
      >
        <option value="sans">Sans Serif (Default)</option>
        <option value="serif">Serif</option>
        <option value="mono">Monospace</option>
        <option value="inter">Inter</option>
        <option value="roboto">Roboto</option>
        <option value="lora">Lora</option>
      </select>
    </div>
  );

  if (activeTab === 'style') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Colors</h3>
          {renderColorPicker('Background Color', 'backgroundColor')}
          {renderColorPicker('Text Color', 'textColor')}
          {section.type === 'hero' && (
            <>
              {renderColorPicker('Headline Color', 'headlineColor')}
              {renderColorPicker('Subheadline Color', 'subheadlineColor')}
              {renderColorPicker('Button Color', 'buttonColor')}
              {renderColorPicker('Button Text Color', 'buttonTextColor')}
            </>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Typography</h3>
          {renderFontPicker('Section Font Family', 'fontFamily')}
          {section.type === 'hero' && (
            <>
               {renderFontPicker('Headline Font', 'headlineFontFamily')}
               {renderFontPicker('Subheadline Font', 'subheadlineFontFamily')}
               {renderFontPicker('Button Font', 'buttonFontFamily')}
            </>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Background</h3>
          {renderTextField('Background Image URL', 'backgroundImage', 'https://...')}
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="bg-overlay"
              checked={section.config.overlay || false}
              onChange={(e) => updateConfig(section.id, 'overlay', e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="bg-overlay" className="text-sm text-gray-700">Add dark overlay</label>
          </div>
        </div>
      </div>
    );
  }

  const renderBoxModelControl = (
    label: string, 
    type: 'padding' | 'margin'
  ) => {
    const fields = ['Top', 'Right', 'Bottom', 'Left'];
    
    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="grid grid-cols-3 gap-1 p-2 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="col-start-2 flex flex-col items-center">
            <div className="text-[10px] text-gray-400 mb-1 uppercase">Top</div>
            <div className="flex items-center w-full">
              <button 
                onClick={() => {
                  const val = parseFloat(section.config[`${type}Top`] || '0') || 0;
                  const unit = (section.config[`${type}Top`] || '').replace(/[0-9.-]/g, '') || 'px';
                  updateConfig(section.id, `${type}Top`, `${val - 1}${unit}`);
                }}
                className="w-5 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-l text-gray-600 text-xs"
              >
                -
              </button>
              <input
                type="text"
                value={section.config[`${type}Top`] || ''}
                onChange={(e) => updateConfig(section.id, `${type}Top`, e.target.value)}
                className="w-full h-6 px-1 text-center text-xs border-y border-gray-300 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 min-w-0"
                placeholder="0"
              />
              <button 
                onClick={() => {
                  const val = parseFloat(section.config[`${type}Top`] || '0') || 0;
                  const unit = (section.config[`${type}Top`] || '').replace(/[0-9.-]/g, '') || 'px';
                  updateConfig(section.id, `${type}Top`, `${val + 1}${unit}`);
                }}
                className="w-5 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-r text-gray-600 text-xs"
              >
                +
              </button>
            </div>
          </div>
          
          <div className="col-start-1 row-start-2 flex flex-col items-center justify-center">
             <div className="text-[10px] text-gray-400 mb-1 uppercase">Left</div>
             <div className="flex items-center w-full">
              <button 
                onClick={() => {
                  const val = parseFloat(section.config[`${type}Left`] || '0') || 0;
                  const unit = (section.config[`${type}Left`] || '').replace(/[0-9.-]/g, '') || 'px';
                  updateConfig(section.id, `${type}Left`, `${val - 1}${unit}`);
                }}
                className="w-5 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-l text-gray-600 text-xs"
              >
                -
              </button>
              <input
                type="text"
                value={section.config[`${type}Left`] || ''}
                onChange={(e) => updateConfig(section.id, `${type}Left`, e.target.value)}
                className="w-full h-6 px-1 text-center text-xs border-y border-gray-300 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 min-w-0"
                placeholder="0"
              />
              <button 
                onClick={() => {
                  const val = parseFloat(section.config[`${type}Left`] || '0') || 0;
                  const unit = (section.config[`${type}Left`] || '').replace(/[0-9.-]/g, '') || 'px';
                  updateConfig(section.id, `${type}Left`, `${val + 1}${unit}`);
                }}
                className="w-5 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-r text-gray-600 text-xs"
              >
                +
              </button>
            </div>
          </div>

          <div className="col-start-2 row-start-2 flex items-center justify-center">
             <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{type === 'padding' ? 'Pad' : 'Mar'}</div>
          </div>

          <div className="col-start-3 row-start-2 flex flex-col items-center justify-center">
             <div className="text-[10px] text-gray-400 mb-1 uppercase">Right</div>
             <div className="flex items-center w-full">
              <button 
                onClick={() => {
                  const val = parseFloat(section.config[`${type}Right`] || '0') || 0;
                  const unit = (section.config[`${type}Right`] || '').replace(/[0-9.-]/g, '') || 'px';
                  updateConfig(section.id, `${type}Right`, `${val - 1}${unit}`);
                }}
                className="w-5 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-l text-gray-600 text-xs"
              >
                -
              </button>
              <input
                type="text"
                value={section.config[`${type}Right`] || ''}
                onChange={(e) => updateConfig(section.id, `${type}Right`, e.target.value)}
                className="w-full h-6 px-1 text-center text-xs border-y border-gray-300 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 min-w-0"
                placeholder="0"
              />
              <button 
                onClick={() => {
                  const val = parseFloat(section.config[`${type}Right`] || '0') || 0;
                  const unit = (section.config[`${type}Right`] || '').replace(/[0-9.-]/g, '') || 'px';
                  updateConfig(section.id, `${type}Right`, `${val + 1}${unit}`);
                }}
                className="w-5 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-r text-gray-600 text-xs"
              >
                +
              </button>
            </div>
          </div>

          <div className="col-start-2 row-start-3 flex flex-col items-center">
             <div className="flex items-center w-full">
              <button 
                onClick={() => {
                  const val = parseFloat(section.config[`${type}Bottom`] || '0') || 0;
                  const unit = (section.config[`${type}Bottom`] || '').replace(/[0-9.-]/g, '') || 'px';
                  updateConfig(section.id, `${type}Bottom`, `${val - 1}${unit}`);
                }}
                className="w-5 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-l text-gray-600 text-xs"
              >
                -
              </button>
              <input
                type="text"
                value={section.config[`${type}Bottom`] || ''}
                onChange={(e) => updateConfig(section.id, `${type}Bottom`, e.target.value)}
                className="w-full h-6 px-1 text-center text-xs border-y border-gray-300 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 min-w-0"
                placeholder="0"
              />
              <button 
                onClick={() => {
                  const val = parseFloat(section.config[`${type}Bottom`] || '0') || 0;
                  const unit = (section.config[`${type}Bottom`] || '').replace(/[0-9.-]/g, '') || 'px';
                  updateConfig(section.id, `${type}Bottom`, `${val + 1}${unit}`);
                }}
                className="w-5 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-r text-gray-600 text-xs"
              >
                +
              </button>
            </div>
            <div className="text-[10px] text-gray-400 mt-1 uppercase">Bottom</div>
          </div>
        </div>
      </div>
    );
  };

  if (activeTab === 'layout') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Dimensions & Spacing</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Height</label>
            <div className="flex items-center gap-3">
               <input 
                 type="range" 
                 min="0" 
                 max="1000" 
                 step="50"
                 value={parseInt(section.config.minHeight) || 0}
                 onChange={(e) => updateConfig(section.id, 'minHeight', `${e.target.value}px`)}
                 className="flex-1 accent-teal-600"
               />
               <span className="text-xs text-gray-500 w-16 text-right font-mono">{section.config.minHeight || 'Auto'}</span>
            </div>
            <div className="flex justify-end mt-1">
              <button 
                onClick={() => updateConfig(section.id, 'minHeight', '')}
                className="text-[10px] text-teal-600 hover:underline"
              >
                Reset to Auto
              </button>
            </div>
          </div>

          <div className="bg-gray-50/50 rounded-xl border border-gray-200 p-2">
            {renderBoxModelControl('Padding', 'padding')}
            <div className="my-4 border-t border-gray-200"></div>
            {renderBoxModelControl('Margin', 'margin')}
          </div>
        </div>

        {section.type === 'hero' && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Alignment</h3>
            <div className="flex gap-2">
              {['left', 'center', 'right'].map((align) => (
                <button
                  key={align}
                  onClick={() => updateConfig(section.id, 'alignment', align)}
                  className={`flex-1 p-2 border rounded-lg flex justify-center ${
                    section.config.alignment === align
                      ? 'border-teal-500 bg-teal-50 text-teal-600'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {align === 'left' && <AlignLeft className="size-4" />}
                  {align === 'center' && <AlignCenter className="size-4" />}
                  {align === 'right' && <AlignRight className="size-4" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Content Tab
  const renderBlocks = () => {
    if (!section.blocks || section.blocks.length === 0) {
      if (section.type === 'custom') {
        return (
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-400">
            Drop elements in the preview area to add content
          </div>
        );
      }
      return null;
    }

    return (
      <div className="flex flex-col gap-4">
        {section.blocks.map((block, index) => (
          <div key={block.id} className="relative group/block hover:ring-1 hover:ring-teal-200 rounded p-1">
            {/* Block content rendering */}
            {(block.type === 'text' || block.type === 'heading' || block.type === 'paragraph') && (
              <div 
                className="prose max-w-none text-xs"
                dangerouslySetInnerHTML={{ __html: block.content.html || '<p>Edit this text...</p>' }} 
              />
            )}
            {block.type === 'button' && (
              <div className="flex justify-start">
                <button className="px-4 py-1.5 bg-teal-600 text-white text-xs rounded hover:bg-teal-700 transition-colors">
                  {block.content.text || 'Click Me'}
                </button>
              </div>
            )}
            {block.type === 'image' && (
              <img 
                src={block.content.url || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1471&q=80'} 
                alt={block.content.alt || 'Image'} 
                className="max-w-full h-auto rounded-lg"
              />
            )}
            {block.type === 'spacer' && (
              <div style={{ height: block.content.height || '32px' }} className="w-full bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
                Spacer
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  switch (section.type) {
    case 'custom':
      return (
        <div className="space-y-4">
           <p className="text-sm text-gray-500 mb-4">
             Custom sections are composed of blocks. Manage the blocks in the preview area.
           </p>
           <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
             {renderBlocks()}
           </div>
        </div>
      );

    case 'navbar':
      return (
        <div className="space-y-4">
          {renderTextField('Logo Text', 'logoText')}
          {renderTextField('Logo Image URL', 'logoImage', 'https://...')}
          
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="sticky-nav"
              checked={section.config.sticky || false}
              onChange={(e) => updateConfig(section.id, 'sticky', e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="sticky-nav" className="text-sm text-gray-700">Sticky Navigation</label>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="show-btn"
              checked={section.config.showButton || false}
              onChange={(e) => updateConfig(section.id, 'showButton', e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="show-btn" className="text-sm text-gray-700">Show CTA Button</label>
          </div>
          
          {section.config.showButton && (
            <>
              {renderTextField('Button Text', 'buttonText')}
              {renderLinkControl('Button Link', 'buttonUrl')}
            </>
          )}

          <div className="border-t border-gray-200 pt-4 mt-4">
             <label className="block text-sm font-medium text-gray-700 mb-2">Navigation Links</label>
             <div className="space-y-2">
               {(section.config.links || []).map((link: any, i: number) => (
                 <div key={i} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                   <div className="flex gap-2">
                      <input
                        type="text"
                        value={link.text}
                        onChange={(e) => {
                          const newLinks = [...(section.config.links || [])];
                          newLinks[i] = { ...newLinks[i], text: e.target.value };
                          updateConfig(section.id, 'links', newLinks);
                        }}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                        placeholder="Link Text"
                      />
                      <button 
                         onClick={() => {
                            const newLinks = section.config.links.filter((_: any, idx: number) => idx !== i);
                            updateConfig(section.id, 'links', newLinks);
                         }}
                         className="p-1 text-red-500 hover:bg-red-50 rounded"
                       >
                         <Trash2 className="size-4" />
                       </button>
                   </div>
                   
                   {/* Inline Link Picker for Nav Items */}
                   <div className="flex gap-2 items-center">
                     <select
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs bg-white text-gray-700"
                        value={pages.some(p => p.slug === link.url) ? link.url : 'custom'}
                        onChange={(e) => {
                           if (e.target.value !== 'custom') {
                              const newLinks = [...(section.config.links || [])];
                              newLinks[i] = { ...newLinks[i], url: e.target.value };
                              updateConfig(section.id, 'links', newLinks);
                           }
                        }}
                     >
                       <option value="custom">Custom URL...</option>
                       <optgroup label="Internal Pages">
                         {pages.map(p => (
                           <option key={p.id} value={p.slug}>{p.name}</option>
                         ))}
                       </optgroup>
                     </select>
                     {(!pages.some(p => p.slug === link.url) || link.url === '#') && (
                       <input
                         type="text"
                         value={link.url}
                         onChange={(e) => {
                           const newLinks = [...(section.config.links || [])];
                           newLinks[i] = { ...newLinks[i], url: e.target.value };
                           updateConfig(section.id, 'links', newLinks);
                         }}
                         className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                         placeholder="https://..."
                       />
                     )}
                   </div>
                 </div>
               ))}
               <button
                 onClick={() => {
                   const newLinks = [...(section.config.links || []), { text: 'New Link', url: '#' }];
                   updateConfig(section.id, 'links', newLinks);
                 }}
                 className="text-sm text-teal-600 font-medium hover:underline flex items-center gap-1 mt-2"
               >
                 <Plus className="size-3" /> Add Link
               </button>
             </div>
          </div>
        </div>
      );

    case 'hero':
      return (
        <div className="space-y-4">
          {renderTextField('Headline', 'headline', '', false, selectedBlockId === getBlockIdByType('heading'))}
          {renderTextField('Subheadline', 'subheadline', '', true, selectedBlockId === getBlockIdByType('paragraph'))}
          {renderTextField('Button Text', 'ctaText', '', false, selectedBlockId === getBlockIdByType('button'))}
          {renderLinkControl('Button Link', 'ctaLink')}
        </div>
      );

    case 'course-grid':
      const courseMatch = selectedBlockId?.match(/^course-(\d+)/);
      const selectedCourseIndex = courseMatch ? parseInt(courseMatch[1]) : -1;
      const coursesConfig = section.config.courses || [1, 2, 3];
      
      if (selectedCourseIndex !== -1 && coursesConfig[selectedCourseIndex] !== undefined) {
         const currentCourse = coursesConfig[selectedCourseIndex];
         const isDefault = typeof currentCourse === 'number';
         
         const courseObj = isDefault ? {
            title: `Course Title ${currentCourse}`,
            description: 'Brief course description explaining what students will learn',
            meta: '12 lessons • 6 hours',
            imageUrl: '',
            linkedCourseId: ''
         } : currentCourse;

         return (
             <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                 <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
                     <button 
                        onClick={() => setSelectedBlockId && setSelectedBlockId(null)}
                        className="p-1 hover:bg-gray-100 rounded text-gray-500"
                        title="Back to Grid Settings"
                     >
                       <ArrowLeft className="size-4" />
                     </button>
                     <h3 className="font-semibold text-gray-900">Edit Course Card</h3>
                 </div>

                 {/* Link Course */}
                 <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link Existing Course</label>
                    <select
                        value={courseObj.linkedCourseId || ''}
                        onChange={(e) => {
                             const linkedId = e.target.value;
                             const linkedCourse = availableCoursesList.find(c => c.id === linkedId);
                             
                             const newCourses = [...coursesConfig];
                             
                             if (linkedCourse) {
                                 newCourses[selectedCourseIndex] = {
                                     ...courseObj,
                                     title: linkedCourse.title,
                                     description: linkedCourse.description,
                                     meta: `${linkedCourse.modules?.length || 0} modules • ${linkedCourse.duration}`,
                                     linkedCourseId: linkedId,
                                     imageUrl: courseObj.imageUrl || linkedCourse.thumbnail || linkedCourse.imageUrl || ''
                                 };
                             } else {
                                 newCourses[selectedCourseIndex] = {
                                     ...courseObj,
                                     linkedCourseId: ''
                                 };
                             }
                             updateConfig(section.id, 'courses', newCourses);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                    >
                        <option value="">-- Select a Course --</option>
                        {availableCoursesList.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                    </select>
                    <p className="text-[10px] text-gray-500 mt-1">Linking a course will auto-fill details.</p>
                 </div>

                 {/* Cover Photo */}
                 <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cover Photo</label>
                    {courseObj.imageUrl ? (
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 group/cover">
                            <img
                                src={courseObj.imageUrl}
                                alt="Preview"
                                className="w-full h-full object-cover"
                                onError={() => {
                                    const newCourses = [...coursesConfig];
                                    const prev = typeof newCourses[selectedCourseIndex] === 'number'
                                        ? { title: `Course Title ${newCourses[selectedCourseIndex]}`, description: 'Brief course description explaining what students will learn', meta: '12 lessons • 6 hours' }
                                        : newCourses[selectedCourseIndex];
                                    newCourses[selectedCourseIndex] = { ...prev, imageUrl: '' };
                                    updateConfig(section.id, 'courses', newCourses);
                                }}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    className="px-3 py-1.5 bg-white text-gray-800 text-xs font-medium rounded-lg hover:bg-gray-100 flex items-center gap-1.5"
                                    onClick={() => {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = 'image/*';
                                        input.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
                                        document.body.appendChild(input);
                                        input.onchange = () => {
                                            const file = input.files?.[0];
                                            if (document.body.contains(input)) document.body.removeChild(input);
                                            if (!file) return;
                                            const reader = new FileReader();
                                            reader.onload = (ev) => {
                                                const url = ev.target?.result as string;
                                                const newCourses = [...coursesConfig];
                                                const prev = typeof newCourses[selectedCourseIndex] === 'number'
                                                    ? { title: `Course Title ${newCourses[selectedCourseIndex]}`, description: 'Brief course description explaining what students will learn', meta: '12 lessons • 6 hours' }
                                                    : newCourses[selectedCourseIndex];
                                                newCourses[selectedCourseIndex] = { ...prev, imageUrl: url };
                                                updateConfig(section.id, 'courses', newCourses);
                                            };
                                            reader.readAsDataURL(file);
                                        };
                                        input.addEventListener('cancel', () => { if (document.body.contains(input)) document.body.removeChild(input); });
                                        input.click();
                                    }}
                                >
                                    <Upload className="size-3" /> Change
                                </button>
                                <button
                                    className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 flex items-center gap-1.5"
                                    onClick={() => {
                                        const newCourses = [...coursesConfig];
                                        const prev = typeof newCourses[selectedCourseIndex] === 'number'
                                            ? { title: `Course Title ${newCourses[selectedCourseIndex]}`, description: 'Brief course description explaining what students will learn', meta: '12 lessons • 6 hours' }
                                            : newCourses[selectedCourseIndex];
                                        newCourses[selectedCourseIndex] = { ...prev, imageUrl: '' };
                                        updateConfig(section.id, 'courses', newCourses);
                                    }}
                                >
                                    <Trash2 className="size-3" /> Remove
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            className="w-full aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-teal-400 hover:text-teal-500 hover:bg-teal-50/50 transition-all cursor-pointer"
                            onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
                                document.body.appendChild(input);
                                input.onchange = () => {
                                    const file = input.files?.[0];
                                    if (document.body.contains(input)) document.body.removeChild(input);
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                        const url = ev.target?.result as string;
                                        const newCourses = [...coursesConfig];
                                        const prev = typeof newCourses[selectedCourseIndex] === 'number'
                                            ? { title: `Course Title ${newCourses[selectedCourseIndex]}`, description: 'Brief course description explaining what students will learn', meta: '12 lessons • 6 hours' }
                                            : newCourses[selectedCourseIndex];
                                        newCourses[selectedCourseIndex] = { ...prev, imageUrl: url };
                                        updateConfig(section.id, 'courses', newCourses);
                                    };
                                    reader.readAsDataURL(file);
                                };
                                input.addEventListener('cancel', () => { if (document.body.contains(input)) document.body.removeChild(input); });
                                input.click();
                            }}
                        >
                            <Upload className="size-5" />
                            <span className="text-xs font-medium">Click to upload image</span>
                            <span className="text-[10px]">PNG, JPG, GIF, WEBP</span>
                        </button>
                    )}
                </div>

                 <div className="border-t border-gray-200 pt-4 mt-4">
                     <p className="text-xs font-semibold text-gray-900 mb-3 uppercase tracking-wide">Card Details</p>
                     
                     <div className="space-y-3">
                         <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                            <input 
                                type="text" 
                                value={courseObj.title} 
                                onChange={(e) => {
                                    const newCourses = [...coursesConfig];
                                    const prev = typeof newCourses[selectedCourseIndex] === 'number' 
                                        ? { 
                                            title: `Course Title ${newCourses[selectedCourseIndex]}`,
                                            description: 'Brief course description explaining what students will learn',
                                            meta: '12 lessons • 6 hours'
                                          } 
                                        : newCourses[selectedCourseIndex];
                                        
                                    newCourses[selectedCourseIndex] = { ...prev, title: e.target.value };
                                    updateConfig(section.id, 'courses', newCourses);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                         </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                            <textarea 
                                value={courseObj.description} 
                                onChange={(e) => {
                                    const newCourses = [...coursesConfig];
                                    const prev = typeof newCourses[selectedCourseIndex] === 'number' 
                                        ? { 
                                            title: `Course Title ${newCourses[selectedCourseIndex]}`,
                                            description: 'Brief course description explaining what students will learn',
                                            meta: '12 lessons • 6 hours'
                                          } 
                                        : newCourses[selectedCourseIndex];
                                        
                                    newCourses[selectedCourseIndex] = { ...prev, description: e.target.value };
                                    updateConfig(section.id, 'courses', newCourses);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                rows={3}
                            />
                         </div>
                     </div>
                 </div>
             </div>
         );
      }

      return (
        <div className="space-y-4">
          <div className="bg-teal-50 border border-teal-100 rounded-lg p-3 text-sm text-teal-800 flex items-start gap-2">
             <MousePointerClick className="size-4 mt-0.5 shrink-0" />
             <p>Select a course card in the preview to edit its details and link existing courses.</p>
          </div>
          
          {renderTextField('Heading', 'heading', '', false, selectedBlockId === getBlockIdByType('heading'))}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Courses Per Row</label>
            <select
              value={section.config.coursesPerRow || 3}
              onChange={(e) => updateConfig(section.id, 'coursesPerRow', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            >
              <option value="2">2 Columns</option>
              <option value="3">3 Columns</option>
              <option value="4">4 Columns</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={section.config.showCategories || false}
              onChange={(e) => updateConfig(section.id, 'showCategories', e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <label className="text-sm text-gray-700">Show Categories</label>
          </div>

          <div className="pt-4 border-t border-gray-200">
             <label className="block text-sm font-medium text-gray-700 mb-2">Manage Courses</label>
             <button
               onClick={() => {
                 const newCourses = [...(section.config.courses || [1, 2, 3]), (section.config.courses?.length || 3) + 1];
                 updateConfig(section.id, 'courses', newCourses);
               }}
               className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-teal-600 hover:border-teal-500 hover:bg-teal-50 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
             >
               <Plus className="size-4" />
               Add New Course Card
             </button>
          </div>
        </div>
      );

    case 'features':
      return (
        <div className="space-y-4">
          {renderTextField('Heading', 'heading', '', false, selectedBlockId === getBlockIdByType('heading'))}
          
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Features</label>
              <button
                onClick={() => {
                  const newFeatures = [...(section.config.features || []), { title: 'New Feature', description: 'Feature description', icon: '✓' }];
                  updateConfig(section.id, 'features', newFeatures);
                }}
                className="text-xs text-teal-600 font-medium hover:underline flex items-center gap-1"
              >
                <Plus className="size-3" /> Add Feature
              </button>
            </div>
            <div className="space-y-3">
               {(section.config.features || ['Expert Instructors', 'Flexible Learning', 'Industry Recognized']).map((feature: any, i: number) => {
                  const title = typeof feature === 'string' ? feature : feature.title;
                  const description = typeof feature === 'string' ? 'High-quality content delivered by professionals' : feature.description;
                  const titleId = `${section.id}-feature-${i}-title`;
                  const descId = `${section.id}-feature-${i}-desc`;
                  
                  return (
                    <div key={i} className={`p-3 rounded-lg border relative group transition-all duration-300 ${
                        selectedBlockId === titleId || selectedBlockId === descId 
                          ? 'border-teal-500 bg-teal-50/50 ring-1 ring-teal-500' 
                          : 'bg-gray-50 border-gray-100'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="size-8 bg-teal-100 rounded-full flex items-center justify-center text-sm shrink-0">
                            {typeof feature === 'string' ? '✓' : (feature.icon || '✓')}
                          </div>
                          <input
                            type="text"
                            value={title}
                            onChange={(e) => {
                              // Ensure we're working with the full array or default array
                              const currentFeatures = section.config.features || ['Expert Instructors', 'Flexible Learning', 'Industry Recognized'];
                              let newFeatures = [...currentFeatures];
                              
                              // Normalize to objects if needed
                              newFeatures = newFeatures.map(f => 
                                typeof f === 'string' 
                                  ? { title: f, description: 'High-quality content delivered by professionals', icon: '✓' } 
                                  : f
                              );
                              
                              newFeatures[i] = { ...newFeatures[i], title: e.target.value };
                              updateConfig(section.id, 'features', newFeatures);
                            }}
                            className={`flex-1 px-2 py-1 border rounded text-sm font-medium focus:ring-1 focus:ring-teal-500 transition-colors ${
                              selectedBlockId === titleId ? 'border-teal-500 ring-1 ring-teal-500' : 'border-gray-300'
                            }`}
                            placeholder="Feature Title"
                          />
                           <button 
                            onClick={() => {
                               const currentFeatures = section.config.features || ['Expert Instructors', 'Flexible Learning', 'Industry Recognized'];
                               let newFeatures = [...currentFeatures];
                               
                               newFeatures = newFeatures.map(f => 
                                 typeof f === 'string' 
                                   ? { title: f, description: 'High-quality content delivered by professionals', icon: '✓' } 
                                   : f
                               );

                               newFeatures = newFeatures.filter((_, idx) => idx !== i);
                               updateConfig(section.id, 'features', newFeatures);
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        <textarea
                          value={description}
                          onChange={(e) => {
                            const currentFeatures = section.config.features || ['Expert Instructors', 'Flexible Learning', 'Industry Recognized'];
                            let newFeatures = [...currentFeatures];
                            
                            newFeatures = newFeatures.map(f => 
                              typeof f === 'string' 
                                ? { title: f, description: 'High-quality content delivered by professionals', icon: '✓' } 
                                : f
                            );
                            
                            newFeatures[i] = { ...newFeatures[i], description: e.target.value };
                            updateConfig(section.id, 'features', newFeatures);
                          }}
                          className={`w-full px-2 py-1 border rounded text-xs text-gray-600 focus:ring-1 focus:ring-teal-500 transition-colors ${
                            selectedBlockId === descId ? 'border-teal-500 ring-1 ring-teal-500' : 'border-gray-300'
                          }`}
                          placeholder="Description"
                          rows={2}
                        />
                    </div>
                  );
               })}
            </div>
          </div>
        </div>
      );

    case 'team':
      return (
        <div className="space-y-4">
          {renderTextField('Heading', 'heading', '', false, selectedBlockId === getBlockIdByType('heading'))}
          
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-2">
               <label className="block text-sm font-medium text-gray-700">Team Members</label>
               <button
                 onClick={() => {
                   const newMembers = [...(section.config.members || []), { name: 'New Member', role: 'Role', bio: 'Bio' }];
                   updateConfig(section.id, 'members', newMembers);
                 }}
                 className="text-xs text-teal-600 font-medium hover:underline flex items-center gap-1"
               >
                 <Plus className="size-3" /> Add Member
               </button>
            </div>
            
            <div className="space-y-3">
               {(section.config.members || []).map((member: any, i: number) => {
                 const nameId = `${section.id}-member-${i}-name`;
                 const roleId = `${section.id}-member-${i}-role`;
                 const bioId = `${section.id}-member-${i}-bio`;
                 const isMemberSelected = selectedBlockId === nameId || selectedBlockId === roleId || selectedBlockId === bioId;
                 
                 return (
                   <div key={i} className={`p-3 rounded-lg border relative group transition-all duration-300 ${
                      isMemberSelected ? 'border-teal-500 bg-teal-50/50 ring-1 ring-teal-500' : 'bg-gray-50 border-gray-100'
                   }`}>
                      <div className="flex justify-between mb-2">
                         <span className="text-xs font-semibold text-gray-500 uppercase">Member {i + 1}</span>
                         <button 
                            onClick={() => {
                               const newMembers = section.config.members.filter((_: any, idx: number) => idx !== i);
                               updateConfig(section.id, 'members', newMembers);
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                         >
                            <Trash2 className="size-4" />
                         </button>
                      </div>
                      
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => {
                          const newMembers = [...(section.config.members || [])];
                          newMembers[i] = { ...newMembers[i], name: e.target.value };
                          updateConfig(section.id, 'members', newMembers);
                        }}
                        className={`w-full px-2 py-1 mb-2 border rounded text-sm font-medium transition-colors ${
                          selectedBlockId === nameId ? 'border-teal-500 ring-1 ring-teal-500' : 'border-gray-300'
                        }`}
                        placeholder="Name"
                      />
                      <input
                        type="text"
                        value={member.role}
                        onChange={(e) => {
                          const newMembers = [...(section.config.members || [])];
                          newMembers[i] = { ...newMembers[i], role: e.target.value };
                          updateConfig(section.id, 'members', newMembers);
                        }}
                        className={`w-full px-2 py-1 mb-2 border rounded text-xs text-teal-600 transition-colors ${
                          selectedBlockId === roleId ? 'border-teal-500 ring-1 ring-teal-500' : 'border-gray-300'
                        }`}
                        placeholder="Role"
                      />
                      <textarea
                        value={member.bio}
                        onChange={(e) => {
                          const newMembers = [...(section.config.members || [])];
                          newMembers[i] = { ...newMembers[i], bio: e.target.value };
                          updateConfig(section.id, 'members', newMembers);
                        }}
                        className={`w-full px-2 py-1 border rounded text-xs text-gray-600 transition-colors ${
                          selectedBlockId === bioId ? 'border-teal-500 ring-1 ring-teal-500' : 'border-gray-300'
                        }`}
                        placeholder="Bio"
                        rows={2}
                      />
                   </div>
                 );
               })}
               {(section.config.members || []).length === 0 && (
                  <div className="text-center p-4 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                     No team members added
                  </div>
               )}
            </div>
          </div>
        </div>
      );

    case 'pricing':
      return (
        <div className="space-y-4">
          {renderTextField('Heading', 'heading', '', false, selectedBlockId === getBlockIdByType('heading'))}
          
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-2">
               <label className="block text-sm font-medium text-gray-700">Pricing Plans</label>
               <button
                 onClick={() => {
                   const newPlans = [...(section.config.plans || []), { name: 'New Plan', price: '$0', period: '/mo', features: ['Feature 1'] }];
                   updateConfig(section.id, 'plans', newPlans);
                 }}
                 className="text-xs text-teal-600 font-medium hover:underline flex items-center gap-1"
               >
                 <Plus className="size-3" /> Add Plan
               </button>
            </div>
            
            <div className="space-y-3">
               {(section.config.plans || []).map((plan: any, i: number) => {
                 const nameId = `${section.id}-plan-${i}-name`;
                 const priceId = `${section.id}-plan-${i}-price`;
                 const periodId = `${section.id}-plan-${i}-period`;
                 const featuresPrefix = `${section.id}-plan-${i}-feature-`;
                 
                 const isFeaturesSelected = selectedBlockId && selectedBlockId.startsWith(featuresPrefix);
                 const isPlanSelected = selectedBlockId === nameId || selectedBlockId === priceId || selectedBlockId === periodId || isFeaturesSelected;

                 return (
                   <div key={i} className={`p-3 rounded-lg border relative group transition-all duration-300 ${
                      isPlanSelected 
                        ? 'border-teal-500 bg-teal-50/50 ring-1 ring-teal-500' 
                        : (plan.highlighted ? 'bg-teal-50 border-teal-200' : 'bg-gray-50 border-gray-100')
                   }`}>
                      <div className="flex justify-between items-center mb-2">
                         <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase">Plan {i + 1}</span>
                            <button
                              onClick={() => {
                                 const newPlans = [...(section.config.plans || [])];
                                 newPlans[i] = { ...newPlans[i], highlighted: !newPlans[i].highlighted };
                                 updateConfig(section.id, 'plans', newPlans);
                              }}
                              className={`text-[10px] px-1.5 py-0.5 rounded ${plan.highlighted ? 'bg-teal-200 text-teal-800' : 'bg-gray-200 text-gray-600'}`}
                            >
                               {plan.highlighted ? 'Highlighted' : 'Highlight'}
                            </button>
                         </div>
                         <button 
                            onClick={() => {
                               const newPlans = section.config.plans.filter((_: any, idx: number) => idx !== i);
                               updateConfig(section.id, 'plans', newPlans);
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                         >
                            <Trash2 className="size-4" />
                         </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mb-2">
                          <input
                            type="text"
                            value={plan.name}
                            onChange={(e) => {
                              const newPlans = [...(section.config.plans || [])];
                              newPlans[i] = { ...newPlans[i], name: e.target.value };
                              updateConfig(section.id, 'plans', newPlans);
                            }}
                            className={`col-span-2 px-2 py-1 border rounded text-sm font-medium transition-colors ${
                              selectedBlockId === nameId ? 'border-teal-500 ring-1 ring-teal-500' : 'border-gray-300'
                            }`}
                            placeholder="Plan Name"
                          />
                          <input
                            type="text"
                            value={plan.price}
                            onChange={(e) => {
                              const newPlans = [...(section.config.plans || [])];
                              newPlans[i] = { ...newPlans[i], price: e.target.value };
                              updateConfig(section.id, 'plans', newPlans);
                            }}
                            className={`px-2 py-1 border rounded text-sm transition-colors ${
                              selectedBlockId === priceId ? 'border-teal-500 ring-1 ring-teal-500' : 'border-gray-300'
                            }`}
                            placeholder="Price"
                          />
                          <input
                            type="text"
                            value={plan.period}
                            onChange={(e) => {
                              const newPlans = [...(section.config.plans || [])];
                              newPlans[i] = { ...newPlans[i], period: e.target.value };
                              updateConfig(section.id, 'plans', newPlans);
                            }}
                            className={`px-2 py-1 border rounded text-xs text-gray-500 transition-colors ${
                              selectedBlockId === periodId ? 'border-teal-500 ring-1 ring-teal-500' : 'border-gray-300'
                            }`}
                            placeholder="/month"
                          />
                      </div>
                      
                      <div className="mt-2 pt-2 border-t border-gray-200/50">
                          <label className="text-xs text-gray-500 block mb-1">Features (one per line)</label>
                          <textarea
                            value={(plan.features || []).join('\n')}
                            onChange={(e) => {
                              const newPlans = [...(section.config.plans || [])];
                              newPlans[i] = { ...newPlans[i], features: e.target.value.split('\n') };
                              updateConfig(section.id, 'plans', newPlans);
                            }}
                            className={`w-full px-2 py-1 border rounded text-xs text-gray-600 transition-colors ${
                              isFeaturesSelected ? 'border-teal-500 ring-1 ring-teal-500' : 'border-gray-300'
                            }`}
                            rows={3}
                            placeholder="Feature 1&#10;Feature 2"
                          />
                      </div>
                   </div>
                 );
               })}
            </div>
          </div>
        </div>
      );

    case 'stats':
      return (
        <div className="space-y-4">
          {renderTextField('Heading', 'heading')}
          
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-2">
               <label className="block text-sm font-medium text-gray-700">Statistics</label>
               <button
                 onClick={() => {
                   const newStats = [...(section.config.statistics || []), { number: '100+', label: 'Label' }];
                   updateConfig(section.id, 'statistics', newStats);
                 }}
                 className="text-xs text-teal-600 font-medium hover:underline flex items-center gap-1"
               >
                 <Plus className="size-3" /> Add Stat
               </button>
            </div>
            
            <div className="space-y-2">
               {(section.config.statistics || []).map((stat: any, i: number) => (
                 <div key={i} className="flex gap-2 items-center p-2 bg-gray-50 rounded border border-gray-100 group">
                    <input
                      type="text"
                      value={stat.number}
                      onChange={(e) => {
                        const newStats = [...(section.config.statistics || [])];
                        newStats[i] = { ...newStats[i], number: e.target.value };
                        updateConfig(section.id, 'statistics', newStats);
                      }}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm font-bold text-center"
                      placeholder="100+"
                    />
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => {
                        const newStats = [...(section.config.statistics || [])];
                        newStats[i] = { ...newStats[i], label: e.target.value };
                        updateConfig(section.id, 'statistics', newStats);
                      }}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Label"
                    />
                    <button 
                      onClick={() => {
                         const newStats = section.config.statistics.filter((_: any, idx: number) => idx !== i);
                         updateConfig(section.id, 'statistics', newStats);
                      }}
                      className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="size-4" />
                    </button>
                 </div>
               ))}
            </div>
          </div>
        </div>
      );
      
    case 'faq':
      return (
        <div className="space-y-4">
          {renderTextField('Heading', 'heading')}
          
          <div className="border-t border-gray-200 pt-4">
             <div className="flex justify-between items-center mb-2">
               <label className="block text-sm font-medium text-gray-700">Questions</label>
               <button
                 onClick={() => {
                   const newQuestions = [...(section.config.questions || []), { question: 'Question?', answer: 'Answer.' }];
                   updateConfig(section.id, 'questions', newQuestions);
                 }}
                 className="text-xs text-teal-600 font-medium hover:underline flex items-center gap-1"
               >
                 <Plus className="size-3" /> Add Question
               </button>
            </div>
            
            <div className="space-y-3">
               {(section.config.questions || []).map((q: any, i: number) => (
                 <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-100 relative group">
                    <div className="absolute top-2 right-2">
                       <button 
                          onClick={() => {
                             const newQuestions = section.config.questions.filter((_: any, idx: number) => idx !== i);
                             updateConfig(section.id, 'questions', newQuestions);
                          }}
                          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                       >
                          <Trash2 className="size-4" />
                       </button>
                    </div>
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => {
                        const newQuestions = [...(section.config.questions || [])];
                        newQuestions[i] = { ...newQuestions[i], question: e.target.value };
                        updateConfig(section.id, 'questions', newQuestions);
                      }}
                      className="w-full pr-6 px-2 py-1 mb-2 border border-gray-300 rounded text-sm font-medium"
                      placeholder="Question"
                    />
                    <textarea
                      value={q.answer}
                      onChange={(e) => {
                        const newQuestions = [...(section.config.questions || [])];
                        newQuestions[i] = { ...newQuestions[i], answer: e.target.value };
                        updateConfig(section.id, 'questions', newQuestions);
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-gray-600"
                      placeholder="Answer"
                      rows={2}
                    />
                 </div>
               ))}
            </div>
          </div>
        </div>
      );

    case 'logos':
      return (
        <div className="space-y-4">
          {renderTextField('Heading', 'heading')}
          
          <div className="border-t border-gray-200 pt-4">
             <div className="flex justify-between items-center mb-2">
               <label className="block text-sm font-medium text-gray-700">Logos</label>
               <button
                 onClick={() => {
                   const newLogos = [...(section.config.logos || []), { name: 'Logo' }];
                   updateConfig(section.id, 'logos', newLogos);
                 }}
                 className="text-xs text-teal-600 font-medium hover:underline flex items-center gap-1"
               >
                 <Plus className="size-3" /> Add Logo
               </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
               {(section.config.logos || []).map((logo: any, i: number) => (
                 <div key={i} className="flex gap-2 items-center p-2 bg-gray-50 rounded border border-gray-100 group relative">
                    <input
                      type="text"
                      value={logo.name}
                      onChange={(e) => {
                        const newLogos = [...(section.config.logos || [])];
                        newLogos[i] = { ...newLogos[i], name: e.target.value };
                        updateConfig(section.id, 'logos', newLogos);
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center"
                      placeholder="Company"
                    />
                    <button 
                      onClick={() => {
                         const newLogos = section.config.logos.filter((_: any, idx: number) => idx !== i);
                         updateConfig(section.id, 'logos', newLogos);
                      }}
                      className="absolute -top-1 -right-1 bg-white border border-gray-200 rounded-full p-0.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <Trash2 className="size-3" />
                    </button>
                 </div>
               ))}
            </div>
          </div>
        </div>
      );

    case 'video':
       return (
         <div className="space-y-4">
           {renderTextField('Heading', 'heading')}
           {renderTextField('Description', 'description', '', true)}
           {renderTextField('Video URL (YouTube/Vimeo)', 'videoUrl')}
         </div>
       );
    
    case 'image':
      return (
        <div className="space-y-4">
           {renderTextField('Image URL', 'imageUrl', 'https://...')}
           {renderTextField('Alt Text', 'altText')}
           {renderTextField('Caption', 'caption', '', true)}
           <div className="flex items-center gap-2 mt-2">
             <input
               type="checkbox"
               checked={section.config.fullWidth || false}
               onChange={(e) => updateConfig(section.id, 'fullWidth', e.target.checked)}
               className="rounded text-teal-600 focus:ring-teal-500"
             />
             <label className="text-sm text-gray-700">Full Width</label>
           </div>
        </div>
      );

    case 'rich-text':
      return (
         <div className="space-y-4">
            <p className="text-sm text-gray-500 italic">
               Click directly on the text in the preview to edit content.
            </p>
            {renderTextField('Max Width (e.g., 800px)', 'maxWidth')}
         </div>
      );

    case 'testimonials':
      return (
         <div className="space-y-4">
           {renderTextField('Heading', 'heading')}
           <p className="text-xs text-gray-500 italic">Manage testimonials in the preview area.</p>
         </div>
      );

    case 'cta':
      return (
         <div className="space-y-4">
            {renderTextField('Headline', 'headline')}
            {renderTextField('Subheadline', 'subheadline', '', true)}
            {renderTextField('Button Text', 'ctaText')}
            {renderLinkControl('Button Link', 'ctaLink')}
         </div>
      );
       
    case 'footer':
      return (
        <div className="space-y-4">
          {renderTextField('Company Name', 'companyName')}
          {renderTextField('Description', 'description', '', true)}
          
          <div className="border-t border-gray-200 pt-4 mt-4">
             <div className="flex justify-between items-center mb-2">
               <label className="block text-sm font-medium text-gray-700">Footer Links</label>
               <button
                 onClick={() => {
                   const newLinks = [...(section.config.links || []), { text: 'New Link', url: '#' }];
                   updateConfig(section.id, 'links', newLinks);
                 }}
                 className="text-xs text-teal-600 font-medium hover:underline flex items-center gap-1"
               >
                 <Plus className="size-3" /> Add Link
               </button>
             </div>
             
             <div className="space-y-2">
               {(section.config.links || []).map((link: any, i: number) => (
                 <div key={i} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100 relative group">
                   <div className="absolute top-2 right-2">
                      <button 
                         onClick={() => {
                            const newLinks = section.config.links.filter((_: any, idx: number) => idx !== i);
                            updateConfig(section.id, 'links', newLinks);
                         }}
                         className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                         <Trash2 className="size-4" />
                      </button>
                   </div>
                   
                   <input
                     type="text"
                     value={link.text}
                     onChange={(e) => {
                       const newLinks = [...(section.config.links || [])];
                       newLinks[i] = { ...newLinks[i], text: e.target.value };
                       updateConfig(section.id, 'links', newLinks);
                     }}
                     className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white font-medium"
                     placeholder="Link Text"
                   />
                   
                   {/* Inline Link Picker for Footer Items */}
                   <div className="flex gap-2 items-center">
                     <select
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs bg-white text-gray-700"
                        value={pages.some(p => p.slug === link.url) ? link.url : 'custom'}
                        onChange={(e) => {
                           if (e.target.value !== 'custom') {
                              const newLinks = [...(section.config.links || [])];
                              newLinks[i] = { ...newLinks[i], url: e.target.value };
                              updateConfig(section.id, 'links', newLinks);
                           }
                        }}
                     >
                       <option value="custom">Custom URL...</option>
                       <optgroup label="Internal Pages">
                         {pages.map(p => (
                           <option key={p.id} value={p.slug}>{p.name}</option>
                         ))}
                       </optgroup>
                     </select>
                     {(!pages.some(p => p.slug === link.url) || link.url === '#') && (
                       <input
                         type="text"
                         value={link.url}
                         onChange={(e) => {
                           const newLinks = [...(section.config.links || [])];
                           newLinks[i] = { ...newLinks[i], url: e.target.value };
                           updateConfig(section.id, 'links', newLinks);
                         }}
                         className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                         placeholder="https://..."
                       />
                     )}
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="space-y-4">
          {renderTextField('Heading', 'heading')}
          {renderTextField('Description', 'description', '', true)}
          <p className="text-xs text-gray-500 italic mt-4">More options available in Style tab.</p>
        </div>
      );
  }
}
