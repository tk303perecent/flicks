// src/pages/Dashboard/FlashcardsView.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiPlus, FiTrash2, FiEdit, FiBookOpen, FiChevronDown, FiChevronUp, FiLoader, // Using FiEdit
    FiSave, FiX // Save/Cancel icons
} from 'react-icons/fi';
import { supabase } from '../../supabaseClient'; // Adjust path if needed

const FlashcardsView = () => {
    // Deck State
    const [decks, setDecks] = useState([]);
    const [deckLoading, setDeckLoading] = useState(true);
    const [deckError, setDeckError] = useState(null);
    const [newDeckName, setNewDeckName] = useState('');

    // Card View/Manage State
    const [selectedDeckId, setSelectedDeckId] = useState(null);
    const [cards, setCards] = useState([]);
    const [cardLoading, setCardLoading] = useState(false);
    const [cardError, setCardError] = useState(null);
    const [newCardQuestion, setNewCardQuestion] = useState('');
    const [newCardAnswer, setNewCardAnswer] = useState('');
    const [isSubmittingCard, setIsSubmittingCard] = useState(false);

    // State for Editing Cards
    const [editingCardId, setEditingCardId] = useState(null);
    const [editCardQuestion, setEditCardQuestion] = useState('');
    const [editCardAnswer, setEditCardAnswer] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // User State
    const [user, setUser] = useState(undefined);

    const navigate = useNavigate();

    // useEffects for user session, fetching decks, fetching cards (remain the same)
    useEffect(() => { /* ... get user session ... */
        let mounted = true; async function getInitialSession() { const { data: { session }, error: sessionError } = await supabase.auth.getSession(); if (mounted) { if (sessionError) console.error("Error getting initial session:", sessionError); setUser(session?.user ?? null); } } getInitialSession(); const { data: { subscription }, error: listenerError } = supabase.auth.onAuthStateChange((_event, session) => { if (mounted) setUser(session?.user ?? null); }); if (listenerError) console.error("Error setting up auth listener:", listenerError); return () => { mounted = false; subscription?.unsubscribe(); };
    }, []);
    const fetchDecks = async () => { /* ... fetch decks logic ... */ if (user === undefined || user === null) { if (user === null) { setDecks([]); setDeckLoading(false); } return; } setDeckLoading(true); setDeckError(null); try { const { data, error: fetchError } = await supabase.from('decks').select('*').order('created_at', { ascending: false }); if (fetchError) throw fetchError; setDecks(data || []); } catch (err) { console.error("Error fetching decks:", err); if (err.message.includes('security violation') || err.code === '42501') setDeckError("Permission denied fetching decks."); else setDeckError("Failed to load decks. Please try again."); } finally { setDeckLoading(false); } };
    useEffect(() => { if (user !== undefined) fetchDecks(); }, [user]);
    useEffect(() => { /* ... fetch cards logic ... */
        const fetchCards = async () => { if (!selectedDeckId || !user) { setCards([]); return; } setCardLoading(true); setCardError(null); setEditingCardId(null); try { const { data, error: fetchError } = await supabase.from('flashcards').select('*').eq('deck_id', selectedDeckId).eq('user_id', user.id).order('created_at', { ascending: true }); if (fetchError) throw fetchError; setCards(data || []); } catch (err) { console.error(`Error fetching cards for deck ${selectedDeckId}:`, err); setCardError("Failed to load cards."); } finally { setCardLoading(false); } }; fetchCards();
     }, [selectedDeckId, user]);


    // Handlers for Deck Create/Delete (remain the same)
    const handleCreateDeck = async (e) => { /* ... same ... */ e.preventDefault(); if (!newDeckName.trim() || !user) return; try { const { error: insertError } = await supabase.from('decks').insert({ name: newDeckName, user_id: user.id }).single(); if (insertError) throw insertError; fetchDecks(); setNewDeckName(''); } catch (err) { console.error("Error creating deck:", err); setDeckError(`Failed to create deck: ${err.message}`); } };
    const handleDeleteDeck = async (deckId) => { /* ... same ... */ if (!window.confirm("Are you sure you want to delete this deck and ALL its cards?")) return; if (!user) return; try { const { error: deleteError } = await supabase.from('decks').delete().match({ id: deckId, user_id: user.id }); if (deleteError) throw deleteError; fetchDecks(); if(selectedDeckId === deckId) setSelectedDeckId(null); } catch (err) { console.error("Error deleting deck:", err); setDeckError(`Failed to delete deck: ${err.message}`); } };

    // Toggle Card View / Reset Edit State (remains the same)
    const handleViewCards = (deckId) => { setEditingCardId(null); if (selectedDeckId === deckId) setSelectedDeckId(null); else setSelectedDeckId(deckId); };

    // Navigate to Study Page (remains the same)
    const handleStudyDeck = (deckId) => { navigate(`/dashboard/study/${deckId}`); };

    // Handle Adding a New Card (remains the same)
    const handleAddCard = async (e) => { /* ... same ... */ e.preventDefault(); if (!newCardQuestion.trim() || !newCardAnswer.trim() || !selectedDeckId || !user) return; setIsSubmittingCard(true); setCardError(null); try { const { data, error: insertError } = await supabase.from('flashcards').insert({ deck_id: selectedDeckId, user_id: user.id, question: newCardQuestion.trim(), answer: newCardAnswer.trim() }).select().single(); if (insertError) throw insertError; setCards(prev => [...prev, data]); setNewCardQuestion(''); setNewCardAnswer(''); } catch(err) { console.error("Error adding card:", err); setCardError(`Failed to add card: ${err.message}`); } finally { setIsSubmittingCard(false); } };

    // Handle Deleting a Card (remains the same)
    const handleDeleteCard = async (cardId) => { /* ... same ... */ if (!window.confirm("Delete this flashcard?")) return; if (!user) return; try { const { error: deleteError } = await supabase.from('flashcards').delete().match({ id: cardId, user_id: user.id }); if (deleteError) throw deleteError; setCards(prev => prev.filter(card => card.id !== cardId)); if (editingCardId === cardId) setEditingCardId(null); } catch(err) { console.error("Error deleting card:", err); setCardError(`Failed to delete card: ${err.message}`); } };

    // Edit Card Handlers (remain the same)
    const handleStartEdit = (card) => { setEditingCardId(card.id); setEditCardQuestion(card.question); setEditCardAnswer(card.answer); setCardError(null); };
    const handleCancelEdit = () => { setEditingCardId(null); };
    const handleSaveEdit = async () => { if (!editCardQuestion.trim() || !editCardAnswer.trim() || !editingCardId || !user) { setCardError("Question and Answer cannot be empty."); return; } setIsSavingEdit(true); setCardError(null); try { const { data, error: updateError } = await supabase.from('flashcards').update({ question: editCardQuestion.trim(), answer: editCardAnswer.trim() }).match({ id: editingCardId, user_id: user.id }).select().single(); if (updateError) throw updateError; setCards(prevCards => prevCards.map(card => card.id === editingCardId ? data : card )); setEditingCardId(null); } catch (err) { console.error("Error updating card:", err); setCardError(`Failed to save changes: ${err.message}`); } finally { setIsSavingEdit(false); } };

    // --- RENDER LOGIC ---
    return (
        <div>
            <h2 className="text-2xl font-semibold mb-6 dark:text-gray-100">Your Flashcard Decks</h2>
            {/* Create Deck Form */}
            <form onSubmit={handleCreateDeck} className="mb-6 p-4 border rounded bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm"> {/* ... form ... */} <label htmlFor="new-deck-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Create New Deck</label><div className="flex space-x-2"><input id="new-deck-name" type="text" value={newDeckName} onChange={(e) => setNewDeckName(e.target.value)} placeholder="Enter deck name" required className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#38B2AC] focus:border-[#38B2AC] dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-offset-gray-800"/><button type="submit" disabled={!newDeckName.trim() || deckLoading} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#38B2AC] hover:bg-[#319795] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38B2AC] disabled:opacity-50 dark:focus:ring-offset-gray-800"><FiPlus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" /> Create</button></div> </form>

            {/* Loading/Error for Decks */}
            {user === undefined && <p className="text-gray-500 dark:text-gray-400">Loading user session...</p>}
            {user !== undefined && deckLoading && <p className="text-gray-500 dark:text-gray-400">Loading decks...</p>}
            {deckError && <p className="text-red-600 dark:text-red-400">Error: {deckError}</p>}

            {/* Deck List */}
            {user !== undefined && !deckLoading && !deckError && (
                <div className="space-y-4">
                    {decks.length === 0 ? (<p className="text-gray-500 dark:text-gray-400">{user ? 'You haven\'t created any decks yet...' : 'Please log in...'}</p>) : (
                        decks.map((deck) => (
                            <div key={deck.id} className="border rounded bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm overflow-hidden">
                                {/* Deck Header Row */}
                                <div className="p-4 flex justify-between items-center border-b dark:border-gray-700"> <div> <h3 className="text-lg font-medium dark:text-gray-100">{deck.name}</h3> {deck.description && <p className="text-sm text-gray-500 dark:text-gray-400">{deck.description}</p>} <p className="text-xs text-gray-400 dark:text-gray-500">Created: {new Date(deck.created_at).toLocaleDateString()}</p> </div> <div className="flex space-x-1"> <button onClick={() => handleStudyDeck(deck.id)} title="Study Deck" className="p-2 text-gray-500 hover:text-[#38B2AC] dark:text-gray-400 dark:hover:text-[#319795]"> <FiBookOpen className="w-5 h-5" /> </button> <button onClick={() => handleViewCards(deck.id)} title={selectedDeckId === deck.id ? "Hide Cards" : "View/Edit Cards"} className={`p-2 text-gray-500 ${selectedDeckId === deck.id ? 'text-blue-600 dark:text-blue-400' : 'hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400'}`}> {selectedDeckId === deck.id ? <FiChevronUp className="w-5 h-5" /> : <FiChevronDown className="w-5 h-5" />} </button> <button onClick={() => handleDeleteDeck(deck.id)} title="Delete Deck" className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"> <FiTrash2 className="w-5 h-5" /> </button> </div> </div>

                                {/* Conditionally Rendered Card Section */}
                                {selectedDeckId === deck.id && (
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700">
                                        <h4 className="text-md font-semibold mb-3 dark:text-gray-200">Flashcards in this Deck</h4>
                                        {cardLoading && <p className="text-sm text-gray-500 dark:text-gray-400"><FiLoader className="animate-spin inline mr-1"/> Loading cards...</p>}
                                        {cardError && <p className="text-sm text-red-600 dark:text-red-400">Error: {cardError}</p>}

                                        {!cardLoading && !cardError && (
                                            <>
                                                {/* Card List with Editing */}
                                                <div className="space-y-2 mb-4 max-h-96 overflow-y-auto pr-2"> {/* Added pr-2 for scrollbar space */}
                                                    {cards.length === 0 ? ( <p className="text-sm text-gray-500 dark:text-gray-400 italic">No flashcards in this deck yet.</p> ) : (
                                                        cards.map(card => (
                                                            <div key={card.id} className={`p-3 border rounded dark:border-gray-600 text-sm ${editingCardId === card.id ? 'bg-blue-50 dark:bg-gray-700/50' : 'bg-white dark:bg-gray-700'}`}>
                                                                {editingCardId === card.id ? (
                                                                    // --- Editing State ---
                                                                    <div className="space-y-2">
                                                                        <div><label htmlFor={`edit-q-${card.id}`} className="sr-only">Question</label><textarea id={`edit-q-${card.id}`} rows="2" value={editCardQuestion} onChange={e => setEditCardQuestion(e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#38B2AC] focus:border-[#38B2AC] dark:bg-gray-600 dark:border-gray-500 dark:text-white"/></div>
                                                                        <div><label htmlFor={`edit-a-${card.id}`} className="sr-only">Answer</label><textarea id={`edit-a-${card.id}`} rows="2" value={editCardAnswer} onChange={e => setEditCardAnswer(e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#38B2AC] focus:border-[#38B2AC] dark:bg-gray-600 dark:border-gray-500 dark:text-white"/></div>
                                                                        <div className="flex justify-end space-x-2 mt-1">
                                                                             <button onClick={handleCancelEdit} className="px-2 py-1 text-xs rounded border border-gray-400 dark:border-gray-500 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600" title="Cancel Edit"> <FiX size={14}/> </button>
                                                                             <button onClick={handleSaveEdit} disabled={isSavingEdit} className="inline-flex items-center px-2 py-1 text-xs rounded border border-transparent bg-[#38B2AC] hover:bg-[#319795] text-white disabled:opacity-50" title="Save Changes"> {isSavingEdit ? <FiLoader className="animate-spin" size={14}/> : <FiSave size={14}/>} </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    // --- Display State ---
                                                                    <div className="flex justify-between items-start">
                                                                        <div className="flex-1 mr-2 break-words">
                                                                            <p className="font-medium dark:text-gray-200">Q: <span className="font-normal">{card.question}</span></p>
                                                                            <p className="text-gray-600 dark:text-gray-300">A: <span className="font-normal">{card.answer}</span></p>
                                                                        </div>
                                                                        {/* --- Edit/Delete Buttons Side-by-Side --- */}
                                                                        <div className="flex items-center space-x-1 ml-1 flex-shrink-0">
                                                                            <button onClick={() => handleStartEdit(card)} title="Edit Card" className="p-1 text-gray-400 hover:text-[#38B2AC]"> <FiEdit size={14}/> </button>
                                                                            <button onClick={() => handleDeleteCard(card.id)} title="Delete Card" className="p-1 text-gray-400 hover:text-red-500"> <FiTrash2 size={14} /> </button>
                                                                         </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                                {/* Add Card Form */}
                                                <form onSubmit={handleAddCard} className="mt-4 pt-4 border-t dark:border-gray-600 space-y-2"> <h5 className="text-sm font-semibold dark:text-gray-200">Add New Card</h5> <div> <label htmlFor={`q-${deck.id}`} className="sr-only">Question</label> <textarea id={`q-${deck.id}`} rows="2" value={newCardQuestion} onChange={e => setNewCardQuestion(e.target.value)} placeholder="Question" required className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#38B2AC] focus:border-[#38B2AC] dark:bg-gray-600 dark:border-gray-500 dark:text-white" /> </div> <div> <label htmlFor={`a-${deck.id}`} className="sr-only">Answer</label> <textarea id={`a-${deck.id}`} rows="2" value={newCardAnswer} onChange={e => setNewCardAnswer(e.target.value)} placeholder="Answer" required className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#38B2AC] focus:border-[#38B2AC] dark:bg-gray-600 dark:border-gray-500 dark:text-white" /> </div> <div className="flex justify-end"> <button type="submit" disabled={isSubmittingCard} className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-[#38B2AC] hover:bg-[#319795] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38B2AC] disabled:opacity-50 dark:focus:ring-offset-gray-800"> {isSubmittingCard ? <FiLoader className="animate-spin mr-1" size={14}/> : <FiPlus size={14} className="mr-1"/>} Add Card </button> </div> {cardError && <p className="text-xs text-red-600 dark:text-red-400 mt-1">Error: {cardError}</p>} </form>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default FlashcardsView;