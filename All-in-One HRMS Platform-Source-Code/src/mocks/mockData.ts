// Mock data for the application
export const mockData = {
  employees: [
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@company.com',
      position: 'Senior Developer',
      department: 'Engineering',
      status: 'Active',
      joinDate: '2023-01-15',
      avatar: 'JS'
    },
    {
      id: '2',
      name: 'Maria Garcia',
      email: 'maria.garcia@company.com',
      position: 'UX Designer',
      department: 'Design',
      status: 'Active',
      joinDate: '2022-11-03',
      avatar: 'MG'
    },
    {
      id: '3',
      name: 'David Johnson',
      email: 'david.johnson@company.com',
      position: 'Product Manager',
      department: 'Product',
      status: 'Active',
      joinDate: '2021-06-22',
      avatar: 'DJ'
    },
    {
      id: '4',
      name: 'Sarah Thompson',
      email: 'sarah.thompson@company.com',
      position: 'HR Specialist',
      department: 'Human Resources',
      status: 'Active',
      joinDate: '2020-08-10',
      avatar: 'ST'
    },
    {
      id: '5',
      name: 'Michael Davis',
      email: 'michael.davis@company.com',
      position: 'Frontend Developer',
      department: 'Engineering',
      status: 'Leave',
      joinDate: '2022-03-18',
      avatar: 'MD'
    },
    {
      id: '6',
      name: 'Jennifer Wilson',
      email: 'jennifer.wilson@company.com',
      position: 'Marketing Specialist',
      department: 'Marketing',
      status: 'Active',
      joinDate: '2021-10-05',
      avatar: 'JW'
    }
  ],

  jobs: [
    {
      id: '1',
      title: 'Senior React Developer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      status: 'Open',
      postedDate: '2025-05-15',
      applicants: 24
    },
    {
      id: '2',
      title: 'UX/UI Designer',
      department: 'Design',
      location: 'New York, NY',
      type: 'Full-time',
      status: 'Open',
      postedDate: '2025-05-20',
      applicants: 18
    },
    {
      id: '3',
      title: 'Product Manager',
      department: 'Product',
      location: 'San Francisco, CA',
      type: 'Full-time',
      status: 'Open',
      postedDate: '2025-05-25',
      applicants: 12
    },
    {
      id: '4',
      title: 'DevOps Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      status: 'Draft',
      postedDate: null,
      applicants: 0
    },
    {
      id: '5',
      title: 'Customer Success Manager',
      department: 'Customer Support',
      location: 'Austin, TX',
      type: 'Full-time',
      status: 'Closed',
      postedDate: '2025-03-10',
      applicants: 32
    }
  ],

  candidates: [
    {
      id: '1',
      name: 'Alex Johnson',
      email: 'alex.johnson@email.com',
      jobId: '1',
      jobTitle: 'Senior React Developer',
      status: 'Screening',
      applied: '2025-05-28',
      experience: '5 years',
      skills: ['React', 'TypeScript', 'Redux', 'Node.js']
    },
    {
      id: '2',
      name: 'Emma Davis',
      email: 'emma.davis@email.com',
      jobId: '1',
      jobTitle: 'Senior React Developer',
      status: 'Interview',
      applied: '2025-05-25',
      experience: '7 years',
      skills: ['React', 'JavaScript', 'HTML/CSS', 'GraphQL']
    },
    {
      id: '3',
      name: 'Miguel Hernandez',
      email: 'miguel.hernandez@email.com',
      jobId: '2',
      jobTitle: 'UX/UI Designer',
      status: 'Screening',
      applied: '2025-06-01',
      experience: '3 years',
      skills: ['Figma', 'Adobe XD', 'UI Design', 'User Research']
    },
    {
      id: '4',
      name: 'Sophie Chen',
      email: 'sophie.chen@email.com',
      jobId: '3',
      jobTitle: 'Product Manager',
      status: 'Offer',
      applied: '2025-05-22',
      experience: '6 years',
      skills: ['Product Strategy', 'Agile', 'User Stories', 'Analytics']
    }
  ],

  leave_requests: [
    {
      id: '1',
      employeeId: '1',
      employeeName: 'John Smith',
      type: 'Vacation',
      startDate: '2025-07-15',
      endDate: '2025-07-25',
      days: 9,
      status: 'Approved',
      requestDate: '2025-06-01'
    },
    {
      id: '2',
      employeeId: '2',
      employeeName: 'Maria Garcia',
      type: 'Sick Leave',
      startDate: '2025-06-12',
      endDate: '2025-06-14',
      days: 3,
      status: 'Approved',
      requestDate: '2025-06-08'
    },
    {
      id: '3',
      employeeId: '3',
      employeeName: 'David Johnson',
      type: 'Personal Leave',
      startDate: '2025-06-30',
      endDate: '2025-07-02',
      days: 3,
      status: 'Pending',
      requestDate: '2025-06-09'
    },
    {
      id: '4',
      employeeId: '5',
      employeeName: 'Michael Davis',
      type: 'Family Emergency',
      startDate: '2025-06-08',
      endDate: '2025-06-15',
      days: 6,
      status: 'Approved',
      requestDate: '2025-06-07'
    },
    {
      id: '5',
      employeeId: '6',
      employeeName: 'Jennifer Wilson',
      type: 'Vacation',
      startDate: '2025-07-04',
      endDate: '2025-07-08',
      days: 3,
      status: 'Pending',
      requestDate: '2025-06-10'
    }
  ],

  performance_reviews: [
    {
      id: 1,
      type: 'Annual Performance Review',
      status: 'In Progress',
      dueDate: '2025-06-30',
      completionPercentage: 25,
      reviewers: ['John Smith', 'Mary Johnson'],
      description: 'Annual performance evaluation covering all aspects of job performance, goal achievement, and competencies.'
    },
    {
      id: 2,
      type: 'Mid-Year Check-in',
      status: 'Not Started',
      dueDate: '2025-07-15',
      completionPercentage: 0,
      reviewers: ['John Smith'],
      description: 'Mid-year progress check against established goals and competencies.'
    },
    {
      id: 3,
      type: 'Project Retrospective',
      status: 'Completed',
      dueDate: '2025-05-10',
      completionPercentage: 100,
      reviewers: ['Project Team', 'Mary Johnson'],
      description: 'Feedback on your contribution to the CRM Implementation project.'
    },
    {
      id: 4,
      type: 'Peer Feedback Round',
      status: 'Pending Approval',
      dueDate: '2025-06-20',
      completionPercentage: 80,
      reviewers: ['Lisa Wang', 'Robert Chen', 'Amara Singh'],
      description: 'Collected feedback from peers on collaboration and teamwork skills.'
    }
  ],

  goals: [
    {
      id: 1,
      title: 'Improve Customer Satisfaction',
      category: 'Customer Experience',
      progress: 75,
      dueDate: '2025-08-15',
      status: 'In Progress',
      description: 'Increase NPS score from 45 to 60 through improved customer service training and feedback implementation.',
      keyResults: [
        { id: 1, title: 'Conduct customer service training for all team members', progress: 100 },
        { id: 2, title: 'Implement feedback collection system', progress: 100 },
        { id: 3, title: 'Achieve NPS score of 60', progress: 50 },
        { id: 4, title: 'Reduce response time to customer queries to under 2 hours', progress: 75 }
      ]
    },
    {
      id: 2,
      title: 'Launch New Product Features',
      category: 'Product Development',
      progress: 45,
      dueDate: '2025-07-30',
      status: 'In Progress',
      description: 'Successfully launch the AI recommendation engine and mobile application features for the core product.',
      keyResults: [
        { id: 1, title: 'Complete development of AI recommendation engine', progress: 80 },
        { id: 2, title: 'Finish QA testing of all new features', progress: 60 },
        { id: 3, title: 'Launch mobile application in app stores', progress: 20 },
        { id: 4, title: 'Achieve 10,000 feature activations in first month', progress: 0 }
      ]
    },
    {
      id: 3,
      title: 'Reduce Support Response Time',
      category: 'Operations',
      progress: 90,
      dueDate: '2025-06-15',
      status: 'In Progress',
      description: 'Optimize support workflows to reduce average ticket resolution time from 24 hours to 8 hours.',
      keyResults: [
        { id: 1, title: 'Implement automated ticket routing system', progress: 100 },
        { id: 2, title: 'Create knowledge base for common issues', progress: 100 },
        { id: 3, title: 'Train team on new support workflows', progress: 100 },
        { id: 4, title: 'Achieve average resolution time of 8 hours', progress: 75 }
      ]
    },
    {
      id: 4,
      title: 'Develop Leadership Skills',
      category: 'Personal Development',
      progress: 60,
      dueDate: '2025-12-31',
      status: 'In Progress',
      description: 'Enhance leadership capabilities through training, mentoring, and practical application.',
      keyResults: [
        { id: 1, title: 'Complete leadership training program', progress: 100 },
        { id: 2, title: 'Find and meet regularly with a mentor', progress: 75 },
        { id: 3, title: 'Lead at least one cross-functional project', progress: 50 },
        { id: 4, title: 'Improve leadership competency assessment scores by 20%', progress: 0 }
      ]
    },
    {
      id: 5,
      title: 'Implement Expense Management System',
      category: 'Finance',
      progress: 100,
      dueDate: '2025-04-30',
      status: 'Completed',
      description: 'Successfully deploy and train staff on the new expense management system.',
      keyResults: [
        { id: 1, title: 'Select appropriate expense management solution', progress: 100 },
        { id: 2, title: 'Configure system for company needs', progress: 100 },
        { id: 3, title: 'Train all employees on new system', progress: 100 },
        { id: 4, title: 'Achieve 100% adoption rate', progress: 100 }
      ]
    }
  ],

  feedback: [
    {
      id: 1,
      from: 'Jane Doe',
      avatar: 'JD',
      avatarColor: 'bg-green-200 text-green-700',
      message: 'Great job on the client presentation yesterday. Your preparation really showed!',
      date: '2025-06-09',
      type: 'praise'
    },
    {
      id: 2,
      from: 'Team Supervisor',
      avatar: 'TS',
      avatarColor: 'bg-blue-200 text-blue-700',
      message: 'I appreciate your initiative in resolving the database issue last week.',
      date: '2025-06-05',
      type: 'praise'
    },
    {
      id: 3,
      from: 'Michael Brown',
      avatar: 'MB',
      avatarColor: 'bg-purple-200 text-purple-700',
      message: 'Your technical insights were valuable during our architectural planning session. In future sessions, it would be helpful if you could prepare a brief document summarizing your ideas to share in advance.',
      date: '2025-05-28',
      type: 'constructive'
    },
    {
      id: 4,
      from: 'Sarah Williams',
      avatar: 'SW',
      avatarColor: 'bg-pink-200 text-pink-700',
      message: 'I valued your input on the marketing strategy. You have a good eye for customer needs.',
      date: '2025-05-20',
      type: 'praise'
    }
  ],

  feedback_requests: [
    {
      id: 1,
      for: 'Alex Johnson',
      avatar: 'AJ',
      avatarColor: 'bg-yellow-200 text-yellow-700',
      dueDate: '2025-06-15',
      project: 'Website Redesign',
      status: 'pending'
    },
    {
      id: 2,
      for: 'Emily Davis',
      avatar: 'ED',
      avatarColor: 'bg-indigo-200 text-indigo-700',
      dueDate: '2025-06-20',
      project: 'Mobile App Development',
      status: 'pending'
    },
    {
      id: 3,
      for: 'Mark Wilson',
      avatar: 'MW',
      avatarColor: 'bg-red-200 text-red-700',
      dueDate: '2025-06-10',
      project: 'Data Migration',
      status: 'pending'
    }
  ]
};
