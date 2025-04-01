// src/pages/Stats.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiAward, FiStar, FiTrendingUp } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext'; // To ensure user is logged in
import { supabase } from '../supabaseClient'; // Supabase client

// --- Helper Function: Calculate Mean Rating ---
// (Copied from FlicksClub.jsx for consistency, could be refactored into a shared util)
const calculateMean = (ratings) => {
  const validRatings = ratings.filter(r => r !== null && r !== undefined && !isNaN(parseFloat(r)));
  if (validRatings.length === 0) return null;
  const sum = validRatings.reduce((acc, r) => acc + parseFloat(r), 0);
  const mean = sum / validRatings.length;
  return parseFloat(mean.toFixed(1)); // Return as number for easier sorting
};

// --- Helper Function: Format Date ---
// (Simplified version for display if needed, or reuse from FlicksClub/utils)
const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString + 'T00:00:00Z'); // Parse as UTC
        if (isNaN(date.getTime())) throw new Error('Invalid date');
        return date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC'
        });
    } catch (e) {
        return dateString; // Fallback
    }
};


const Stats = () => {
  const { session } = useAuth();
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Fetch Movie Data ---
  useEffect(() => {
    const fetchMovies = async () => {
      if (!session?.user) {
        setIsLoading(false);
        setError("Please log in to view stats.");
        setMovies([]);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('watched_flicks')
          .select('*')
          .order('watched_on', { ascending: false }); // Order doesn't strictly matter for stats, but good practice

        if (fetchError) throw fetchError;
        setMovies(data || []);
      } catch (err) {
        console.error("Error fetching movies for stats:", err.message);
        setError("Failed to load movie data for statistics.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMovies();
  }, [session]); // Re-fetch if session changes

  // --- Calculate Statistics using useMemo for performance ---

  // 1. Leaderboard (Movies with calculated mean ratings, sorted)
  const leaderboard = useMemo(() => {
    if (!movies || movies.length === 0) return [];

    return movies
      .map(movie => ({
        ...movie,
        // Calculate mean rating, store it directly on the object for sorting
        meanRating: calculateMean([movie.rating_megan, movie.rating_alex, movie.rating_tim]),
      }))
      // Filter out movies where mean couldn't be calculated (e.g., no ratings at all)
      .filter(movie => movie.meanRating !== null)
      // Sort by mean rating descending. Handle potential nulls just in case (though filter should prevent)
      .sort((a, b) => (b.meanRating ?? -1) - (a.meanRating ?? -1));
  }, [movies]);

  // 2. Highest Rated Movie(s) Overall
  const highestRatedOverall = useMemo(() => {
    if (leaderboard.length === 0) return { movies: [], score: null };

    const topScore = leaderboard[0].meanRating; // Highest score is from the first item after sorting
    const topMovies = leaderboard.filter(movie => movie.meanRating === topScore);

    return { movies: topMovies, score: topScore };
  }, [leaderboard]);

  // 3. Highest Rated By User
  const getHighestRatedByUser = (userKey) => {
    if (!movies || movies.length === 0) return { movies: [], score: null };

    let highestScore = -1; // Start below possible rating range

    // Find the highest score given by this user
    movies.forEach(movie => {
      const rating = movie[userKey];
      if (rating !== null && rating !== undefined && !isNaN(parseFloat(rating))) {
        if (parseFloat(rating) > highestScore) {
          highestScore = parseFloat(rating);
        }
      }
    });

    if (highestScore === -1) { // User hasn't rated any movies
        return { movies: [], score: null };
    }

    // Filter movies where the user gave that highest score
    const topMovies = movies.filter(movie => movie[userKey] === highestScore);

    return { movies: topMovies, score: highestScore };
  };

  // Calculate for each user (memoized individually)
  const highestRatedByMeg = useMemo(() => getHighestRatedByUser('rating_megan'), [movies]);
  const highestRatedByAlec = useMemo(() => getHighestRatedByUser('rating_alex'), [movies]);
  const highestRatedByTim = useMemo(() => getHighestRatedByUser('rating_tim'), [movies]);

  // --- Render Logic ---

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-medium-text">
        Loading statistics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-red-400">
        Error: {error}
        <div className="mt-4">
            <Link to="/flicks" className="inline-flex items-center gap-2 text-accent-teal hover:text-accent-teal-hover transition-colors">
              <FiArrowLeft size={20} />
              Back to Movie Log
            </Link>
        </div>
      </div>
    );
  }

  if (movies.length === 0 && !error) {
      return (
         <div className="container mx-auto px-4 py-12 text-center text-medium-text">
            No movie data available to generate statistics. Log some movies first!
             <div className="mt-4">
                <Link to="/flicks" className="inline-flex items-center gap-2 text-accent-teal hover:text-accent-teal-hover transition-colors">
                  <FiArrowLeft size={20} />
                  Back to Movie Log
                </Link>
            </div>
         </div>
      )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 min-h-[calc(100vh-160px)] text-light-text">
      {/* Back Button */}
      <div className="mb-6">
        <Link to="/flicks" className="inline-flex items-center gap-2 text-accent-teal hover:text-accent-teal-hover transition-colors">
          <FiArrowLeft size={20} />
          Back to Movie Log
        </Link>
      </div>

      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-8 sm:mb-10 text-center">
        <FiTrendingUp className="inline-block mr-3 align-middle mb-1" size={30}/>
        Flicks Club Statistics
      </h1>

      {/* --- Overall Stats Section --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-8 lg:mb-12">

        {/* Highest Rated Overall */}
        <div className="bg-navbar-grey p-4 sm:p-6 rounded-lg shadow-md border border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold text-accent-teal mb-3 flex items-center gap-2">
            <FiAward size={22}/> Highest Rated Overall (Average)
          </h2>
          {highestRatedOverall.movies.length > 0 ? (
            <>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-2">{highestRatedOverall.score?.toFixed(1)} <span className="text-base text-medium-text font-normal">/ 10</span></p>
              <ul className="list-disc list-inside text-sm sm:text-base text-light-text space-y-1">
                {highestRatedOverall.movies.map(movie => (
                  <li key={movie.id}>
                    {movie.title}
                    <span className="text-xs text-gray-400 ml-2">({formatDateForDisplay(movie.watched_on)})</span>
                  </li>
                ))}
              </ul>
              {highestRatedOverall.movies.length > 1 && <p className="text-xs text-gray-400 mt-2 italic">({highestRatedOverall.movies.length} movies tied)</p>}
            </>
          ) : (
            <p className="text-medium-text italic text-sm">No movies have been rated yet.</p>
          )}
        </div>

        {/* User Highest Ratings */}
        <div className="bg-navbar-grey p-4 sm:p-6 rounded-lg shadow-md border border-gray-700 space-y-4">
           <h2 className="text-lg sm:text-xl font-semibold text-accent-teal mb-1 flex items-center gap-2">
            <FiStar size={20}/> User Top Picks
           </h2>
           {/* Meg's Highest */}
           <div className="border-t border-gray-600 pt-3">
             <h3 className="font-semibold text-white mb-1">Meg's Highest Rated:</h3>
             {highestRatedByMeg.score !== null ? (
                <>
                 <p className="text-xl font-bold text-yellow-400 inline-block mr-2">{highestRatedByMeg.score?.toFixed(1)}</p>
                 <span className="text-sm text-light-text"> for {highestRatedByMeg.movies.map(m => m.title).join(', ')}</span>
                 {highestRatedByMeg.movies.length > 1 && <span className="text-xs text-gray-400 ml-1 italic"> (Tie)</span>}
                </>
             ) : <p className="text-medium-text italic text-sm">Meg hasn't rated any movies yet.</p>}
           </div>
           {/* Alec's Highest */}
           <div className="border-t border-gray-600 pt-3">
             <h3 className="font-semibold text-white mb-1">Alec's Highest Rated:</h3>
              {highestRatedByAlec.score !== null ? (
                 <>
                 <p className="text-xl font-bold text-yellow-400 inline-block mr-2">{highestRatedByAlec.score?.toFixed(1)}</p>
                 <span className="text-sm text-light-text"> for {highestRatedByAlec.movies.map(m => m.title).join(', ')}</span>
                  {highestRatedByAlec.movies.length > 1 && <span className="text-xs text-gray-400 ml-1 italic"> (Tie)</span>}
                 </>
              ) : <p className="text-medium-text italic text-sm">Alec hasn't rated any movies yet.</p>}
           </div>
           {/* Tim's Highest */}
           <div className="border-t border-gray-600 pt-3">
             <h3 className="font-semibold text-white mb-1">Tim's Highest Rated:</h3>
             {highestRatedByTim.score !== null ? (
                 <>
                 <p className="text-xl font-bold text-yellow-400 inline-block mr-2">{highestRatedByTim.score?.toFixed(1)}</p>
                 <span className="text-sm text-light-text"> for {highestRatedByTim.movies.map(m => m.title).join(', ')}</span>
                  {highestRatedByTim.movies.length > 1 && <span className="text-xs text-gray-400 ml-1 italic"> (Tie)</span>}
                 </>
             ) : <p className="text-medium-text italic text-sm">Tim hasn't rated any movies yet.</p>}
           </div>
        </div>
      </div>


      {/* --- Leaderboard Section --- */}
      <div className="bg-navbar-grey p-4 sm:p-6 rounded-lg shadow-md border border-gray-700 overflow-x-auto">
        <h2 className="text-lg sm:text-xl font-semibold text-accent-teal mb-4">
          Movie Leaderboard (by Average Rating)
        </h2>
        {leaderboard.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-700 border-collapse">
            <thead className="bg-pleasant-grey">
              <tr>
                <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-medium-text uppercase tracking-wider w-12">Rank</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Title</th>
                <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-medium-text uppercase tracking-wider w-20">Avg Rating</th>
                <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-medium-text uppercase tracking-wider w-16">Meg</th>
                <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-medium-text uppercase tracking-wider w-16">Alec</th>
                <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-medium-text uppercase tracking-wider w-16">Tim</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider hidden sm:table-cell w-28">Watched On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {leaderboard.map((movie, index) => (
                <tr key={movie.id} className="hover:bg-pleasant-grey/50">
                  <td className="px-3 py-3 text-center whitespace-nowrap text-sm text-medium-text font-semibold">{index + 1}</td>
                  <td className="px-4 py-3 text-left text-sm text-light-text font-medium">{movie.title}</td>
                  <td className="px-3 py-3 text-center whitespace-nowrap text-sm font-bold text-yellow-400">{movie.meanRating?.toFixed(1) ?? '-'}</td>
                  <td className="px-2 py-3 text-center whitespace-nowrap text-xs text-medium-text">{movie.rating_megan?.toFixed(1) ?? '-'}</td>
                  <td className="px-2 py-3 text-center whitespace-nowrap text-xs text-medium-text">{movie.rating_alex?.toFixed(1) ?? '-'}</td>
                  <td className="px-2 py-3 text-center whitespace-nowrap text-xs text-medium-text">{movie.rating_tim?.toFixed(1) ?? '-'}</td>
                  <td className="px-3 py-3 text-left whitespace-nowrap text-xs text-gray-400 hidden sm:table-cell">{formatDateForDisplay(movie.watched_on)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-medium-text italic text-center py-4">No rated movies found to build a leaderboard.</p>
        )}
      </div>

    </div>
  );
};

export default Stats;