import { useState } from "react";
import { SidebarData } from "./SidebarData";
import companyLogo from "../assets/company-logo.png";
import { ChevronLeft, ChevronRight } from "lucide-react";

function Navbar() {
  const [isOpen, setIsOpen] = useState(true);

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
            {isOpen ? <ChevronLeft /> : <ChevronRight />}
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
        /* Reset any default margins and paddings */
        body {
          margin: 0;
          padding: 0;
        }

        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 240px;
          background-color: #2c3e50;
          color: white;
          transition: width 0.3s ease;
          z-index: 1000;
          margin: 0;
          padding: 0;
        }

        .sidebar.collapsed {
          width: 60px;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          padding: 12px;
          position: relative;
          margin: 0;
        }

        .logo {
          width: 32px;
          height: 32px;
          object-fit: contain;
          margin: 0;
        }

        .company-name {
          margin-left: 12px;
          font-size: 16px;
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
          right: -12px;
          top: 50%;
          transform: translateY(-50%);
          width: 24px;
          height: 24px;
          background: #2c3e50;
          border: none;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1001;
          padding: 0;
          margin: 0;
        }

        .nav-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .nav-item {
          display: flex;
          align-items: center;
          padding: 12px;
          cursor: pointer;
          transition: background-color 0.2s;
          margin: 0;
        }

        .nav-item:hover {
          background-color: #34495e;
        }

        .nav-item.active {
          background-color: #34495e;
        }

        .icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0;
        }

        .title {
          margin-left: 12px;
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

        /* Styles for the main content */
        #root {
          padding: 0;
          margin: 0;
        }

        main {
          margin-left: 240px;
          margin-top: 0;
          padding: 0;
          transition: margin-left 0.3s ease;
        }

        main.collapsed {
          margin-left: 60px;
        }
      `}</style>
    </>
  );
}

export default Navbar;