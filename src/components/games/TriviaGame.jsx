// src/components/games/Games.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient'; // Adjust path as needed
import { generateTriviaQuestions, formatUserQuestion, shuffleArray } from '../../utils/gameHelpers'; // Adjust path

const TriviaGame = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data and setup questions
  useEffect(() => {
    const loadGameData = async () => {
      setIsLoading(true);
      setError(null);
      setGameOver(false); // Reset game over state
      setCurrentQuestionIndex(0); // Reset index
      setScore(0); // Reset score

      try {
        // Fetch watched movies
        const { data: movies, error: moviesError } = await supabase
          .from('watched_flicks')
          .select('*')
          .order('watched_on', { ascending: false });

        if (moviesError) throw moviesError;
        if (!movies || movies.length === 0) {
            throw new Error("No movies found in the log to generate questions.");
        }

        // Fetch user-submitted questions (approved only)
        const { data: userQuestionsData, error: userQuestionsError } = await supabase
          .from('user_trivia_questions')
          .select('*')
          .eq('is_approved', true); // Assuming you have an is_approved column

        if (userQuestionsError) throw userQuestionsError;

        // Generate questions from movie data
        // Let's aim for roughly 5 generated, 5 user questions if available
        const generated = generateTriviaQuestions(movies, 5);

        // Format user questions
        const formattedUserQs = userQuestionsData ? userQuestionsData.map(formatUserQuestion).filter(q => q !== null) : [];

        // Combine and shuffle
        let combinedQuestions = [...generated, ...shuffleArray(formattedUserQs)]; // Prioritize generated slightly? Or shuffle all?
        combinedQuestions = shuffleArray(combinedQuestions);

        // Limit total questions (e.g., to 10)
        const finalQuestions = combinedQuestions.slice(0, 10);

         if (finalQuestions.length === 0) {
           throw new Error("Could not generate or find any trivia questions.");
         }


        setQuestions(finalQuestions);

      } catch (err) {
        console.error("Error loading game data:", err);
        setError(`Failed to load trivia game: ${err.message}`);
        setQuestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadGameData();
  }, []); // Run once on component mount

  const currentQuestion = useMemo(() => {
    return questions[currentQuestionIndex];
  }, [questions, currentQuestionIndex]);

  const handleAnswerSelect = (option) => {
    if (showFeedback) return; // Don't allow changing answer after submission
    setSelectedAnswer(option);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return; // Must select an answer

    const correct = selectedAnswer === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    if (correct) {
      setScore(prevScore => prevScore + 1);
    }
    setShowFeedback(true);

    // Automatically move to next question after a delay
    setTimeout(() => {
      setShowFeedback(false);
      setSelectedAnswer(null);
      setIsCorrect(null);
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      } else {
        setGameOver(true); // End of questions
      }
    }, 1500); // 1.5 second delay to show feedback
  };

   const handlePlayAgain = () => {
        // Re-trigger the useEffect to load new data/questions
        // A simple way is to change a key prop on this component from the parent,
        // but for simplicity here, we'll just reset state and reload.
        // Note: This simple reload might fetch the exact same questions if DB hasn't changed.
        // A better approach involves forcing a re-fetch or generating new random questions.
         setQuestions([]); // Clear questions to force reload state
         setIsLoading(true);
         setError(null);
         setGameOver(false);
         setCurrentQuestionIndex(0);
         setScore(0);
         // We need to re-run the fetch logic. Simplest way without parent key change:
          const loadGameData = async () => {
              setIsLoading(true); setError(null); setGameOver(false); setCurrentQuestionIndex(0); setScore(0);
              try {
                  const { data: movies, error: moviesError } = await supabase.from('watched_flicks').select('*').order('watched_on', { ascending: false });
                  if (moviesError) throw moviesError; if (!movies || movies.length === 0) throw new Error("No movies found.");
                  const { data: userQuestionsData, error: userQuestionsError } = await supabase.from('user_trivia_questions').select('*').eq('is_approved', true);
                  if (userQuestionsError) throw userQuestionsError;
                  const generated = generateTriviaQuestions(movies, 5);
                  const formattedUserQs = userQuestionsData ? userQuestionsData.map(formatUserQuestion).filter(q => q !== null) : [];
                  let combinedQuestions = [...generated, ...shuffleArray(formattedUserQs)];
                  combinedQuestions = shuffleArray(combinedQuestions);
                  const finalQuestions = combinedQuestions.slice(0, 10);
                   if (finalQuestions.length === 0) throw new Error("No questions available.");
                  setQuestions(finalQuestions);
              } catch (err) { console.error("Error reloading:", err); setError(`Failed to reload: ${err.message}`); setQuestions([]);
              } finally { setIsLoading(false); }
          };
         loadGameData();
    };


  // --- Render Logic ---

  if (isLoading) {
    return <p className="text-center text-medium-text text-lg my-10">Loading Trivia Game...</p>;
  }

  if (error) {
    return <p className="text-center text-red-400 bg-red-900/30 p-3 rounded-md max-w-xl mx-auto">{error}</p>;
  }

  if (gameOver) {
    return (
      <div className="text-center bg-navbar-grey p-6 rounded-lg shadow-lg max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-white mb-4">Game Over!</h2>
        <p className="text-xl text-light-text mb-6">
          Your final score: {score} / {questions.length}
        </p>
        <button
           onClick={handlePlayAgain}
           className="px-6 py-2 bg-accent-teal hover:bg-accent-teal-hover text-white font-semibold rounded-md transition duration-200"
         >
           Play Again
         </button>
      </div>
    );
  }

  if (!currentQuestion) {
    // Should ideally be caught by loading/error states, but as a fallback
    return <p className="text-center text-medium-text">No question data available.</p>;
  }

  return (
    <div className="bg-navbar-grey p-4 sm:p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-medium-text">Question {currentQuestionIndex + 1} of {questions.length}</span>
        <span className="text-sm font-semibold text-light-text">Score: {score}</span>
      </div>

      <h2 className="text-lg sm:text-xl font-semibold text-white mb-5 min-h-[3em]">
        {currentQuestion.questionText}
      </h2>

      <div className="grid grid-cols-1 gap-3">
        {currentQuestion.options.map((option, index) => {
          // Determine button style based on selection and feedback state
          let buttonClass = "w-full text-left px-4 py-2 rounded-md transition duration-150 text-sm sm:text-base ";
          if (showFeedback) {
            if (option === currentQuestion.correctAnswer) {
              buttonClass += "bg-green-500 text-white cursor-not-allowed"; // Correct answer
            } else if (option === selectedAnswer) {
              buttonClass += "bg-red-500 text-white cursor-not-allowed"; // Incorrectly selected answer
            } else {
              buttonClass += "bg-pleasant-grey/50 text-medium-text cursor-not-allowed opacity-60"; // Other incorrect options
            }
          } else {
             if (option === selectedAnswer) {
               buttonClass += "bg-accent-teal text-white ring-2 ring-accent-teal-hover"; // Selected answer
             } else {
               buttonClass += "bg-pleasant-grey text-light-text hover:bg-gray-600"; // Default/unselected answer
             }
          }

          return (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              disabled={showFeedback}
              className={buttonClass}
            >
              {option}
            </button>
          );
        })}
      </div>

       {/* Feedback Message - kept simple */}
       {showFeedback && (
            <p className={`mt-4 text-center font-semibold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {isCorrect ? 'Correct!' : 'Incorrect!'}
                {!isCorrect && ` The answer was: ${currentQuestion.correctAnswer}`}
            </p>
        )}


      {!showFeedback && (
         <div className="mt-6 text-right">
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null || showFeedback}
              className="px-5 py-1.5 bg-accent-teal hover:bg-accent-teal-hover text-white font-semibold rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              Submit
            </button>
          </div>
       )}
    </div>
  );
};

export default TriviaGame;