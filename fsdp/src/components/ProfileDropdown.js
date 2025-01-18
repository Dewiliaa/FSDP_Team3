import React, { useState, useEffect } from 'react';
import { CgProfile } from 'react-icons/cg';
import { BiLogOutCircle } from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';

function ProfileDropdown({ setIsAuthenticated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Get username from localStorage
    const storedUsername = localStorage.getItem('currentUsername');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const handleSignout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('rememberedUsername');
    localStorage.removeItem('currentUsername'); // Clear username on logout
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <div 
      style={{ 
        position: 'absolute', 
        top: '10px', 
        right: '20px',
        zIndex: 1000
      }}
    >
      <div 
        onMouseEnter={() => setIsOpen(true)}
        className="profile-button"
        style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#2563eb',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '25px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <CgProfile size={24} />
        <span>{username}</span>
      </div>

      {isOpen && (
        <div 
          onMouseLeave={() => setIsOpen(false)}
          onMouseEnter={() => setIsOpen(true)}
          style={{
            position: 'absolute',
            top: '120%',
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '8px',
            marginTop: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            minWidth: '150px',
            animation: 'fadeIn 0.2s ease-in-out'
          }}
        >
          <button 
            onClick={handleSignout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '10px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderRadius: '8px',
              color: '#ef4444',
              transition: 'background-color 0.2s ease'
            }}
          >
            <BiLogOutCircle size={20} />
            Logout
          </button>
        </div>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .profile-button:hover {
            background-color: #1d4ed8;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          }

          button:hover {
            background-color: #fee2e2 !important;
          }
        `}
      </style>
    </div>
  );
}

export default ProfileDropdown;