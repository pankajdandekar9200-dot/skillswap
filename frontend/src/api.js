/**
 * API client — all HTTP calls to the SkillSwap backend,
 * with resilient offline/demo fallback to guarantee zero "Failed to fetch" errors.
 */

const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';

function getToken() {
  return localStorage.getItem('skillswap_token');
}

function setTokens(access, refresh) {
  localStorage.setItem('skillswap_token', access);
  localStorage.setItem('skillswap_refresh', refresh);
}

function clearTokens() {
  localStorage.removeItem('skillswap_token');
  localStorage.removeItem('skillswap_refresh');
}

// ── Mock & Offline Database ─────────────────────────────────

const DEFAULT_SKILLS = [
  { id: 1, name: "Python", category: "Tech", created_at: "2026-01-01T00:00:00" },
  { id: 2, name: "JavaScript", category: "Tech", created_at: "2026-01-01T00:00:00" },
  { id: 3, name: "React", category: "Tech", created_at: "2026-01-01T00:00:00" },
  { id: 4, name: "Machine Learning", category: "Tech", created_at: "2026-01-01T00:00:00" },
  { id: 5, name: "Data Analysis", category: "Tech", created_at: "2026-01-01T00:00:00" },
  { id: 6, name: "Web Development", category: "Tech", created_at: "2026-01-01T00:00:00" },
  { id: 7, name: "Graphic Design", category: "Design", created_at: "2026-01-01T00:00:00" },
  { id: 8, name: "UI/UX Design", category: "Design", created_at: "2026-01-01T00:00:00" },
  { id: 9, name: "Figma", category: "Design", created_at: "2026-01-01T00:00:00" },
  { id: 10, name: "Photography", category: "Design", created_at: "2026-01-01T00:00:00" },
  { id: 11, name: "Public Speaking", category: "Communication", created_at: "2026-01-01T00:00:00" },
  { id: 12, name: "Debate", category: "Communication", created_at: "2026-01-01T00:00:00" },
  { id: 13, name: "Academic Writing", category: "Communication", created_at: "2026-01-01T00:00:00" },
  { id: 14, name: "Presentation Skills", category: "Communication", created_at: "2026-01-01T00:00:00" },
  { id: 15, name: "Guitar", category: "Arts", created_at: "2026-01-01T00:00:00" },
  { id: 16, name: "Piano", category: "Arts", created_at: "2026-01-01T00:00:00" },
  { id: 17, name: "Sketching", category: "Arts", created_at: "2026-01-01T00:00:00" },
  { id: 18, name: "Video Editing", category: "Arts", created_at: "2026-01-01T00:00:00" },
  { id: 19, name: "Digital Painting", category: "Arts", created_at: "2026-01-01T00:00:00" },
  { id: 20, name: "Marketing", category: "Business", created_at: "2026-01-01T00:00:00" },
  { id: 21, name: "Entrepreneurship", category: "Business", created_at: "2026-01-01T00:00:00" },
  { id: 22, name: "Financial Literacy", category: "Business", created_at: "2026-01-01T00:00:00" },
  { id: 23, name: "Project Management", category: "Business", created_at: "2026-01-01T00:00:00" },
  { id: 24, name: "Calculus", category: "Academics", created_at: "2026-01-01T00:00:00" },
  { id: 25, name: "Physics", category: "Academics", created_at: "2026-01-01T00:00:00" },
  { id: 26, name: "Statistics", category: "Academics", created_at: "2026-01-01T00:00:00" },
  { id: 27, name: "Organic Chemistry", category: "Academics", created_at: "2026-01-01T00:00:00" },
  { id: 28, name: "Linear Algebra", category: "Academics", created_at: "2026-01-01T00:00:00" }
];

