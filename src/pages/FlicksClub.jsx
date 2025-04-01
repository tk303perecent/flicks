// src/pages/FlicksClub.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
// --- Import ALL necessary icons ---
import {
  FiTrash2,
  FiCalendar,
  FiList,
  FiEdit,
  FiStar,
  FiBarChart2,
  FiMessageSquare,
  FiThumbsUp // <-- Added Suggested icon
} from 'react-icons/fi';
// ---------------------------------
import EditMovieModal from '../components/EditMovieModal';
import BackgroundPosters from '../components/BackgroundPosters';

// --- Helper Functions ---
const calculateMean = (ratings) => {
  const validRatings = ratings.filter(r => r !== null && r !== undefined && !isNaN(parseFloat(r)));
  if (validRatings.length === 0) return null;
  const sum = validRatings.reduce((acc, r) => acc + parseFloat(r), 0);
  const mean = sum / validRatings.length;
  return mean.toFixed(1);
};

const formatDateForInput = (date) => {
    if (!date) return '';
    const d = typeof date === 'string' && !date.includes('T') ? new Date(date + 'T00:00:00Z') : new Date(date);
    if (isNaN(d.getTime())) {
        console.warn("Invalid date received in formatDateForInput:", date);
        const d2 = new Date(date);
         if (isNaN(d2.getTime())) return '';
         date = d2;
    } else {
        date = d;
    }
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString + 'T00:00:00Z');
        if (isNaN(date.getTime())) throw new Error('Invalid date');
        return date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC'
        });
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return dateString;
    }
};
// --- End Helper Functions ---


