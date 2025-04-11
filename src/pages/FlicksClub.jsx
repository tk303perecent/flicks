// src/pages/FlicksClub.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
  FiTrash2, FiCalendar, FiList, FiEdit, FiStar, FiBarChart2, 
  FiMessageSquare, FiThumbsUp, FiPlayCircle, FiGrid, FiFilter,
  FiSearch, FiChevronUp, FiChevronDown, FiCheck, FiX, FiImage
} from 'react-icons/fi';
import EditMovieModal from '../components/EditMovieModal';
import BackgroundPosters from '../components/BackgroundPosters';

// Rating Badge Component
const RatingBadge = ({ rating, size = 'normal' }) => {
  const getBgColor = (rating) => {
    if (!rating) return 'bg-gray-600';
    const r = parseFloat(rating);
    if (r >= 8) return 'bg-green-500';
    if (r >= 6) return 'bg-blue-500';
    if (r >= 4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const sizeClasses = size === 'large' 
    ? 'px-3 py-1.5 text-base'
    : size === 'small'
    ? 'px-1.5 py-0.5 text-xs'
    : 'px-2 py-1 text-sm';

  return (
    <div className={`${getBgColor(rating)} ${sizeClasses} rounded-full font-bold text-white shadow-lg flex items-center justify-center`}>
      {rating ?? '-'}
    </div>
  );
};

// Helper Functions
const calculateMean = (ratings) => {
  const validRatings = ratings.filter(r => r !== null && r !== undefined && !isNaN(parseFloat(r)));
  if (validRatings.length === 0) return null;
  const sum = validRatings.reduce((acc, r) => acc + parseFloat(r), 0);
  const mean = sum / validRatings.length;
  return mean.toFixed(1);
};

const formatDateForInput = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' && !date.includes('T') 
    ? new Date(date + 'T00:00:00Z') 
    : new Date(date);
  
  if (isNaN(d.getTime())) {
    console.warn("Invalid date received in formatDateForInput:", date);
    return '';
  }

  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateForDisplay = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString + 'T00:00:00Z');
    if (isNaN(date.getTime())) throw new Error('Invalid date');
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return dateString;
  }
};

