// src/pages/Games.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiClipboard, FiList, FiImage } from 'react-icons/fi'; // Corrected: FiImage
import { useAuth } from '../context/AuthContext'; // Adjust path as needed
import TriviaGame from '../components/games/TriviaGame'; // Adjust path as needed
import AddTriviaQuestionModal from '../components/games/AddTriviaQuestionModal'; // Import the modal
// Import other game components here when ready
// import PosterGuessGame from '../components/games/PosterGuessGame';

const Games = () => {
  const { session } = useAuth();
  const [activeGame, setActiveGame] = useState(null); // e.g., 'trivia', 'poster', null for menu
  const [gameKey, setGameKey] = useState(0); // Used to force re-mount/reset of game component
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false); // State for modal visibility

  // --- Game Menu Component ---
  // Added icons and wrapper div for better styling
  const GameMenu = ({ onSelectGame }) => (
    // Added wrapper div for card-like appearance
    <div className="bg-navbar-grey p-6 sm:p-8 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-xl sm:text-2xl font-semibold text-white mb-6 text-center">Choose a Game</h2>
      <div className="space-y-4">
        {/* Game Selection Buttons */}
        <button
          onClick={() => onSelectGame('trivia')}
          className="w-full flex items-center justify-center gap-3 px-5 py-2.5 bg-pleasant-grey hover:bg-gray-600 text-light-text font-semibold rounded-md transition duration-200 text-base sm:text-lg"
        >
          <FiList size={20} /> {/* Icon Added */}
          <span>Flicks Club Trivia</span>
        </button>
         <button
           // onClick={() => onSelectGame('poster')}
           disabled // Remove disabled when PosterGuessGame is ready
           className="w-full flex items-center justify-center gap-3 px-5 py-2.5 bg-pleasant-grey text-light-text font-semibold rounded-md transition duration-200 text-base sm:text-lg opacity-50 cursor-not-allowed"
         >
           <FiImage size={20} /> {/* Corrected Icon */}
           <span>Guess the Poster (Coming Soon)</span>
         </button>
         {/* Other game buttons would go here */}
      </div>
    </div>
  );

  // --- Handler Functions ---
  const handleSelectGame = (game) => {
    setActiveGame(game);
    setGameKey(prevKey => prevKey + 1); // Change key to force re-mount of game component
  };

  const handleBackToMenu = () => {
    setActiveGame(null);
  };

  // --- Render Logic ---

  // Check for session
  if (!session) {
     return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Flicks Club Games</h1>
        <p className="text-lg text-medium-text">Please log in to play games or add questions.</p>
      </div>
    );
  }

  // Main component structure
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 min-h-[calc(100vh-160px)]">
       <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6 text-center">
         Flicks Club Games
       </h1>

       {/* --- Back to Movie Log Link (Styled like example) --- */}
       <div className="text-center mb-8 sm:mb-10"> {/* Increased bottom margin */}
         <Link
           to="/flicks" // Adjust if path is different
           className="inline-flex items-center gap-2 text-accent-teal hover:text-accent-teal-hover transition-colors text-sm sm:text-base"
           aria-label="Back to Movie Log"
         >
           <FiArrowLeft size={20} />
           Back to Movie Log
         </Link>
       </div>
       {/* --- End Back to Movie Log Link --- */}


       {/* Back to Game Menu Button (only shows if a game is active) */}
       {/* This appears between the main nav and the game content */}
       {activeGame && (
            <div className="text-center mb-6">
                <button
                    onClick={handleBackToMenu}
                    className="text-sm text-accent-teal hover:underline"
                >
                    &larr; Back to Game Menu
                </button>
            </div>
        )}

       {/* --- Main Conditional Rendering (Menu or Active Game) --- */}

       {/* Show Menu if no game is active */}
       {!activeGame && <GameMenu onSelectGame={handleSelectGame} />}

       {/* Show Trivia Game and Add Question Button if 'trivia' is active */}
       {activeGame === 'trivia' && (
         // Wrapper to group game and button
         <div className="flex flex-col items-center">
           {/* Render the actual TriviaGame component */}
           <div className="w-full max-w-2xl mb-8"> {/* Constrain width of game, add margin */}
             <TriviaGame key={gameKey} />
           </div>

           {/* Add Question Button (Shown only with Trivia Game) */}
           <div className="text-center">
             <button
               onClick={() => setIsAddQuestionModalOpen(true)} // Open modal
               className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition duration-200 text-base"
             >
               ＋ Add Trivia Question Related to Movies
             </button>
           </div>
         </div>
       )}

       {/* Placeholder for rendering other games */}
       {/* activeGame === 'poster' && ( ... ) */}

       {/* --- Render the Modal --- */}
       <AddTriviaQuestionModal
         isOpen={isAddQuestionModalOpen}
         onClose={() => setIsAddQuestionModalOpen(false)}
       />
    </div>
  );
};

export default Games;