// StudentDetail.js - Page for viewing individual student details and activity
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentService } from '../services/api';
import {
  FaUserGraduate,
  FaSpinner,
  FaExclamationCircle,
  FaEnvelope,
  FaCalendarAlt,
  FaClock,
  FaChartLine,
  FaEye,
  FaChalkboardTeacher,
  FaArrowLeft
} from 'react-icons/fa';
import '../styles/StudentDetail.css';

const StudentDetail = () => {
  const { id } = useParams();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudentData();
  }, [id]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const data = await studentService.getStudentById(id);
      setStudentData(data);
    } catch (err) {
      setError('Failed to load student data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <FaSpinner className="spinner" />
        <p>Loading student data...</p>
      </div>
    );
  }

  if (error || !studentData) {
    return (
      <div className="error-state">
        <FaExclamationCircle />
        <h2>Error Loading Data</h2>
        <p>{error || 'Student not found'}</p>
        <div className="error-actions">
          <button onClick={fetchStudentData} className="btn btn-primary">
            Try Again
          </button>
          <Link to="/students" className="btn btn-outline">
            <FaArrowLeft /> Back to Students
          </Link>
        </div>
      </div>
    );
  }

  const { student, stats } = studentData;

  return (
    <div className="student-detail-page">
      <div className="page-header">
        <Link to="/students" className="back-link">
          <FaArrowLeft /> Back to Students List
        </Link>
      </div>

      {/* Student Profile Card */}
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            <FaUserGraduate />
          </div>
          <div className="profile-info">
            <h1>{student.name || 'No Name'}</h1>
            <div className="profile-meta">
              <div className="meta-item">
                <FaEnvelope />
                <span>{student.email}</span>
              </div>
              <div className="meta-item">
                <FaCalendarAlt />
                <span>Registered: {new Date(student.createdAt).toLocaleDateString()}</span>
              </div>
              {student.lastLogin && (
                <div className="meta-item">
                  <FaClock />
                  <span>Last Login: {new Date(student.lastLogin).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
          <div className="profile-status">
            <span className={`status-badge ${student.active ? 'active' : 'inactive'}`}>
              {student.active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Activity Overview */}
      <div className="activity-overview">
        <h2>
          <FaChartLine /> Activity Overview
        </h2>
        
        <div className="activity-stats">
          <div className="activity-stat-card">
            <div className="stat-icon">
              <FaEye />
            </div>
            <div className="stat-details">
              <h3>Total Sessions</h3>
              <div className="stat-value">{stats.length}</div>
            </div>
          </div>
          
          <div className="activity-stat-card">
            <div className="stat-icon">
              <FaChalkboardTeacher />
            </div>
            <div className="stat-details">
              <h3>Presentations Viewed</h3>
              <div className="stat-value">
                {Array.from(new Set(stats.map(stat => stat.presentationId?._id))).length}
              </div>
            </div>
          </div>
          
          <div className="activity-stat-card">
            <div className="stat-icon">
              <FaClock />
            </div>
            <div className="stat-details">
              <h3>Total Time Spent</h3>
              <div className="stat-value">
                {stats.reduce((total, stat) => total + (stat.duration || 0), 0) / 60} min
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Usage History */}
      <div className="usage-history">
        <h2>
          <FaCalendarAlt /> Usage History
        </h2>
        
        {stats.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Presentation</th>
                  <th>Date</th>
                  <th>Duration</th>
                  <th>Slides Viewed</th>
                  <th>Completion</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat, index) => (
                  <tr key={index}>
                    <td>
                      {stat.presentationId ? (
                        <Link to={`/presentations/${stat.presentationId._id}`} className="presentation-link">
                          {stat.presentationId.title}
                        </Link>
                      ) : (
                        <span className="text-muted">Deleted Presentation</span>
                      )}
                    </td>
                    <td>{new Date(stat.startTime).toLocaleString()}</td>
                    <td>{Math.floor(stat.duration / 60)} min {stat.duration % 60} sec</td>
                    <td>{stat.slidesViewed || 0}</td>
                    <td>
                      <div className="completion-bar">
                        <div 
                          className="completion-progress" 
                          style={{ width: `${stat.completionPercentage || 0}%` }}
                        ></div>
                        <span className="completion-text">{stat.completionPercentage || 0}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No usage history found for this student.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDetail;