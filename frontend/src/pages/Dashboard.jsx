import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getExchangeRequests, updateExchangeRequest, getSessions, getMyCredits } from '../api';
import { getAvatarColor, getInitials } from '../components/Navbar';
import { SwapIcon, CalendarIcon, CoinIcon, CheckIcon, ClockIcon, StarIcon, SearchIcon } from '../components/Icons';
import './Dashboard.css';

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getExchangeRequests(),
      getSessions(),
      getMyCredits(),
    ])
      .then(([reqs, sess, cred]) => {
        setRequests(reqs);
        setSessions(sess);
        setCredits(cred);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRequestAction = async (id, status) => {
    try {
      await updateExchangeRequest(id, status);
      toast.success(status === 'accepted' ? 'Request accepted! You can now schedule a session.' : 'Request declined.');
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      refreshUser();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const pendingReceived = requests.filter(r => r.status === 'pending' && r.recipient_id === user?.id);
  const activeExchanges = requests.filter(r => r.status === 'accepted');
  const upcomingSessions = sessions.filter(s => s.status === 'scheduled');
  const completedSessions = sessions.filter(s => s.status === 'completed');

  if (loading) {
    return <div className="loading-page"><div className="spinner" /><p>Loading your dashboard...</p></div>;
  }

  return (
    <div className="page">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1>Welcome back, {user?.name?.split(' ')[0]}!</h1>
            <p>Here's your skill exchange overview</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="stats-grid mb-4">
          <div className="stat-card card card-tint-peach">
            <div className="stat-icon"><SwapIcon size={28} /></div>
            <div className="stat-value">{activeExchanges.length}</div>
            <div className="stat-label">Active Exchanges</div>
          </div>
          <div className="stat-card card card-tint-blue">
            <div className="stat-icon"><CalendarIcon size={28} /></div>
            <div className="stat-value">{upcomingSessions.length}</div>
            <div className="stat-label">Upcoming Sessions</div>
          </div>
          <div className="stat-card card card-tint-lavender">
            <div className="stat-icon"><CheckIcon size={28} /></div>
            <div className="stat-value">{completedSessions.length}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card card card-tint-pink">
            <div className="stat-icon"><CoinIcon size={28} /></div>
            <div className="stat-value">{credits?.balance ?? user?.credit_balance ?? 0}</div>
            <div className="stat-label">Credits</div>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Pending requests */}
          <div className="dashboard-section">
            <h2 className="mb-2">
              <ClockIcon size={20} /> Pending Requests
              {pendingReceived.length > 0 && <span className="badge badge-warning ml-1">{pendingReceived.length}</span>}
            </h2>
            {pendingReceived.length === 0 ? (
              <div className="card" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                <p style={{ margin: 0 }}>No pending requests right now.</p>
              </div>
            ) : (
              <div className="request-list">
                {pendingReceived.map(r => (
                  <div key={r.id} className="request-card card">
                    <div className="request-top">
                      <div className="avatar" style={{ background: getAvatarColor(r.requester?.name) }}>
                        {getInitials(r.requester?.name)}
                      </div>
                      <div className="request-info">
                        <strong>{r.requester?.name}</strong>
                        <p className="request-skills">
                          Wants to swap: <span className="skill-tag skill-tag-communication" style={{fontSize: 11}}>{r.requester_skill?.name}</span>
                          {' '}for{' '}
                          <span className="skill-tag skill-tag-tech" style={{fontSize: 11}}>{r.recipient_skill?.name}</span>
                        </p>
                        {r.message && <p className="request-msg">{r.message}</p>}
                      </div>
                    </div>
                    <div className="request-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => handleRequestAction(r.id, 'accepted')}>Accept</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleRequestAction(r.id, 'declined')}>Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active exchanges */}
          <div className="dashboard-section">
            <h2 className="mb-2"><SwapIcon size={20} /> Active Exchanges</h2>
            {activeExchanges.length === 0 ? (
              <div className="card" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                <p style={{ margin: 0 }}>No active exchanges yet.</p>
                <Link to="/discover" className="btn btn-primary btn-sm mt-2">
                  <SearchIcon size={14} /> Find Matches
                </Link>
              </div>
            ) : (
              <div className="exchange-list">
                {activeExchanges.slice(0, 5).map(r => {
                  const partner = r.requester_id === user?.id ? r.recipient : r.requester;
                  return (
                    <div key={r.id} className="exchange-card card card-interactive">
                      <div className="flex items-center gap-2">
                        <div className="avatar avatar-sm" style={{ background: getAvatarColor(partner?.name) }}>
                          {getInitials(partner?.name)}
                        </div>
                        <div>
                          <strong>{partner?.name}</strong>
                          <p style={{ fontSize: 13, color: 'var(--ink-secondary)', margin: 0 }}>
                            {r.requester_skill?.name} ↔ {r.recipient_skill?.name}
                          </p>
                        </div>
                      </div>
                      <Link to={`/sessions?exchange=${r.id}`} className="btn btn-secondary btn-sm">
                        <CalendarIcon size={14} /> Schedule
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming sessions */}
        {upcomingSessions.length > 0 && (
          <div className="mt-4">
            <h2 className="mb-2"><CalendarIcon size={20} /> Upcoming Sessions</h2>
            <div className="session-list">
              {upcomingSessions.map(s => (
                <Link key={s.id} to={`/sessions`} className="session-card card card-interactive">
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={20} />
                    <div>
                      <strong>{new Date(s.scheduled_at).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
                      <p style={{ fontSize: 13, margin: 0, color: 'var(--ink-secondary)' }}>
                        {new Date(s.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · {s.duration_minutes}min · {s.mode}
                      </p>
                    </div>
                  </div>
                  <span className="badge badge-warning">Scheduled</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