const FlicksClub = () => {
  const { session } = useAuth();
  const [movies, setMovies] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // New state for enhanced features
  const [displayMode, setDisplayMode] = useState('table'); // 'table', 'grid', or 'compact'
  const [sortBy, setSortBy] = useState('date'); // 'date', 'title', 'rating'
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterRating, setFilterRating] = useState('all'); // 'all', '8+', '6+', '4+'
  const [searchQuery, setSearchQuery] = useState('');

  // Quick stats calculations
  const stats = useMemo(() => {
    if (movies.length === 0) return {
      total: 0,
      avgRating: '-',
      thisMonth: 0,
      highestRated: { title: '-', rating: 0 }
    };

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const thisMonthCount = movies.filter(m => {
      const date = new Date(m.watched_on);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    const allRatings = movies.map(m => ({
      title: m.title,
      rating: calculateMean([m.rating_megan, m.rating_alex, m.rating_tim])
    })).filter(r => r.rating !== null);

    const avgRating = allRatings.length > 0 
      ? (allRatings.reduce((sum, r) => sum + parseFloat(r.rating), 0) / allRatings.length).toFixed(1)
      : '-';

    const highestRated = allRatings.reduce((max, curr) => 
      parseFloat(curr.rating) > parseFloat(max.rating) ? curr : max, 
      { title: '-', rating: 0 }
    );

    return {
      total: movies.length,
      avgRating,
      thisMonth: thisMonthCount,
      highestRated
    };
  }, [movies]);

  // Filtered and sorted movies
  const filteredMovies = useMemo(() => {
    return movies.filter(movie => {
      const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          movie.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const meanRating = calculateMean([movie.rating_megan, movie.rating_alex, movie.rating_tim]);
      const passesRatingFilter = filterRating === 'all' ? true :
        filterRating === '8+' ? parseFloat(meanRating) >= 8 :
        filterRating === '6+' ? parseFloat(meanRating) >= 6 :
        filterRating === '4+' ? parseFloat(meanRating) >= 4 : true;

      return matchesSearch && passesRatingFilter;
    }).sort((a, b) => {
      if (sortBy === 'date') {
        return sortDirection === 'desc' 
          ? new Date(b.watched_on) - new Date(a.watched_on)
          : new Date(a.watched_on) - new Date(b.watched_on);
      }
      if (sortBy === 'title') {
        return sortDirection === 'desc'
          ? b.title.localeCompare(a.title)
          : a.title.localeCompare(b.title);
      }
      if (sortBy === 'rating') {
        const ratingA = calculateMean([a.rating_megan, a.rating_alex, a.rating_tim]) || '0';
        const ratingB = calculateMean([b.rating_megan, b.rating_alex, b.rating_tim]) || '0';
        return sortDirection === 'desc'
          ? parseFloat(ratingB) - parseFloat(ratingA)
          : parseFloat(ratingA) - parseFloat(ratingB);
      }
      return 0;
    });
  }, [movies, searchQuery, filterRating, sortBy, sortDirection]);

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


  // MovieCard Component (moved inside FlicksClub to access helpers)
  const MovieCard = ({ movie, onEdit, onDelete }) => {
    const meanRating = calculateMean([movie.rating_megan, movie.rating_alex, movie.rating_tim]);
    const hasComments = !!(movie.comment_megan || movie.comment_alex || movie.comment_tim);

    return (
      <div className="bg-navbar-grey rounded-lg shadow-md overflow-hidden flex flex-col group">
        {/* Poster Image with Hover Effect */}
        <div className="relative aspect-[2/3] bg-pleasant-grey overflow-hidden">
          {movie.poster_filename ? (
            <>
              <img
                src={`/images/movie_jackets/${movie.poster_filename}`}
                alt={movie.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-300" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FiImage size={48} className="text-medium-text" />
            </div>
          )}
          {/* Rating Badge */}
          <div className="absolute top-2 right-2">
            <RatingBadge rating={meanRating} size="large" />
          </div>
          {/* Quick Actions Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex justify-end gap-3">
              <button
                onClick={() => onEdit(movie)}
                className="text-white hover:text-accent-teal transition-colors"
                title="Edit Entry"
              >
                <FiEdit size={20} />
              </button>
              <button
                onClick={() => onDelete(movie.id)}
                className="text-white hover:text-red-400 transition-colors"
                title="Delete Entry"
              >
                <FiTrash2 size={20} />
              </button>
            </div>
          </div>
        </div>
        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-start gap-2 mb-2">
            <h3 className="font-semibold text-light-text flex-1 line-clamp-2">{movie.title}</h3>
            {hasComments && (
              <FiMessageSquare
                className="text-accent-teal flex-shrink-0 mt-1"
                size={16}
                title="Contains user comments"
              />
            )}
          </div>
          <div className="text-xs text-medium-text mb-3">{formatDateForDisplay(movie.watched_on)}</div>
          {movie.description && (
            <p className="text-sm text-gray-400 mb-4 line-clamp-3">{movie.description}</p>
          )}
          {/* Individual Ratings */}
          <div className="mt-auto grid grid-cols-3 gap-2 p-3 bg-pleasant-grey rounded-md">
            <div className="text-center">
              <div className="text-xs text-medium-text mb-1">Meg</div>
              <RatingBadge rating={movie.rating_megan} size="small" />
            </div>
            <div className="text-center">
              <div className="text-xs text-medium-text mb-1">Alec</div>
              <RatingBadge rating={movie.rating_alex} size="small" />
            </div>
            <div className="text-center">
              <div className="text-xs text-medium-text mb-1">Tim</div>
              <RatingBadge rating={movie.rating_tim} size="small" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main render
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

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-navbar-grey p-4 rounded-lg shadow-md border border-gray-700">
            <h3 className="text-medium-text text-sm mb-1">Total Movies</h3>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-navbar-grey p-4 rounded-lg shadow-md border border-gray-700">
            <h3 className="text-medium-text text-sm mb-1">Average Rating</h3>
            <p className="text-2xl font-bold text-white">{stats.avgRating}</p>
          </div>
          <div className="bg-navbar-grey p-4 rounded-lg shadow-md border border-gray-700">
            <h3 className="text-medium-text text-sm mb-1">This Month</h3>
            <p className="text-2xl font-bold text-white">{stats.thisMonth}</p>
          </div>
          <div className="bg-navbar-grey p-4 rounded-lg shadow-md border border-gray-700">
            <h3 className="text-medium-text text-sm mb-1">Highest Rated</h3>
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-white truncate">{stats.highestRated.title}</p>
              <span className="text-sm text-accent-teal">{stats.highestRated.rating}</span>
            </div>
          </div>
        </div>

        {/* View Toggle / Page Buttons */}
        <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setDisplayMode('table')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-2 text-sm transition-colors ${
                displayMode === 'table' ? 'bg-accent-teal text-white' : 'bg-pleasant-grey text-medium-text hover:bg-gray-600'
              }`}
            >
              <FiList size={18}/> Table
            </button>
            <button
              onClick={() => setDisplayMode('grid')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-2 text-sm transition-colors ${
                displayMode === 'grid' ? 'bg-accent-teal text-white' : 'bg-pleasant-grey text-medium-text hover:bg-gray-600'
              }`}
            >
              <FiGrid size={18}/> Grid
            </button>
            <button
              onClick={() => setDisplayMode('compact')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-2 text-sm transition-colors ${
                displayMode === 'compact' ? 'bg-accent-teal text-white' : 'bg-pleasant-grey text-medium-text hover:bg-gray-600'
              }`}
            >
              <FiList size={18}/> Compact
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-medium-text" />
              <input
                type="text"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-pleasant-grey border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-accent-teal text-light-text placeholder-medium-text w-64"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-pleasant-grey border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-accent-teal text-light-text"
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
              <option value="rating">Sort by Rating</option>
            </select>

            <button
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-2 bg-pleasant-grey border border-gray-600 rounded-md hover:bg-gray-600 transition-colors"
              title={sortDirection === 'asc' ? "Sort Ascending" : "Sort Descending"}
            >
              {sortDirection === 'asc' ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
            </button>

            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="px-4 py-2 bg-pleasant-grey border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-accent-teal text-light-text"
            >
              <option value="all">All Ratings</option>
              <option value="8+">8+ Rating</option>
              <option value="6+">6+ Rating</option>
              <option value="4+">4+ Rating</option>
            </select>
          </div>
        </div>

        {/* --- Add Movie Form --- */}
        <div className="mb-8 sm:mb-12 bg-navbar-grey p-4 sm:p-6 rounded-lg shadow-md max-w-3xl mx-auto">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Log a Watched Movie</h2>
          <form onSubmit={handleAddMovie} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Date */}
              <div>
                <label htmlFor="movieDate" className="block text-sm font-medium text-medium-text mb-1">Date Watched</label>
                <input 
                  type="date" 
                  id="movieDate" 
                  value={formDate} 
                  onChange={(e) => setFormDate(e.target.value)} 
                  className="w-full px-3 py-2 rounded-md bg-pleasant-grey border border-gray-600 text-light-text focus:outline-none focus:ring-1 focus:ring-accent-teal appearance-none" 
                  required
                />
              </div>
              {/* Title */}
              <div>
                <label htmlFor="movieTitle" className="block text-sm font-medium text-medium-text mb-1">Movie Title</label>
                <input 
                  type="text" 
                  id="movieTitle" 
                  placeholder="Enter title..." 
                  value={formTitle} 
                  onChange={(e) => setFormTitle(e.target.value)} 
                  className="w-full px-3 py-2 rounded-md bg-pleasant-grey border border-gray-600 text-light-text focus:outline-none focus:ring-1 focus:ring-accent-teal" 
                  required
                />
              </div>
              {/* Ratings Group */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-medium-text">Ratings</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="ratingMegan" className="block text-xs text-medium-text mb-1">Meg</label>
                    <input 
                      type="number" 
                      id="ratingMegan" 
                      step="0.1" 
                      min="0" 
                      max="10" 
                      value={formRatingMegan} 
                      onChange={(e) => setFormRatingMegan(e.target.value)} 
                      placeholder="-" 
                      className="w-full px-3 py-2 rounded-md bg-pleasant-grey border border-gray-600 text-light-text focus:outline-none focus:ring-1 focus:ring-accent-teal"
                    />
                  </div>
                  <div>
                    <label htmlFor="ratingAlex" className="block text-xs text-medium-text mb-1">Alec</label>
                    <input 
                      type="number" 
                      id="ratingAlex" 
                      step="0.1" 
                      min="0" 
                      max="10" 
                      value={formRatingAlex} 
                      onChange={(e) => setFormRatingAlex(e.target.value)} 
                      placeholder="-" 
                      className="w-full px-3 py-2 rounded-md bg-pleasant-grey border border-gray-600 text-light-text focus:outline-none focus:ring-1 focus:ring-accent-teal"
                    />
                  </div>
                  <div>
                    <label htmlFor="ratingTim" className="block text-xs text-medium-text mb-1">Tim</label>
                    <input 
                      type="number" 
                      id="ratingTim" 
                      step="0.1" 
                      min="0" 
                      max="10" 
                      value={formRatingTim} 
                      onChange={(e) => setFormRatingTim(e.target.value)} 
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
                <label htmlFor="movieDescription" className="block text-sm font-medium text-medium-text mb-1">Your Description</label>
                <textarea 
                  id="movieDescription" 
                  rows="3" 
                  placeholder="Add your personal notes or summary..." 
                  value={formDescription} 
                  onChange={(e) => setFormDescription(e.target.value)} 
                  className="w-full px-3 py-2 rounded-md bg-pleasant-grey border border-gray-600 text-light-text focus:outline-none focus:ring-1 focus:ring-accent-teal"
                />
              </div>
              {/* Poster Section */}
              <div>
                <label htmlFor="moviePosterFilename" className="block text-sm font-medium text-medium-text mb-1">Poster Image</label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      id="moviePosterFilename" 
                      placeholder="e.g., movie_poster.jpg" 
                      value={formPosterFilename} 
                      onChange={(e) => setFormPosterFilename(e.target.value)} 
                      className="w-full px-3 py-2 rounded-md bg-pleasant-grey border border-gray-600 text-light-text focus:outline-none focus:ring-1 focus:ring-accent-teal" 
                    />
                    <p className="mt-1 text-xs text-gray-400">Filename from /public/images/movie_jackets/</p>
                  </div>
                  {formPosterFilename && (
                    <div className="w-24 h-36 bg-pleasant-grey rounded-md overflow-hidden flex items-center justify-center">
                      <img
                        src={`/images/movie_jackets/${formPosterFilename}`}
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
              {/* Submit Button */}
              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full px-5 py-2 bg-accent-teal hover:bg-accent-teal-hover text-white font-semibold rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : 'Add Log Entry'}
                </button>
              </div>
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
              <>
                {displayMode === 'table' && (
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
                )}

                {displayMode === 'grid' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredMovies.map(movie => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        onEdit={handleOpenEditModal}
                        onDelete={handleDeleteMovie}
                      />
                    ))}
                  </div>
                )}

                {displayMode === 'compact' && (
                  <div className="bg-navbar-grey rounded-lg shadow-md overflow-hidden">
                    <ul className="divide-y divide-gray-700">
                      {filteredMovies.map(movie => {
                        const meanRating = calculateMean([movie.rating_megan, movie.rating_alex, movie.rating_tim]);
                        return (
                          <li key={movie.id} className="p-4 flex items-center gap-4 hover:bg-pleasant-grey/50">
                            <div className="flex-shrink-0 w-16 h-24 bg-pleasant-grey rounded-md overflow-hidden">
                              {movie.poster_filename ? (
                                <img
                                  src={`/images/movie_jackets/${movie.poster_filename}`}
                                  alt={movie.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <FiImage size={24} className="text-medium-text" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-light-text line-clamp-2">{movie.title}</h3>
                              <div className="text-xs text-medium-text mb-1">{formatDateForDisplay(movie.watched_on)}</div>
                              <div className="text-sm text-gray-400 line-clamp-3">{movie.description}</div>
                            </div>
                            <div className="flex-shrink-0 flex flex-col items-center gap-2">
                              <RatingBadge rating={meanRating} size="small" />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleOpenEditModal(movie)}
                                  className="text-accent-teal hover:text-accent-teal-hover transition-colors"
                                  title="Edit Entry"
                                >
                                  <FiEdit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteMovie(movie.id)}
                                  className="text-red-500 hover:text-red-400 transition-colors"
                                  title="Delete Entry"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </>
            )}

            {/* --- Calendar View --- */}
            {viewMode === 'calendar' && (
              <div className="bg-navbar-grey rounded-lg shadow-md p-4 sm:p-6">
                <Calendar
                  onChange={setCalendarDate}
                  value={calendarDate}
                  tileClassName={tileClassName}
                  onClickDay={handleDayClick}
                />
              </div>
            )}

            {modalDate && modalMovies.length > 0 && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-navbar-grey rounded-lg shadow-md p-6 max-w-3xl w-full mx-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-white">Movies Watched on {formatDateForDisplay(modalDate)}</h2>
                    <button
                      onClick={() => setModalDate(null)}
                      className="text-medium-text hover:text-light-text transition-colors"
                    >
                      <FiX size={24} />
                    </button>
                  </div>
                  <ul className="divide-y divide-gray-700">
                    {modalMovies.map(movie => {
                      const meanRating = calculateMean([movie.rating_megan, movie.rating_alex, movie.rating_tim]);
                      return (
                        <li key={movie.id} className="py-4 flex items-center gap-4">
                          <div className="flex-shrink-0 w-16 h-24 bg-pleasant-grey rounded-md overflow-hidden">
                            {movie.poster_filename ? (
                              <img
                                src={`/images/movie_jackets/${movie.poster_filename}`}
                                alt={movie.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FiImage size={24} className="text-medium-text" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-light-text line-clamp-2">{movie.title}</h3>
                            <div className="text-xs text-medium-text mb-1">{formatDateForDisplay(movie.watched_on)}</div>
                            <div className="text-sm text-gray-400 line-clamp-3">{movie.description}</div>
                          </div>
                          <div className="flex-shrink-0 flex flex-col items-center gap-2">
                            <RatingBadge rating={meanRating} size="small" />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenEditModal(movie)}
                                className="text-accent-teal hover:text-accent-teal-hover transition-colors"
                                title="Edit Entry"
                              >
                                <FiEdit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteMovie(movie.id)}
                                className="text-red-500 hover:text-red-400 transition-colors"
                                title="Delete Entry"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}

            <EditMovieModal
              isOpen={isEditModalOpen}
              onClose={handleCloseEditModal}
              movie={editingMovie}
              onSave={handleUpdateMovie}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default FlicksClub;