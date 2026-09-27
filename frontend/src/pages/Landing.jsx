import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SwapIcon, StarIcon, CheckIcon, BookIcon, SearchIcon, UserIcon, CalendarIcon, CoinIcon, SendIcon } from '../components/Icons';
import './Landing.css';

const CATEGORIES = [
  { name: 'Tech', emoji: '💻', color: 'var(--card-tint-blue)', skills: ['Python', 'JavaScript', 'React', 'Machine Learning'] },
  { name: 'Design', emoji: '🎨', color: 'var(--card-tint-lavender)', skills: ['Graphic Design', 'UI/UX', 'Figma', 'Photography'] },
  { name: 'Communication', emoji: '🎤', color: 'var(--card-tint-peach)', skills: ['Public Speaking', 'Debate', 'Academic Writing'] },
  { name: 'Arts', emoji: '🎸', color: 'var(--card-tint-pink)', skills: ['Guitar', 'Piano', 'Sketching', 'Video Editing'] },
  { name: 'Business', emoji: '📈', color: '#E5EFE9', skills: ['Marketing', 'Entrepreneurship', 'Financial Literacy'] },
  { name: 'Academics', emoji: '📚', color: '#EDE9E4', skills: ['Calculus', 'Physics', 'Statistics', 'Linear Algebra'] },
];

const STEPS = [
  { icon: <UserIcon />, title: 'Create your profile', desc: 'Sign up with your college email and tell us about yourself.' },
  { icon: <BookIcon />, title: 'List your skills', desc: 'Add skills you can teach and skills you want to learn.' },
  { icon: <SearchIcon />, title: 'Get matched', desc: 'Our algorithm finds peers who complement your learning goals.' },
  { icon: <SendIcon />, title: 'Send a request', desc: 'Reach out to a match and propose a skill exchange.' },
  { icon: <CalendarIcon />, title: 'Book a session', desc: 'Schedule a time that works for both of you.' },
  { icon: <SwapIcon size={22} />, title: 'Swap skills', desc: 'Meet up (online or in person) and learn from each other.' },
  { icon: <CheckIcon />, title: 'Complete & earn', desc: 'Mark the session done to earn credits for your teaching.' },
  { icon: <StarIcon filled />, title: 'Rate & review', desc: 'Share your experience to help others find great partners.' },
  { icon: <CoinIcon size={22} />, title: 'Keep growing', desc: 'Use credits for more sessions. The more you teach, the more you learn.' },
];

const VALUE_PROPS = [
  { title: 'No money required', desc: 'Exchange skills, not cash. Teaching earns credits you spend on learning.', icon: '🤝' },
  { title: 'Smart matching', desc: 'Our algorithm pairs you with students who have exactly what you need.', icon: '🎯' },
  { title: 'Verified students', desc: 'Every profile shows ratings, completed sessions, and verification status.', icon: '✅' },
  { title: 'Flexible scheduling', desc: 'Meet online or in person, whenever works for both of you.', icon: '📅' },
  { title: 'Build your reputation', desc: 'Reviews and badges showcase your teaching skills to the community.', icon: '🌟' },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="landing">
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-content">
            <h1 className="hero-title">
              Share Skills.<br />
              Learn Together.<br />
              <span className="hero-accent">Grow as Students.</span>
            </h1>
            <p className="hero-subtitle">
              SkillSwap connects college students who want to teach what they know
              and learn what they don't — no money, just mutual growth.
            </p>
            <div className="hero-actions">
              {user ? (
                <Link to="/dashboard" className="btn btn-primary btn-lg">Go to Dashboard</Link>
              ) : (
                <>
                  <Link to="/signup" className="btn btn-primary btn-lg">Start Swapping Skills</Link>
                  <Link to="/login" className="btn btn-secondary btn-lg">I have an account</Link>
                </>
              )}
            </div>
            <p className="hero-note">Join 500+ students already learning from each other</p>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hero-swap-animation">
              <div className="hero-card hero-card-teach card-tint-peach">
                <span className="hero-card-label">I can teach</span>
                <span className="hero-card-skill">Python</span>
              </div>
              <div className="hero-swap-icon">
                <SwapIcon size={40} />
              </div>
              <div className="hero-card hero-card-learn card-tint-blue">
                <span className="hero-card-label">I want to learn</span>
                <span className="hero-card-skill">Guitar</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────── */}
      <section className="section" id="how-it-works">
        <div className="container">
          <h2 className="section-title text-center">How SkillSwap Works</h2>
          <p className="section-subtitle text-center">Nine simple steps from signup to skill mastery</p>

          <div className="steps-grid">
            {STEPS.map((step, i) => (
              <div key={i} className="step-card card card-interactive">
                <div className="step-number">{String(i + 1).padStart(2, '0')}</div>
                <div className="step-icon">{step.icon}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Value Props ──────────────────────────────────── */}
      <section className="section section-alt">
        <div className="container">
          <h2 className="section-title text-center">Why Students Love SkillSwap</h2>
          <div className="value-grid">
            {VALUE_PROPS.map((vp, i) => (
              <div key={i} className="value-card card">
                <span className="value-emoji">{vp.icon}</span>
                <h3>{vp.title}</h3>
                <p>{vp.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Skill Categories ─────────────────────────────── */}
      <section className="section">
        <div className="container">
          <h2 className="section-title text-center">Explore Skill Categories</h2>
          <p className="section-subtitle text-center">From coding to guitar — find your next learning adventure</p>
          <div className="category-grid">
            {CATEGORIES.map((cat, i) => (
              <div key={i} className="category-card card card-interactive" style={{ background: cat.color }}>
                <span className="category-emoji">{cat.emoji}</span>
                <h3>{cat.name}</h3>
                <div className="category-skills">
                  {cat.skills.map(s => (
                    <span key={s} className={`skill-tag skill-tag-${cat.name.toLowerCase()}`}>{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="section section-cta">
        <div className="container text-center">
          <h2>Ready to start learning?</h2>
          <p className="section-subtitle">Create your free account in under a minute.</p>
          {user ? (
            <Link to="/discover" className="btn btn-primary btn-lg">Find Your Match</Link>
          ) : (
            <Link to="/signup" className="btn btn-primary btn-lg">Create Free Account</Link>
          )}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <div className="navbar-logo">
              <SwapIcon size={24} />
              <span>SkillSwap</span>
            </div>
            <p>Share Skills · Learn Together · Grow as Students</p>
          </div>
          <div className="footer-links">
            <a href="#how-it-works">How It Works</a>
            <Link to="/signup">Sign Up</Link>
            <Link to="/login">Log In</Link>
          </div>
          <div className="footer-copy">
            <small>© 2026 SkillSwap. Built for students, by students.</small>
          </div>
        </div>
      </footer>
    </div>
  );
}
