import { User, LogOut, MessagesSquare, GraduationCap, ChevronDown } from 'lucide-react';
import { User as UserType } from '@/app/types';
import { useState } from 'react';
import logoImage from 'figma:asset/4d915a981a9217f9ee2238527a51376f1592134f.png';

interface HeaderProps {
  currentUser: UserType | null;
  onNavigate: (page: 'home' | 'dashboard' | 'login' | 'signup') => void;
  onLogout: () => void;
}

export function Header({ currentUser, onNavigate, onLogout }: HeaderProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <button 
                onClick={() => onNavigate('home')}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity -ml-2"
              >
                <div className="relative">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg"></div>
                  <div className="absolute -top-1.5 left-0">
                    <GraduationCap className="size-4 text-black -rotate-12" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-semibold text-gray-900">Teachly</span>
                  <span className="text-xs text-gray-500">Empower Your Team to Excel</span>
                </div>
              </button>

              {/* Navigation Menu */}
              <nav className="hidden md:flex items-center gap-1">
                {/* Features Dropdown */}
                <div className="relative">
                  <button
                    onMouseEnter={() => setOpenDropdown('features')}
                    onMouseLeave={() => setOpenDropdown(null)}
                    className="flex items-center gap-1 px-3 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                  >
                    Features
                    <ChevronDown className="size-4" />
                  </button>
                  {openDropdown === 'features' && (
                    <div 
                      onMouseEnter={() => setOpenDropdown('features')}
                      onMouseLeave={() => setOpenDropdown(null)}
                      className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2"
                    >
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Course Management</a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Employee Tracking</a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Progress Analytics</a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Custom Branding</a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Certificate Generation</a>
                    </div>
                  )}
                </div>

                {/* Solutions Dropdown */}
                <div className="relative">
                  <button
                    onMouseEnter={() => setOpenDropdown('solutions')}
                    onMouseLeave={() => setOpenDropdown(null)}
                    className="flex items-center gap-1 px-3 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                  >
                    Solutions
                    <ChevronDown className="size-4" />
                  </button>
                  {openDropdown === 'solutions' && (
                    <div 
                      onMouseEnter={() => setOpenDropdown('solutions')}
                      onMouseLeave={() => setOpenDropdown(null)}
                      className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2"
                    >
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">For Small Business</a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">For Enterprises</a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">For Training Teams</a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">For HR Departments</a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">For Onboarding</a>
                    </div>
                  )}
                </div>

                {/* Pricing Dropdown */}
                <div className="relative">
                  <button
                    onMouseEnter={() => setOpenDropdown('pricing')}
                    onMouseLeave={() => setOpenDropdown(null)}
                    className="flex items-center gap-1 px-3 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                  >
                    Pricing
                    <ChevronDown className="size-4" />
                  </button>
                  {openDropdown === 'pricing' && (
                    <div 
                      onMouseEnter={() => setOpenDropdown('pricing')}
                      onMouseLeave={() => setOpenDropdown(null)}
                      className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2"
                    >
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Starter Plan</a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Professional Plan</a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Enterprise Plan</a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Compare Plans</a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Request Demo</a>
                    </div>
                  )}
                </div>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {currentUser ? (
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => onNavigate('dashboard')}
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                  >
                    <User className="size-5" />
                    <span className="hidden sm:inline">{currentUser.name}</span>
                  </button>
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
                  >
                    <LogOut className="size-5" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onNavigate('login')}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors font-medium"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => onNavigate('signup')}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Floating Chat Button */}
      <button
        className="fixed bottom-6 right-6 z-50 p-4 bg-white text-black rounded-full shadow-lg hover:bg-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-110"
        title="Chat Support"
      >
        <MessagesSquare className="size-6" />
      </button>
    </>
  );
}