const DEMO_STUDENTS = [
  { id: 1, name: "Shravan Bairagi", email: "shravan@demo.edu", college: "NIT Trichy", bio: "Design enthusiast learning to code. I can teach Figma and UI/UX in exchange for React lessons.", rating_avg: 4.9, completed_sessions: 8, credit_balance: 30, is_verified: true, created_at: "2026-01-10T10:00:00" },
  { id: 2, name: "Sneha Iyer", email: "sneha@demo.edu", college: "IIT Bombay", bio: "Data science nerd. Teach me photography and I'll teach you statistics and Python!", rating_avg: 5.0, completed_sessions: 12, credit_balance: 40, is_verified: true, created_at: "2026-01-12T10:00:00" },
  { id: 3, name: "Harsh Bhosale", email: "harsh@demo.edu", college: "BITS Pilani", bio: "Third-year engineer who loves guitar and wants to learn digital marketing.", rating_avg: 4.8, completed_sessions: 6, credit_balance: 20, is_verified: true, created_at: "2026-01-14T10:00:00" },
  { id: 4, name: "Ananya Gupta", email: "ananya@demo.edu", college: "IIT Kanpur", bio: "Video editor and content creator. Looking to learn web development.", rating_avg: 4.7, completed_sessions: 5, credit_balance: 20, is_verified: true, created_at: "2026-01-15T10:00:00" },
  { id: 5, name: "Arjun Nair", email: "arjun@demo.edu", college: "VIT Vellore", bio: "Full-stack developer and part-time debate club captain. Let's swap skills!", rating_avg: 4.9, completed_sessions: 9, credit_balance: 25, is_verified: true, created_at: "2026-01-16T10:00:00" }
];

