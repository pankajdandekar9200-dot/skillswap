import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getMatches, createExchangeRequest, getMySkills } from '../api';
import { getAvatarColor, getInitials } from '../components/Navbar';
import { StarIcon, SwapIcon, SearchIcon, VerifiedIcon, SendIcon } from '../components/Icons';
import './Discover.css';

export default function Discover() {
  const { user } = useAuth();
  const toast = useToast();
  const [matches, setMatches] = useState([]);
  const [mySkills, setMySkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ skill: '', mode: '' });
  const [requestModal, setRequestModal] = useState(null);
  const [requestMsg, setRequestMsg] = useState('');
  const [reqSkills, setReqSkills] = useState({ mine: '', theirs: '' });
  const [sending, setSending] = useState(false);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const [m, ms] = await Promise.all([
        getMatches(filters),
        getMySkills(),
      ]);
      setMatches(m);
      setMySkills(ms);
    } catch (err) {
      toast.error('Failed to load matches. Make sure you have skills set up.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleSearch = () => fetchMatches();

  const openRequestModal = (match) => {
    setRequestModal(match);
    setRequestMsg("Hey! I noticed we have complementary skills. I'd love to swap and learn from each other!");
    // Pre-select first available skills
    const myTeach = mySkills.filter(s => s.type === 'teach');
    const theirTeach = match.teaches || [];
    setReqSkills({
      mine: myTeach[0]?.skill?.id || '',
      theirs: theirTeach[0]?.id || '',
    });
  };

  const handleSendRequest = async () => {
    if (!reqSkills.mine || !reqSkills.theirs) {
      toast.error('Please select the skills to exchange.');
      return;
    }
    setSending(true);
    try {
      await createExchangeRequest({
        recipient_id: requestModal.user.id,
        requester_skill_id: Number(reqSkills.mine),
        recipient_skill_id: Number(reqSkills.theirs),
        message: requestMsg,
      });
      toast.success('Exchange request sent! They\'ll be notified.');
      setRequestModal(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const myTeachSkills = mySkills.filter(s => s.type === 'teach');

  return (
    <div className="page">
      <div className="container">
        <div className="discover-header">
          <div>
            <h1>Discover Matches</h1>
            <p>Students who have what you need — and need what you have</p>
          </div>
        </div>

        {/* Filters */}
        <div className="discover-filters card mb-4">
          <div className="filter-row">
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label htmlFor="filter-skill" className="form-label">Skill</label>
              <input
                id="filter-skill"
                className="form-input"
                placeholder="e.g. Python, Guitar..."
                value={filters.skill}
                onChange={e => setFilters(p => ({ ...p, skill: e.target.value }))}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="filter-mode" className="form-label">Mode</label>
              <select id="filter-mode" className="form-select" value={filters.mode} onChange={e => setFilters(p => ({ ...p, mode: e.target.value }))}>
                <option value="">Any</option>
                <option value="online">Online</option>
                <option value="in-person">In Person</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleSearch} style={{ alignSelf: 'flex-end' }}>
              <SearchIcon size={16} /> Search
            </button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="loading-page"><div className="spinner" /><p>Finding your best matches...</p></div>
        ) : matches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><SwapIcon size={64} /></div>
            <h3>No matches yet</h3>
            <p>Try adding more skills to your profile or adjusting your filters to find compatible peers.</p>
            <Link to="/skills" className="btn btn-primary">Update Your Skills</Link>
          </div>
        ) : (
          <div className="match-grid">
            {matches.map(match => (
              <div key={match.user.id} className="match-card card card-interactive">
                <div className="match-card-top">
                  <div
                    className="avatar avatar-lg"
                    style={{ background: getAvatarColor(match.user.name) }}
                  >
                    {match.user.profile_photo_url ? (
                      <img src={match.user.profile_photo_url} alt={match.user.name} />
                    ) : (
                      getInitials(match.user.name)
                    )}
                    {match.user.is_verified && (
                      <div className="avatar-indicator verified" title="Verified" />
                    )}
                  </div>
                  <div className="match-score badge badge-brand">
                    {Math.round(match.score)}% match
                  </div>
                </div>

                <h3 className="match-name">
                  {match.user.name}
                  {match.user.is_verified && <VerifiedIcon size={14} />}
                </h3>
                {match.user.college && <p className="match-college">{match.user.college}</p>}

                <div className="match-skills">
                  <div className="match-skill-section">
                    <span className="match-skill-label">Teaches</span>
                    <div className="flex flex-wrap gap-1">
                      {match.teaches.map(s => (
                        <span key={s.id} className={`skill-tag skill-tag-${s.category.toLowerCase()}`}>{s.name}</span>
                      ))}
                    </div>
                  </div>
                  <div className="match-skill-section">
                    <span className="match-skill-label">Wants to learn</span>
                    <div className="flex flex-wrap gap-1">
                      {match.wants_to_learn.map(s => (
                        <span key={s.id} className={`skill-tag skill-tag-${s.category.toLowerCase()}`}>{s.name}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {match.shared_availability > 0 && (
                  <p className="match-avail">{match.shared_availability} shared day{match.shared_availability > 1 ? 's' : ''} available</p>
                )}

                <div className="match-actions">
                  <Link to={`/user/${match.user.id}`} className="btn btn-ghost btn-sm">View Profile</Link>
                  <button className="btn btn-primary btn-sm" onClick={() => openRequestModal(match)}>
                    <SendIcon size={14} /> Send Request
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Request Modal */}
        {requestModal && (
          <div className="modal-overlay" onClick={() => setRequestModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2 className="mb-2">Send Exchange Request</h2>
              <p className="mb-3">Propose a skill swap with {requestModal.user.name}</p>

              <div className="form-group">
                <label htmlFor="req-my-skill" className="form-label">I'll teach</label>
                <select id="req-my-skill" className="form-select" value={reqSkills.mine} onChange={e => setReqSkills(p => ({ ...p, mine: e.target.value }))}>
                  <option value="">Select a skill...</option>
                  {myTeachSkills.map(s => (
                    <option key={s.skill?.id} value={s.skill?.id}>{s.skill?.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="req-their-skill" className="form-label">I want to learn</label>
                <select id="req-their-skill" className="form-select" value={reqSkills.theirs} onChange={e => setReqSkills(p => ({ ...p, theirs: e.target.value }))}>
                  <option value="">Select a skill...</option>
                  {(requestModal.teaches || []).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="req-message" className="form-label">Message (optional)</label>
                <textarea
                  id="req-message"
                  className="form-textarea"
                  value={requestMsg}
                  onChange={e => setRequestMsg(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-between">
                <button className="btn btn-ghost" onClick={() => setRequestModal(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSendRequest} disabled={sending}>
                  {sending ? 'Sending...' : 'Send Exchange Request'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