const FlicksClub = () => {
  const { session } = useAuth();
  const [movies, setMovies] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Form State ---
  const [formDate, setFormDate] = useState(formatDateForInput(new Date()));
  const [formTitle, setFormTitle] = useState('');
  const [formRatingMegan, setFormRatingMegan] = useState('');
  const [formRatingAlex, setFormRatingAlex] = useState('');
  const [formRatingTim, setFormRatingTim] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPosterFilename, setFormPosterFilename] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Calendar State ---
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [modalDate, setModalDate] = useState(null);
  const [modalMovies, setModalMovies] = useState([]);

  // --- Edit Modal State ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);


  // --- Fetch Movies Hook ---
  useEffect(() => {
     const fetchMovies = async () => {
       if (!session?.user) {
         setIsLoading(false);
         setMovies([]);
         return;
       }
       setIsLoading(true);
       setError(null);
       try {
         const { data, error } = await supabase
           .from('watched_flicks')
           .select('*') // Selects all columns
           .order('watched_on', { ascending: false });

         if (error) throw error;
         setMovies(data || []);
       } catch (error) {
         console.error("Error fetching movies:", error.message);
         setError("Failed to load movie log.");
       } finally {
         setIsLoading(false);
       }
     };
     fetchMovies();
  }, [session]);

  // --- Add Movie Handler ---
  const handleAddMovie = async (e) => {
    e.preventDefault();
    if (!session?.user || !formDate || !formTitle) {
        setError("Date and Title are required.");
        return;
    }
    setIsSubmitting(true);
    setError(null);

    const newMovie = {
        watched_on: formDate,
        title: formTitle.trim(),
        rating_megan: formRatingMegan === '' || isNaN(parseFloat(formRatingMegan)) ? null : parseFloat(formRatingMegan),
        rating_alex: formRatingAlex === '' || isNaN(parseFloat(formRatingAlex)) ? null : parseFloat(formRatingAlex),
        rating_tim: formRatingTim === '' || isNaN(parseFloat(formRatingTim)) ? null : parseFloat(formRatingTim),
        description: formDescription.trim() || null,
        poster_filename: formPosterFilename.trim() || null,
    };

    const ratings = [newMovie.rating_megan, newMovie.rating_alex, newMovie.rating_tim];
    if (ratings.some(r => r !== null && (r < 0 || r > 10))) {
        setError("Ratings must be between 0 and 10.");
        setIsSubmitting(false);
        return;
    }
    if (newMovie.poster_filename && !newMovie.poster_filename.includes('.')) {
       setError("Poster filename should include an extension (e.g., .jpg).");
       setIsSubmitting(false);
       return;
    }

    try {
        const { data, error } = await supabase
            .from('watched_flicks')
            .insert(newMovie)
            .select()
            .single();

        if (error) throw error;

        setMovies(prev => [data, ...prev].sort((a, b) => new Date(b.watched_on + 'T00:00:00Z') - new Date(a.watched_on + 'T00:00:00Z')));
        // Clear form
        setFormDate(formatDateForInput(new Date()));
        setFormTitle('');
        setFormRatingMegan('');
        setFormRatingAlex('');
        setFormRatingTim('');
        setFormDescription('');
        setFormPosterFilename('');

    } catch (error) {
        console.error("Error adding movie:", error.message);
        setError(`Failed to add movie log entry: ${error.message}`);
    } finally {
        setIsSubmitting(false);
    }
  };

  // --- Delete Movie Handler ---
  const handleDeleteMovie = async (movieId) => {
    if (!session?.user || !window.confirm("Delete this movie entry?")) return;
    setError(null);
    try {
      const { error } = await supabase
        .from('watched_flicks')
        .delete()
        .eq('id', movieId);

      if (error) throw error;
      setMovies(prev => prev.filter(movie => movie.id !== movieId));
    } catch (error) {
      console.error("Error deleting movie:", error.message);
      setError("Failed to delete movie log entry.");
    }
  };

  // --- Edit Modal Functions ---
  const handleOpenEditModal = (movie) => {
      setEditingMovie(movie);
      setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
      setIsEditModalOpen(false);
      setEditingMovie(null);
  };

  // --- Update Movie Handler ---
  const handleUpdateMovie = async (movieId, updatedData) => {
      if (!session?.user) return Promise.reject("User not logged in");
      setError(null);

      try {
          const ratings = [updatedData.rating_megan, updatedData.rating_alex, updatedData.rating_tim];
           if (ratings.some(r => r !== null && r !== undefined && (r < 0 || r > 10))) {
               throw new Error("Ratings must be between 0 and 10.");
           }

          const { data, error } = await supabase
              .from('watched_flicks')
              .update(updatedData)
              .eq('id', movieId)
              .select()
              .single();

          if (error) throw error;

          setMovies(prevMovies =>
              prevMovies.map(movie =>
                  movie.id === movieId ? { ...movie, ...data } : movie
              ).sort((a, b) => new Date(b.watched_on + 'T00:00:00Z') - new Date(a.watched_on + 'T00:00:00Z'))
          );
          handleCloseEditModal();
          return Promise.resolve();

      } catch (error) {
          console.error("Error updating movie:", error?.message || error);
          return Promise.reject(new Error(`Failed to update movie: ${error?.message || 'Unknown error'}`));
      }
  };


  // --- Calendar View Helpers ---
  const watchedDates = useMemo(() => {
     const dates = new Set();
     movies.forEach(movie => {
       if(movie.watched_on) { dates.add(movie.watched_on); }
     });
     return dates;
  }, [movies]);

  const tileClassName = ({ date, view }) => {
     if (view === 'month') {
       const year = date.getFullYear();
       const month = String(date.getMonth() + 1).padStart(2, '0');
       const day = String(date.getDate()).padStart(2, '0');
       const dateStr = `${year}-${month}-${day}`;
       if (watchedDates.has(dateStr)) {
         return 'has-movie';
       }
     }
     return null;
  };

  const handleDayClick = (value) => {
     const dateStr = formatDateForInput(value);
     const moviesOnDate = movies.filter(movie => movie.watched_on === dateStr);
     if (moviesOnDate.length > 0) {
       setModalMovies(moviesOnDate);
       setModalDate(value);
     } else {
        setModalMovies([]);
        setModalDate(null);
     }
  };

  // --- Background Poster URLs ---
  const backgroundPosterUrls = useMemo(() => {
      const posters = movies
        .filter(movie => movie.poster_filename)
        .map(movie => `/images/movie_jackets/${movie.poster_filename}`);
      const shuffled = posters.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 15);
  }, [movies]);


   // --- Main Render ---
   if (!session) {
     return (
       <div className="container mx-auto px-4 py-16 sm:px-6 md:py-24 text-center">
         <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">Flicks Club</h1>
         <p className="text-base sm:text-lg text-medium-text">Please log in to use the shared movie log.</p>
       </div>
     );
   }

  return (
    <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 min-h-[calc(100vh-160px)]">
      <BackgroundPosters imageUrls={backgroundPosterUrls} />

      <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6 sm:mb-8 text-center">
            Flicks Club Movie Log
          </h1>

          {/* --- View Toggle / Page Buttons --- */}
          <div className="flex justify-center flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-8">
             {/* List View Button */}
             <button
               onClick={() => setViewMode('list')}
               className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md font-semibold flex items-center gap-2 text-sm sm:text-base transition-colors ${viewMode === 'list' ? 'bg-accent-teal text-white' : 'bg-pleasant-grey text-medium-text hover:bg-gray-600'}`}
             >
               <FiList size={18}/> List
             </button>
             {/* Calendar View Button */}
             <button
               onClick={() => setViewMode('calendar')}
               className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md font-semibold flex items-center gap-2 text-sm sm:text-base transition-colors ${viewMode === 'calendar' ? 'bg-accent-teal text-white' : 'bg-pleasant-grey text-medium-text hover:bg-gray-600'}`}
             >
               <FiCalendar size={18}/> Calendar
             </button>
             {/* Stats Page Button */}
             <Link to="/stats">
               <button
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-md font-semibold flex items-center gap-2 text-sm sm:text-base transition-colors bg-pleasant-grey text-medium-text hover:bg-gray-600"
                  aria-label="View Statistics"
                >
                  <FiBarChart2 size={18}/> Stats
                </button>
             </Link>
             {/* === Suggested Button === */}
             <Link to="/suggested">
               <button
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-md font-semibold flex items-center gap-2 text-sm sm:text-base transition-colors bg-pleasant-grey text-medium-text hover:bg-gray-600"
                  aria-label="View Suggestions"
                >
                  <FiThumbsUp size={18}/> Suggested
                </button>
             </Link>
             {/* ========================= */}
          </div>

          {/* --- Add Movie Form --- */}
          <div className="mb-8 sm:mb-12 bg-navbar-grey p-4 sm:p-6 rounded-lg shadow-md max-w-3xl mx-auto">
             <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Log a Watched Movie</h2>
             <form onSubmit={handleAddMovie} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Date */}
                <div className="md:col-span-1">
                 <label htmlFor="movieDate" className="block text-xs sm:text-sm font-medium text-medium-text mb-1">Date Watched</label>
                 <input type="date" id="movieDate" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full px-3 py-2 rounded-md bg-pleasant-grey border border-gray-600 text-light-text text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-accent-teal appearance-none" required/>
               </div>
                {/* Title */}
               <div className="md:col-span-1">
                 <label htmlFor="movieTitle" className="block text-xs sm:text-sm font-medium text-medium-text mb-1">Movie Title</label>
                 <input type="text" id="movieTitle" placeholder="Enter title..." value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="w-full px-3 py-2 rounded-md bg-pleasant-grey border border-gray-600 text-light-text text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-accent-teal" required/>
               </div>
                {/* Description */}
               <div className="md:col-span-2">
                   <label htmlFor="movieDescription" className="block text-xs sm:text-sm font-medium text-medium-text mb-1">Your Description (Optional)</label>
                   <textarea id="movieDescription" rows="3" placeholder="Add your personal notes or summary..." value={formDescription} onChange={(e) => setFormDescription(e.target.value)} className="w-full px-3 py-2 rounded-md bg-pleasant-grey border border-gray-600 text-light-text text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-accent-teal"/>
               </div>
                {/* Poster Filename */}
               <div className="md:col-span-2">
                 <label htmlFor="moviePosterFilename" className="block text-xs sm:text-sm font-medium text-medium-text mb-1">Poster Filename (Optional)</label>
                 <input type="text" id="moviePosterFilename" placeholder="e.g., movie_poster.jpg" value={formPosterFilename} onChange={(e) => setFormPosterFilename(e.target.value)} className="w-full px-3 py-2 rounded-md bg-pleasant-grey border border-gray-600 text-light-text text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-accent-teal" aria-describedby="poster-filename-help"/>
                 <p id="poster-filename-help" className="mt-1 text-xs text-gray-400">Filename from /public/images/movie_jackets/.</p>
               </div>
                {/* Ratings Inputs */}
               <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-2">
                  <div>
                   <label htmlFor="ratingMegan" className="block text-xs sm:text-sm font-medium text-medium-text mb-1">Meg's Rating (0-10)</label>
                   <input type="number" id="ratingMegan" step="0.1" min="0" max="10" value={formRatingMegan} onChange={(e) => setFormRatingMegan(e.target.value)} placeholder="-" className="w-full px-3 py-2 rounded-md bg-pleasant-grey border border-gray-600 text-light-text text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-accent-teal"/>
                 </div>
                  <div>
                   <label htmlFor="ratingAlex" className="block text-xs sm:text-sm font-medium text-medium-text mb-1">Alec's Rating (0-10)</label>
                   <input type="number" id="ratingAlex" step="0.1" min="0" max="10" value={formRatingAlex} onChange={(e) => setFormRatingAlex(e.target.value)} placeholder="-" className="w-full px-3 py-2 rounded-md bg-pleasant-grey border border-gray-600 text-light-text text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-accent-teal"/>
                 </div>
                  <div>
                   <label htmlFor="ratingTim" className="block text-xs sm:text-sm font-medium text-medium-text mb-1">Tim's Rating (0-10)</label>
                   <input type="number" id="ratingTim" step="0.1" min="0" max="10" value={formRatingTim} onChange={(e) => setFormRatingTim(e.target.value)} placeholder="-" className="w-full px-3 py-2 rounded-md bg-pleasant-grey border border-gray-600 text-light-text text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-accent-teal"/>
                 </div>
               </div>
                {/* Submit Button */}
               <div className="md:col-span-2 flex justify-end mt-4">
                  <button type="submit" disabled={isSubmitting} className="w-full md:w-auto px-5 py-2 sm:px-6 sm:py-2 bg-accent-teal hover:bg-accent-teal-hover text-white font-semibold rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base" >
                  {isSubmitting ? 'Saving...' : 'Add Log Entry'}
                  </button>
               </div>
             </form>
          </div>

          {/* Loading/Error Display */}
          {isLoading && <p className="text-center text-medium-text text-base sm:text-lg my-10">Loading movie log...</p>}
          {error && <p className="text-center text-red-400 bg-red-900/30 p-3 rounded-md max-w-xl mx-auto mb-6 text-sm sm:text-base">{error}</p>}

          {/* Conditional View Rendering */}
          {!isLoading && !error && (
            <>
              {/* --- List View --- */}
              {viewMode === 'list' && (
                <div> {/* Container */}

                  {/* === DESKTOP/TABLET VIEW === */}
                  <div className="hidden md:block overflow-x-auto bg-navbar-grey rounded-lg shadow-md">
                    <table className="min-w-full divide-y divide-gray-700 border-collapse">
                      <thead className="bg-pleasant-grey">
                        <tr>
                          <th scope="col" className="px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-medium-text uppercase tracking-wider whitespace-nowrap">Watched On</th>
                          <th scope="col" className="px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-medium-text uppercase tracking-wider whitespace-nowrap">Film & Description</th>
                          <th scope="col" className="px-2 py-3 text-center text-[10px] sm:text-xs font-medium text-medium-text uppercase tracking-wider whitespace-nowrap">Meg</th>
                          <th scope="col" className="px-2 py-3 text-center text-[10px] sm:text-xs font-medium text-medium-text uppercase tracking-wider whitespace-nowrap">Alec</th>
                          <th scope="col" className="px-2 py-3 text-center text-[10px] sm:text-xs font-medium text-medium-text uppercase tracking-wider whitespace-nowrap">Tim</th>
                          <th scope="col" className="px-2 py-3 text-center text-[10px] sm:text-xs font-medium text-medium-text uppercase tracking-wider whitespace-nowrap">Mean</th>
                          <th scope="col" className="px-3 py-3 text-center text-[10px] sm:text-xs font-medium text-medium-text uppercase tracking-wider whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {movies.length === 0 ? (
                            <tr><td colSpan="7" className="text-center py-6 text-medium-text italic text-sm">No movies logged yet.</td></tr>
                        ) : (
                            movies.map((movie) => {
                              const meanRating = calculateMean([movie.rating_megan, movie.rating_alex, movie.rating_tim]);
                              const hasComments = !!(movie.comment_megan || movie.comment_alex || movie.comment_tim);
                              return (
                                <tr key={movie.id} className="hover:bg-pleasant-grey/50 group align-top">
                                  <td className="px-3 py-3 whitespace-nowrap text-xs sm:text-sm text-light-text">{formatDateForDisplay(movie.watched_on)}</td>
                                  {/* Film & Description Column */}
                                  <td className="px-3 py-3 text-xs sm:text-sm text-light-text min-w-[150px]">
                                      <div className="font-medium flex items-center">
                                        <span>{movie.title}</span>
                                        {hasComments && (
                                            <FiMessageSquare
                                              className="ml-2 text-accent-teal flex-shrink-0"
                                              size={14}
                                              title="Contains user comments"
                                            />
                                        )}
                                      </div>
                                      {movie.description && (
                                          <div className="text-[11px] sm:text-xs text-gray-400 mt-1 font-normal whitespace-pre-wrap break-words">{movie.description}</div>
                                      )}
                                  </td>
                                  {/* Ratings Columns */}
                                  <td className="px-2 py-3 text-center whitespace-nowrap text-xs sm:text-sm text-medium-text">{movie.rating_megan ?? '-'}</td>
                                  <td className="px-2 py-3 text-center whitespace-nowrap text-xs sm:text-sm text-medium-text">{movie.rating_alex ?? '-'}</td>
                                  <td className="px-2 py-3 text-center whitespace-nowrap text-xs sm:text-sm text-medium-text">{movie.rating_tim ?? '-'}</td>
                                  <td className="px-2 py-3 text-center whitespace-nowrap text-xs sm:text-sm font-semibold text-light-text">{meanRating ?? '-'}</td>
                                  {/* Actions Column */}
                                  <td className="px-3 py-3 text-center text-sm font-medium whitespace-nowrap">
                                    <div className="flex justify-center items-start pt-1 gap-4">
                                      <button onClick={() => handleOpenEditModal(movie)} title="Edit Entry" className="text-accent-teal hover:text-accent-teal-hover p-1"><FiEdit size={18}/></button>
                                      <button onClick={() => handleDeleteMovie(movie.id)} title="Delete Entry" className="text-red-500 hover:text-red-400 p-1"><FiTrash2 size={18}/></button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* === MOBILE VIEW (Card Layout) === */}
                  <div className="block md:hidden space-y-4">
                      {movies.length === 0 ? (
                          <p className="text-center py-6 text-medium-text italic text-sm">No movies logged yet.</p>
                      ) : (
                          movies.map((movie) => {
                             const meanRating = calculateMean([movie.rating_megan, movie.rating_alex, movie.rating_tim]);
                             const hasComments = !!(movie.comment_megan || movie.comment_alex || movie.comment_tim);
                             return (
                                <div key={movie.id} className="bg-navbar-grey rounded-lg shadow-md p-4 border border-gray-700">
                                    {/* Card Header */}
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs text-medium-text font-medium">{formatDateForDisplay(movie.watched_on)}</span>
                                        <div className="flex items-center gap-3 -mt-1 -mr-1">
                                            <button onClick={() => handleOpenEditModal(movie)} title="Edit Entry" className="text-accent-teal hover:text-accent-teal-hover p-1.5"> <FiEdit size={18}/> </button>
                                            <button onClick={() => handleDeleteMovie(movie.id)} title="Delete Entry" className="text-red-500 hover:text-red-400 p-1.5"> <FiTrash2 size={18}/> </button>
                                        </div>
                                    </div>
                                    {/* Card Body */}
                                    <h3 className="text-base font-semibold text-light-text mb-1 flex items-center">
                                      <span>{movie.title}</span>
                                       {hasComments && (
                                          <FiMessageSquare
                                            className="ml-2 text-accent-teal flex-shrink-0"
                                            size={14}
                                            title="Contains user comments"
                                          />
                                      )}
                                    </h3>
                                    {movie.description && (
                                        <p className="text-xs text-gray-400 mb-3 whitespace-pre-wrap break-words">{movie.description}</p>
                                    )}
                                    {/* Card Footer */}
                                    <div className="border-t border-gray-700 pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                                        <span className="text-medium-text">Meg: <span className="font-medium text-light-text">{movie.rating_megan ?? '-'}</span></span>
                                        <span className="text-medium-text">Alec: <span className="font-medium text-light-text">{movie.rating_alex ?? '-'}</span></span>
                                        <span className="text-medium-text">Tim: <span className="font-medium text-light-text">{movie.rating_tim ?? '-'}</span></span>
                                        <span className="text-medium-text flex items-center gap-1">
                                            Avg: <span className="font-bold text-light-text">{meanRating ?? '-'}</span>
                                        </span>
                                    </div>
                                </div>
                             );
                          })
                      )}
                  </div>

                </div>
              )} {/* End List View */}

              {/* --- Calendar View --- */}
              {viewMode === 'calendar' && (
                 <div className="flicks-calendar-container bg-navbar-grey p-3 sm:p-4 rounded-lg shadow-md max-w-xl mx-auto">
                    <Calendar
                        onChange={setCalendarDate} value={calendarDate}
                        onClickDay={handleDayClick} tileClassName={tileClassName}
                        className="flicks-calendar !bg-transparent !border-none !font-sans"
                    />
                    <p className="text-center text-[11px] sm:text-xs text-medium-text mt-3">
                       Days marked have movie entries. Click a day to view.
                    </p>
                 </div>
              )} {/* End Calendar View */}
            </>
           )} {/* End Conditional View Rendering */}

           {/* --- Calendar Day Details Modal --- */}
           {modalDate && modalMovies.length > 0 && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-75 backdrop-blur-sm" onClick={() => setModalDate(null)}>
                  <div className="bg-pleasant-grey rounded-lg shadow-xl p-4 sm:p-6 max-w-lg w-full relative border border-gray-600 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setModalDate(null)} className="absolute top-2 right-2 text-medium-text hover:text-light-text text-3xl leading-none p-1 focus:outline-none" aria-label="Close modal"> × </button>
                      <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 pr-8">Watched on {modalDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}</h3>
                      <ul className="space-y-4 overflow-y-auto pr-2 flex-grow custom-scrollbar">
                          {modalMovies.map(movie => {
                              const meanRating = calculateMean([movie.rating_megan, movie.rating_alex, movie.rating_tim]);
                              return (
                                  <li key={movie.id} className="border-b border-gray-700 pb-3 last:border-b-0">
                                      <p className="font-semibold text-light-text text-sm sm:text-base">{movie.title}</p>
                                      {movie.description && (
                                          <p className="text-xs sm:text-sm text-gray-300 mt-1 whitespace-pre-wrap break-words">{movie.description}</p>
                                      )}
                                      <div className="text-xs sm:text-sm text-medium-text space-x-2 sm:space-x-3 mt-2 flex flex-wrap gap-x-2 gap-y-1">
                                          <span>Meg: <span className="font-semibold">{movie.rating_megan ?? '-'}</span></span>
                                          <span>Alec: <span className="font-semibold">{movie.rating_alex ?? '-'}</span></span>
                                          <span>Tim: <span className="font-semibold">{movie.rating_tim ?? '-'}</span></span>
                                          <span className="font-bold text-light-text">Avg: {meanRating ?? '-'}</span>
                                      </div>
                                  </li>
                              );
                           })}
                      </ul>
                  </div>
              </div>
           )} {/* End Calendar Modal */}

           {/* --- Edit Movie Modal --- */}
            <EditMovieModal
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                movie={editingMovie}
                onSave={handleUpdateMovie}
            />

      </div> {/* End Relative Content Wrapper */}
    </div> // End main container div
  );
};

export default FlicksClub;