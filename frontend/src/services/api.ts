import {
  Profile,
  Skill,
  TargetJob,
  ReadinessData,
  SkillGapData,
  TestQuestion,
  TestResult,
  InterviewFeedback,
  RoadmapStep,
  Job,
  WorkforceLocation,
} from '../types';

function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port, origin } = window.location;
    // If accessing from mobile phone or external device on local network IP (e.g. 192.168.x.x)
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      if (port === '5173') {
        return `${protocol}//${hostname}:8000/api`;
      }
      return `${origin}/api`;
    }
  }
  return 'http://127.0.0.1:8000/api';
}

export interface SavedAccount {
  email: string;
  full_name: string;
  token: string;
  role?: string;
}

export function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('token');
}

export function getSavedAccounts(): SavedAccount[] {
  try {
    const raw = localStorage.getItem('saved_user_accounts');
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return [
    { email: 'venkyvenkatadri99899@gmail.com', full_name: 'M Venkatadri', token: 'demo-session-token-mobile-123', role: 'Python Developer' },
    { email: 'alex.rivera@tech.co', full_name: 'Alex Rivera', token: 'demo-token-alex', role: 'Fullstack Engineer' },
    { email: 'sarah.chen@ai.io', full_name: 'Sarah Chen', token: 'demo-token-sarah', role: 'AI/ML Engineer' }
  ];
}

export function saveAccount(email: string, full_name: string, token: string, role?: string) {
  const accounts = getSavedAccounts();
  const existingIdx = accounts.findIndex(a => a.email.toLowerCase() === email.toLowerCase());
  if (existingIdx >= 0) {
    accounts[existingIdx] = { email, full_name, token, role: role || accounts[existingIdx].role };
  } else {
    accounts.push({ email, full_name, token, role: role || 'Candidate' });
  }
  localStorage.setItem('saved_user_accounts', JSON.stringify(accounts));
}

export function switchAccount(email: string): SavedAccount | null {
  const accounts = getSavedAccounts();
  const target = accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
  if (target) {
    setAuthToken(target.token);
    localStorage.setItem('active_user_email', target.email);
    localStorage.setItem('active_user_name', target.full_name);
    return target;
  }
  return null;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const baseUrl = getApiBaseUrl();

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        removeAuthToken();
      }
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Static host HTML response');
    }

    return await response.json();
  } catch (err: any) {
    // If a real backend URL is configured (production), never fall back to mock data.
    // Throw the real error so the UI shows the actual problem.
    const isProduction = !!import.meta.env.VITE_API_URL;
    if (isProduction) {
      throw err;
    }

    // Local dev fallback (no backend running) — demo/mock data below
    if (endpoint === '/auth/login' || endpoint === '/auth/register') {
      const demoToken = 'demo-session-token-mobile-123';
      setAuthToken(demoToken);
      let reqData: any = {};
      try {
        if (options.body && typeof options.body === 'string') {
          reqData = JSON.parse(options.body);
        }
      } catch (_) {}
      return {
        access_token: demoToken,
        token_type: 'bearer',
        user: {
          id: 1,
          email: reqData.email || 'venkyvenkatadri99899@gmail.com',
          full_name: reqData.full_name || 'M Venkatadri'
        }
      } as unknown as T;
    }
    if (endpoint === '/auth/me') {
      const savedName = localStorage.getItem('active_user_name') || 'M Venkatadri';
      const savedEmail = localStorage.getItem('active_user_email') || 'venkyvenkatadri99899@gmail.com';
      return {
        user_id: 1,
        full_name: savedName,
        email: savedEmail,
        location: 'San Francisco, CA',
        education: 'B.S. Computer Science',
        experience_level: 'Mid-Level',
        current_role: 'Software Developer',
        preferred_location: 'Remote',
        preferred_job_type: 'Full-time',
        preferred_industry: 'Technology',
        remote_preference: 'Remote',
        onboarding_completed: true
      } as unknown as T;
    }
    if (endpoint.startsWith('/roadmap')) {
      return {
        target_job: 'Python Developer',
        steps: [
          {
            skill: 'Python Foundations',
            status: 'Completed',
            estimated_time: 'Mastered',
            priority: 'Verified',
            demand_trend: 'Very High',
            why_it_matters: 'Core foundation for Python Developer role.',
            resource_link: 'https://docs.python.org/3/',
            practice_project: 'Production pipeline utilizing Python'
          },
          {
            skill: 'REST API & Architecture',
            status: 'In Progress',
            estimated_time: '1 Week',
            priority: 'High',
            demand_trend: 'Very High',
            why_it_matters: 'Backend service communication standard.',
            resource_link: 'https://fastapi.tiangolo.com/',
            practice_project: 'FastAPI microservice implementation'
          },
          {
            skill: 'Docker & Containerization',
            status: 'Pending',
            estimated_time: '2 Weeks',
            priority: 'Medium',
            demand_trend: 'High',
            why_it_matters: 'Container isolation & deployment.',
            resource_link: 'https://docs.docker.com/',
            practice_project: 'Docker multi-stage build setup'
          }
        ]
      } as unknown as T;
    }
    if (endpoint.startsWith('/readiness')) {
      return {
        target_job: 'Python Developer',
        overall_readiness: 78,
        components: [
          { category: 'Technical Skills', score: 82, weight: '40%' },
          { category: 'System Design', score: 72, weight: '30%' },
          { category: 'Practical Experience', score: 75, weight: '30%' }
        ],
        explanation: 'Strong foundational technical skills. Focus on containerization & cloud deployment to reach 90%+ readiness.',
        top_skills_to_improve: ['Docker', 'AWS', 'System Design']
      } as unknown as T;
    }
    if (endpoint.startsWith('/skill-gap')) {
      return {
        target_job: 'Python Developer',
        gap_score: 22,
        gap_level: 'Medium',
        strong_skills: ['Python', 'SQL', 'Git'],
        good_skills: ['REST API'],
        needs_improvement_skills: ['Docker'],
        missing_skills: ['AWS', 'Kubernetes'],
        future_skills: ['Vector DBs', 'RAG'],
        explanation: 'Key gap identified in containerization & cloud infrastructure.'
      } as unknown as T;
    }
    if (endpoint.startsWith('/tests/history')) {
      return [
        {
          id: 1,
          target_job: 'Python Developer',
          score_percentage: 85,
          total_questions: 5,
          correct_answers: 4,
          completed_at: 'Today',
          category: 'Python Foundations'
        }
      ] as unknown as T;
    }
    if (endpoint.startsWith('/target-jobs')) {
      return [
        { job_title: 'Python Developer', is_primary: true },
        { job_title: 'AI/ML Engineer', is_primary: false }
      ] as unknown as T;
    }
    if (endpoint.startsWith('/skills')) {
      return [
        { skill_name: 'Python', proficiency: 'Advanced' },
        { skill_name: 'SQL', proficiency: 'Intermediate' }
      ] as unknown as T;
    }
    if (endpoint.startsWith('/tests/progressive-prep')) {
      return [
        {
          stage: 1,
          title: 'Python Fundamentals',
          questions: [
            {
              id: 101,
              question_text: 'What is the primary difference between a List Comprehension and a Generator Expression in Python?',
              options: [
                'Generator Expressions compute items lazily in O(1) memory, while List Comprehensions evaluate all items into RAM.',
                'List Comprehensions use less memory than Generator Expressions.',
                'Generator Expressions create immutable tuples.',
                'There is no difference.'
              ],
              correct_index: 0,
              ai_explanation: 'Generator expressions use lazy evaluation, yielding items one at a time, making them memory-efficient for large datasets. List comprehensions store all items in memory immediately.'
            },
            {
              id: 102,
              question_text: 'Which Python keyword is used to define a generator function?',
              options: ['return', 'yield', 'async', 'lambda'],
              correct_index: 1,
              ai_explanation: 'The "yield" keyword pauses a function and returns a value, making it a generator that resumes from where it left off on the next call.'
            }
          ]
        },
        {
          stage: 2,
          title: 'REST API & Architecture',
          questions: [
            {
              id: 201,
              question_text: 'What HTTP status code indicates a resource was successfully created?',
              options: ['200 OK', '201 Created', '204 No Content', '302 Found'],
              correct_index: 1,
              ai_explanation: '201 Created is the standard REST response when a new resource is successfully created via POST request.'
            },
            {
              id: 202,
              question_text: 'Which of the following best describes idempotency in REST APIs?',
              options: [
                'The API always returns cached results.',
                'Multiple identical requests produce the same result as a single request.',
                'The API supports both GET and POST methods.',
                'The API validates all input before processing.'
              ],
              correct_index: 1,
              ai_explanation: 'Idempotency means that making the same request multiple times has the same effect as making it once. GET, PUT, and DELETE are idempotent; POST is not.'
            }
          ]
        },
        {
          stage: 3,
          title: 'System Design & Cloud',
          questions: [
            {
              id: 301,
              question_text: 'What is the primary purpose of a load balancer in a distributed system?',
              options: [
                'To encrypt traffic between services.',
                'To distribute incoming requests across multiple servers.',
                'To cache database queries.',
                'To compress API responses.'
              ],
              correct_index: 1,
              ai_explanation: 'A load balancer distributes incoming network traffic across multiple backend servers to ensure no single server is overwhelmed, improving availability and reliability.'
            }
          ]
        }
      ] as unknown as T;
    }
    if (endpoint.startsWith('/tests/questions')) {
      return [
        {
          id: 1,
          target_job: 'Python Developer',
          question_text: 'What is the primary difference between a List Comprehension and a Generator Expression in Python?',
          option_a: 'Generator Expressions compute items lazily in O(1) memory, while List Comprehensions evaluate all items into RAM.',
          option_b: 'List Comprehensions use less memory than Generator Expressions.',
          option_c: 'Generator Expressions create immutable tuples.',
          option_d: 'There is no difference.',
          correct_option: 'A',
          category: 'Python Foundations',
          difficulty: 'Medium'
        }
      ] as unknown as T;
    }
    if (endpoint.startsWith('/interview/questions')) {
      return [
        {
          index: 0,
          difficulty: 'Easy',
          difficulty_label: 'Level 1: Python Fundamentals',
          question: 'Introduce your professional background as a Python Developer and explain core architectural principles you follow.'
        }
      ] as unknown as T;
    }
    if (endpoint.startsWith('/resume')) {
      return {
        ats_score: 88,
        matching_keywords: ['Python', 'SQL', 'REST API', 'Git'],
        missing_keywords: ['Docker', 'AWS'],
        suggestions: ['Add Docker containerization project experience to resume to boost ATS rank.']
      } as unknown as T;
    }
    if (endpoint.startsWith('/jobs')) {
      return [
        {
          id: 1,
          title: 'Software Engineer - Backend (Python / FastAPI)',
          company: 'Stripe',
          location: 'San Francisco, CA, USA / Remote',
          experience_required: '1-3 years',
          salary_range: '$170,000 - $220,000 / year',
          remote_type: 'Remote',
          industry: 'Fintech',
          description: 'Join Stripe\'s core infrastructure team building microservices using Python, FastAPI, PostgreSQL, and distributed caching.',
          required_skills: ['Python', 'SQL', 'FastAPI', 'REST API', 'Docker'],
          matching_skills: ['Python', 'SQL', 'FastAPI', 'REST API'],
          missing_skills: ['Docker'],
          match_percentage: 88,
          original_apply_url: 'https://stripe.com/jobs'
        },
        {
          id: 2,
          title: 'Backend AI Systems Engineer (Python / PyTorch)',
          company: 'OpenAI',
          location: 'San Francisco, CA, USA',
          experience_required: '1-4 years',
          salary_range: '$190,000 - $260,000 / year',
          remote_type: 'Hybrid',
          industry: 'Artificial Intelligence',
          description: 'Develop high-throughput inference APIs, model serving infrastructure, and vector store pipelines supporting ChatGPT.',
          required_skills: ['Python', 'Machine Learning', 'PyTorch', 'FastAPI'],
          matching_skills: ['Python', 'FastAPI'],
          missing_skills: ['Machine Learning', 'PyTorch'],
          match_percentage: 82,
          original_apply_url: 'https://openai.com/careers'
        },
        {
          id: 3,
          title: 'Software Development Engineer (Python / AWS)',
          company: 'Amazon Web Services (AWS)',
          location: 'Austin, TX, USA / Remote',
          experience_required: '0-2 years',
          salary_range: '$145,000 - $190,000 / year',
          remote_type: 'Hybrid',
          industry: 'Cloud Computing',
          description: 'Architect cloud-native backend services, automated CI/CD deployments, and scalable AWS cloud infrastructure APIs.',
          required_skills: ['Python', 'AWS', 'Docker', 'REST API', 'SQL'],
          matching_skills: ['Python', 'SQL', 'REST API'],
          missing_skills: ['AWS', 'Docker'],
          match_percentage: 78,
          original_apply_url: 'https://amazon.jobs'
        },
        {
          id: 4,
          title: 'Software Engineer II - Java & Azure Cloud',
          company: 'Microsoft',
          location: 'Redmond, WA, USA / Remote',
          experience_required: '1-3 years',
          salary_range: '$150,000 - $195,000 / year',
          remote_type: 'Hybrid',
          industry: 'Enterprise Software',
          description: 'Build high-throughput enterprise backends and cloud microservices supporting Azure cloud platform services.',
          required_skills: ['Java', 'SQL', 'REST API', 'Docker'],
          matching_skills: ['SQL', 'REST API'],
          missing_skills: ['Java', 'Docker'],
          match_percentage: 75,
          original_apply_url: 'https://careers.microsoft.com'
        },
        {
          id: 5,
          title: 'Software Engineer - AI Platform & Infrastructure',
          company: 'Google',
          location: 'Mountain View, CA, USA / Bengaluru, India',
          experience_required: '1-4 years',
          salary_range: '$165,000 - $225,000 / year',
          remote_type: 'Hybrid',
          industry: 'Cloud & AI Search',
          description: 'Develop scalable distributed machine learning platforms, Gemini model integration layers, and high-performance server backend services.',
          required_skills: ['Python', 'Machine Learning', 'PyTorch', 'Pandas'],
          matching_skills: ['Python'],
          missing_skills: ['Machine Learning', 'PyTorch', 'Pandas'],
          match_percentage: 72,
          original_apply_url: 'https://careers.google.com/jobs/'
        }
      ] as unknown as T;
    }
    return { status: 'success' } as unknown as T;
  }
}

