// Dashboard.js - Main dashboard page with overview statistics
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsService } from '../services/api';
import { 
  FaUserGraduate, 
  FaChalkboardTeacher, 
  FaEye,
  FaChartLine,
  FaSpinner
} from 'react-icons/fa';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalPresentations: 0,
    activeStudentsCount: 0,
    mostViewedPresentations: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await statsService.getOverallStats();
        setStats(data);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <FaSpinner className="spinner" />
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <FaUserGraduate />
          </div>
          <div className="stat-info">
            <h3>Total Students</h3>
            <div className="number">{stats.totalStudents}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <FaChalkboardTeacher />
          </div>
          <div className="stat-info">
            <h3>Total Presentations</h3>
            <div className="number">{stats.totalPresentations}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <FaChartLine />
          </div>
          <div className="stat-info">
            <h3>Active Students</h3>
            <div className="number">{stats.activeStudentsCount}</div>
            <div className="stat-subtitle">Last 30 days</div>
          </div>
        </div>
      </div>
      
      {/* Most Viewed Presentations */}
      <div className="card most-viewed-card">
        <div className="card-header">
          <h2 className="card-title">
            <FaEye /> Most Viewed Presentations
          </h2>
          <Link to="/presentations" className="btn btn-outline">
            View All
          </Link>
        </div>
        
        <div className="card-body">
          {stats.mostViewedPresentations && stats.mostViewedPresentations.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>View Count</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.mostViewedPresentations.map((presentation, index) => (
                    <tr key={index}>
                      <td>{presentation.title}</td>
                      <td>{presentation.viewCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No presentation data available yet.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to="/presentations" className="action-button">
            <FaChalkboardTeacher />
            <span>Manage Presentations</span>
          </Link>
          <Link to="/students" className="action-button">
            <FaUserGraduate />
            <span>Manage Students</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;