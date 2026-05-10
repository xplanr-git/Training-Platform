import { CheckSquare, PlayCircle, Award, MessageCircle, BookOpen, ClipboardList } from 'lucide-react';

export const allActivitiesData = [
  { name: 'Tom Richards', action: 'completed', item: 'Section 5: Advanced Techniques', time: 'Just now', timestamp: Date.now(), icon: CheckSquare, color: 'text-green-600' },
  { name: 'Anna Kim', action: 'started', item: 'Video: Getting Started', time: '2 min ago', timestamp: Date.now() - 2 * 60 * 1000, icon: PlayCircle, color: 'text-blue-600' },
  { name: 'Mark Johnson', action: 'passed', item: 'Quiz: Module 3 Assessment', time: '5 min ago', timestamp: Date.now() - 5 * 60 * 1000, icon: Award, color: 'text-yellow-600' },
  { name: 'Laura White', action: 'posted in', item: 'Discussion: Best Practices', time: '8 min ago', timestamp: Date.now() - 8 * 60 * 1000, icon: MessageCircle, color: 'text-purple-600' },
  { name: 'Kevin Zhang', action: 'completed', item: 'Activity: Hands-on Exercise', time: '12 min ago', timestamp: Date.now() - 12 * 60 * 1000, icon: CheckSquare, color: 'text-green-600' },
  { name: 'Maria Garcia', action: 'started', item: 'Section 3: Core Concepts', time: '18 min ago', timestamp: Date.now() - 18 * 60 * 1000, icon: BookOpen, color: 'text-teal-600' },
  { name: 'Peter Brown', action: 'submitted', item: 'Assignment: Final Project', time: '25 min ago', timestamp: Date.now() - 25 * 60 * 1000, icon: ClipboardList, color: 'text-orange-600' },
  { name: 'Sarah Wilson', action: 'completed', item: 'Video: Introduction', time: '32 min ago', timestamp: Date.now() - 32 * 60 * 1000, icon: PlayCircle, color: 'text-blue-600' },
  { name: 'David Lee', action: 'started', item: 'Section 2: Intermediate Topics', time: '45 min ago', timestamp: Date.now() - 45 * 60 * 1000, icon: BookOpen, color: 'text-teal-600' },
  { name: 'Emma Davis', action: 'passed', item: 'Quiz: Section 1 Review', time: '1 hour ago', timestamp: Date.now() - 60 * 60 * 1000, icon: Award, color: 'text-yellow-600' },
  { name: 'James Martinez', action: 'completed', item: 'Activity: Practice Exercise', time: '1 hour ago', timestamp: Date.now() - 65 * 60 * 1000, icon: CheckSquare, color: 'text-green-600' },
  { name: 'Olivia Taylor', action: 'posted in', item: 'Discussion: Tips & Tricks', time: '2 hours ago', timestamp: Date.now() - 2 * 60 * 60 * 1000, icon: MessageCircle, color: 'text-purple-600' },
  { name: 'Michael Brown', action: 'submitted', item: 'Assignment: Module 2 Project', time: '2 hours ago', timestamp: Date.now() - 130 * 60 * 1000, icon: ClipboardList, color: 'text-orange-600' },
  { name: 'Sophia Anderson', action: 'started', item: 'Video: Advanced Concepts', time: '3 hours ago', timestamp: Date.now() - 3 * 60 * 60 * 1000, icon: PlayCircle, color: 'text-blue-600' },
  { name: 'William Thomas', action: 'completed', item: 'Section 4: Expert Level', time: '3 hours ago', timestamp: Date.now() - 190 * 60 * 1000, icon: CheckSquare, color: 'text-green-600' },
  { name: 'Isabella Moore', action: 'passed', item: 'Quiz: Midterm Exam', time: '5 hours ago', timestamp: Date.now() - 5 * 60 * 60 * 1000, icon: Award, color: 'text-yellow-600' },
  { name: 'Ethan Harris', action: 'started', item: 'Section 1: Basics', time: '6 hours ago', timestamp: Date.now() - 6 * 60 * 60 * 1000, icon: BookOpen, color: 'text-teal-600' },
  { name: 'Mia Clark', action: 'completed', item: 'Activity: Lab Session', time: '8 hours ago', timestamp: Date.now() - 8 * 60 * 60 * 1000, icon: CheckSquare, color: 'text-green-600' },
  { name: 'Benjamin Lewis', action: 'posted in', item: 'Discussion: Q&A Forum', time: '10 hours ago', timestamp: Date.now() - 10 * 60 * 60 * 1000, icon: MessageCircle, color: 'text-purple-600' },
  { name: 'Charlotte Walker', action: 'submitted', item: 'Assignment: Case Study', time: '12 hours ago', timestamp: Date.now() - 12 * 60 * 60 * 1000, icon: ClipboardList, color: 'text-orange-600' },
  { name: 'Lucas Hall', action: 'completed', item: 'Video: Deep Dive', time: '1 day ago', timestamp: Date.now() - 24 * 60 * 60 * 1000, icon: PlayCircle, color: 'text-blue-600' },
  { name: 'Amelia Young', action: 'started', item: 'Section 6: Mastery', time: '1 day ago', timestamp: Date.now() - 26 * 60 * 60 * 1000, icon: BookOpen, color: 'text-teal-600' },
  { name: 'Mason King', action: 'passed', item: 'Quiz: Final Assessment', time: '2 days ago', timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, icon: Award, color: 'text-yellow-600' },
  { name: 'Harper Wright', action: 'completed', item: 'Activity: Capstone Project', time: '2 days ago', timestamp: Date.now() - 50 * 60 * 60 * 1000, icon: CheckSquare, color: 'text-green-600' },
  { name: 'Elijah Scott', action: 'posted in', item: 'Discussion: Success Stories', time: '3 days ago', timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000, icon: MessageCircle, color: 'text-purple-600' },
];

