import React, { useState } from 'react';
import { CgProfile } from "react-icons/cg";
import '../App.css'; // Ensure this includes the updated CSS
import { useNavigate } from 'react-router-dom';

function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Function to handle opening/closing the dropdown
  const toggleDropdown = () => setIsOpen(!isOpen);

  // Function to handle signout (example placeholder function)
  const handleSignout = () => {
    alert("Signed Out!");
    navigate('/');
    // Implement signout logic here, e.g., clearing user data or redirecting to Home page
  };

  return (
    <div className="profile-container" onClick={toggleDropdown}>
      <CgProfile className="profile-icon" />
      <span className="profile-name">Garrett</span>
      {isOpen && (
        <div className="dropdown-menu">
          <button onClick={handleSignout} className="dropdown-item">
            Signout
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileDropdown;
