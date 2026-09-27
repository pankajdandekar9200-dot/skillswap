import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getMe, getUser, getUserReviews, updateMe } from '../api';
import { getAvatarColor, getInitials } from '../components/Navbar';
import { StarIcon, VerifiedIcon, CheckIcon, CoinIcon, CalendarIcon, SwapIcon } from '../components/Icons';
import './Profile.css';

export default function Profile() {
  const { userId } = useParams();
  const { user: authUser, refreshUser } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '', college: '' });

  const isOwn = !userId || Number(userId) === authUser?.id;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const p = isOwn ? await getMe() : await getUser(userId);
        setProfile(p);
        const r = await getUserReviews(p.id);
        setReviews(r);
        if (isOwn) {
          setEditForm({ name: p.name || '', bio: p.bio || '', college: p.college || '' });
        }
      } catch {
        toast.error('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  const handleSaveProfile = async () => {
    try {
      await updateMe(editForm);
      await refreshUser();
      const p = await getMe();
      setProfile(p);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading || !profile) {
    return <div className="loading-page"><div className="spinner" /><p>Loading profile...</p></div>;
  }

  const teachSkills = profile.user_skills?.filter(s => s.type === 'teach') || [];
  const learnSkills = profile.user_skills?.filter(s => s.type === 'learn') || [];

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 800 }}>
        {/* Profile header */}
        <div className="profile-header card">
          <div className="profile-header-top">
            <div className="avatar avatar-xl" style={{ background: getAvatarColor(profile.name) }}>
              {profile.profile_photo_url ? (
                <img src={profile.profile_photo_url} alt={profile.name} />
              ) : (
                getInitials(profile.name)
              )}
              {profile.is_verified && <div className="avatar-indicator verified" />}
            </div>

            <div className="profile-info">
              {editing ? (
                <div>
                  <div className="form-group">
                    <label htmlFor="edit-name" className="form-label">Name</label>
                    <input id="edit-name" className="form-input" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-college" className="form-label">College</label>
                    <input id="edit-college" className="form-input" value={editForm.college} onChange={e => setEditForm(p => ({ ...p, college: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-bio" className="form-label">Bio</label>
                    <textarea id="edit-bio" className="form-textarea" value={editForm.bio} onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))} rows={3} />
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-primary btn-sm" onClick={handleSaveProfile}>Save Changes</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="profile-name">
                    {profile.name}
                    {profile.is_verified && <VerifiedIcon size={20} />}
                  </h1>
                  {profile.college && <p className="profile-college">{profile.college}</p>}
                  {profile.bio && <p className="profile-bio">{profile.bio}</p>}
                  {isOwn && (
                    <button className="btn btn-secondary btn-sm mt-2" onClick={() => setEditing(true)}>
                      Edit Profile
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-stat-value">
                {profile.rating_avg ? `${profile.rating_avg.toFixed(1)} ★` : 'No ratings'}
              </span>
              <span className="profile-stat-label">Rating</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">{profile.completed_sessions}</span>
              <span className="profile-stat-label">Sessions</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">{profile.credit_balance}</span>
              <span className="profile-stat-label">Credits</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">{reviews.length}</span>
              <span className="profile-stat-label">Reviews</span>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="profile-section">
          <div className="grid grid-2">
            <div className="card">
              <h3 className="mb-2" style={{ color: 'var(--success)' }}>Skills I Teach</h3>
              {teachSkills.length === 0 ? (
                <p style={{ fontSize: 14 }}>No teaching skills listed yet.</p>
              ) : (
                <div className="profile-skill-list">
                  {teachSkills.map(us => (
                    <div key={us.id} className="profile-skill-item">
                      <span className={`skill-tag skill-tag-${(us.skill?.category || '').toLowerCase()}`}>{us.skill?.name}</span>
                      <div className="proficiency-bar" style={{ width: 80 }}>
                        <div className="proficiency-bar-fill" style={{ width: `${us.proficiency_level}%` }} />
                      </div>
                      <span className="sr-only">{us.proficiency_level}% proficiency</span>
                    </div>
                  ))}
                </div>
              )}
              {isOwn && <Link to="/skills" className="btn btn-ghost btn-sm mt-2">Manage Skills</Link>}
            </div>

            <div className="card">
              <h3 className="mb-2" style={{ color: 'var(--brand-brown)' }}>Skills I Want to Learn</h3>
              {learnSkills.length === 0 ? (
                <p style={{ fontSize: 14 }}>No learning goals listed yet.</p>
              ) : (
                <div className="profile-skill-list">
                  {learnSkills.map(us => (
                    <div key={us.id} className="profile-skill-item">
                      <span className={`skill-tag skill-tag-${(us.skill?.category || '').toLowerCase()}`}>{us.skill?.name}</span>
                      <div className="proficiency-bar" style={{ width: 80 }}>
                        <div className="proficiency-bar-fill" style={{ width: `${us.proficiency_level}%`, background: 'var(--warning)' }} />
                      </div>
                      <span className="sr-only">{us.proficiency_level}% current level</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="profile-section">
          <h2 className="mb-2">Reviews ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
              <p style={{ margin: 0 }}>No reviews yet. Complete sessions to get your first review!</p>
            </div>
          ) : (
            <div className="review-list">
              {reviews.map(r => (
                <div key={r.id} className="review-card card">
                  <div className="review-top">
                    <div className="flex items-center gap-2">
                      <div className="avatar avatar-sm" style={{ background: getAvatarColor(r.reviewer?.name) }}>
                        {getInitials(r.reviewer?.name)}
                      </div>
                      <div>
                        <strong>{r.reviewer?.name}</strong>
                        <div className="stars">
                          {[1, 2, 3, 4, 5].map(v => (
                            <span key={v} className={`star ${v <= r.rating ? 'filled' : ''}`}>★</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <small>{new Date(r.created_at).toLocaleDateString('en-IN')}</small>
                  </div>
                  {r.comment && <p className="review-comment">{r.comment}</p>}
                  {r.would_learn_again && (
                    <span className="badge badge-success"><CheckIcon size={12} /> Would learn again</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
