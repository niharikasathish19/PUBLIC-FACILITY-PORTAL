import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

const theme = {
  bg: '#F9F6F0',          // Soft warm linen background
  cardBg: '#FFFFFF',      // Card white
  panelBg: '#F1E9DC',     // Rich warm sand
  primary: '#5C493B',     // Deep roasted mocha
  primaryDark: '#36281E', // Very dark rich espresso for main title
  accent: '#9A6B4C',      // Deep terracotta clay for ratings
  textMain: '#241B15',    // Near-black dark brown for primary text
  textMuted: '#4E4036',   // Significantly darker readable brown for descriptions/locations
  border: '#DFD3C3',      // Defined warm beige border
  borderActive: '#8C674E',
  danger: '#8E382E',      // Dark terracotta for delete
  dangerBg: '#F8EAE7',
  inputBg: '#FCFAF7'
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  const [isRegister, setIsRegister] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authRole, setAuthRole] = useState('user');

  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [facilityFeedbacks, setFacilityFeedbacks] = useState([]);

  const [newFacName, setNewFacName] = useState('');
  const [newFacCategory, setNewFacCategory] = useState('Park');
  const [newFacAddress, setNewFacAddress] = useState('');
  const [newFacCity, setNewFacCity] = useState('');

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      const res = await fetch(`${API_BASE}/facilities`);
      const data = await res.json();
      setFacilities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setMessage('Failed to connect to backend on port 5000.');
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setMessage('');

    const endpoint = isRegister ? '/register' : '/login';
    const payload = isRegister
      ? { name: authName, email: authEmail, password: authPassword, role: authRole }
      : { email: authEmail, password: authPassword };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Auth failed');

      if (isRegister) {
        setMessage('Registration successful! Please login.');
        setIsRegister(false);
      } else {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setMessage(`Logged in as ${data.user.name}`);
      }
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setMessage('Logged out successfully.');
  };

  const handleSelectFacility = async (fac) => {
    setSelectedFacility(fac);
    try {
      const res = await fetch(`${API_BASE}/feedback/${fac._id}`);
      const data = await res.json();
      setFacilityFeedbacks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setMessage('Please log in to submit feedback!');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          facilityId: selectedFacility._id,
          rating: Number(rating),
          comment
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed');

      setMessage('Feedback submitted successfully!');
      setComment('');
      handleSelectFacility(selectedFacility);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleAddFacility = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/facilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFacName,
          category: newFacCategory,
          address: newFacAddress,
          city: newFacCity
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error adding facility');

      setMessage('New facility added!');
      setNewFacName('');
      setNewFacAddress('');
      setNewFacCity('');
      fetchFacilities();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleDeleteFacility = async (id) => {
    if (!window.confirm('Delete this facility?')) return;
    try {
      await fetch(`${API_BASE}/facilities/${id}`, { method: 'DELETE' });
      fetchFacilities();
      if (selectedFacility?._id === id) setSelectedFacility(null);
    } catch (err) {
      console.error(err);
    }
  };

  const inputStyle = {
    padding: '10px 14px',
    backgroundColor: theme.inputBg,
    color: theme.textMain,
    border: `1.5px solid ${theme.border}`,
    borderRadius: '6px',
    outline: 'none',
    fontSize: '14px',
    fontWeight: '500'
  };

  const primaryBtnStyle = {
    padding: '10px 20px',
    backgroundColor: theme.primary,
    color: '#FAF8F5',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'background 0.2s'
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: theme.bg,
      color: theme.textMain,
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      padding: '30px 40px',
      boxSizing: 'border-box'
    }}>
      {/* Title Header with increased font size and darker colors */}
      <div style={{ textAlign: 'center', marginBottom: '35px' }}>
        <h1 style={{
          margin: '0 0 10px 0',
          fontSize: '44px',           // Enlarged title
          fontWeight: '800',
          color: theme.primaryDark,   // Dark espresso brown
          letterSpacing: '-0.5px'
        }}>
          🏛️ Public Facility Portal
        </h1>
        <p style={{
          margin: 0,
          color: theme.textMuted,      // Darker rich brown
          fontSize: '17px',
          fontWeight: '500'
        }}>
          A unified civic feedback system for reporting maintenance and rating public spaces.
        </p>
      </div>

      {/* Status Notification */}
      {message && (
        <div style={{
          width: '100%',
          padding: '12px 20px',
          backgroundColor: theme.panelBg,
          border: `1.5px solid ${theme.borderActive}`,
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px',
          fontWeight: '600',
          color: theme.primaryDark
        }}>
          {message}
        </div>
      )}

      {/* Auth Bar */}
      <div style={{
        width: '100%',
        backgroundColor: theme.cardBg,
        padding: '18px 24px',
        borderRadius: '10px',
        border: `1.5px solid ${theme.border}`,
        marginBottom: '30px',
        boxShadow: '0 3px 10px rgba(54, 40, 30, 0.05)'
      }}>
        {user ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '16px', color: theme.textMain, fontWeight: '500' }}>
              Signed in as <strong style={{ color: theme.primaryDark }}>{user.name}</strong> ({user.role})
            </span>
            <button
              onClick={handleLogout}
              style={{
                ...primaryBtnStyle,
                backgroundColor: theme.panelBg,
                color: theme.primaryDark,
                border: `1.5px solid ${theme.border}`
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <form onSubmit={handleAuth} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontWeight: '700', color: theme.primaryDark, fontSize: '16px' }}>
              {isRegister ? 'Register' : 'Login'}:
            </span>
            {isRegister && (
              <>
                <input
                  type="text"
                  placeholder="Name"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  style={inputStyle}
                  required
                />
                <select value={authRole} onChange={(e) => setAuthRole(e.target.value)} style={inputStyle}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </>
            )}
            <input
              type="email"
              placeholder="Email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              style={inputStyle}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              style={inputStyle}
              required
            />
            <button type="submit" style={primaryBtnStyle}>
              {isRegister ? 'Sign Up' : 'Log In'}
            </button>
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              style={{
                background: 'none',
                border: 'none',
                color: theme.primaryDark,
                fontWeight: '600',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '14px',
                marginLeft: '6px'
              }}
            >
              {isRegister ? 'Already registered? Login' : "Don't have an account? Register"}
            </button>
          </form>
        )}
      </div>

      {/* Main Grid Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(350px, 1fr) minmax(400px, 1.2fr)',
        gap: '30px',
        alignItems: 'start'
      }}>
        {/* Left Column: Facilities */}
        <div>
          <h3 style={{
            marginTop: 0,
            marginBottom: '16px',
            color: theme.primaryDark,
            fontSize: '22px',
            fontWeight: '700'
          }}>
            📍 Public Facilities
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {facilities.length === 0 && (
              <div style={{
                padding: '30px',
                textAlign: 'center',
                color: theme.textMuted,
                border: `1.5px dashed ${theme.border}`,
                borderRadius: '8px',
                fontWeight: '500'
              }}>
                No facilities registered yet.
              </div>
            )}
            {facilities.map((fac) => (
              <div
                key={fac._id}
                onClick={() => handleSelectFacility(fac)}
                style={{
                  backgroundColor: theme.cardBg,
                  border: selectedFacility?._id === fac._id ? `2px solid ${theme.borderActive}` : `1.5px solid ${theme.border}`,
                  padding: '18px 20px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(54, 40, 30, 0.05)',
                  transition: 'all 0.15s ease-in-out'
                }}
              >
                <h4 style={{ margin: '0 0 6px 0', fontSize: '18px', color: theme.primaryDark, fontWeight: '700' }}>
                  {fac.name} <span style={{ fontSize: '13px', color: theme.textMuted, fontWeight: '600' }}>({fac.category})</span>
                </h4>
                <p style={{ margin: '0 0 14px 0', fontSize: '14px', color: theme.textMuted, fontWeight: '500' }}>
                  {fac.address}, {fac.city}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectFacility(fac);
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: selectedFacility?._id === fac._id ? theme.primary : theme.panelBg,
                      color: selectedFacility?._id === fac._id ? '#FAF8F5' : theme.primaryDark,
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    {selectedFacility?._id === fac._id ? 'Selected' : 'View Reviews'}
                  </button>
                  {user?.role === 'admin' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFacility(fac._id);
                      }}
                      style={{
                        backgroundColor: theme.dangerBg,
                        color: theme.danger,
                        border: 'none',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Admin Add Facility Form */}
          {user?.role === 'admin' && (
            <div style={{
              marginTop: '30px',
              padding: '22px',
              backgroundColor: theme.cardBg,
              border: `1.5px dashed ${theme.borderActive}`,
              borderRadius: '10px'
            }}>
              <h4 style={{ margin: '0 0 16px 0', color: theme.primaryDark, fontSize: '18px', fontWeight: '700' }}>
                ➕ Add Facility (Admin)
              </h4>
              <form onSubmit={handleAddFacility} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Facility Name"
                  value={newFacName}
                  onChange={(e) => setNewFacName(e.target.value)}
                  style={inputStyle}
                  required
                />
                <select
                  value={newFacCategory}
                  onChange={(e) => setNewFacCategory(e.target.value)}
                  style={inputStyle}
                >
                  <option value="Park">Park</option>
                  <option value="Hospital">Hospital</option>
                  <option value="Restroom">Restroom</option>
                  <option value="Library">Library</option>
                  <option value="Bus Stop">Bus Stop</option>
                  <option value="Car Wash">Car Wash</option>
                </select>
                <input
                  type="text"
                  placeholder="Address"
                  value={newFacAddress}
                  onChange={(e) => setNewFacAddress(e.target.value)}
                  style={inputStyle}
                  required
                />
                <input
                  type="text"
                  placeholder="City"
                  value={newFacCity}
                  onChange={(e) => setNewFacCity(e.target.value)}
                  style={inputStyle}
                  required
                />
                <button type="submit" style={primaryBtnStyle}>Create Facility</button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Feedback */}
        <div>
          {selectedFacility ? (
            <div style={{
              backgroundColor: theme.cardBg,
              padding: '24px 28px',
              borderRadius: '10px',
              border: `1.5px solid ${theme.border}`,
              boxShadow: '0 3px 10px rgba(54, 40, 30, 0.05)'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '18px', color: theme.primaryDark, fontSize: '22px', fontWeight: '700' }}>
                Reviews: {selectedFacility.name}
              </h3>

              {token ? (
                <form
                  onSubmit={handleFeedbackSubmit}
                  style={{
                    padding: '18px',
                    backgroundColor: theme.panelBg,
                    borderRadius: '8px',
                    marginBottom: '24px'
                  }}
                >
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: theme.primaryDark, fontWeight: '700' }}>
                    Leave Feedback
                  </h4>
                  <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ fontSize: '14px', color: theme.primaryDark, fontWeight: '600' }}>Rating (1 to 5):</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      style={{ ...inputStyle, width: '60px' }}
                      required
                    />
                  </div>
                  <textarea
                    rows="3"
                    placeholder="Share your experience or report an issue..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    style={{ ...inputStyle, width: '100%', resize: 'vertical', marginBottom: '12px', boxSizing: 'border-box' }}
                    required
                  />
                  <button type="submit" style={primaryBtnStyle}>Submit Review</button>
                </form>
              ) : (
                <div style={{
                  padding: '14px',
                  backgroundColor: theme.panelBg,
                  borderRadius: '8px',
                  marginBottom: '24px',
                  color: theme.primaryDark,
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  💡 Please log in above to submit a review or rating.
                </div>
              )}

              {/* Reviews List */}
              <div>
                <h4 style={{ fontSize: '17px', color: theme.primaryDark, marginBottom: '14px', fontWeight: '700' }}>
                  Community Reviews ({facilityFeedbacks.length})
                </h4>
                {facilityFeedbacks.length === 0 && (
                  <p style={{ color: theme.textMuted, fontSize: '14px', fontWeight: '500' }}>
                    No reviews submitted for this facility yet.
                  </p>
                )}
                {facilityFeedbacks.map((item) => (
                  <div
                    key={item._id}
                    style={{
                      borderBottom: `1px solid ${theme.border}`,
                      padding: '14px 0'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '700', color: theme.textMain }}>{item.userName}</span>
                      <span style={{ color: theme.accent, fontSize: '14px', fontWeight: '700' }}>★ {item.rating}/5</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', color: theme.textMuted, lineHeight: '1.5', fontWeight: '500' }}>
                      {item.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              minHeight: '320px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.cardBg,
              border: `1.5px dashed ${theme.border}`,
              borderRadius: '10px',
              color: theme.textMuted,
              fontSize: '16px',
              fontWeight: '500',
              textAlign: 'center',
              padding: '30px'
            }}>
              Select a facility from the left column to read reviews or leave feedback.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}