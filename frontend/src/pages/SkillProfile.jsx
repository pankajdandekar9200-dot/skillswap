import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getSkills, addUserSkill, removeUserSkill, getMySkills, addAvailability, getMyAvailability, removeAvailability } from '../api';
import { CheckIcon, XIcon } from '../components/Icons';
import './SkillProfile.css';

const CATEGORIES = ['Tech', 'Design', 'Communication', 'Arts', 'Business', 'Academics'];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const TIMES = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

export default function SkillProfile() {
  const { refreshUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: teach, 2: learn, 3: availability
  const [catalog, setCatalog] = useState([]);
  const [mySkills, setMySkills] = useState([]);
  const [myAvail, setMyAvail] = useState([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [proficiency, setProficiency] = useState(50);
  const [loading, setLoading] = useState(true);

  // Availability form
  const [availForm, setAvailForm] = useState({ day: 'monday', start: '09:00', end: '11:00', mode: 'online' });

  useEffect(() => {
    Promise.all([getSkills(), getMySkills(), getMyAvailability()])
      .then(([skills, ms, av]) => {
        setCatalog(skills);
        setMySkills(ms);
        setMyAvail(av);
      })
      .catch(() => toast.error('Failed to load skills.'))
      .finally(() => setLoading(false));
  }, []);

  const handleAddSkill = async (skill, type) => {
    try {
      const result = await addUserSkill(skill.id, type, proficiency);
      setMySkills(prev => [...prev, result]);
      toast.success(`Added "${skill.name}" to your ${type === 'teach' ? 'teaching' : 'learning'} list!`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRemoveSkill = async (userSkillId) => {
    try {
      await removeUserSkill(userSkillId);
      setMySkills(prev => prev.filter(s => s.id !== userSkillId));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddAvail = async () => {
    try {
      const result = await addAvailability({
        day_of_week: availForm.day,
        start_time: availForm.start,
        end_time: availForm.end,
        mode: availForm.mode,
      });
      setMyAvail(prev => [...prev, result]);
      toast.success('Availability added!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRemoveAvail = async (id) => {
    try {
      await removeAvailability(id);
      setMyAvail(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleFinish = async () => {
    await refreshUser();
    toast.success('Profile complete! Let\'s find you some matches.');
    navigate('/discover');
  };

  const teachSkills = mySkills.filter(s => s.type === 'teach');
  const learnSkills = mySkills.filter(s => s.type === 'learn');

  const filteredCatalog = selectedCat
    ? catalog.filter(s => s.category === selectedCat)
    : catalog;

  const currentType = step === 1 ? 'teach' : 'learn';
  const currentSkills = step === 1 ? teachSkills : learnSkills;
  const addedIds = currentSkills.map(s => s.skill?.id || s.skill_id);

  if (loading) {
    return <div className="loading-page"><div className="spinner" /><p>Loading skills...</p></div>;
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="skill-profile-header text-center">
          <h1>{step <= 2 ? 'Build Your Skill Profile' : 'Set Your Availability'}</h1>
          <p>
            {step === 1 && 'What skills can you teach other students?'}
            {step === 2 && 'What skills do you want to learn?'}
            {step === 3 && 'When are you available for skill exchanges?'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="step-indicator mb-4" style={{ maxWidth: 300, margin: '0 auto var(--space-4)' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ display: 'contents' }}>
              <div className={`step-dot ${step === s ? 'active' : step > s ? 'completed' : ''}`}>
                {step > s ? <CheckIcon size={14} /> : s}
              </div>
              {s < 3 && <div className={`step-line ${step > s ? 'active' : ''}`} />}
            </div>
          ))}
        </div>

        {/* Steps 1 & 2: skill selection */}
        {step <= 2 && (
          <>
            {/* Current selections */}
            {currentSkills.length > 0 && (
              <div className="selected-skills mb-3">
                <h3 className="mb-1">{step === 1 ? 'Skills you teach' : 'Skills you want to learn'}</h3>
                <div className="flex flex-wrap gap-1">
                  {currentSkills.map(us => (
                    <span key={us.id} className={`skill-tag skill-tag-${(us.skill?.category || '').toLowerCase()} skill-tag-removable`}>
                      {us.skill?.name}
                      <button className="remove-btn" onClick={() => handleRemoveSkill(us.id)} aria-label={`Remove ${us.skill?.name}`}>
                        <XIcon size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Proficiency slider */}
            <div className="form-group mb-3">
              <label className="form-label">Your proficiency level: <strong>{proficiency}%</strong></label>
              <input
                type="range"
                min="0"
                max="100"
                value={proficiency}
                onChange={e => setProficiency(Number(e.target.value))}
                className="proficiency-slider"
                aria-label="Proficiency level"
              />
              <div className="flex justify-between" style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>
                <span>Beginner</span>
                <span>Expert</span>
              </div>
            </div>

            {/* Category filter */}
            <div className="category-filter mb-3">
              <button
                className={`btn btn-sm ${!selectedCat ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setSelectedCat('')}
              >
                All
              </button>
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  className={`btn btn-sm ${selectedCat === c ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setSelectedCat(c)}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Skill catalog */}
            <div className="skill-catalog">
              {filteredCatalog.map(skill => {
                const added = addedIds.includes(skill.id);
                return (
                  <button
                    key={skill.id}
                    className={`skill-catalog-item ${added ? 'added' : ''}`}
                    onClick={() => !added && handleAddSkill(skill, currentType)}
                    disabled={added}
                  >
                    <span className={`skill-tag skill-tag-${skill.category.toLowerCase()}`}>{skill.name}</span>
                    {added && <CheckIcon size={14} />}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Step 3: availability */}
        {step === 3 && (
          <>
            {myAvail.length > 0 && (
              <div className="mb-3">
                <h3 className="mb-2">Your availability</h3>
                <div className="avail-list">
                  {myAvail.map(a => (
                    <div key={a.id} className="avail-item card">
                      <div>
                        <strong style={{ textTransform: 'capitalize' }}>{a.day_of_week}</strong>
                        <span className="avail-time">{a.start_time} – {a.end_time}</span>
                        <span className="badge badge-brand">{a.mode}</span>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleRemoveAvail(a.id)} aria-label="Remove">
                        <XIcon size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card mb-3">
              <h3 className="mb-2">Add a time slot</h3>
              <div className="avail-form">
                <div className="form-group">
                  <label htmlFor="avail-day" className="form-label">Day</label>
                  <select id="avail-day" className="form-select" value={availForm.day} onChange={e => setAvailForm(p => ({ ...p, day: e.target.value }))}>
                    {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="avail-start" className="form-label">Start</label>
                  <select id="avail-start" className="form-select" value={availForm.start} onChange={e => setAvailForm(p => ({ ...p, start: e.target.value }))}>
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="avail-end" className="form-label">End</label>
                  <select id="avail-end" className="form-select" value={availForm.end} onChange={e => setAvailForm(p => ({ ...p, end: e.target.value }))}>
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="avail-mode" className="form-label">Mode</label>
                  <select id="avail-mode" className="form-select" value={availForm.mode} onChange={e => setAvailForm(p => ({ ...p, mode: e.target.value }))}>
                    <option value="online">Online</option>
                    <option value="in-person">In Person</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-secondary mt-2" onClick={handleAddAvail}>Add Time Slot</button>
            </div>
          </>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-4">
          {step > 1 ? (
            <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>Back</button>
          ) : <div />}
          {step < 3 ? (
            <button
              className="btn btn-primary"
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 ? teachSkills.length === 0 : learnSkills.length === 0}
            >
              {step === 1 ? 'Next: Skills to Learn' : 'Next: Availability'}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleFinish}>
              Find Matches
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
