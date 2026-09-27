import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getSessions, updateSession, createSession, getExchangeRequests, createReview } from '../api';
import { getAvatarColor, getInitials } from '../components/Navbar';
import { CalendarIcon, CheckIcon, ClockIcon, StarIcon, XIcon } from '../components/Icons';
import './Sessions.css';

export default function Sessions() {
  const { user } = useAuth();
  const toast = useToast();
  const [sessions, setSessions] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');
  const [scheduleModal, setScheduleModal] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ date: '', time: '10:00', duration: 60, mode: 'online', link: '' });
  const [reviewForm, setReviewForm] = useState({ rating: 5, teaching_quality: 5, knowledge: 5, communication: 5, would_learn_again: true, comment: '' });

  const fetchData = async () => {
    try {
      const [sess, exch] = await Promise.all([getSessions(), getExchangeRequests('accepted')]);
      setSessions(sess);
      setExchanges(exch);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const upcoming = sessions.filter(s => s.status === 'scheduled');
  const completed = sessions.filter(s => s.status === 'completed');
  const other = sessions.filter(s => s.status !== 'scheduled' && s.status !== 'completed');

  const handleComplete = async (id) => {
    try {
      await updateSession(id, { status: 'completed' });
      toast.success('Session marked complete! Credits awarded.');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleForm.date) {
      toast.error('Please select a date.');
      return;
    }
    try {
      const scheduled_at = `${scheduleForm.date}T${scheduleForm.time}:00`;
      await createSession({
        exchange_request_id: scheduleModal.id,
        scheduled_at,
        duration_minutes: scheduleForm.duration,
        mode: scheduleForm.mode,
        meeting_link_or_location: scheduleForm.link || null,
      });
      toast.success('Session scheduled!');
      setScheduleModal(null);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReview = async () => {
    try {
      await createReview(reviewModal.id, reviewForm);
      toast.success('Review submitted! Thank you for your feedback.');
      setReviewModal(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return <div className="loading-page"><div className="spinner" /><p>Loading sessions...</p></div>;
  }

  const displaySessions = tab === 'upcoming' ? upcoming : tab === 'completed' ? completed : other;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 800 }}>
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1>Sessions</h1>
            <p>Manage your skill exchange sessions</p>
          </div>
          {exchanges.length > 0 && (
            <button className="btn btn-primary" onClick={() => setScheduleModal(exchanges[0])}>
              <CalendarIcon size={16} /> Schedule Session
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="session-tabs mb-3">
          {[
            { key: 'upcoming', label: 'Upcoming', count: upcoming.length },
            { key: 'completed', label: 'Completed', count: completed.length },
            { key: 'other', label: 'Other', count: other.length },
          ].map(t => (
            <button
              key={t.key}
              className={`session-tab ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label} {t.count > 0 && <span className="badge badge-brand">{t.count}</span>}
            </button>
          ))}
        </div>

        {/* Session list */}
        {displaySessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><CalendarIcon size={64} /></div>
            <h3>No {tab} sessions</h3>
            <p>
              {tab === 'upcoming'
                ? 'Schedule a session from an accepted exchange request.'
                : 'Completed sessions will appear here.'}
            </p>
          </div>
        ) : (
          <div className="session-list-full">
            {displaySessions.map(s => {
              const er = s.exchange_request;
              const partner = er
                ? (er.requester_id === user?.id ? er.recipient : er.requester)
                : null;

              return (
                <div key={s.id} className="session-detail-card card">
                  <div className="session-detail-top">
                    <div className="flex items-center gap-2">
                      {partner && (
                        <div className="avatar" style={{ background: getAvatarColor(partner?.name) }}>
                          {getInitials(partner?.name)}
                        </div>
                      )}
                      <div>
                        <strong>{partner?.name || 'Partner'}</strong>
                        <p style={{ fontSize: 13, color: 'var(--ink-secondary)', margin: 0 }}>
                          {er?.requester_skill?.name} ↔ {er?.recipient_skill?.name}
                        </p>
                      </div>
                    </div>
                    <span className={`badge badge-${s.status === 'scheduled' ? 'warning' : s.status === 'completed' ? 'success' : 'danger'}`}>
                      {s.status}
                    </span>
                  </div>

                  <div className="session-detail-meta">
                    <div className="session-meta-item">
                      <CalendarIcon size={16} />
                      <span>{new Date(s.scheduled_at).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="session-meta-item">
                      <ClockIcon size={16} />
                      <span>{new Date(s.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · {s.duration_minutes} min</span>
                    </div>
                    <div className="session-meta-item">
                      <span className="badge badge-brand">{s.mode}</span>
                    </div>
                    {s.meeting_link_or_location && (
                      <div className="session-meta-item">
                        <a href={s.meeting_link_or_location} target="_blank" rel="noopener noreferrer">
                          Join meeting
                        </a>
                      </div>
                    )}
                  </div>

                  {s.status === 'scheduled' && (
                    <div className="session-detail-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => handleComplete(s.id)}>
                        <CheckIcon size={14} /> Mark Complete
                      </button>
                    </div>
                  )}

                  {s.status === 'completed' && (
                    <div className="session-detail-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => setReviewModal(s)}>
                        <StarIcon size={14} /> Leave Review
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Schedule Modal */}
        {scheduleModal && (
          <div className="modal-overlay" onClick={() => setScheduleModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2 className="mb-2">Schedule a Session</h2>

              <div className="form-group">
                <label htmlFor="sched-exchange" className="form-label">Exchange</label>
                <select id="sched-exchange" className="form-select" value={scheduleModal.id} onChange={e => {
                  const ex = exchanges.find(x => x.id === Number(e.target.value));
                  if (ex) setScheduleModal(ex);
                }}>
                  {exchanges.map(ex => (
                    <option key={ex.id} value={ex.id}>
                      {ex.requester_skill?.name} ↔ {ex.recipient_skill?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="sched-date" className="form-label">Date</label>
                <input id="sched-date" type="date" className="form-input" value={scheduleForm.date} onChange={e => setScheduleForm(p => ({ ...p, date: e.target.value }))} />
              </div>

              <div className="form-group">
                <label htmlFor="sched-time" className="form-label">Time</label>
                <input id="sched-time" type="time" className="form-input" value={scheduleForm.time} onChange={e => setScheduleForm(p => ({ ...p, time: e.target.value }))} />
              </div>

              <div className="form-group">
                <label htmlFor="sched-duration" className="form-label">Duration (minutes)</label>
                <select id="sched-duration" className="form-select" value={scheduleForm.duration} onChange={e => setScheduleForm(p => ({ ...p, duration: Number(e.target.value) }))}>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                  <option value={90}>90 min</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="sched-link" className="form-label">Meeting link or location</label>
                <input id="sched-link" className="form-input" placeholder="https://meet.google.com/..." value={scheduleForm.link} onChange={e => setScheduleForm(p => ({ ...p, link: e.target.value }))} />
              </div>

              <div className="flex gap-2 justify-between">
                <button className="btn btn-ghost" onClick={() => setScheduleModal(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSchedule}>Book Session</button>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {reviewModal && (
          <div className="modal-overlay" onClick={() => setReviewModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2 className="mb-2">Leave a Review</h2>
              <p className="mb-3">How was your learning experience?</p>

              {['rating', 'teaching_quality', 'knowledge', 'communication'].map(field => (
                <div key={field} className="form-group">
                  <label className="form-label" style={{ textTransform: 'capitalize' }}>{field.replace('_', ' ')}</label>
                  <div className="stars stars-input">
                    {[1, 2, 3, 4, 5].map(v => (
                      <span
                        key={v}
                        className={`star ${v <= reviewForm[field] ? 'filled' : ''}`}
                        onClick={() => setReviewForm(p => ({ ...p, [field]: v }))}
                        role="button"
                        aria-label={`${v} star${v > 1 ? 's' : ''}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              <div className="form-group">
                <label className="form-label">
                  <input
                    type="checkbox"
                    checked={reviewForm.would_learn_again}
                    onChange={e => setReviewForm(p => ({ ...p, would_learn_again: e.target.checked }))}
                    style={{ marginRight: 8 }}
                  />
                  I would learn from this person again
                </label>
              </div>

              <div className="form-group">
                <label htmlFor="review-comment" className="form-label">Comment</label>
                <textarea id="review-comment" className="form-textarea" value={reviewForm.comment} onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))} placeholder="Share your experience..." rows={3} />
              </div>

              <div className="flex gap-2 justify-between">
                <button className="btn btn-ghost" onClick={() => setReviewModal(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleReview}>Submit Review</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
