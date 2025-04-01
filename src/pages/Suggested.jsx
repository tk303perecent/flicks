// src/pages/Suggested.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiThumbsUp, FiExternalLink, FiPlusCircle, FiLoader, FiUser, FiClock, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

// Helper functions
const formatSimpleDateTime = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
        });
    } catch (e) {
        return dateString;
    }
};

const isValidUrl = (string) => {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
};

const Suggested = () => {
    const { session } = useAuth();
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formTitle, setFormTitle] = useState('');
    const [formImdbLink, setFormImdbLink] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);

    // Log session on initial render/change
    // console.log('Suggested component render - Session:', session);

    useEffect(() => {
        const fetchSuggestions = async () => {
            setIsLoading(true);
            setError(null);
            console.log("Fetching suggestions..."); // Log fetch start
            const { data, error: fetchError } = await supabase
                .from('suggested_flicks')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) {
                console.error("Error fetching suggestions:", fetchError);
                setError("Could not load suggestions.");
            } else {
                console.log("Fetched suggestions:", data); // Log fetched data
                setSuggestions(data || []);
            }
            setIsLoading(false);
        };

        // Only fetch if logged in, otherwise handled by render logic
        if (session) {
             fetchSuggestions();
        } else {
             setIsLoading(false); // Not loading if not logged in
             setSuggestions([]); // Ensure suggestions are empty if logged out
        }
    }, [session]); // Re-fetch if session changes (e.g., after login)

    const handleAddSuggestion = async (e) => {
        e.preventDefault();
        console.log('handleAddSuggestion: Function started.'); // <-- ADDED LOG

        if (!session?.user) {
            setFormError("You must be logged in to suggest a movie.");
            console.log('handleAddSuggestion: Exiting - No user session.'); // <-- ADDED LOG
            return;
        }
        // Added detailed user log
        console.log('handleAddSuggestion: User session found - ID:', session.user.id, 'Email:', session.user.email); // <-- ADDED LOG

        if (!formTitle.trim()) {
            setFormError("Movie title is required.");
            console.log('handleAddSuggestion: Exiting - No title.'); // <-- ADDED LOG
            return;
        }
        console.log('handleAddSuggestion: Title found:', formTitle.trim()); // <-- ADDED LOG

        const imdbLinkTrimmed = formImdbLink.trim();

        if (imdbLinkTrimmed && !isValidUrl(imdbLinkTrimmed)) {
             setFormError("Please enter a valid URL for the IMDB link.");
             console.log('handleAddSuggestion: Exiting - Invalid URL format.'); // <-- ADDED LOG
             return;
        }
        if (imdbLinkTrimmed && !imdbLinkTrimmed.includes('imdb.com')) {
             setFormError("Please ensure the link is from imdb.com.");
             console.log('handleAddSuggestion: Exiting - Not an IMDB link.'); // <-- ADDED LOG
             return;
         }
        console.log('handleAddSuggestion: Validation passed.'); // <-- ADDED LOG

        setIsSubmitting(true);
        setFormError(null);

        const newSuggestion = {
            title: formTitle.trim(),
            imdb_link: imdbLinkTrimmed || null,
            suggested_by_user_id: session.user.id,
            // No email field based on your preference
        };
        console.log('handleAddSuggestion: Attempting to insert:', newSuggestion); // <-- ADDED LOG

        try { // Wrap Supabase call in try/catch/finally
            const { data, error: insertError } = await supabase
                .from('suggested_flicks')
                .insert(newSuggestion)
                .select()
                .single();

            // Check specifically for insertError
            if (insertError) {
                 // Throw the error to be caught by the catch block below
                 throw insertError;
            }

            // Only process if data is returned (success)
            if (data) {
                console.log('handleAddSuggestion: Insert successful:', data); // <-- ADDED LOG
                // Prepend new suggestion to the list
                setSuggestions(prev => [data, ...prev]);
                // Clear form
                setFormTitle('');
                setFormImdbLink('');
            } else {
                 // This case might occur if RLS prevents returning the inserted row but allows the insert
                 console.log('handleAddSuggestion: Insert completed but no data returned. RLS might be preventing select.'); // <-- ADDED LOG
                 setFormError("Suggestion added, but failed to retrieve confirmation."); // Inform user, maybe clear form anyway
                 setFormTitle('');
                 setFormImdbLink('');
            }

        } catch (error) { // Catch any error from the try block (including thrown insertError)
             console.error("Error adding suggestion (inside catch):", error); // <-- ADDED LOG
             // Provide specific Supabase error message if available
             setFormError(`Failed to add suggestion: ${error.message || 'Unknown error'}. Please try again.`);
        } finally { // Ensure isSubmitting is always reset
             setIsSubmitting(false);
             console.log('handleAddSuggestion: Function finished.'); // <-- ADDED LOG
        }
    };


    const handleDeleteSuggestion = async (suggestionId) => {
        // ... (delete logic remains the same) ...
        if (!session?.user) return;
        const suggestionToDelete = suggestions.find(s => s.id === suggestionId);
         if (!window.confirm(`Delete suggestion "${suggestionToDelete?.title || 'this suggestion'}"?`)) {
             return;
         }
        // Rely on RLS to prevent unauthorized deletes
        const { error: deleteError } = await supabase
            .from('suggested_flicks')
            .delete()
            .eq('id', suggestionId);
        if (deleteError) {
            console.error("Error deleting suggestion:", deleteError);
            setError("Failed to delete suggestion."); // Use general error state for display list
        } else {
            setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
        }
    };

    // Render logic (Login prompt, loading, error, list, form)
    if (!session) {
         return (
            <div className="container mx-auto px-4 py-16 sm:px-6 md:py-24 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">Suggested Flicks</h1>
              <p className="text-base sm:text-lg text-medium-text">Please <Link to="/login" className="text-accent-teal hover:underline">log in</Link> to view or add movie suggestions.</p>
            </div>
         );
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 min-h-[calc(100vh-160px)] text-light-text">
            {/* Back Button */}
            <div className="mb-6">
                <Link to="/flicks" className="inline-flex items-center gap-2 text-accent-teal hover:text-accent-teal-hover transition-colors">
                    <FiArrowLeft size={20} /> Back to Movie Log
                </Link>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-8 sm:mb-10 text-center flex justify-center items-center gap-3">
                <FiThumbsUp size={30} /> Suggested Flicks
            </h1>

            {/* Add Suggestion Form */}
            <div className="mb-8 sm:mb-12 bg-navbar-grey p-4 sm:p-6 rounded-lg shadow-md max-w-2xl mx-auto">
                <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Suggest a Movie</h2>
                <form onSubmit={handleAddSuggestion} className="space-y-4">
                    <div>
                        <label htmlFor="suggestTitle" className="block text-xs sm:text-sm font-medium text-medium-text mb-1">Movie Title <span className="text-red-400">*</span></label>
                        <input
                            type="text" id="suggestTitle" value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            placeholder="Enter the movie title..."
                            className="w-full px-3 py-2 rounded-md bg-pleasant-grey border border-gray-600 text-light-text text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-accent-teal"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="suggestImdbLink" className="block text-xs sm:text-sm font-medium text-medium-text mb-1">IMDB Link (Optional)</label>
                        <input
                            type="url" id="suggestImdbLink" value={formImdbLink}
                            onChange={(e) => setFormImdbLink(e.target.value)}
                            placeholder="Paste IMDB link here (e.g., https://www.imdb.com/title/tt...)"
                            className="w-full px-3 py-2 rounded-md bg-pleasant-grey border border-gray-600 text-light-text text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-accent-teal"
                        />
                    </div>
                    {/* Display Form Error Here */}
                    {formError && <p className="text-sm text-red-400 bg-red-900/20 p-3 rounded-md">{formError}</p>}
                    <div className="flex justify-end">
                        <button
                            type="submit" disabled={isSubmitting}
                            className="inline-flex items-center gap-2 px-5 py-2 sm:px-6 sm:py-2 bg-accent-teal hover:bg-accent-teal-hover text-white font-semibold rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                            {isSubmitting ? <FiLoader className="animate-spin" size={18} /> : <FiPlusCircle size={18} />}
                            {isSubmitting ? 'Adding...' : 'Add Suggestion'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Display Suggestions */}
            <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">Suggestions List</h2>
                {isLoading && <p className="text-center text-medium-text"><FiLoader className="animate-spin inline mr-2" /> Loading suggestions...</p>}
                {/* Display general list error */}
                {error && !isLoading && <p className="text-center text-red-400 bg-red-900/20 p-3 rounded-md">{error}</p>}
                {!isLoading && !error && suggestions.length === 0 && (
                    <p className="text-center text-medium-text italic">No movie suggestions yet. Be the first!</p>
                )}
                {!isLoading && !error && suggestions.length > 0 && (
                    suggestions.map(suggestion => (
                        <div key={suggestion.id} className="bg-navbar-grey p-4 rounded-lg shadow flex flex-col sm:flex-row justify-between items-start gap-4 border border-gray-700/50">
                            <div className="flex-grow">
                                <h3 className="text-base sm:text-lg font-semibold text-light-text mb-1">{suggestion.title}</h3>
                                <div className="text-xs text-gray-400 space-y-0.5 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
                                     <span className="flex items-center gap-1" title="Suggested By User">
                                         <FiUser size={12}/> {/* Indicator for who suggested */}
                                     </span>
                                    <span className="flex items-center gap-1" title="Suggested On">
                                        <FiClock size={12}/> {formatSimpleDateTime(suggestion.created_at)}
                                    </span>
                                </div>
                                {suggestion.imdb_link && (
                                    <a
                                        href={suggestion.imdb_link} target="_blank" rel="noopener noreferrer"
                                        className="mt-2 inline-flex items-center gap-1.5 text-sm text-accent-teal hover:text-accent-teal-hover hover:underline"
                                        title={`View "${suggestion.title}" on IMDB`}
                                    >
                                        View on IMDB <FiExternalLink size={14} />
                                    </a>
                                )}
                            </div>
                            {/* Optional Delete Button */}
                             {session.user.id === suggestion.suggested_by_user_id && (
                                <button
                                    onClick={() => handleDeleteSuggestion(suggestion.id)}
                                    className="text-red-500 hover:text-red-400 p-1.5 -mr-1.5 flex-shrink-0 self-start sm:self-center"
                                    title="Delete Suggestion"
                                >
                                    <FiTrash2 size={18} />
                                </button>
                             )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Suggested;