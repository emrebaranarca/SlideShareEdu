// Students.js - Page for managing student accounts
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentService } from '../services/api';
import {
  FaUserGraduate,
  FaUserPlus,
  FaSearch,
  FaEye,
  FaSpinner,
  FaTimesCircle,
  FaExclamationCircle,
  FaCheck,
  FaCalendarAlt
} from 'react-icons/fa';
import '../styles/Students.css';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Fetch students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await studentService.getAllStudents();
      setStudents(data);
    } catch (err) {
      setError('Failed to load students');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    setRegisterError('');
  };

  // Handle student registration
  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!registerForm.name.trim() || !registerForm.email.trim() || !registerForm.password) {
      setRegisterError('All fields are required');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerForm.email)) {
      setRegisterError('Please enter a valid email address');
      return;
    }
    
    // Validate password strength
    if (registerForm.password.length < 6) {
      setRegisterError('Password must be at least 6 characters');
      return;
    }
    
    setRegisterLoading(true);
    
    try {
      await studentService.createStudent(registerForm);
      
      // Show success message
      setRegisterSuccess(true);
      
      // Reset form
      setTimeout(() => {
        setRegisterForm({
          name: '',
          email: '',
          password: '',
        });
        setRegisterSuccess(false);
        setRegisterModalOpen(false);
        
        // Refresh students list
        fetchStudents();
      }, 2000);
    } catch (err) {
      setRegisterError(err.msg || 'Failed to register student');
    } finally {
      setRegisterLoading(false);
    }
  };

  if (loading && students.length === 0) {
    return (
      <div className="loading-state">
        <FaSpinner className="spinner" />
        <p>Loading students...</p>
      </div>
    );
  }

  return (
    <div className="students-page">
      <div className="page-header">
        <h1>Students</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => setRegisterModalOpen(true)}
        >
          <FaUserPlus /> Register New Student
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <FaExclamationCircle /> {error}
        </div>
      )}

      <div className="search-box">
        <FaSearch />
        <input
          type="text"
          placeholder="Search students by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="students-list">
        {filteredStudents.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Registered On</th>
                  <th>Last Login</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student._id}>
                    <td>
                      <div className="student-info">
                        <div className="student-avatar">
                          <FaUserGraduate />
                        </div>
                        <span>{student.name || 'No Name'}</span>
                      </div>
                    </td>
                    <td>{student.email}</td>
                    <td>
                      <div className="date-info">
                        <FaCalendarAlt />
                        {new Date(student.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      {student.lastLogin ? (
                        <div className="date-info">
                          <FaCalendarAlt />
                          {new Date(student.lastLogin).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-muted">Never</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${student.active ? 'active' : 'inactive'}`}>
                        {student.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link 
                          to={`/students/${student._id}`} 
                          className="action-btn view-btn"
                          title="View Details"
                        >
                          <FaEye />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>
              {searchTerm 
                ? `No students matching "${searchTerm}"`
                : 'No students available. Register your first student!'
              }
            </p>
            {!searchTerm && (
              <button 
                className="btn btn-primary mt-3" 
                onClick={() => setRegisterModalOpen(true)}
              >
                <FaUserPlus /> Register New Student
              </button>
            )}
          </div>
        )}
      </div>

      {/* Register Student Modal */}
      {registerModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Register New Student</h2>
              <button className="close-btn" onClick={() => setRegisterModalOpen(false)}>
                <FaTimesCircle />
              </button>
            </div>
            
            {registerError && (
              <div className="alert alert-error">
                <FaExclamationCircle /> {registerError}
              </div>
            )}
            
            {registerSuccess && (
              <div className="alert alert-success">
                <FaCheck /> Student registered successfully!
              </div>
            )}
            
            <form onSubmit={handleRegister} className="register-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={registerForm.name}
                  onChange={handleInputChange}
                  placeholder="Enter student's full name"
                  required
                  disabled={registerLoading || registerSuccess}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={registerForm.email}
                  onChange={handleInputChange}
                  placeholder="Enter student's email"
                  required
                  disabled={registerLoading || registerSuccess}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={registerForm.password}
                  onChange={handleInputChange}
                  placeholder="Enter a strong password"
                  required
                  disabled={registerLoading || registerSuccess}
                />
                <small className="form-hint">Password must be at least 6 characters</small>
              </div>
              
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setRegisterModalOpen(false)}
                  disabled={registerLoading || registerSuccess}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={registerLoading || registerSuccess}
                >
                  {registerLoading ? (
                    <>
                      <FaSpinner className="spinner" /> Registering...
                    </>
                  ) : (
                    <>
                      <FaUserPlus /> Register Student
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;