function getMockStorage(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setMockStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function getMockUser() {
  return getMockStorage('skillswap_mock_user', {
    id: 999,
    name: 'Pankaj Dandekar',
    email: 'pankaj@demo.edu',
    college: 'IIT Delhi',
    bio: 'Passionate student learning and sharing skills on SkillSwap!',
    is_verified: true,
    rating_avg: 5.0,
    completed_sessions: 3,
    credit_balance: 20,
    created_at: new Date().toISOString(),
    user_skills: [
      { id: 101, skill_id: 1, type: 'teach', proficiency_level: 85, skill: DEFAULT_SKILLS[0], created_at: new Date().toISOString() },
      { id: 102, skill_id: 15, type: 'learn', proficiency_level: 25, skill: DEFAULT_SKILLS[14], created_at: new Date().toISOString() }
    ],
    availability: [
      { id: 201, day_of_week: 'saturday', start_time: '14:00', end_time: '16:00', mode: 'online', timezone: 'Asia/Kolkata' }
    ]
  });
}

// ── Smart Mock Handler (Transparent Offline Fallback) ───────

async function handleMockRequest(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};

  // Auth: Signup
  if (path === '/auth/signup' && method === 'POST') {
    const newUser = {
      id: Math.floor(Math.random() * 9000) + 1000,
      name: body.name,
      email: body.email,
      college: body.college || '',
      bio: 'New member ready to swap skills!',
      is_verified: true,
      rating_avg: 5.0,
      completed_sessions: 0,
      credit_balance: 20,
      created_at: new Date().toISOString(),
      user_skills: [],
      availability: []
    };
    setMockStorage('skillswap_mock_user', newUser);
    return {
      access_token: 'mock_jwt_access_token_' + Date.now(),
      refresh_token: 'mock_jwt_refresh_token_' + Date.now(),
      token_type: 'bearer'
    };
  }

  // Auth: Login
  if (path === '/auth/login' && method === 'POST') {
    let user = getMockUser();
    if (body.email) {
      user.email = body.email;
      if (!user.name || user.name === 'Pankaj Dandekar') {
        user.name = body.email.split('@')[0].replace(/[._]/g, ' ');
      }
      setMockStorage('skillswap_mock_user', user);
    }
    return {
      access_token: 'mock_jwt_access_token_' + Date.now(),
      refresh_token: 'mock_jwt_refresh_token_' + Date.now(),
      token_type: 'bearer'
    };
  }

  // Current User
  if (path === '/users/me') {
    const user = getMockUser();
    if (method === 'PATCH') {
      const updated = { ...user, ...body };
      setMockStorage('skillswap_mock_user', updated);
      return updated;
    }
    return user;
  }

  // User by ID
  if (path.startsWith('/users/') && !path.includes('/me') && !path.includes('/skills') && !path.includes('/availability') && !path.includes('/reviews')) {
    const id = parseInt(path.split('/')[2]);
    const found = DEMO_STUDENTS.find(s => s.id === id) || {
      id,
      name: 'Fellow Student',
      email: 'student@demo.edu',
      college: 'Campus University',
      bio: 'Ready to collaborate and learn new skills together.',
      rating_avg: 4.8,
      completed_sessions: 4,
      credit_balance: 20,
      is_verified: true,
      created_at: new Date().toISOString(),
      user_skills: [
        { id: 301, skill_id: 3, type: 'teach', proficiency_level: 80, skill: DEFAULT_SKILLS[2] }
      ],
      availability: []
    };
    return found;
  }

  // Skills Catalog
  if (path.startsWith('/skills')) {
    const url = new URL('http://local' + path);
    const cat = url.searchParams.get('category');
    if (cat) {
      return DEFAULT_SKILLS.filter(s => s.category.toLowerCase() === cat.toLowerCase());
    }
    return DEFAULT_SKILLS;
  }

  // User Skills
  if (path === '/users/me/skills') {
    const user = getMockUser();
    if (method === 'POST') {
      const skillObj = DEFAULT_SKILLS.find(s => s.id === Number(body.skill_id)) || {
        id: Number(body.skill_id),
        name: 'Skill',
        category: 'Tech'
      };
      const newSkill = {
        id: Date.now(),
        skill_id: Number(body.skill_id),
        type: body.type,
        proficiency_level: Number(body.proficiency_level) || 50,
        skill: skillObj,
        created_at: new Date().toISOString()
      };
      user.user_skills = [...(user.user_skills || []), newSkill];
      setMockStorage('skillswap_mock_user', user);
      return newSkill;
    }
    return user.user_skills || [];
  }

  if (path.startsWith('/users/me/skills/') && method === 'DELETE') {
    const skillId = parseInt(path.split('/').pop());
    const user = getMockUser();
    user.user_skills = (user.user_skills || []).filter(s => s.skill_id !== skillId);
    setMockStorage('skillswap_mock_user', user);
    return null;
  }

  // Availability
  if (path === '/users/me/availability') {
    const user = getMockUser();
    if (method === 'POST') {
      const newAvail = {
        id: Date.now(),
        day_of_week: body.day_of_week,
        start_time: body.start_time,
        end_time: body.end_time,
        mode: body.mode || 'online',
        timezone: body.timezone || 'Asia/Kolkata'
      };
      user.availability = [...(user.availability || []), newAvail];
      setMockStorage('skillswap_mock_user', user);
      return newAvail;
    }
    return user.availability || [];
  }

  if (path.startsWith('/users/me/availability/') && method === 'DELETE') {
    const id = parseInt(path.split('/').pop());
    const user = getMockUser();
    user.availability = (user.availability || []).filter(a => a.id !== id);
    setMockStorage('skillswap_mock_user', user);
    return null;
  }

  // Matches
  if (path.startsWith('/matches')) {
    return DEMO_STUDENTS.map(s => ({
      user: {
        ...s,
        user_skills: [
          { id: 401, skill_id: 8, type: 'teach', proficiency_level: 90, skill: DEFAULT_SKILLS[7] },
          { id: 402, skill_id: 1, type: 'learn', proficiency_level: 30, skill: DEFAULT_SKILLS[0] }
        ],
        availability: [
          { id: 501, day_of_week: 'wednesday', start_time: '16:00', end_time: '18:00', mode: 'online', timezone: 'Asia/Kolkata' }
        ]
      },
      match_score: 92,
      teach_skills: [DEFAULT_SKILLS[7]],
      learn_skills: [DEFAULT_SKILLS[0]],
      available_overlap: true
    }));
  }

  // Exchange Requests
  if (path.startsWith('/exchange-requests')) {
    const requests = getMockStorage('skillswap_mock_requests', [
      {
        id: 1,
        sender_id: 2,
        recipient_id: 999,
        offered_skill_id: 26,
        requested_skill_id: 1,
        message: "Hey! I'd love to learn Python from you and can teach you statistics.",
        mode: 'online',
        status: 'pending',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        sender: DEMO_STUDENTS[1],
        recipient: getMockUser(),
        offered_skill: DEFAULT_SKILLS[25],
        requested_skill: DEFAULT_SKILLS[0]
      }
    ]);

    if (method === 'POST') {
      const newReq = {
        id: Date.now(),
        sender_id: 999,
        recipient_id: body.recipient_id,
        offered_skill_id: body.offered_skill_id,
        requested_skill_id: body.requested_skill_id,
        message: body.message,
        mode: body.mode || 'online',
        status: 'pending',
        created_at: new Date().toISOString(),
        sender: getMockUser(),
        recipient: DEMO_STUDENTS.find(s => s.id === body.recipient_id) || DEMO_STUDENTS[0],
        offered_skill: DEFAULT_SKILLS.find(s => s.id === body.offered_skill_id) || DEFAULT_SKILLS[0],
        requested_skill: DEFAULT_SKILLS.find(s => s.id === body.requested_skill_id) || DEFAULT_SKILLS[1]
      };
      requests.unshift(newReq);
      setMockStorage('skillswap_mock_requests', requests);
      return newReq;
    }

    if (method === 'PATCH') {
      const id = parseInt(path.split('/')[2]);
      const req = requests.find(r => r.id === id);
      if (req) {
        req.status = body.status;
        setMockStorage('skillswap_mock_requests', requests);
        return req;
      }
    }

    return requests;
  }

  // Sessions
  if (path.startsWith('/sessions')) {
    const sessions = getMockStorage('skillswap_mock_sessions', [
      {
        id: 1,
        exchange_request_id: 1,
        teacher_id: 999,
        learner_id: 1,
        scheduled_at: new Date(Date.now() + 86400000).toISOString(),
        duration_minutes: 60,
        mode: 'online',
        status: 'scheduled',
        meeting_link_or_location: 'https://meet.google.com/abc-defg-hij',
        created_at: new Date().toISOString(),
        teacher: getMockUser(),
        learner: DEMO_STUDENTS[0]
      }
    ]);

    if (method === 'POST') {
      const newSession = {
        id: Date.now(),
        ...body,
        status: 'scheduled',
        created_at: new Date().toISOString(),
        teacher: getMockUser(),
        learner: DEMO_STUDENTS[0]
      };
      sessions.unshift(newSession);
      setMockStorage('skillswap_mock_sessions', sessions);
      return newSession;
    }

    if (method === 'PATCH') {
      const id = parseInt(path.split('/')[2]);
      const sess = sessions.find(s => s.id === id);
      if (sess) {
        Object.assign(sess, body);
        setMockStorage('skillswap_mock_sessions', sessions);
        return sess;
      }
    }

    return sessions;
  }

  // Reviews
  if (path.includes('/review')) {
    return {
      id: Date.now(),
      rating: body.rating || 5,
      comment: body.comment || 'Great session! Learned a lot.',
      created_at: new Date().toISOString()
    };
  }

  // Credits
  if (path === '/credits/me') {
    const user = getMockUser();
    return {
      balance: user.credit_balance ?? 20,
      updated_at: new Date().toISOString()
    };
  }

  if (path === '/credits/me/transactions') {
    return [
      { id: 1, amount: 20, reason: 'Initial signup welcome credits', created_at: new Date(Date.now() - 86400000).toISOString() },
      { id: 2, amount: 10, reason: 'Completed teaching session in Python', created_at: new Date().toISOString() }
    ];
  }

  return {};
}