export const api = {
  // Auth
  register: (data: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<Profile>('/auth/me'),

  // Onboarding & Profile
  updateProfileStep1: (data: any) => request<any>('/profile/step1', { method: 'POST', body: JSON.stringify(data) }),
  updateProfileStep3: (data: any) => request<any>('/profile/step3', { method: 'POST', body: JSON.stringify(data) }),

  // Resume Upload
  uploadResume: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<any>('/resume/upload', { method: 'POST', body: formData });
  },
  confirmResumeData: (data: any) => request<any>('/resume/confirm', { method: 'POST', body: JSON.stringify(data) }),
  getAtsReport: () => request<any>('/resume/ats'),

  // Skills
  getSkills: () => request<Skill[]>('/skills'),
  addSkill: (skill_name: string, proficiency: string) =>
    request<any>('/skills/add', { method: 'POST', body: JSON.stringify({ skill_name, proficiency }) }),
  removeSkill: (skill_name: string) => request<any>(`/skills/remove/${encodeURIComponent(skill_name)}`, { method: 'DELETE' }),

  // Target Jobs
  getTargetJobs: () => request<TargetJob[]>('/target-jobs'),
  setPrimaryTargetJob: (job_title: string) =>
    request<any>(`/target-jobs/primary?job_title=${encodeURIComponent(job_title)}`, { method: 'POST' }),

  // Analytics & Data Prompt
  getReadiness: () => request<ReadinessData>('/readiness'),
  getSkillGap: () => request<SkillGapData>('/skill-gap'),
  submitDataPrompt: (prompt_text: string) =>
    request<ReadinessData>('/data-prompt', { method: 'POST', body: JSON.stringify({ prompt_text }) }),

  // Technical Assessment & AI Interview
  getTestQuestions: (target_job?: string, module_name?: string) =>
    request<TestQuestion[]>(
      `/tests/questions?${target_job ? `target_job=${encodeURIComponent(target_job)}&` : ''}${
        module_name ? `module_name=${encodeURIComponent(module_name)}` : ''
      }`
    ),

  getProgressivePrepQuestions: (target_job?: string, module_name?: string) =>
    request<any[]>(
      `/tests/progressive-prep?${target_job ? `target_job=${encodeURIComponent(target_job)}&` : ''}${
        module_name ? `module_name=${encodeURIComponent(module_name)}` : ''
      }`
    ),

  getInterviewQuestions: (target_job?: string, module_name?: string) =>
    request<any[]>(
      `/interview/questions?${target_job ? `target_job=${encodeURIComponent(target_job)}&` : ''}${
        module_name ? `module_name=${encodeURIComponent(module_name)}` : ''
      }`
    ),
  submitTest: (target_job: string, answers: Record<number, string>) =>
    request<TestResult>('/tests/submit', { method: 'POST', body: JSON.stringify({ target_job, answers }) }),
  getTestHistory: () => request<any[]>('/tests/history'),

  // Mock Interview
  sendInterviewMessage: (
    target_job: string,
    user_response: string,
    question_index: number,
    speech_duration_seconds?: number,
    words_per_minute?: number,
    voice_clarity_score?: number,
    video_posture_score?: number
  ) =>
    request<InterviewFeedback>('/interview/message', {
      method: 'POST',
      body: JSON.stringify({
        target_job,
        user_response,
        question_index,
        speech_duration_seconds,
        words_per_minute,
        voice_clarity_score,
        video_posture_score,
      }),
    }),

  // Roadmap & Jobs
  getRoadmap: () => request<{ target_job: string; steps: RoadmapStep[]; updated_at: string }>('/roadmap'),
  getJobs: (search?: string, remote_type?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (remote_type) params.append('remote_type', remote_type);
    return request<Job[]>(`/jobs?${params.toString()}`);
  },

  // Radar Map & Chatbot
  getWorkforceRadar: () => request<WorkforceLocation[]>('/workforce-radar'),
  askChatbot: (user_message: string, current_page_context?: string) =>
    request<{ answer: string; context_used: any; timestamp: string }>('/chatbot/ask', {
      method: 'POST',
      body: JSON.stringify({ user_message, current_page_context }),
    }),

  // AI Agent Generators (Chosen Role Test Questions & Personalized Roadmap)
  generateAgentTests: (role_title: string, skill_focus?: string, difficulty?: string) =>
    request<any>('/ai-agent/generate-tests', {
      method: 'POST',
      body: JSON.stringify({ role_title, skill_focus, difficulty }),
    }),

  generateAgentRoadmap: (role_title: string, focus_areas?: string[]) =>
    request<{ target_job: string; overall_fit: string; steps: RoadmapStep[]; generated_by_agent: boolean; updated_at: string }>(
      '/ai-agent/generate-roadmap',
      {
        method: 'POST',
        body: JSON.stringify({ role_title, focus_areas }),
      }
    ),
};
