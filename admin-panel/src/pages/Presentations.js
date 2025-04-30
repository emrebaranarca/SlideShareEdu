// Presentations.js - Page for managing presentations
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { presentationService } from '../services/api';
import {
  FaPlus,
  FaEdit,
  FaTrashAlt,
  FaEye,
  FaSpinner,
  FaSearch,
  FaFileUpload,
  FaTimesCircle,
  FaExclamationCircle,
  FaCheck
} from 'react-icons/fa';
import '../styles/Presentations.css';

const Presentations = () => {
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    isPublished: true,
    file: null
  });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    presentationId: null,
    presentationTitle: ''
  });

  // Fetch presentations on component mount
  useEffect(() => {
    fetchPresentations();
  }, []);

  const fetchPresentations = async () => {
    try {
      setLoading(true);
      const data = await presentationService.getAllPresentations();
      setPresentations(data);
    } catch (err) {
      setError('Failed to load presentations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter presentations based on search term
  const filteredPresentations = presentations.filter(presentation => 
    presentation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    presentation.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      setUploadForm(prev => ({ ...prev, file: files[0] }));
    } else if (type === 'checkbox') {
      setUploadForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setUploadForm(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    setUploadError('');
  };

  // Handle presentation upload
  const handleUpload = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!uploadForm.title.trim()) {
      setUploadError('Title is required');
      return;
    }
    
    if (!uploadForm.file) {
      setUploadError('Please select a PowerPoint file');
      return;
    }
    
    setUploadLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('presentation', uploadForm.file);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('isPublished', uploadForm.isPublished);
      
      await presentationService.uploadPresentation(formData);
      
      // Reset form and close modal
      setUploadForm({
        title: '',
        description: '',
        isPublished: true,
        file: null
      });
      setUploadModalOpen(false);
      
      // Refresh presentations list
      fetchPresentations();
    } catch (err) {
      setUploadError(err.msg || 'Failed to upload presentation');
    } finally {
      setUploadLoading(false);
    }
  };

  // Handle presentation deletion
  const handleDelete = async () => {
    try {
      await presentationService.deletePresentation(deleteModal.presentationId);
      
      // Close modal and refresh presentations
      setDeleteModal({ isOpen: false, presentationId: null, presentationTitle: '' });
      fetchPresentations();
    } catch (err) {
      setError('Failed to delete presentation');
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (id, title) => {
    setDeleteModal({
      isOpen: true,
      presentationId: id,
      presentationTitle: title
    });
  };

  if (loading && presentations.length === 0) {
    return (
      <div className="loading-state">
        <FaSpinner className="spinner" />
        <p>Loading presentations...</p>
      </div>
    );
  }

  return (
    <div className="presentations-page">
      <div className="page-header">
        <h1>Presentations</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => setUploadModalOpen(true)}
        >
          <FaPlus /> Upload Presentation
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
          placeholder="Search presentations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="presentations-list">
        {filteredPresentations.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Upload Date</th>
                  <th>Slides</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPresentations.map(presentation => (
                  <tr key={presentation._id}>
                    <td>
                      <Link to={`/presentations/${presentation._id}`} className="presentation-title">
                        {presentation.title}
                      </Link>
                    </td>
                    <td>{new Date(presentation.uploadDate).toLocaleDateString()}</td>
                    <td>{presentation.slideCount}</td>
                    <td>
                      <span className={`status-badge ${presentation.isPublished ? 'published' : 'unpublished'}`}>
                        {presentation.isPublished ? 'Published' : 'Unpublished'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link 
                          to={`/presentations/${presentation._id}`} 
                          className="action-btn view-btn"
                          title="View Details"
                        >
                          <FaEye />
                        </Link>
                        <Link 
                          to={`/presentations/${presentation._id}`} 
                          className="action-btn edit-btn"
                          title="Edit"
                        >
                          <FaEdit />
                        </Link>
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => openDeleteModal(presentation._id, presentation.title)}
                          title="Delete"
                        >
                          <FaTrashAlt />
                        </button>
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
                ? `No presentations matching "${searchTerm}"`
                : 'No presentations available. Upload your first presentation!'
              }
            </p>
            {!searchTerm && (
              <button 
                className="btn btn-primary mt-3" 
                onClick={() => setUploadModalOpen(true)}
              >
                <FaFileUpload /> Upload Presentation
              </button>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Upload Presentation</h2>
              <button className="close-btn" onClick={() => setUploadModalOpen(false)}>
                <FaTimesCircle />
              </button>
            </div>
            
            {uploadError && (
              <div className="alert alert-error">
                <FaExclamationCircle /> {uploadError}
              </div>
            )}
            
            <form onSubmit={handleUpload} className="upload-form">
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={uploadForm.title}
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
                  value={uploadForm.description}
                  onChange={handleInputChange}
                  placeholder="Enter presentation description"
                  rows="4"
                />
              </div>
              
              <div className="form-group">
                <div className="file-upload">
                  <label htmlFor="file">
                    <FaFileUpload /> Choose PowerPoint File
                  </label>
                  <input
                    type="file"
                    id="file"
                    name="file"
                    onChange={handleInputChange}
                    accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    required
                  />
                  {uploadForm.file && (
                                          <div className="selected-file">
                      <span>{uploadForm.file.name}</span>
                      <button 
                        type="button" 
                        onClick={() => setUploadForm(prev => ({ ...prev, file: null }))}
                        title="Clear selection"
                      >
                        <FaTimesCircle />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="isPublished"
                  name="isPublished"
                  checked={uploadForm.isPublished}
                  onChange={handleInputChange}
                />
                <label htmlFor="isPublished">
                  Publish immediately (make available to students)
                </label>
              </div>
              
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setUploadModalOpen(false)}
                  disabled={uploadLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={uploadLoading}
                >
                  {uploadLoading ? (
                    <>
                      <FaSpinner className="spinner" /> Uploading...
                    </>
                  ) : (
                    <>
                      <FaCheck /> Upload Presentation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal delete-modal">
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete the presentation: <strong>{deleteModal.presentationTitle}</strong>?
              </p>
              <p className="warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-outline" 
                onClick={() => setDeleteModal({ isOpen: false, presentationId: null, presentationTitle: '' })}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Presentations;