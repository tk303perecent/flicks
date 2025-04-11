// src/components/games/AddTriviaQuestionModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient'; // Adjust path as needed
import { useAuth } from '../../context/AuthContext'; // Adjust path as needed

const AddTriviaQuestionModal = ({ isOpen, onClose }) => {
  const { session } = useAuth();
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [selectedMovieId, setSelectedMovieId] = useState('');
  const [questionText, setQuestionText] = useState('');

  // --- State for Answer Choices ---
  const [answerChoices, setAnswerChoices] = useState(['', '', '', '']); // Array for 4 answer texts
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(null); // Index of the correct answer (0-3)
  // --------------------------------

  const [isLoadingMovies, setIsLoadingMovies] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch watched movies (id and title) when the modal opens
  const fetchMovies = useCallback(async () => {
    if (!session) return;
    setIsLoadingMovies(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('watched_flicks')
        .select('id, title')
        .order('title', { ascending: true });

      if (error) throw error;
      setWatchedMovies(data || []);
    } catch (err) {
      console.error("Error fetching watched movies:", err);
      setError("Couldn't load your movie list. Please try again.");
      setWatchedMovies([]);
    } finally {
      setIsLoadingMovies(false);
    }
  }, [session]);

  // Effect to reset state and fetch movies when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedMovieId('');
      setQuestionText('');
      setAnswerChoices(['', '', '', '']); // Reset answers
      setCorrectAnswerIndex(null); // Reset correct answer selection
      setError(null);
      setSuccessMessage(null);
      fetchMovies();
    }
  }, [isOpen, fetchMovies]);

  // --- Handlers for Answer Inputs ---
  const handleAnswerChange = (index, value) => {
    const newChoices = [...answerChoices];
    newChoices[index] = value;
    setAnswerChoices(newChoices);
  };

  const handleCorrectIndexChange = (index) => {
    setCorrectAnswerIndex(index);
  };
  // ----------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // --- Validation ---
    if (!selectedMovieId) {
        setError("Please select the movie this question is about.");
        return;
    }
     if (!questionText.trim()) {
        setError("Please enter the question text.");
        return;
    }
    if (correctAnswerIndex === null) {
      setError("Please select the correct answer using the radio button.");
      return;
    }
     if (answerChoices[correctAnswerIndex].trim() === '') {
       setError("Please provide text for the selected correct answer.");
       return;
     }
    // Ensure at least one incorrect answer also has text
    const incorrectTextsProvided = answerChoices
        .map(a => a.trim())
        .filter((text, index) => index !== correctAnswerIndex && text !== '');
    if (incorrectTextsProvided.length === 0) {
       setError("Please provide text for at least one incorrect answer choice.");
       return;
    }
     if (!session?.user?.id) {
        setError("You must be logged in to add a question.");
        return;
    }
    // --- End Validation ---

    setIsSubmitting(true);

    // Prepare data for Supabase (using separate columns)
    const correctText = answerChoices[correctAnswerIndex].trim();
    const incorrectTexts = answerChoices
        .map(a => a.trim())
        .filter((text, index) => index !== correctAnswerIndex && text !== ''); // Get non-empty incorrect answers

    const newQuestion = {
      watched_flick_id: parseInt(selectedMovieId, 10), // !! Adjust type if needed (e.g., remove parseInt if UUID) !!
      created_by_user_id: session.user.id,
      question_text: questionText.trim(),
      correct_answer: correctText,
      incorrect_answer_1: incorrectTexts[0] || null, // Assign first incorrect
      incorrect_answer_2: incorrectTexts[1] || null, // Assign second incorrect
      incorrect_answer_3: incorrectTexts[2] || null, // Assign third incorrect
      is_approved: false, // Default to not approved - change to true if no moderation needed
    };

    try {
      const { error: insertError } = await supabase
        .from('user_trivia_questions')
        .insert(newQuestion);

      if (insertError) throw insertError;

      setSuccessMessage("Question added!");
      // Reset form after success
      setQuestionText('');
      setAnswerChoices(['', '', '', '']);
      setCorrectAnswerIndex(null);
      setSelectedMovieId('');
      // Consider closing modal automatically: setTimeout(onClose, 2000);

    } catch (err) {
      console.error("Error inserting question:", err);
      setError(`Failed to add question: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render the modal if isOpen is false
  if (!isOpen) {
    return null;
  }

  // Render the modal
  return (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75 backdrop-blur-sm"
        onClick={onClose} // Close modal if overlay is clicked
    >
      <div
        className="bg-navbar-grey rounded-lg shadow-xl p-5 sm:p-8 max-w-xl w-full relative border border-gray-600 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside content
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-medium-text hover:text-light-text text-3xl leading-none p-1 focus:outline-none"
          aria-label="Close modal"
          disabled={isSubmitting}
        >
          &times;
        </button>

        <h2 className="text-xl sm:text-2xl font-semibold text-white mb-6 pr-8">Add Your Trivia Question</h2>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 flex-grow custom-scrollbar">
          {/* Movie Selection */}
          <div>
            <label htmlFor="movieSelect" className="block text-sm font-medium text-medium-text mb-1">
              Which movie is this question about? <span className="text-red-500">*</span>
            </label>
            {isLoadingMovies ? (
              <p className="text-sm text-gray-400">Loading movies...</p>
            ) : watchedMovies.length > 0 ? (
              <select
                id="movieSelect"
                value={selectedMovieId}
                onChange={(e) => setSelectedMovieId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-md bg-pleasant-grey border border-gray-600 text-light-text text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-accent-teal"
                disabled={isSubmitting}
              >
                <option value="" disabled>-- Select a Movie --</option>
                {watchedMovies.map(movie => (
                  <option key={movie.id} value={movie.id}>
                    {movie.title}
                  </option>
                ))}
              </select>
            ) : (
               <p className="text-sm text-red-400">No watched movies found to select.</p>
            )}
          </div>

          {/* Question Text */}
          <div>
            <label htmlFor="questionText" className="block text-sm font-medium text-medium-text mb-1">
              Question <span className="text-red-500">*</span>
            </label>
            <textarea
              id="questionText"
              rows="3"
              placeholder="e.g., What color was the main character's hat?"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-md bg-pleasant-grey border border-gray-600 text-light-text text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-accent-teal"
              disabled={isSubmitting}
            />
          </div>

          {/* --- Answer Choices Section --- */}
          <div className="space-y-3 pt-2">
            <label className="block text-sm font-medium text-medium-text mb-1">
              Answer Choices (Select the correct one) <span className="text-red-500">*</span>
            </label>
            {answerChoices.map((choice, index) => (
              <div key={index} className="flex items-center space-x-3">
                {/* Radio button to mark correct answer */}
                <input
                  type="radio"
                  id={`correctAnswer-${index}`}
                  name="correctAnswerSelector" // Shared name groups the radio buttons
                  value={index} // Value is the index
                  checked={correctAnswerIndex === index} // Check if this index is selected
                  onChange={() => handleCorrectIndexChange(index)} // Update state on change
                  required // Ensures one radio button in the group must be selected
                  className="focus:ring-accent-teal h-4 w-4 text-accent-teal border-gray-500 bg-pleasant-grey flex-shrink-0"
                  disabled={isSubmitting}
                />
                {/* Text input for the answer choice */}
                <input
                  type="text"
                  id={`answerChoice-${index}`}
                  placeholder={`Answer Choice ${index + 1}${correctAnswerIndex === index ? ' (Correct)' : ''}`}
                  value={choice}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  // Consider adding validation here or primarily in handleSubmit
                  className="flex-grow px-3 py-2 rounded-md bg-pleasant-grey border border-gray-600 text-light-text text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-accent-teal"
                  disabled={isSubmitting}
                />
              </div>
            ))}
             <p className="text-xs text-gray-400 pl-7">Please provide text for the correct answer and at least one incorrect answer.</p>
          </div>
          {/* --- End Answer Choices Section --- */}


          {/* Submit Button & Messages */}
          <div className="pt-4">
             {/* Error Message */}
             {error && (
                <p className="text-center text-red-400 bg-red-900/30 p-2 rounded-md mb-4 text-sm">
                  {error}
                </p>
             )}
             {/* Success Message */}
             {successMessage && (
                <p className="text-center text-green-400 bg-green-900/30 p-2 rounded-md mb-4 text-sm">
                  {successMessage}
                </p>
             )}
            <button
              type="submit"
              disabled={isSubmitting || isLoadingMovies}
              className="w-full px-5 py-2.5 bg-accent-teal hover:bg-accent-teal-hover text-white font-semibold rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base"
            >
              {isSubmitting ? 'Saving...' : 'Add Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTriviaQuestionModal;