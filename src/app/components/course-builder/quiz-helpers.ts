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