export const completionsData = [
  { name: 'Sarah Mitchell', role: 'Sales Manager', time: '2 hours ago', progress: 100, avatar: 'SM', color: 'bg-blue-600' },
  { name: 'James Wilson', role: 'Developer', time: '5 hours ago', progress: 100, avatar: 'JW', color: 'bg-green-600' },
  { name: 'Emily Chen', role: 'User Manager', time: '8 hours ago', progress: 100, avatar: 'EC', color: 'bg-purple-600' },
  { name: 'Michael Brown', role: 'Sales Manager', time: '1 day ago', progress: 100, avatar: 'MB', color: 'bg-orange-600' },
  { name: 'Lisa Anderson', role: 'Instructor', time: '1 day ago', progress: 100, avatar: 'LA', color: 'bg-pink-600' },
  { name: 'David Lee', role: 'Developer', time: '2 days ago', progress: 100, avatar: 'DL', color: 'bg-teal-600' },
  { name: 'Rachel Martinez', role: 'Sales Manager', time: '3 days ago', progress: 100, avatar: 'RM', color: 'bg-indigo-600' },
  { name: 'Chris Thompson', role: 'User Manager', time: '3 days ago', progress: 100, avatar: 'CT', color: 'bg-red-600' },
  { name: 'Ashley Davis', role: 'Developer', time: '4 days ago', progress: 100, avatar: 'AD', color: 'bg-yellow-600' },
  { name: 'Kevin Park', role: 'Sales Manager', time: '5 days ago', progress: 100, avatar: 'KP', color: 'bg-cyan-600' },
];

export const enrollmentsData = [
  { name: 'Alex Thompson', role: 'Developer', time: '15 min ago', avatar: 'AT', color: 'bg-red-600' },
  { name: 'Jessica Park', role: 'Sales Manager', time: '1 hour ago', avatar: 'JP', color: 'bg-yellow-600' },
  { name: 'Ryan Davis', role: 'User Manager', time: '3 hours ago', avatar: 'RD', color: 'bg-cyan-600' },
  { name: 'Sophie Turner', role: 'Instructor', time: '5 hours ago', avatar: 'ST', color: 'bg-lime-600' },
  { name: 'Chris Martin', role: 'Developer', time: '8 hours ago', avatar: 'CM', color: 'bg-violet-600' },
  { name: 'Nina Patel', role: 'Sales Manager', time: '12 hours ago', avatar: 'NP', color: 'bg-fuchsia-600' },
  { name: 'Marcus Johnson', role: 'User Manager', time: '15 hours ago', avatar: 'MJ', color: 'bg-rose-600' },
  { name: 'Taylor Swift', role: 'Developer', time: '18 hours ago', avatar: 'TS', color: 'bg-amber-600' },
  { name: 'Jordan Lee', role: 'Sales Manager', time: '20 hours ago', avatar: 'JL', color: 'bg-emerald-600' },
  { name: 'Morgan Freeman', role: 'Instructor', time: '22 hours ago', avatar: 'MF', color: 'bg-sky-600' },
];

export const atRiskData = [
  { name: 'John Cooper', role: 'Developer', progress: 34, lastActive: '8 days ago', avatar: 'JC', color: 'bg-gray-600' },
  { name: 'Emma Roberts', role: 'Sales Manager', progress: 22, lastActive: '10 days ago', avatar: 'ER', color: 'bg-gray-600' },
  { name: 'Daniel Lee', role: 'User Manager', progress: 45, lastActive: '12 days ago', avatar: 'DL', color: 'bg-gray-600' },
  { name: 'Olivia Martinez', role: 'Developer', progress: 18, lastActive: '15 days ago', avatar: 'OM', color: 'bg-gray-600' },
  { name: 'William Garcia', role: 'Sales Manager', progress: 28, lastActive: '16 days ago', avatar: 'WG', color: 'bg-gray-600' },
  { name: 'Sophia Rodriguez', role: 'User Manager', progress: 12, lastActive: '20 days ago', avatar: 'SR', color: 'bg-gray-600' },
  { name: 'James Anderson', role: 'Developer', progress: 41, lastActive: '22 days ago', avatar: 'JA', color: 'bg-gray-600' },
  { name: 'Isabella White', role: 'Instructor', progress: 35, lastActive: '25 days ago', avatar: 'IW', color: 'bg-gray-600' },
];

export const quizAttemptsData = [
  { name: 'Mark Johnson', quiz: 'Module 3 Assessment', score: 88, status: 'Passed', time: '5 min ago', avatar: 'MJ', color: 'bg-green-600' },
  { name: 'Anna Kim', quiz: 'Section 2 Quiz', score: 92, status: 'Passed', time: '45 min ago', avatar: 'AK', color: 'bg-green-600' },
  { name: 'Brian Foster', quiz: 'Final Exam', score: 58, status: 'Failed', time: '2 hours ago', avatar: 'BF', color: 'bg-red-600' },
  { name: 'Carol White', quiz: 'Module 1 Quiz', score: 95, status: 'Passed', time: '3 hours ago', avatar: 'CW', color: 'bg-green-600' },
  { name: 'Daniel Kim', quiz: 'Mid-term Assessment', score: 78, status: 'Passed', time: '5 hours ago', avatar: 'DK', color: 'bg-green-600' },
  { name: 'Eva Martinez', quiz: 'Section 4 Quiz', score: 45, status: 'Failed', time: '7 hours ago', avatar: 'EM', color: 'bg-red-600' },
  { name: 'Frank Wilson', quiz: 'Module 2 Assessment', score: 91, status: 'Passed', time: '9 hours ago', avatar: 'FW', color: 'bg-green-600' },
  { name: 'Grace Lee', quiz: 'Final Exam', score: 87, status: 'Passed', time: '12 hours ago', avatar: 'GL', color: 'bg-green-600' },
  { name: 'Henry Brown', quiz: 'Section 1 Quiz', score: 52, status: 'Failed', time: '15 hours ago', avatar: 'HB', color: 'bg-red-600' },
  { name: 'Ivy Chen', quiz: 'Module 5 Assessment', score: 98, status: 'Passed', time: '1 day ago', avatar: 'IC', color: 'bg-green-600' },
];

export const topActivitiesData = [
  { title: 'Introduction to React Hooks', section: 'Section 1: Getting Started', type: 'video', rating: 4.9, completions: 847, views: 982 },
  { title: 'State Management Quiz', section: 'Section 2: Core Concepts', type: 'quiz', rating: 4.8, completions: 723, views: 856 },
  { title: 'Building Your First Component', section: 'Section 1: Getting Started', type: 'video', rating: 4.7, completions: 689, views: 801 },
  { title: 'Final Project Assignment', section: 'Section 5: Advanced Topics', type: 'assignment', rating: 4.9, completions: 567, views: 645 },
  { title: 'Props and State Deep Dive', section: 'Section 2: Core Concepts', type: 'video', rating: 4.6, completions: 534, views: 623 },
  { title: 'Component Lifecycle Discussion', section: 'Section 3: Intermediate', type: 'discussion', rating: 4.8, completions: 498, views: 587 },
  { title: 'React Router Basics', section: 'Section 4: Navigation', type: 'video', rating: 4.7, completions: 456, views: 534 },
  { title: 'Hooks Assessment', section: 'Section 3: Intermediate', type: 'quiz', rating: 4.5, completions: 423, views: 512 },
  { title: 'Context API Tutorial', section: 'Section 4: Navigation', type: 'video', rating: 4.6, completions: 389, views: 478 },
  { title: 'Performance Optimization', section: 'Section 5: Advanced Topics', type: 'assignment', rating: 4.9, completions: 356, views: 423 },
];

export const certificatesData = [
  { name: 'Sarah Mitchell', role: 'Sales Manager', date: 'Feb 8, 2026', score: '98%', avatar: 'SM', color: 'bg-blue-600' },
  { name: 'James Wilson', role: 'Developer', date: 'Feb 8, 2026', score: '95%', avatar: 'JW', color: 'bg-green-600' },
  { name: 'Emily Chen', role: 'User Manager', date: 'Feb 7, 2026', score: '92%', avatar: 'EC', color: 'bg-purple-600' },
  { name: 'Michael Brown', role: 'Sales Manager', date: 'Feb 7, 2026', score: '97%', avatar: 'MB', color: 'bg-orange-600' },
  { name: 'Lisa Anderson', role: 'Instructor', date: 'Feb 7, 2026', score: '100%', avatar: 'LA', color: 'bg-pink-600' },
  { name: 'David Lee', role: 'Developer', date: 'Feb 6, 2026', score: '89%', avatar: 'DL', color: 'bg-teal-600' },
  { name: 'Rachel Martinez', role: 'Sales Manager', date: 'Feb 6, 2026', score: '94%', avatar: 'RM', color: 'bg-indigo-600' },
  { name: 'Alex Thompson', role: 'User Manager', date: 'Feb 5, 2026', score: '91%', avatar: 'AT', color: 'bg-red-600' },
  { name: 'Jessica Park', role: 'Instructor', date: 'Feb 5, 2026', score: '96%', avatar: 'JP', color: 'bg-yellow-600' },
  { name: 'Ryan Davis', role: 'Developer', date: 'Feb 4, 2026', score: '87%', avatar: 'RD', color: 'bg-cyan-600' },
  { name: 'Sophia Lee', role: 'Sales Manager', date: 'Feb 4, 2026', score: '93%', avatar: 'SL', color: 'bg-blue-600' },
  { name: 'Thomas White', role: 'Developer', date: 'Feb 3, 2026', score: '88%', avatar: 'TW', color: 'bg-green-600' },
  { name: 'Olivia Brown', role: 'User Manager', date: 'Feb 3, 2026', score: '90%', avatar: 'OB', color: 'bg-purple-600' },
  { name: 'William Garcia', role: 'Instructor', date: 'Feb 2, 2026', score: '99%', avatar: 'WG', color: 'bg-pink-600' },
  { name: 'Ava Martinez', role: 'Developer', date: 'Feb 2, 2026', score: '86%', avatar: 'AM', color: 'bg-teal-600' },
];

export const topPerformersData = [
  { name: 'Lisa Anderson', role: 'Instructor', score: 100, activities: 28, time: '12.5 hrs', avatar: 'LA', color: 'bg-yellow-500', rank: 1 },
  { name: 'Sarah Mitchell', role: 'Sales Manager', score: 98, activities: 26, time: '11.8 hrs', avatar: 'SM', color: 'bg-gray-400', rank: 2 },
  { name: 'Michael Brown', role: 'Sales Manager', score: 97, activities: 25, time: '10.2 hrs', avatar: 'MB', color: 'bg-orange-600', rank: 3 },
  { name: 'James Wilson', role: 'Developer', score: 95, activities: 24, time: '9.8 hrs', avatar: 'JW', color: 'bg-blue-600', rank: 4 },
  { name: 'Emily Chen', role: 'User Manager', score: 92, activities: 23, time: '9.5 hrs', avatar: 'EC', color: 'bg-purple-600', rank: 5 },
  { name: 'David Lee', role: 'Developer', score: 89, activities: 22, time: '9.2 hrs', avatar: 'DL', color: 'bg-teal-600', rank: 6 },
  { name: 'Rachel Martinez', role: 'Instructor', score: 88, activities: 21, time: '8.8 hrs', avatar: 'RM', color: 'bg-indigo-600', rank: 7 },
  { name: 'Alex Thompson', role: 'Sales Manager', score: 85, activities: 20, time: '8.5 hrs', avatar: 'AT', color: 'bg-red-600', rank: 8 },
  { name: 'Jessica Park', role: 'User Manager', score: 83, activities: 19, time: '8.2 hrs', avatar: 'JP', color: 'bg-yellow-600', rank: 9 },
  { name: 'Ryan Davis', role: 'Developer', score: 81, activities: 18, time: '7.9 hrs', avatar: 'RD', color: 'bg-cyan-600', rank: 10 },
  { name: 'Sophia Lee', role: 'Sales Manager', score: 79, activities: 17, time: '7.6 hrs', avatar: 'SL', color: 'bg-blue-600', rank: 11 },
  { name: 'Thomas White', role: 'Developer', score: 77, activities: 16, time: '7.3 hrs', avatar: 'TW', color: 'bg-green-600', rank: 12 },
  { name: 'Olivia Brown', role: 'User Manager', score: 75, activities: 15, time: '7.0 hrs', avatar: 'OB', color: 'bg-purple-600', rank: 13 },
  { name: 'William Garcia', role: 'Instructor', score: 73, activities: 14, time: '6.7 hrs', avatar: 'WG', color: 'bg-pink-600', rank: 14 },
  { name: 'Ava Martinez', role: 'Developer', score: 71, activities: 13, time: '6.4 hrs', avatar: 'AM', color: 'bg-teal-600', rank: 15 },
];

export const quizResultsData = [
  { name: 'Sarah Mitchell', role: 'Sales Manager', quiz: 'Section 1 - Safety Basics Quiz', score: '95%', attempts: 1, date: 'Feb 8, 2026', time: '8 mins', avatar: 'SM', color: 'bg-blue-600', status: 'Passed' },
  { name: 'Michael Brown', role: 'Sales Manager', quiz: 'Section 2 - Equipment Training Quiz', score: '88%', attempts: 1, date: 'Feb 8, 2026', time: '12 mins', avatar: 'MB', color: 'bg-orange-600', status: 'Passed' },
  { name: 'Lisa Anderson', role: 'Instructor', quiz: 'Section 1 - Safety Basics Quiz', score: '100%', attempts: 1, date: 'Feb 7, 2026', time: '6 mins', avatar: 'LA', color: 'bg-yellow-500', status: 'Passed' },
  { name: 'James Wilson', role: 'Developer', quiz: 'Section 3 - Advanced Procedures Quiz', score: '92%', attempts: 2, date: 'Feb 7, 2026', time: '15 mins', avatar: 'JW', color: 'bg-blue-600', status: 'Passed' },
  { name: 'Emily Chen', role: 'User Manager', quiz: 'Section 1 - Safety Basics Quiz', score: '85%', attempts: 1, date: 'Feb 7, 2026', time: '9 mins', avatar: 'EC', color: 'bg-purple-600', status: 'Passed' },
  { name: 'David Lee', role: 'Developer', quiz: 'Section 2 - Equipment Training Quiz', score: '78%', attempts: 2, date: 'Feb 6, 2026', time: '14 mins', avatar: 'DL', color: 'bg-teal-600', status: 'Passed' },
  { name: 'Rachel Martinez', role: 'Instructor', quiz: 'Final Assessment Quiz', score: '96%', attempts: 1, date: 'Feb 6, 2026', time: '18 mins', avatar: 'RM', color: 'bg-indigo-600', status: 'Passed' },
  { name: 'Alex Thompson', role: 'Sales Manager', quiz: 'Section 1 - Safety Basics Quiz', score: '82%', attempts: 1, date: 'Feb 6, 2026', time: '10 mins', avatar: 'AT', color: 'bg-red-600', status: 'Passed' },
  { name: 'Jessica Park', role: 'User Manager', quiz: 'Section 3 - Advanced Procedures Quiz', score: '89%', attempts: 1, date: 'Feb 5, 2026', time: '13 mins', avatar: 'JP', color: 'bg-yellow-600', status: 'Passed' },
  { name: 'Ryan Davis', role: 'Developer', quiz: 'Section 2 - Equipment Training Quiz', score: '91%', attempts: 1, date: 'Feb 5, 2026', time: '11 mins', avatar: 'RD', color: 'bg-cyan-600', status: 'Passed' },
  { name: 'Sophia Lee', role: 'Sales Manager', quiz: 'Final Assessment Quiz', score: '87%', attempts: 2, date: 'Feb 5, 2026', time: '20 mins', avatar: 'SL', color: 'bg-blue-600', status: 'Passed' },
  { name: 'Thomas White', role: 'Developer', quiz: 'Section 1 - Safety Basics Quiz', score: '65%', attempts: 3, date: 'Feb 4, 2026', time: '16 mins', avatar: 'TW', color: 'bg-green-600', status: 'Failed' },
  { name: 'Olivia Brown', role: 'User Manager', quiz: 'Section 3 - Advanced Procedures Quiz', score: '94%', attempts: 1, date: 'Feb 4, 2026', time: '14 mins', avatar: 'OB', color: 'bg-purple-600', status: 'Passed' },
  { name: 'William Garcia', role: 'Instructor', quiz: 'Section 2 - Equipment Training Quiz', score: '99%', attempts: 1, date: 'Feb 4, 2026', time: '10 mins', avatar: 'WG', color: 'bg-pink-600', status: 'Passed' },
  { name: 'Ava Martinez', role: 'Developer', quiz: 'Final Assessment Quiz', score: '83%', attempts: 1, date: 'Feb 3, 2026', time: '17 mins', avatar: 'AM', color: 'bg-teal-600', status: 'Passed' },
  { name: 'John Smith', role: 'Sales Manager', quiz: 'Section 1 - Safety Basics Quiz', score: '58%', attempts: 2, date: 'Feb 3, 2026', time: '12 mins', avatar: 'JS', color: 'bg-indigo-600', status: 'Failed' },
  { name: 'Emma Johnson', role: 'Developer', quiz: 'Section 3 - Advanced Procedures Quiz', score: '90%', attempts: 1, date: 'Feb 3, 2026', time: '13 mins', avatar: 'EJ', color: 'bg-rose-600', status: 'Passed' },
  { name: 'Daniel Martinez', role: 'Instructor', quiz: 'Section 2 - Equipment Training Quiz', score: '86%', attempts: 1, date: 'Feb 2, 2026', time: '11 mins', avatar: 'DM', color: 'bg-emerald-600', status: 'Passed' },
  { name: 'Grace Wilson', role: 'User Manager', quiz: 'Final Assessment Quiz', score: '92%', attempts: 1, date: 'Feb 2, 2026', time: '19 mins', avatar: 'GW', color: 'bg-violet-600', status: 'Passed' },
  { name: 'Henry Chen', role: 'Developer', quiz: 'Section 1 - Safety Basics Quiz', score: '97%', attempts: 1, date: 'Feb 2, 2026', time: '7 mins', avatar: 'HC', color: 'bg-amber-600', status: 'Passed' },
];

export const getQuizDetails = (result: any) => {
  const quizzes: any = {
    'Section 1 - Safety Basics Quiz': {
      totalQuestions: 20,
      passingScore: 70,
      questions: [
        { question: 'What is the minimum safe distance from moving equipment?', userAnswer: 'At least 10 feet', correctAnswer: 'At least 10 feet', isCorrect: true, timeSpent: '25s' },
        { question: 'Which PPE must be worn at all times in the warehouse?', userAnswer: 'Safety vest and hard hat', correctAnswer: 'Safety vest and hard hat', isCorrect: true, timeSpent: '18s' },
        { question: 'What should you do if you notice a safety hazard?', userAnswer: 'Report immediately to supervisor', correctAnswer: 'Report immediately to supervisor', isCorrect: true, timeSpent: '22s' },
        { question: 'How often should fire extinguishers be inspected?', userAnswer: 'Monthly', correctAnswer: 'Monthly', isCorrect: true, timeSpent: '15s' },
        { question: 'What is the proper lifting technique?', userAnswer: 'Bend at knees, keep back straight', correctAnswer: 'Bend at knees, keep back straight', isCorrect: true, timeSpent: '20s' },
        { question: 'Where are emergency exits located?', userAnswer: 'North and South ends', correctAnswer: 'All four corners', isCorrect: result.status === 'Failed', timeSpent: '30s' },
        { question: 'What is the maximum weight for manual lifting?', userAnswer: '50 lbs', correctAnswer: '50 lbs', isCorrect: true, timeSpent: '12s' },
        { question: 'Who should you contact in an emergency?', userAnswer: 'Security at ext. 911', correctAnswer: 'Security at ext. 911', isCorrect: true, timeSpent: '10s' },
        { question: 'What does a yellow safety line indicate?', userAnswer: 'Caution zone', correctAnswer: 'Caution zone', isCorrect: true, timeSpent: '14s' },
        { question: 'When must safety goggles be worn?', userAnswer: 'When operating machinery', correctAnswer: 'When operating machinery', isCorrect: true, timeSpent: '16s' },
      ]
    },
    'Section 2 - Equipment Training Quiz': {
      totalQuestions: 15,
      passingScore: 75,
      questions: [
        { question: 'What is the first step before operating a forklift?', userAnswer: 'Complete pre-operation inspection', correctAnswer: 'Complete pre-operation inspection', isCorrect: true, timeSpent: '28s' },
        { question: 'What is the maximum load capacity?', userAnswer: '5000 lbs', correctAnswer: '5000 lbs', isCorrect: true, timeSpent: '20s' },
        { question: 'How should you approach an intersection?', userAnswer: 'Slow down and sound horn', correctAnswer: 'Slow down and sound horn', isCorrect: true, timeSpent: '22s' },
        { question: 'What should you check on the tires daily?', userAnswer: 'Pressure and wear', correctAnswer: 'Pressure and wear', isCorrect: true, timeSpent: '18s' },
        { question: 'When is it safe to raise a load?', userAnswer: 'When forks are level', correctAnswer: 'When area is clear and forks are level', isCorrect: result.status === 'Failed', timeSpent: '25s' },
        { question: 'What is the proper speed in the warehouse?', userAnswer: '5 mph', correctAnswer: '5 mph', isCorrect: true, timeSpent: '12s' },
        { question: 'How often should equipment be serviced?', userAnswer: 'Every 200 hours', correctAnswer: 'Every 200 hours', isCorrect: true, timeSpent: '15s' },
        { question: 'What does a red tag on equipment mean?', userAnswer: 'Out of service', correctAnswer: 'Out of service', isCorrect: true, timeSpent: '10s' },
      ]
    },
    'Section 3 - Advanced Procedures Quiz': {
      totalQuestions: 18,
      passingScore: 80,
      questions: [
        { question: 'What is the protocol for handling hazardous materials?', userAnswer: 'Follow MSDS guidelines', correctAnswer: 'Follow MSDS guidelines', isCorrect: true, timeSpent: '35s' },
        { question: 'How should spills be contained?', userAnswer: 'Use spill kit and barrier', correctAnswer: 'Use spill kit and barrier', isCorrect: true, timeSpent: '28s' },
        { question: 'What PPE is required for chemical handling?', userAnswer: 'Gloves, goggles, and apron', correctAnswer: 'Gloves, goggles, and apron', isCorrect: true, timeSpent: '22s' },
        { question: 'When should you use lockout/tagout procedures?', userAnswer: 'During equipment maintenance', correctAnswer: 'During equipment maintenance', isCorrect: true, timeSpent: '30s' },
        { question: 'What is the first step in emergency evacuation?', userAnswer: 'Alert nearby personnel', correctAnswer: 'Alert nearby personnel', isCorrect: true, timeSpent: '18s' },
        { question: 'How are controlled substances stored?', userAnswer: 'In locked cabinet', correctAnswer: 'In locked, ventilated cabinet', isCorrect: result.status === 'Failed', timeSpent: '25s' },
        { question: 'What is the maximum stack height?', userAnswer: '15 feet', correctAnswer: '15 feet', isCorrect: true, timeSpent: '15s' },
        { question: 'Who can authorize confined space entry?', userAnswer: 'Safety supervisor', correctAnswer: 'Safety supervisor', isCorrect: true, timeSpent: '20s' },
      ]
    },
    'Final Assessment Quiz': {
      totalQuestions: 25,
      passingScore: 80,
      questions: [
        { question: 'Describe the complete safety protocol for starting a shift', userAnswer: 'PPE check, area inspection, equipment check', correctAnswer: 'PPE check, area inspection, equipment check', isCorrect: true, timeSpent: '45s' },
        { question: 'What are the three types of fire extinguishers?', userAnswer: 'A, B, and C', correctAnswer: 'A, B, and C', isCorrect: true, timeSpent: '30s' },
        { question: 'Explain the buddy system for hazardous tasks', userAnswer: 'Two people minimum, maintain visual contact', correctAnswer: 'Two people minimum, maintain visual contact', isCorrect: true, timeSpent: '40s' },
        { question: 'What is the incident reporting timeline?', userAnswer: 'Within 24 hours', correctAnswer: 'Immediately, within 1 hour', isCorrect: result.status === 'Failed', timeSpent: '35s' },
        { question: 'List the emergency assembly points', userAnswer: 'Main parking lot', correctAnswer: 'Main and auxiliary parking lots', isCorrect: result.status === 'Failed', timeSpent: '28s' },
        { question: 'What certifications are required annually?', userAnswer: 'Forklift, safety, first aid', correctAnswer: 'Forklift, safety, first aid', isCorrect: true, timeSpent: '32s' },
        { question: 'Describe proper ergonomic workstation setup', userAnswer: 'Monitor eye level, chair adjusted', correctAnswer: 'Monitor eye level, chair adjusted', isCorrect: true, timeSpent: '38s' },
        { question: 'What is the near-miss reporting procedure?', userAnswer: 'Complete form and submit to safety', correctAnswer: 'Complete form and submit to safety', isCorrect: true, timeSpent: '25s' },
        { question: 'When can you override safety interlocks?', userAnswer: 'Never', correctAnswer: 'Never', isCorrect: true, timeSpent: '15s' },
        { question: 'What are the signs of heat exhaustion?', userAnswer: 'Dizziness, nausea, sweating', correctAnswer: 'Dizziness, nausea, sweating', isCorrect: true, timeSpent: '30s' },
      ]
    }
  };

  return quizzes[result.quiz] || quizzes['Section 1 - Safety Basics Quiz'];
};