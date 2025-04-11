// src/pages/Dashboard/FlashcardsStudy.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient'; // Adjust path if needed
import {
    FiLoader, FiRotateCcw, FiArrowLeft, FiArrowRight, FiXCircle,
    FiStar, FiThumbsUp, FiThumbsDown, FiEdit, FiSave, FiX
} from 'react-icons/fi';

// --- Helper Function for Shuffling ---
function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}

const FlashcardsStudy = () => {
    const { deckId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    const [deckName, setDeckName] = useState('');
    const [originalCards, setOriginalCards] = useState([]);
    const [studyCards, setStudyCards] = useState([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [studyLoading, setStudyLoading] = useState(true);
    const [studyError, setStudyError] = useState(null);

    const [cardSessionStatus, setCardSessionStatus] = useState({});
    const [starredCards, setStarredCards] = useState({});

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [cardToEdit, setCardToEdit] = useState(null);
    const [editStudyQuestion, setEditStudyQuestion] = useState('');
    const [editStudyAnswer, setEditStudyAnswer] = useState('');
    const [isSavingStudyEdit, setIsSavingStudyEdit] = useState(false);
    const [editStudyError, setEditStudyError] = useState(null);

    // Get user session
     useEffect(() => {
        let mounted = true;
        async function getInitialSession() {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (mounted) {
                if (sessionError) console.error("Error getting session:", sessionError);
                setUser(session?.user ?? null);
                if (!session?.user) {
                     setStudyError("You must be logged in to study.");
                     setStudyLoading(false);
                }
            }
        }
        getInitialSession();
        return () => { mounted = false; };
    }, []);


    // Fetch deck name and cards based on deckId from URL and user
    const fetchStudyData = useCallback(async () => {
        // Ensure we don't fetch before user is confirmed to exist and deckId is present
        if (!deckId || !user) {
            if (!user && deckId) { setStudyError("Login required."); setStudyLoading(false); }
             // Clear potentially stale data if user logs out while component is mounted
             if (!user) { setOriginalCards([]); setStudyCards([]); setDeckName(''); }
            return;
        }

        setStudyLoading(true); setStudyError(null); setCardSessionStatus({}); setStarredCards({});
        try {
            const { data: deckData, error: deckError } = await supabase.from('decks').select('name').eq('id', deckId).eq('user_id', user.id).maybeSingle();
            if (deckError) throw deckError; if (!deckData) throw new Error("Deck not found or access denied."); setDeckName(deckData.name);

            const { data: cardsData, error: cardsError } = await supabase.from('flashcards').select('*').eq('deck_id', deckId).eq('user_id', user.id);
            if (cardsError) throw cardsError;

            if (cardsData && cardsData.length > 0) { setOriginalCards([...cardsData]); setStudyCards(shuffleArray([...cardsData])); setCurrentCardIndex(0); setIsFlipped(false); }
             else { setOriginalCards([]); setStudyCards([]); setStudyError("This deck has no cards."); }
        } catch (err) {
            console.error(`Error fetching study data for deck ${deckId}:`, err); setStudyError(`Failed to load: ${err.message}`); setStudyCards([]); setOriginalCards([]); setDeckName('');
        } finally { setStudyLoading(false); }
    }, [deckId, user]); // Depend on deckId from URL and user state

    useEffect(() => {
        // Only fetch if we have a user object (even if null, means auth check is done)
        if (user !== undefined) {
             fetchStudyData();
        }
    }, [user, fetchStudyData]); // Fetch when user is determined, or fetch function changes (deckId)


    // ===========================================================
    // CORRECT ORDER: Define handlers used by keyboard effect BEFORE the effect
    // ===========================================================
    const handleFlipCard = useCallback(() => setIsFlipped(prev => !prev), []);

    const handleNextCard = useCallback(() => {
        if (studyCards.length === 0) return;
        setCurrentCardIndex(prevIndex => (prevIndex + 1) % studyCards.length); // Loop
        setIsFlipped(false);
    }, [studyCards.length]);

    const handlePreviousCard = useCallback(() => {
        if (studyCards.length === 0) return;
        setCurrentCardIndex(prevIndex => (prevIndex - 1 + studyCards.length) % studyCards.length); // Loop
        setIsFlipped(false);
    }, [studyCards.length]);
    // ===========================================================


    // --- Keyboard Navigation Effect ---
    useEffect(() => {
        const handleKeyDown = (event) => {
             if (isEditModalOpen) return; // Ignore keyboard nav if modal is open
             if (studyCards.length === 0 || studyLoading) return;

            switch (event.key) {
                case 'ArrowLeft': handlePreviousCard(); break;
                case 'ArrowRight': handleNextCard(); break;
                case ' ': case 'Enter': event.preventDefault(); handleFlipCard(); break;
                default: break;
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
        // Dependencies are correct now
    }, [handlePreviousCard, handleNextCard, handleFlipCard, studyCards, studyLoading, isEditModalOpen]);


    // --- Other Handlers ---
    const handleExitStudy = () => navigate('/dashboard', { state: { requestedView: 'flashcards' } });
    const handleRestartSession = () => { if (originalCards.length > 0) { setStudyCards(shuffleArray([...originalCards])); setCurrentCardIndex(0); setIsFlipped(false); setCardSessionStatus({}); setStarredCards({}); setStudyError(null); } };
    const handleMarkCard = useCallback((status) => { if (!studyCards[currentCardIndex]) return; const cardId = studyCards[currentCardIndex].id; setCardSessionStatus(prev => ({ ...prev, [cardId]: status })); }, [currentCardIndex, studyCards]);
    const handleToggleStar = useCallback(() => { if (!studyCards[currentCardIndex]) return; const cardId = studyCards[currentCardIndex].id; setStarredCards(prev => ({ ...prev, [cardId]: !prev[cardId] })); }, [currentCardIndex, studyCards]);

    // Edit Modal Handlers
    const handleOpenStudyEdit = () => { const card = studyCards[currentCardIndex]; if (card) { setCardToEdit(card); setEditStudyQuestion(card.question); setEditStudyAnswer(card.answer); setIsEditModalOpen(true); setEditStudyError(null); } };
    const handleCloseStudyEdit = () => { setIsEditModalOpen(false); setCardToEdit(null); };
    const handleSaveStudyEdit = async () => { if (!editStudyQuestion.trim() || !editStudyAnswer.trim() || !cardToEdit || !user) { setEditStudyError("Question and Answer cannot be empty."); return; } setIsSavingStudyEdit(true); setEditStudyError(null); try { const { data, error: updateError } = await supabase.from('flashcards').update({ question: editStudyQuestion.trim(), answer: editStudyAnswer.trim() }).match({ id: cardToEdit.id, user_id: user.id }).select().single(); if (updateError) throw updateError; const updateCardInArray = (prevArray) => prevArray.map(c => c.id === cardToEdit.id ? data : c); setStudyCards(updateCardInArray); setOriginalCards(updateCardInArray); handleCloseStudyEdit(); } catch (err) { console.error("Error updating card during study:", err); setEditStudyError(`Failed to save changes: ${err.message}`); } finally { setIsSavingStudyEdit(false); } };

    // Calculate Counts
    const knownCount = useMemo(() => Object.values(cardSessionStatus).filter(s => s === 'known').length, [cardSessionStatus]);
    const reviewCount = useMemo(() => Object.values(cardSessionStatus).filter(s => s === 'review').length, [cardSessionStatus]);
    const starredCount = useMemo(() => Object.values(starredCards).filter(s => s === true).length, [starredCards]);

    // Current card details
    const currentCard = studyCards[currentCardIndex];
    const currentCardId = currentCard?.id;
    const isCurrentCardStarred = currentCardId ? starredCards[currentCardId] : false;
    const currentCardStatus = currentCardId ? cardSessionStatus[currentCardId] : null;

    // --- RENDER LOGIC ---
    return (
        // --- JSX Structure remains the same ---
        <div className="p-4 sm:p-6 flex flex-col items-center min-h-screen bg-gray-100 dark:bg-gray-900"> <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 relative"> <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-gray-700"> <h2 className="text-xl sm:text-2xl font-semibold dark:text-gray-100 truncate"> {studyLoading ? 'Loading...' : `Studying: ${deckName || 'Deck'}`} </h2> <div className="flex items-center space-x-2"> <button onClick={handleRestartSession} disabled={studyLoading || originalCards.length === 0} className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed" title="Restart Session (Re-shuffle)"> <FiRotateCcw size={18} /> </button> <button onClick={handleExitStudy} className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Exit Study Mode"> <FiXCircle size={20} /> </button> </div> </div> {studyLoading && <div className="text-center p-10"><FiLoader className="animate-spin inline mr-2 text-4xl text-gray-500 dark:text-gray-400" /> <p className="mt-2">Loading cards...</p></div>} {studyError && <div className="text-center p-10 text-red-500 dark:text-red-400">Error: {studyError} <button onClick={handleExitStudy} className="ml-2 text-sm underline">Go Back</button></div>} {!studyLoading && !studyError && studyCards.length > 0 && ( <div className="flex flex-col items-center"> <div className="relative w-full"> <div onClick={handleFlipCard} className={`w-full h-64 sm:h-80 p-6 rounded-lg shadow-lg border cursor-pointer flex items-center justify-center text-center text-xl sm:text-2xl transition-transform duration-500 preserve-3d ${isFlipped ? 'bg-blue-50 dark:bg-gray-700 border-blue-200 dark:border-gray-600' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700'} dark:text-gray-100`} style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}> <div className="backface-hidden" style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}> {isFlipped ? <p className="break-words">{currentCard?.answer}</p> : <p className="break-words">{currentCard?.question}</p>} </div> </div> <div className="absolute top-2 right-2 flex flex-col space-y-1"> <button onClick={handleToggleStar} title={isCurrentCardStarred ? "Unstar Card" : "Star Card"} className="p-1.5 rounded-full bg-white/50 dark:bg-gray-800/50 text-gray-400 hover:text-yellow-500 hover:bg-gray-100 dark:hover:bg-gray-700"> <FiStar className={`w-5 h-5 ${isCurrentCardStarred ? 'fill-yellow-400 text-yellow-500' : ''}`} /> </button> <button onClick={handleOpenStudyEdit} title={"Edit Card"} className="p-1.5 rounded-full bg-white/50 dark:bg-gray-800/50 text-gray-400 hover:text-[#38B2AC] hover:bg-gray-100 dark:hover:bg-gray-700"> <FiEdit className="w-5 h-5" /> </button> </div> </div> <div className="w-full mt-4"> <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1"> <span>Progress: {currentCardIndex + 1} / {studyCards.length}</span> <div className="flex space-x-2"> <span title="Cards marked 'Known'"><FiThumbsUp size={12} className="inline text-green-500"/> {knownCount}</span> <span title="Cards marked 'Review Again'"><FiThumbsDown size={12} className="inline text-orange-500"/> {reviewCount}</span> <span title="Starred Cards"><FiStar size={12} className="inline text-yellow-500"/> {starredCount}</span> </div> </div> <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5"> <div className="bg-[#38B2AC] h-1.5 rounded-full transition-width duration-300 ease-out" style={{ width: `${((currentCardIndex + 1) / studyCards.length) * 100}%` }}></div> </div> </div> <button onClick={handleFlipCard} className="mt-2 text-xs text-blue-500 hover:underline dark:text-blue-400">(Click card or press Space/Enter to flip)</button> <div className="flex justify-center w-full space-x-4 mt-4"> <button onClick={() => handleMarkCard('review')} className={`inline-flex items-center gap-1 px-4 py-2 border rounded-md text-sm font-medium transition-colors ${currentCardStatus === 'review' ? 'bg-orange-100 border-orange-300 text-orange-700 dark:bg-orange-900/50 dark:border-orange-700 dark:text-orange-300' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'}`}> <FiThumbsDown size={16}/> Review Again </button> <button onClick={() => handleMarkCard('known')} className={`inline-flex items-center gap-1 px-4 py-2 border rounded-md text-sm font-medium transition-colors ${currentCardStatus === 'known' ? 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'}`}> <FiThumbsUp size={16}/> I Knew This </button> </div> <div className="flex justify-between w-full max-w-xs mt-6"> <button onClick={handlePreviousCard} className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"> <FiArrowLeft className="mr-2 h-4 w-4"/> Previous </button> <button onClick={handleNextCard} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#38B2AC] hover:bg-[#319795] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38B2AC] dark:focus:ring-offset-gray-800"> Next <FiArrowRight className="ml-2 h-4 w-4"/> </button> </div> </div> )} {!studyLoading && !studyError && studyCards.length === 0 && ( <p className="text-center text-gray-500 dark:text-gray-400 italic py-10">This deck has no cards to study. <button onClick={handleExitStudy} className="ml-2 text-sm underline">Go Back</button></p> )} {isEditModalOpen && cardToEdit && ( <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"> <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative"> <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Edit Card</h3> <button onClick={handleCloseStudyEdit} className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"> <FiX size={20}/> </button> <div className="space-y-3"> <div> <label htmlFor="edit-study-q" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Question</label> <textarea id="edit-study-q" rows="3" value={editStudyQuestion} onChange={e => setEditStudyQuestion(e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#38B2AC] focus:border-[#38B2AC] dark:bg-gray-600 dark:border-gray-500 dark:text-white" /> </div> <div> <label htmlFor="edit-study-a" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Answer</label> <textarea id="edit-study-a" rows="3" value={editStudyAnswer} onChange={e => setEditStudyAnswer(e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#38B2AC] focus:border-[#38B2AC] dark:bg-gray-600 dark:border-gray-500 dark:text-white" /> </div> {editStudyError && <p className="text-xs text-red-500 dark:text-red-400">{editStudyError}</p>} <div className="flex justify-end space-x-3 pt-3"> <button onClick={handleCloseStudyEdit} className="px-4 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button> <button onClick={handleSaveStudyEdit} disabled={isSavingStudyEdit} className="inline-flex items-center px-4 py-1.5 text-sm rounded border border-transparent bg-[#38B2AC] hover:bg-[#319795] text-white disabled:opacity-50"> {isSavingStudyEdit ? <FiLoader className="animate-spin mr-1" size={16}/> : <FiSave size={16} className="mr-1"/>} Save </button> </div> </div> </div> </div> )} </div> </div>
    );
};

export default FlashcardsStudy;