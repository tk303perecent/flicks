import React, { useState } from 'react';
import { FiX, FiImage } from 'react-icons/fi';

const EditMovieModal = ({ isOpen, onClose, movie, onSave }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    watched_on: '',
    title: '',
    rating_megan: '',
    rating_alex: '',
    rating_tim: '',
    description: '',
    poster_filename: ''
  });

  // Reset form when modal opens with new movie
  React.useEffect(() => {
    if (movie) {
      setFormData({
        watched_on: movie.watched_on || '',
        title: movie.title || '',
        rating_megan: movie.rating_megan?.toString() || '',
        rating_alex: movie.rating_alex?.toString() || '',
        rating_tim: movie.rating_tim?.toString() || '',
        description: movie.description || '',
        poster_filename: movie.poster_filename || ''
      });
      setError(null);
    }
  }, [movie]);

  if (!isOpen || !movie) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const updatedData = {
        ...formData,
        rating_megan: formData.rating_megan === '' ? null : parseFloat(formData.rating_megan),
        rating_alex: formData.rating_alex === '' ? null : parseFloat(formData.rating_alex),
        rating_tim: formData.rating_tim === '' ? null : parseFloat(formData.rating_tim),
        description: formData.description.trim() || null,
        poster_filename: formData.poster_filename.trim() || null
      };

      await onSave(movie.id, updatedData);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-navbar-grey rounded-lg shadow-xl max-w-3xl w-full relative max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Edit Movie Entry</h2>
          <button
            onClick={onClose}
            className="text-medium-text hover:text-light-text transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Date */}
              <div>
                <label htmlFor="edit-date" className="block text-sm font-medium text-medium-text mb-1">
                  Date Watched
                </label>
                <input
                  type="date"
                  id="edit-date"
                  value={formData.watched_on}
                  onChange={(e) => setFormData(prev => ({ ...prev, watched_on: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md bg-pleasant-grey border border-gray-600 text-light-text focus:outline-none focus:ring-1 focus:ring-accent-teal appearance-none"
                  required
                />
              </div>

              {/* Title */}
              <div>
                <label htmlFor="edit-title" className="block text-sm font-medium text-medium-text mb-1">
                  Movie Title
                </label>
                <input
                  type="text"
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md bg-pleasant-grey border border-gray-600 text-light-text focus:outline-none focus:ring-1 focus:ring-accent-teal"
                  required
                />
              </div>

              {/* Ratings */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-medium-text">Ratings</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="edit-rating-megan" className="block text-xs text-medium-text mb-1">Meg</label>
                    <input
                      type="number"
                      id="edit-rating-megan"
                      step="0.1"
                      min="0"
                      max="10"
                      value={formData.rating_megan}
                      onChange={(e) => setFormData(prev => ({ ...prev, rating_megan: e.target.value }))}
                      placeholder="-"
                      className="w-full px-3 py-2 rounded-md bg-pleasant-grey border border-gray-600 text-light-text focus:outline-none focus:ring-1 focus:ring-accent-teal"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-rating-alex" className="block text-xs text-medium-text mb-1">Alec</label>
                    <input
                      type="number"
                      id="edit-rating-alex"
                      step="0.1"
                      min="0"
                      max="10"
                      value={formData.rating_alex}
                      onChange={(e) => setFormData(prev => ({ ...prev, rating_alex: e.target.value }))}
                      placeholder="-"
                      className="w-full px-3 py-2 rounded-md bg-pleasant-grey border border-gray-600 text-light-text focus:outline-none focus:ring-1 focus:ring-accent-teal"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-rating-tim" className="block text-xs text-medium-text mb-1">Tim</label>
                    <input
                      type="number"
                      id="edit-rating-tim"
                      step="0.1"
                      min="0"
                      max="10"
                      value={formData.rating_tim}
                      onChange={(e) => setFormData(prev => ({ ...prev, rating_tim: e.target.value }))}
                      placeholder="-"
                      className="w-full px-3 py-2 rounded-md bg-pleasant-grey border border-gray-600 text-light-text focus:outline-none focus:ring-1 focus:ring-accent-teal"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Description */}
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-medium-text mb-1">
                  Your Description
                </label>
                <textarea
                  id="edit-description"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md bg-pleasant-grey border border-gray-600 text-light-text focus:outline-none focus:ring-1 focus:ring-accent-teal"
                />
              </div>

              {/* Poster */}
              <div>
                <label htmlFor="edit-poster" className="block text-sm font-medium text-medium-text mb-1">
                  Poster Image
                </label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      id="edit-poster"
                      value={formData.poster_filename}
                      onChange={(e) => setFormData(prev => ({ ...prev, poster_filename: e.target.value }))}
                      placeholder="e.g., movie_poster.jpg"
                      className="w-full px-3 py-2 rounded-md bg-pleasant-grey border border-gray-600 text-light-text focus:outline-none focus:ring-1 focus:ring-accent-teal"
                    />
                    <p className="mt-1 text-xs text-gray-400">Filename from /public/images/movie_jackets/</p>
                  </div>
                  {formData.poster_filename && (
                    <div className="w-24 h-36 bg-pleasant-grey rounded-md overflow-hidden flex items-center justify-center">
                      <img
                        src={`/images/movie_jackets/${formData.poster_filename}`}
                        alt="Poster preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '';
                          e.target.className = 'hidden';
                          e.target.parentElement.innerHTML = '<div class="text-medium-text text-xs text-center p-2">Invalid image</div>';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded-md text-red-400 text-sm">
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-medium-text hover:text-light-text transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-accent-teal hover:bg-accent-teal-hover text-white font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditMovieModal;