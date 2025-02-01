
import { SidebarData } from "./SidebarData";
import companyLogo from "../assets/company-logo.png";
import { ChevronLeft, ChevronRight } from "lucide-react";

// In Navbar.js

const Navbar = ({ isOpen, setIsOpen }) => {
  return (
    <>
      <nav className={`sidebar ${isOpen ? "expanded" : "collapsed"}`}>
        <div className="sidebar-header">
          <img src={companyLogo} alt="Company Logo" className="logo" />
          <h1 className="company-name">DineAd Connect</h1>
          <button 
            className="toggle-button"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        <ul className="nav-list">
          {SidebarData.map((val, key) => (
            <li
              key={key}
              className={`nav-item ${
                window.location.pathname === val.link ? "active" : ""
              }`}
              onClick={() => {
                window.location.pathname = val.link;
              }}
            >
              <div className="icon">{val.icon}</div>
              <div className="title">{val.title}</div>
            </li>
          ))}
        </ul>
      </nav>

      <style>{`
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 240px;
          background-color: #1e2a38;
          color: white;
          transition: all 0.3s ease;
          z-index: 1000;
        }

        .sidebar.collapsed {
          width: 60px;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          padding: 20px 16px;
          position: relative;
          background-color: #1e2a38;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .logo {
          width: 32px;
          height: 32px;
          object-fit: contain;
          flex-shrink: 0;
        }

        .company-name {
          margin-left: 12px;
          font-size: 18px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          opacity: 1;
          transition: opacity 0.3s ease;
        }

        .collapsed .company-name {
          opacity: 0;
          width: 0;
          margin: 0;
        }

        .toggle-button {
          position: absolute;
          right: -20px;
          top: 50%;
          transform: translateY(-50%);
          width: 40px;
          height: 40px;
          background: #1e2a38;
          border: none;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1001;
          box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
        }

        .nav-list {
          list-style: none;
          padding: 8px 0;
          margin: 0;
        }

        .nav-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          cursor: pointer;
          transition: background-color 0.2s;
          color: #a4b4cb;
        }

        .nav-item:hover {
          background-color: #2c3e50;
          color: white;
        }

        .nav-item.active {
          background-color: #2c3e50;
          color: white;
          border-left: 3px solid #3498db;
        }

        .icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .title {
          margin-left: 12px;
          font-size: 16px;
          white-space: nowrap;
          overflow: hidden;
          opacity: 1;
          transition: opacity 0.3s ease;
        }

        .collapsed .title {
          opacity: 0;
          width: 0;
          margin: 0;
        }

        @media screen and (max-width: 700px) {
          .sidebar {
            transform: translateX(0);
            width: 240px;
          }
          
          .sidebar.collapsed {
            transform: translateX(-240px);
          }

          .collapsed .company-name,
          .collapsed .title {
            opacity: 1;
            width: auto;
            margin-left: 12px;
          }

          .toggle-button {
            right: -20px;
          }

          .sidebar .toggle-button {
            transform: translateY(-50%);
          }

          .sidebar.collapsed .toggle-button {
            transform: translateY(-50%) translateX(240px);
            right: -40px;
          }
        }
      `}</style>
    </>
  );
};
export default Navbar;