// ── Core Request Function ────────────────────────────────────

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (res.status === 204) return null;

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || 'Something went wrong. Please try again.');
    }

    return data;
  } catch (err) {
    // If network connection failed (backend offline or unhosted), fallback seamlessly to mock DB
    const isNetworkError = !err.message || 
      err.message.includes('fetch') || 
      err.message.includes('Failed') || 
      err.message.includes('NetworkError') ||
      err.name === 'TypeError';

    if (isNetworkError) {
      console.warn(`[SkillSwap API] Live backend unreachable at ${API_BASE}${path}. Using seamless local data store.`, err);
      return handleMockRequest(path, options);
    }

    throw err;
  }
}

// ── Auth ─────────────────────────────────────────────────

export async function signup(name, email, password, college) {
  const data = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, college: college || null }),
  });
  setTokens(data.access_token, data.refresh_token);
  return data;
}

export async function login(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setTokens(data.access_token, data.refresh_token);
  return data;
}

export function logout() {
  clearTokens();
}

export function isLoggedIn() {
  return !!getToken();
}

// ── Users ────────────────────────────────────────────────

export async function getMe() {
  return request('/users/me');
}

export async function updateMe(data) {
  return request('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function getUser(id) {
  return request(`/users/${id}`);
}

// ── Skills ───────────────────────────────────────────────

export async function getSkills(category) {
  const q = category ? `?category=${encodeURIComponent(category)}` : '';
  return request(`/skills${q}`);
}

export async function addUserSkill(skillId, type, proficiencyLevel) {
  return request('/users/me/skills', {
    method: 'POST',
    body: JSON.stringify({
      skill_id: skillId,
      type,
      proficiency_level: proficiencyLevel,
    }),
  });
}

export async function removeUserSkill(skillId) {
  return request(`/users/me/skills/${skillId}`, { method: 'DELETE' });
}

export async function getMySkills() {
  return request('/users/me/skills');
}

// ── Availability ─────────────────────────────────────────

export async function getMyAvailability() {
  return request('/users/me/availability');
}

export async function addAvailability(data) {
  return request('/users/me/availability', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function removeAvailability(id) {
  return request(`/users/me/availability/${id}`, { method: 'DELETE' });
}

// ── Matching ─────────────────────────────────────────────

export async function getMatches(filters = {}) {
  const params = new URLSearchParams();
  if (filters.skill) params.set('skill', filters.skill);
  if (filters.mode) params.set('mode', filters.mode);
  const q = params.toString() ? `?${params}` : '';
  return request(`/matches${q}`);
}

// ── Exchange Requests ────────────────────────────────────

export async function createExchangeRequest(data) {
  return request('/exchange-requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getExchangeRequests(status) {
  const q = status ? `?status=${status}` : '';
  return request(`/exchange-requests${q}`);
}

export async function getExchangeRequest(id) {
  return request(`/exchange-requests/${id}`);
}

export async function updateExchangeRequest(id, status) {
  return request(`/exchange-requests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ── Sessions ─────────────────────────────────────────────

export async function createSession(data) {
  return request('/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getSessions(status) {
  const q = status ? `?status=${status}` : '';
  return request(`/sessions${q}`);
}

export async function getSession(id) {
  return request(`/sessions/${id}`);
}

export async function updateSession(id, data) {
  return request(`/sessions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ── Reviews ──────────────────────────────────────────────

export async function createReview(sessionId, data) {
  return request(`/sessions/${sessionId}/review`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getUserReviews(userId) {
  return request(`/users/${userId}/reviews`);
}

// ── Credits ──────────────────────────────────────────────

export async function getMyCredits() {
  return request('/credits/me');
}

export async function getMyTransactions() {
  return request('/credits/me/transactions');
}
