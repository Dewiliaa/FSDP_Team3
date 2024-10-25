import React, { useState } from 'react';
import { CgProfile } from 'react-icons/cg';
import { BiLogOutCircle } from 'react-icons/bi';
import '../App.css';
import { useNavigate } from 'react-router-dom';

function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClose, setIsClose] = useState(false);
  const navigate = useNavigate();

  // Function to handle opening/closing the dropdown
  const toggleDropdown = () => {
    if (isOpen) {
      setIsClose(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsClose(false);
      }, 300); 
    } else {
      setIsOpen(true);
    }
  };

  // Function to handle signout
  const handleSignout = () => {
    alert('Signed Out!');
    navigate('/');
  };

  return (
    <div className="profile-container" onClick={toggleDropdown}>
      <CgProfile className="profile-icon" />
      <span className="profile-name">Garrett</span>
      {isOpen && (
        <div className={`dropdown-menu ${isClose ? 'fade-out' : ''}`}>
          <button onClick={handleSignout} className="dropdown-item">
            <BiLogOutCircle className="dropdown-icon" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileDropdown;
