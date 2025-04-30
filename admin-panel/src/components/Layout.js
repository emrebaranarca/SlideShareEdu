// Layout.js - Main Layout Component with Sidebar and Header
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Layout.css';

// Import icons
import { 
  FaChalkboardTeacher, 
  FaUserGraduate, 
  FaChartBar, 
  FaTachometerAlt,
  FaSignOutAlt,
  FaBars,
  FaTimes
} from 'react-icons/fa';

const Layout = ({ children, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const closeSidebar = () => {
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  };
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>TiklaOgren</h2>
          <button className="close-sidebar" onClick={toggleSidebar}>
            <FaTimes />
          </button>
        </div>
        <div className="sidebar-content">
          <ul className="sidebar-menu">
            <li className={isActive('/dashboard') ? 'active' : ''}>
              <Link to="/dashboard" onClick={closeSidebar}>
                <FaTachometerAlt /> Dashboard
              </Link>
            </li>
            <li className={isActive('/presentations') ? 'active' : ''}>
              <Link to="/presentations" onClick={closeSidebar}>
                <FaChalkboardTeacher /> Presentations
              </Link>
            </li>
            <li className={isActive('/students') ? 'active' : ''}>
              <Link to="/students" onClick={closeSidebar}>
                <FaUserGraduate /> Students
              </Link>
            </li>
            <li className={isActive('/statistics') ? 'active' : ''}>
              <Link to="/statistics" onClick={closeSidebar}>
                <FaChartBar /> Statistics
              </Link>
            </li>
          </ul>
        </div>
        <div className="sidebar-footer">
          <button className="logout-button" onClick={onLogout}>
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main">
        {/* Header */}
        <header className="header">
          <button className="toggle-sidebar" onClick={toggleSidebar}>
            <FaBars />
          </button>
          <div className="page-title">
            {location.pathname === '/dashboard' && 'Dashboard'}
            {location.pathname === '/presentations' && 'Presentations'}
            {location.pathname.includes('/presentations/') && 'Presentation Details'}
            {location.pathname === '/students' && 'Students'}
            {location.pathname.includes('/students/') && 'Student Details'}
            {location.pathname === '/statistics' && 'Statistics'}
          </div>
          <div className="header-actions">
            <button className="logout-button-header" onClick={onLogout}>
              <FaSignOutAlt /> Sign Out
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="content" onClick={closeSidebar}>
          <div className="container">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;