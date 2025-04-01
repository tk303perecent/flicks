// src/components/EditMovieModal.jsx
import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiXCircle, FiSave, FiMessageSquare } from 'react-icons/fi'; // Added FiMessageSquare for visual cue

// Helper Function (Unchanged)
const formatDateForInput = (date) => {
    // ... (function remains the same) ...
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date + 'T00:00:00Z') : new Date(date);
    if (isNaN(d.getTime())) {
        console.warn("Invalid date received in formatDateForInput:", date);
        const d2 = new Date(date);
         if (isNaN(d2.getTime())) return '';
         date = d2;
    } else {
        date = d;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}


function EditMovieModal({ isOpen, onClose, movie, onSave }) {
  // --- Internal State ---
  const [watchedOn, setWatchedOn] = useState('');
  const [title, setTitle] = useState('');
  const [ratingMegan, setRatingMegan] = useState('');
  const [ratingAlex, setRatingAlex] = useState('');
  const [ratingTim, setRatingTim] = useState('');
  const [description, setDescription] = useState('');
  const [posterFilename, setPosterFilename] = useState('');
  // --- NEW: State for comments ---
  const [commentMegan, setCommentMegan] = useState('');
  const [commentAlex, setCommentAlex] = useState('');
  const [commentTim, setCommentTim] = useState('');
  // -----------------------------
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // --- Effect to populate form ---
  useEffect(() => {
    if (movie) {
      setWatchedOn(formatDateForInput(movie.watched_on) || '');
      setTitle(movie.title || '');
      setRatingMegan(movie.rating_megan?.toString() ?? '');
      setRatingAlex(movie.rating_alex?.toString() ?? '');
      setRatingTim(movie.rating_tim?.toString() ?? '');
      setDescription(movie.description || '');
      setPosterFilename(movie.poster_filename || '');
      // --- NEW: Populate comment state ---
      setCommentMegan(movie.comment_megan || ''); // Populate from movie object
      setCommentAlex(movie.comment_alex || '');   // Populate from movie object
      setCommentTim(movie.comment_tim || '');     // Populate from movie object
      // ---------------------------------
      setError(null);
      setIsSubmitting(false);
    } else {
      // Reset form if no movie data
      setWatchedOn('');
      setTitle('');
      setRatingMegan('');
      setRatingAlex('');
      setRatingTim('');
      setDescription('');
      setPosterFilename('');
      // --- NEW: Reset comment state ---
      setCommentMegan('');
      setCommentAlex('');
      setCommentTim('');
      // ------------------------------
      setError(null);
      setIsSubmitting(false);
    }
  }, [movie, isOpen]); // Dependency array includes movie and isOpen


  // --- Form submission handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!movie?.id) return;

    setError(null);

    // --- Validation (Unchanged section) ---
    if (!title.trim()) {
        setError("Movie Title cannot be empty.");
        return;
    }
    const filenameValue = posterFilename.trim();
    if (filenameValue && !filenameValue.includes('.')) {
        setError("Poster filename should include an extension (e.g., .jpg).");
        return;
    }
    const ratings = [
        ratingMegan === '' ? null : parseFloat(ratingMegan),
        ratingAlex === '' ? null : parseFloat(ratingAlex),
        ratingTim === '' ? null : parseFloat(ratingTim)
    ];
    if (ratings.some(r => r !== null && (isNaN(r) || r < 0 || r > 10))) {
        setError("Ratings must be a number between 0 and 10.");
        return;
    }
    // --- End Validation ---

    setIsSubmitting(true);

    const updatedData = {
        title: title.trim(),
        rating_megan: ratings[0],
        rating_alex: ratings[1],
        rating_tim: ratings[2],
        description: description.trim() || null,
        poster_filename: filenameValue || null,
        // watched_on: watchedOn, // Only if date editing is enabled

        // --- NEW: Add comments to the data being saved ---
        comment_megan: commentMegan.trim() || null, // Use DB column name
        comment_alex: commentAlex.trim() || null,   // Use DB column name
        comment_tim: commentTim.trim() || null,     // Use DB column name
        // -----------------------------------------------
    };

    try {
      // onSave in FlicksClub already handles passing updatedData to Supabase
      await onSave(movie.id, updatedData);
      // If successful, the parent component (FlicksClub) usually closes the modal
    } catch (err) {
      setError(err.message || "Failed to save changes. Please try again.");
      setIsSubmitting(false); // Keep modal open on error
    }
    // No 'finally' needed here if parent handles closure on success
  };

  // --- Render the modal ---
  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-[70]" onClose={() => !isSubmitting && onClose()}>
        {/* Backdrop */}
        <Transition.Child
          as={React.Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal Content Container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              {/* Dialog Panel */}
              <Dialog.Panel className="w-full max-w-md sm:max-w-lg transform rounded-lg bg-pleasant-grey p-4 sm:p-6 text-left align-middle shadow-xl transition-all border border-gray-600 flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="flex justify-between items-start mb-4">
                  <Dialog.Title as="h3" className="text-base sm:text-lg font-medium leading-6 text-white flex-grow pr-2">
                    Edit: <span className="italic font-normal">{title || movie?.title || 'Movie Log'}</span>
                  </Dialog.Title>
                  <button
                      type="button" onClick={() => !isSubmitting && onClose()} disabled={isSubmitting}
                      className="text-medium-text hover:text-light-text text-2xl focus:outline-none disabled:opacity-50 p-1 -m-1"
                      aria-label="Close modal"
                  > <FiXCircle/> </button>
                </div>

                {/* --- Edit Form --- */}
                {/* Added form attribute for associating save button */}
                <form id="editMovieModalForm" onSubmit={handleSubmit} className="flex-grow overflow-y-auto space-y-4 pb-4 pr-1 custom-scrollbar">

                  {/* Error Message Display */}
                  {error && <p className="text-sm text-red-400 bg-red-900/20 p-3 rounded-md mb-4">{error}</p>}

                  {/* Title Input (Unchanged) */}
                  <div>
                      <label htmlFor="editTitle" className="block text-xs sm:text-sm font-medium text-medium-text mb-1">Title</label>
                      <input
                          type="text" id="editTitle" value={title} onChange={e => setTitle(e.target.value)}
                          className="w-full px-3 py-2 rounded-md bg-navbar-grey border border-gray-600 text-light-text text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-accent-teal" required
                      />
                  </div>

                  {/* Description Textarea (Unchanged) */}
                  <div>
                      <label htmlFor="editDescription" className="block text-xs sm:text-sm font-medium text-medium-text mb-1">General Description</label>
                      <textarea
                          id="editDescription" rows="4" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add/edit general notes/summary..."
                          className="w-full px-3 py-2 rounded-md bg-navbar-grey border border-gray-600 text-light-text text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-accent-teal"
                      />
                  </div>

                  {/* --- NEW: Comments Section --- */}
                  <div className="space-y-3 pt-2 border-t border-gray-700/50">
                     <h4 className="text-sm font-semibold text-accent-teal flex items-center gap-2"><FiMessageSquare size={16}/> User Comments</h4>
                     {/* Meg's Comment */}
                     <div>
                         <label htmlFor="editCommentMegan" className="block text-xs sm:text-sm font-medium text-medium-text mb-1">Meg's Comment</label>
                         <textarea
                            id="editCommentMegan" rows="3" value={commentMegan} onChange={e => setCommentMegan(e.target.value)} placeholder="Meg's thoughts..."
                            className="w-full px-3 py-2 rounded-md bg-navbar-grey border border-gray-600 text-light-text text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-accent-teal"
                          />
                     </div>
                     {/* Alec's Comment */}
                     <div>
                         <label htmlFor="editCommentAlex" className="block text-xs sm:text-sm font-medium text-medium-text mb-1">Alec's Comment</label>
                         <textarea
                            id="editCommentAlex" rows="3" value={commentAlex} onChange={e => setCommentAlex(e.target.value)} placeholder="Alec's thoughts..."
                            className="w-full px-3 py-2 rounded-md bg-navbar-grey border border-gray-600 text-light-text text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-accent-teal"
                          />
                     </div>
                      {/* Tim's Comment */}
                     <div>
                         <label htmlFor="editCommentTim" className="block text-xs sm:text-sm font-medium text-medium-text mb-1">Tim's Comment</label>
                         <textarea
                            id="editCommentTim" rows="3" value={commentTim} onChange={e => setCommentTim(e.target.value)} placeholder="Tim's thoughts..."
                            className="w-full px-3 py-2 rounded-md bg-navbar-grey border border-gray-600 text-light-text text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-accent-teal"
                          />
                     </div>
                  </div>
                  {/* -------------------------- */}


                  {/* Poster Filename Input (Unchanged) */}
                  <div className="pt-2 border-t border-gray-700/50">
                      <label htmlFor="editPosterFilename" className="block text-xs sm:text-sm font-medium text-medium-text mb-1">Poster Filename (Optional)</label>
                      <input
                          type="text" id="editPosterFilename" value={posterFilename} onChange={(e) => setPosterFilename(e.target.value)} placeholder="e.g., lord_of_war.jpg"
                          className="w-full px-3 py-2 rounded-md bg-navbar-grey border border-gray-600 text-light-text text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-accent-teal" aria-describedby="edit-poster-filename-help"
                      />
                      <p id="edit-poster-filename-help" className="mt-1 text-[11px] sm:text-xs text-gray-400">Filename (like movie.jpg) in /public/images/movie_jackets/. Clear field to remove.</p>
                  </div>

                  {/* Ratings Inputs (Unchanged) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-1">
                    <div>
                      <label htmlFor="editRatingMegan" className="block text-xs sm:text-sm font-medium text-medium-text mb-1">Meg (0-10)</label>
                      <input type="number" id="editRatingMegan" step="0.1" min="0" max="10" value={ratingMegan} onChange={(e) => setRatingMegan(e.target.value)} placeholder="-" className="w-full px-3 py-2 rounded-md bg-navbar-grey border border-gray-600 text-light-text text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-accent-teal"/>
                    </div>
                    <div>
                      <label htmlFor="editRatingAlex" className="block text-xs sm:text-sm font-medium text-medium-text mb-1">Alec (0-10)</label>
                       <input type="number" id="editRatingAlex" step="0.1" min="0" max="10" value={ratingAlex} onChange={(e) => setRatingAlex(e.target.value)} placeholder="-" className="w-full px-3 py-2 rounded-md bg-navbar-grey border border-gray-600 text-light-text text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-accent-teal"/>
                    </div>
                    <div>
                      <label htmlFor="editRatingTim" className="block text-xs sm:text-sm font-medium text-medium-text mb-1">Tim (0-10)</label>
                      <input type="number" id="editRatingTim" step="0.1" min="0" max="10" value={ratingTim} onChange={(e) => setRatingTim(e.target.value)} placeholder="-" className="w-full px-3 py-2 rounded-md bg-navbar-grey border border-gray-600 text-light-text text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-accent-teal"/>
                    </div>
                  </div>

                  {/* Optional Date Input (Keep commented unless needed) */}
                  {/* <div>...</div> */}
                </form> {/* End of Form */}

                {/* Action Buttons Area */}
                <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-700 flex flex-col-reverse sm:flex-row justify-end gap-3">
                  <button
                    type="button" onClick={() => !isSubmitting && onClose()} disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-600 px-4 py-2 text-sm font-medium text-medium-text hover:bg-navbar-grey focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 focus-visible:ring-offset-pleasant-grey disabled:opacity-50"
                  > Cancel </button>
                  <button
                    type="submit" form="editMovieModalForm" // Explicitly link button to form
                    disabled={isSubmitting}
                    // onClick={handleSubmit} // Submitting via form onSubmit is generally preferred
                    className="w-full sm:w-auto inline-flex justify-center items-center gap-2 rounded-md border border-transparent bg-accent-teal px-4 py-2 text-sm font-medium text-white hover:bg-accent-teal-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal focus-visible:ring-offset-2 focus-visible:ring-offset-pleasant-grey disabled:opacity-60 disabled:cursor-not-allowed"
                  > <FiSave/> {isSubmitting ? 'Saving...' : 'Save Changes'} </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default EditMovieModal;