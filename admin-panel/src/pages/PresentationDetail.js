// PresentationDetail.js - Page for viewing and editing individual presentation details
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { presentationService } from '../services/api';
import {
  FaChalkboardTeacher,
  FaSpinner,
  FaExclamationCircle,
  FaCalendarAlt,
  FaEdit,
  FaTrashAlt,
  FaSave,
  FaTimes,
  FaFileDownload,
  FaEye,
  FaArrowLeft,
  FaCheck
} from 'react-icons/fa';
import '../styles/PresentationDetail.css';

const PresentationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [presentation, setPresentation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublished: true
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPresentationData();
  }, [id]);

  // Reset form data when presentation data changes
  useEffect(() => {
    if (presentation) {
      setFormData({
        title: presentation.title || '',
        description: presentation.description || '',
        isPublished: presentation.isPublished
      });
    }
  }, [presentation]);

  const fetchPresentationData = async () => {
    try {
      setLoading(true);
      const data = await presentationService.getPresentationById(id);
      setPresentation(data);
    } catch (err) {
      setError('Failed to load presentation data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setSaveError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.title.trim()) {
      setSaveError('Title is required');
      return;
    }
    
    setSaving(true);
    
    try {
      const updatedPresentation = await presentationService.updatePresentation(id, formData);
      setPresentation(updatedPresentation);
      setEditMode(false);
    } catch (err) {
      setSaveError(err.msg || 'Failed to update presentation');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    
    try {
      await presentationService.deletePresentation(id);
      // Redirect to presentations list after successful deletion
      navigate('/presentations');
    } catch (err) {
      setError('Failed to delete presentation');
      setDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <FaSpinner className="spinner" />
        <p>Loading presentation data...</p>
      </div>
    );
  }

  if (error || !presentation) {
    return (
      <div className="error-state">
        <FaExclamationCircle />
        <h2>Error Loading Data</h2>
        <p>{error || 'Presentation not found'}</p>
        <div className="error-actions">
          <button onClick={fetchPresentationData} className="btn btn-primary">
            Try Again
          </button>
          <Link to="/presentations" className="btn btn-outline">
            <FaArrowLeft /> Back to Presentations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="presentation-detail-page">
      <div className="page-header">
        <Link to="/presentations" className="back-link">
          <FaArrowLeft /> Back to Presentations List
        </Link>
        
        {!editMode && (
          <div className="header-actions">
            <button className="btn btn-outline" onClick={() => setEditMode(true)}>
              <FaEdit /> Edit
            </button>
            <button className="btn btn-danger" onClick={() => setDeleteModal(true)}>
              <FaTrashAlt /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Presentation Detail Card */}
      <div className="presentation-card">
        {editMode ? (
          // Edit Form
          <form onSubmit={handleSubmit} className="edit-form">
            <div className="form-header">
              <h2>Edit Presentation</h2>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setEditMode(false)}
                  disabled={saving}
                >
                  <FaTimes /> Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <FaSpinner className="spinner" /> Saving...
                    </>
                  ) : (
                    <>
                      <FaSave /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {saveError && (
              <div className="alert alert-error">
                <FaExclamationCircle /> {saveError}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter presentation title"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description (Optional)</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter presentation description"
                rows="4"
              />
            </div>
            
            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="isPublished"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleInputChange}
              />
              <label htmlFor="isPublished">
                Published (visible to students)
              </label>
            </div>
          </form>
        ) : (
          // View Mode
          <>
            <div className="presentation-header">
              <div className="presentation-icon">
                <FaChalkboardTeacher />
              </div>
              <div className="presentation-title">
                <h1>{presentation.title}</h1>
                <div className="presentation-meta">
                  <span className={`status-badge ${presentation.isPublished ? 'published' : 'unpublished'}`}>
                    {presentation.isPublished ? 'Published' : 'Unpublished'}
                  </span>
                  <div className="meta-item">
                    <FaCalendarAlt />
                    <span>Uploaded: {new Date(presentation.uploadDate).toLocaleDateString()}</span>
                  </div>
                  <div className="meta-item">
                    <FaEye />
                    <span>Slides: {presentation.slideCount}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {presentation.description && (
              <div className="presentation-description">
                <h3>Description</h3>
                <p>{presentation.description}</p>
              </div>
            )}
            
            <div className="presentation-actions">
              <a 
                href={`/api/download/${presentation.fileName}`} 
                className="btn btn-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaFileDownload /> Download Presentation
              </a>
            </div>
          </>
        )}
      </div>

      {/* Student Usage Statistics */}
      <div className="usage-stats">
        <h2>
          <FaEye /> Student Usage Statistics
        </h2>
        
        <div className="card">
          <p className="placeholder-text">
            Student usage statistics for this presentation will be displayed here. This will include:
          </p>
          <ul className="feature-list">
            <li>Number of students who viewed this presentation</li>
            <li>Average completion percentage</li>
            <li>Average time spent on this presentation</li>
            <li>Most viewed slides</li>
          </ul>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="modal-overlay">
          <div className="modal delete-modal">
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete the presentation: <strong>{presentation.title}</strong>?
              </p>
              <p className="warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-outline" 
                onClick={() => setDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <FaSpinner className="spinner" /> Deleting...
                  </>
                ) : (
                  <>
                    <FaTrashAlt /> Yes, Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentationDetail;