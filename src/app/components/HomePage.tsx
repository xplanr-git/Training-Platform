import { Search, TrendingUp, Award, Users, BookOpen, Video, FileText, Target, CheckCircle, ArrowRight, Play, Zap, Shield, BarChart, Cpu, Lightbulb, Globe, Layers, Database, Cloud, Briefcase, HeartPulse, Code, UserCog, Activity, Headphones } from 'lucide-react';
import { Course } from '@/app/types';
import { CourseCard } from '@/app/components/CourseCard';
import { useState, useEffect } from 'react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface HomePageProps {
  courses: Course[];
  onCourseClick: (courseId: string) => void;
  enrolledCourseIds: string[];
  isLoggedIn?: boolean;
  onSignUpClick?: () => void;
}

export function HomePage({ courses, onCourseClick, enrolledCourseIds, isLoggedIn, onSignUpClick }: HomePageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedTrainingCategories, setSelectedTrainingCategories] = useState<string[]>([]);
  const [selectedBuildTab, setSelectedBuildTab] = useState<string>('Templates');

  // Toggle training category selection
  const toggleTrainingCategory = (category: string) => {
    setSelectedTrainingCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Hero section carousel images
  const heroImages = [
    "https://images.unsplash.com/photo-1758691736067-b309ee3ef7b9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBvZmZpY2UlMjBwcmVzZW50YXRpb258ZW58MXx8fHwxNzY5NzI4NjM4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1768796370577-c6e8b708b980?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHRlYW0lMjB0cmFpbmluZyUyMHdvcmtzaG9wfGVufDF8fHx8MTc2OTY3MjAwOXww&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1758691736433-4078b93abd72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3Jwb3JhdGUlMjBsZWFybmluZyUyMHNlc3Npb258ZW58MXx8fHwxNzY5NzI4NjM5fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1590649681928-4b179f773bd5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1lZXRpbmclMjBjb2xsYWJvcmF0aW9ufGVufDF8fHx8MTc2OTY5NTg1OHww&ixlib=rb-4.1.0&q=80&w=1080"
  ];

  // Auto-rotate images every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [heroImages.length]);

  const categories = ['All', ...Array.from(new Set(courses.map(c => c.category)))];
  
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredCourses = courses.filter(c => c.featured);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-black text-white overflow-hidden min-h-screen flex items-center">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="font-bold leading-tight text-center w-full text-[50px]">
              Transform Your Workforce
            </h1>
            
            <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
              Empower your team with expert training. Build skills that drive results.
            </p>
            
            {/* Training Categories */}
            <div className="pt-4">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span 
                  onClick={() => toggleTrainingCategory('Corporate Training')}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm text-white hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <div className={`size-4 border-2 border-white rounded transition-colors ${selectedTrainingCategories.includes('Corporate Training') ? 'bg-white' : 'bg-transparent'}`} />
                  <Briefcase className="size-4" />
                  Corporate Training
                </span>
                <span 
                  onClick={() => toggleTrainingCategory('Healthcare & Safety')}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm text-white hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <div className={`size-4 border-2 border-white rounded transition-colors ${selectedTrainingCategories.includes('Healthcare & Safety') ? 'bg-white' : 'bg-transparent'}`} />
                  <HeartPulse className="size-4" />
                  Healthcare & Safety
                </span>
                <span 
                  onClick={() => toggleTrainingCategory('Technical Skills')}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm text-white hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <div className={`size-4 border-2 border-white rounded transition-colors ${selectedTrainingCategories.includes('Technical Skills') ? 'bg-white' : 'bg-transparent'}`} />
                  <Code className="size-4" />
                  Technical Skills
                </span>
                <span 
                  onClick={() => toggleTrainingCategory('Sales & Marketing')}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm text-white hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <div className={`size-4 border-2 border-white rounded transition-colors ${selectedTrainingCategories.includes('Sales & Marketing') ? 'bg-white' : 'bg-transparent'}`} />
                  <TrendingUp className="size-4" />
                  Sales & Marketing
                </span>
                <span 
                  onClick={() => toggleTrainingCategory('Leadership')}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm text-white hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <div className={`size-4 border-2 border-white rounded transition-colors ${selectedTrainingCategories.includes('Leadership') ? 'bg-white' : 'bg-transparent'}`} />
                  <UserCog className="size-4" />
                  Leadership
                </span>
                <span 
                  onClick={() => toggleTrainingCategory('Compliance')}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm text-white hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <div className={`size-4 border-2 border-white rounded transition-colors ${selectedTrainingCategories.includes('Compliance') ? 'bg-white' : 'bg-transparent'}`} />
                  <Shield className="size-4" />
                  Compliance
                </span>
                <span 
                  onClick={() => toggleTrainingCategory('Fitness & Wellness')}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm text-white hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <div className={`size-4 border-2 border-white rounded transition-colors ${selectedTrainingCategories.includes('Fitness & Wellness') ? 'bg-white' : 'bg-transparent'}`} />
                  <Activity className="size-4" />
                  Fitness & Wellness
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button className="px-8 py-4 bg-white text-black rounded font-semibold hover:bg-gray-100 transition-colors">
                Get Started Free
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold text-black mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-gray-600">
              A comprehensive platform built for modern businesses
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div className="text-center space-y-3">
              <Video className="size-8 text-black mx-auto" />
              <h3 className="font-semibold text-black">Video Lessons</h3>
              <p className="text-gray-600 text-sm">
                High-quality content from industry experts
              </p>
            </div>

            <div className="text-center space-y-3">
              <FileText className="size-8 text-black mx-auto" />
              <h3 className="font-semibold text-black">Course Materials</h3>
              <p className="text-gray-600 text-sm">
                Downloadable resources and guides
              </p>
            </div>

            <div className="text-center space-y-3">
              <Target className="size-8 text-black mx-auto" />
              <h3 className="font-semibold text-black">Progress Tracking</h3>
              <p className="text-gray-600 text-sm">
                Monitor team progress with analytics
              </p>
            </div>

            <div className="text-center space-y-3">
              <Award className="size-8 text-black mx-auto" />
              <h3 className="font-semibold text-black">Certifications</h3>
              <p className="text-gray-600 text-sm">
                Recognized certificates for achievements
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold text-black mb-4">
              Why Choose Teachly
            </h2>
            <p className="text-lg text-gray-600">
              Delivering exceptional learning experiences that drive real business outcomes
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
              <h4 className="font-semibold text-black">Expert-Led Curriculum</h4>
              <p className="text-gray-600 text-sm">Courses designed by industry leaders with proven track records</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-black">Flexible Learning</h4>
              <p className="text-gray-600 text-sm">Self-paced courses that fit into busy schedules</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-black">Actionable Insights</h4>
              <p className="text-gray-600 text-sm">Real-time analytics to measure ROI</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-black">24/7 Support</h4>
              <p className="text-gray-600 text-sm">Dedicated customer service team</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            {/* Testimonial 1 */}
            <div className="space-y-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="size-4 text-black fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed">
                "Teachly transformed our onboarding process. New hires are now productive 40% faster than before."
              </p>
              <div>
                <div className="font-semibold text-black">Sarah Johnson</div>
                <div className="text-sm text-gray-500">VP of HR, TechCorp</div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="space-y-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="size-4 text-black fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed">
                "The best investment we've made in our team. Training completion rates increased from 60% to 94%."
              </p>
              <div>
                <div className="font-semibold text-black">Michael Chen</div>
                <div className="text-sm text-gray-500">Learning Director, GlobalRetail</div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="space-y-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="size-4 text-black fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed">
                "Easy to use, powerful features, and excellent support. Our employees actually enjoy training now!"
              </p>
              <div>
                <div className="font-semibold text-black">Emily Parker</div>
                <div className="text-sm text-gray-500">CEO, InnovateLabs</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Explore Section */}
      <section className="bg-black text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-3">Explore Courses</h2>
            <p className="text-gray-400">Find the perfect course to advance your career</p>
          </div>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
            />
          </div>
        </div>
      </section>

      {/* Build Everything Section */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Build everything for your team</h2>
            <p className="text-lg text-gray-600">From onboarding to advanced skills, create comprehensive training programs tailored to your needs.</p>
          </div>
          
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-3 mb-16">
            <button 
              onClick={() => setSelectedBuildTab('Templates')}
              className={`px-5 py-3 rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors relative ${
                selectedBuildTab === 'Templates' ? 'bg-black text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              Templates
              {selectedBuildTab === 'Templates' && (
                <span className="absolute -top-2 -right-2 bg-teal-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                  Coming Soon
                </span>
              )}
            </button>
            <button 
              onClick={() => setSelectedBuildTab('Course Builder')}
              className={`px-5 py-3 rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors relative ${
                selectedBuildTab === 'Course Builder' ? 'bg-black text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              Course Builder
              {selectedBuildTab === 'Course Builder' && (
                <span className="absolute -top-2 -right-2 bg-teal-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                  Coming Soon
                </span>
              )}
            </button>
            <button 
              onClick={() => setSelectedBuildTab('Learning Paths')}
              className={`px-5 py-3 rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors relative ${
                selectedBuildTab === 'Learning Paths' ? 'bg-black text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              Learning Paths
              {selectedBuildTab === 'Learning Paths' && (
                <span className="absolute -top-2 -right-2 bg-teal-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                  Coming Soon
                </span>
              )}
            </button>
            <button 
              onClick={() => setSelectedBuildTab('Team Management')}
              className={`px-5 py-3 rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors relative ${
                selectedBuildTab === 'Team Management' ? 'bg-black text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              Team Management
              {selectedBuildTab === 'Team Management' && (
                <span className="absolute -top-2 -right-2 bg-teal-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                  Coming Soon
                </span>
              )}
            </button>
            <button 
              onClick={() => setSelectedBuildTab('Custom Content')}
              className={`px-5 py-3 rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors relative ${
                selectedBuildTab === 'Custom Content' ? 'bg-black text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              Custom Content
              {selectedBuildTab === 'Custom Content' && (
                <span className="absolute -top-2 -right-2 bg-teal-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                  Coming Soon
                </span>
              )}
            </button>
          </div>

          {/* Content Grid */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Visual representation */}
            <div className="relative">
              <div className="grid grid-cols-3 gap-4">
                {/* Template cards preview */}
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 h-32">
                    <div className="w-full h-2 bg-gray-900 rounded mb-3"></div>
                    <div className="space-y-2">
                      <div className="h-1.5 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-1.5 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 h-32">
                    <div className="w-full h-2 bg-teal-600 rounded mb-3"></div>
                    <div className="space-y-2">
                      <div className="h-1.5 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-1.5 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 h-32">
                    <div className="w-full h-2 bg-blue-600 rounded mb-3"></div>
                    <div className="space-y-2">
                      <div className="h-1.5 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-1.5 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 h-32">
                    <div className="w-full h-2 bg-purple-600 rounded mb-3"></div>
                    <div className="space-y-2">
                      <div className="h-1.5 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-1.5 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 h-32">
                    <div className="w-full h-2 bg-orange-600 rounded mb-3"></div>
                    <div className="space-y-2">
                      <div className="h-1.5 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-1.5 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 h-32">
                    <div className="w-full h-2 bg-green-600 rounded mb-3"></div>
                    <div className="space-y-2">
                      <div className="h-1.5 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-1.5 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Text and CTA */}
            <div className="space-y-6">
              <h3 className="text-4xl font-bold text-gray-900">50+ customizable course templates</h3>
              <p className="text-lg text-gray-600">Pre-built training modules across all industries. Simply customize and deploy to your team.</p>
              
              {/* Search Bar */}
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Companies Partnership Section */}
      <section className="bg-white py-20 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Trusted by Leading Organizations
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-12 flex-wrap">
            <div className="flex items-center gap-3 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all">
              <div className="bg-gray-900 text-white size-10 rounded flex items-center justify-center">
                <Cpu className="size-5" />
              </div>
              <span className="text-gray-600 font-semibold">TechCorp</span>
            </div>
            <div className="flex items-center gap-3 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white size-10 rounded flex items-center justify-center">
                <Lightbulb className="size-5" />
              </div>
              <span className="text-gray-600 font-semibold">InnovateLab</span>
            </div>
            <div className="flex items-center gap-3 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all">
              <div className="bg-teal-600 text-white size-10 rounded flex items-center justify-center">
                <Globe className="size-5" />
              </div>
              <span className="text-gray-600 font-semibold">GlobalTech</span>
            </div>
            <div className="flex items-center gap-3 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all">
              <div className="bg-orange-600 text-white size-10 rounded flex items-center justify-center">
                <Layers className="size-5" />
              </div>
              <span className="text-gray-600 font-semibold">FutureSoft</span>
            </div>
            <div className="flex items-center gap-3 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all">
              <div className="bg-indigo-600 text-white size-10 rounded flex items-center justify-center">
                <Database className="size-5" />
              </div>
              <span className="text-gray-600 font-semibold">DataVision</span>
            </div>
            <div className="flex items-center gap-3 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all">
              <div className="bg-cyan-600 text-white size-10 rounded flex items-center justify-center">
                <Cloud className="size-5" />
              </div>
              <span className="text-gray-600 font-semibold">CloudStream</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      {isLoggedIn && featuredCourses.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Courses</h2>
              <p className="text-gray-600">Hand-picked courses recommended by our experts</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-blue-600 font-medium cursor-pointer hover:gap-3 transition-all">
              View All <ArrowRight className="size-5" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onClick={() => onCourseClick(course.id)}
                enrolled={enrolledCourseIds.includes(course.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Courses or Marketing CTA */}
      {isLoggedIn ? (
        <section id="all-courses" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gray-50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">All Courses</h2>
              <p className="text-gray-600">Browse our complete catalog of professional training programs</p>
            </div>
            
            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-black text-white shadow-lg'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:shadow-sm'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onClick={() => onCourseClick(course.id)}
                  enrolled={enrolledCourseIds.includes(course.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <BookOpen className="size-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No courses found matching your search.</p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="mt-4 text-blue-600 font-medium hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>
      ) : (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Icon Grid */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl shadow-lg">
                <Users className="size-8 text-blue-600" />
              </div>
              <div className="bg-white p-4 rounded-xl shadow-lg">
                <BookOpen className="size-8 text-purple-600" />
              </div>
              <div className="bg-white p-4 rounded-xl shadow-lg">
                <Award className="size-8 text-orange-600" />
              </div>
              <div className="bg-white p-4 rounded-xl shadow-lg">
                <BarChart className="size-8 text-green-600" />
              </div>
            </div>

            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Ready to Unlock Your Team's Full Potential?
            </h2>
            
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Get access to our complete library of professional training courses designed specifically 
              for businesses. Sign up today and start transforming your workforce with expert-led content.
            </p>

            {/* Benefits List */}
            <div className="grid md:grid-cols-3 gap-6 mt-12 mb-12">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <Shield className="size-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Free to Get Started</h3>
                <p className="text-sm text-gray-600">No credit card required. Start exploring immediately.</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <Users className="size-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Team Management</h3>
                <p className="text-sm text-gray-600">Easily manage and track your entire team's progress.</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <TrendingUp className="size-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Real-Time Analytics</h3>
                <p className="text-sm text-gray-600">Track engagement and measure learning outcomes.</p>
              </div>
            </div>

            <button 
              onClick={onSignUpClick}
              className="inline-flex items-center justify-center gap-2 bg-black text-white px-10 py-5 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
            >
              Sign Up Free - Access All Courses
              <ArrowRight className="size-6" />
            </button>

            <p className="text-sm text-gray-500 mt-4">
              Join 1,200+ companies already using Teachly to train their teams
            </p>
          </div>
        </section>
      )}

      {/* Pricing Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Choose the Perfect Plan for Your Team
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Flexible subscription options designed to scale with your business
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border-2 border-gray-200 hover:shadow-lg transition-shadow">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-bold text-gray-900">Free</span>
                </div>
                <p className="text-gray-600">Perfect for small teams getting started</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Up to 10 users</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Access to 50+ courses</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Basic progress tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Email support</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Course certificates</span>
                </li>
              </ul>

              <button 
                onClick={onSignUpClick}
                className="w-full py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Get Started Free
              </button>
            </div>

            {/* Professional Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-blue-600 hover:shadow-xl transition-shadow relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Professional</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-bold text-gray-900">$49</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-gray-600">For growing teams and businesses</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Up to 50 users</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Access to all 500+ courses</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Advanced analytics & reporting</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Priority support</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Custom branding</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Learning paths & assignments</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">API access</span>
                </li>
              </ul>

              <button className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Start 14-Day Trial
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border-2 border-gray-200 hover:shadow-lg transition-shadow">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-bold text-gray-900">Custom</span>
                </div>
                <p className="text-gray-600">For large organizations with advanced needs</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Unlimited users</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">All courses + custom content</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Dedicated account manager</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">24/7 premium support</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">SSO & advanced security</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Custom integrations</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Onboarding & training</span>
                </li>
              </ul>

              <button className="w-full py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors">
                Contact Sales
              </button>
            </div>
          </div>

          {/* FAQ or Trust Section */}
          <div className="mt-16 text-center">
            <p className="text-gray-600 mb-4">All plans include a 30-day money-back guarantee</p>
            <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="size-4" />
                <span>Secure payments</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="size-4" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="size-4" />
                <span>1,200+ companies trust us</span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}