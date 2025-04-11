// src/utils/gameHelpers.js

/**
 * Shuffles array in place using the Fisher-Yates algorithm.
 * @param {Array} array Array to shuffle.
 */
export const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
  };
  
  /**
   * Calculates the mean rating for a movie, filtering out nulls.
   * @param {object} movie The movie object with rating_megan, rating_alex, rating_tim.
   * @returns {string|null} Mean rating formatted to one decimal place, or null if no valid ratings.
   */
  export const calculateMean = (movie) => {
    const ratings = [movie.rating_megan, movie.rating_alex, movie.rating_tim];
    const validRatings = ratings.filter(r => r !== null && r !== undefined && !isNaN(parseFloat(r)));
    if (validRatings.length === 0) return null;
    const sum = validRatings.reduce((acc, r) => acc + parseFloat(r), 0);
    const mean = sum / validRatings.length;
    return mean.toFixed(1);
  };
  
  
  // --- Basic Trivia Question Generation ---
  // This is a simplified example. You'll likely want to make this more robust.
  
  /**
   * Generates a pool of trivia questions based on watched movie data.
   * @param {Array} movies Array of movie objects from watched_flicks.
   * @param {number} count Number of questions to generate.
   * @returns {Array} Array of question objects.
   */
  export const generateTriviaQuestions = (movies, count = 10) => {
    const questions = [];
    if (!movies || movies.length < 3) return []; // Need enough movies for decent options
  
    const shuffledMovies = shuffleArray([...movies]);
  
    for (let i = 0; i < Math.min(count, shuffledMovies.length); i++) {
        const movie = shuffledMovies[i];
        const questionType = Math.floor(Math.random() * 3); // Randomly pick question type
  
        let question = null;
  
        try {
            // Type 0: Who rated highest? (Requires at least 2 ratings)
            if (questionType === 0) {
                const ratings = [
                    { name: 'Megan', rating: movie.rating_megan },
                    { name: 'Alec', rating: movie.rating_alex },
                    { name: 'Tim', rating: movie.rating_tim },
                ].filter(r => r.rating !== null && r.rating !== undefined);
  
                if (ratings.length >= 2) {
                    ratings.sort((a, b) => b.rating - a.rating);
                    const highestRating = ratings[0].rating;
                    const highestRated = ratings.filter(r => r.rating === highestRating).map(r => r.name);
                    const correctAnswer = highestRated.sort().join(' / '); // Handle ties
  
                    // Get incorrect answers (other raters or dummy names)
                    const allRaters = ['Megan', 'Alec', 'Tim'];
                    let incorrectOptions = allRaters.filter(name => !highestRated.includes(name));
                    // Add dummy options if needed to reach 3 incorrect
                    while (incorrectOptions.length < 3 && incorrectOptions.length > 0) {
                       incorrectOptions.push(incorrectOptions[0] === 'Megan' ? 'Nobody' : 'Megan'); // Just a simple incorrect filler
                       incorrectOptions = [...new Set(incorrectOptions)]; // Ensure unique
                    }
                     if (incorrectOptions.length >= 1) {
                       const options = shuffleArray([correctAnswer, ...incorrectOptions.slice(0,3)]);
                        question = {
                            questionText: `Who gave the highest rating (${highestRating}) to "${movie.title}"?`,
                            options: options,
                            correctAnswer: correctAnswer,
                            source: 'generated' // Mark as generated
                        };
                     }
                }
            }
  
            // Type 1: What was the average rating? (Requires at least 1 rating)
            else if (questionType === 1) {
                const meanRating = calculateMean(movie);
                if (meanRating !== null) {
                    const correctAnswer = meanRating;
                    // Generate plausible incorrect averages
                    let incorrectOptions = [
                        (parseFloat(meanRating) + 1.1).toFixed(1),
                        (parseFloat(meanRating) - 0.8).toFixed(1),
                        (parseFloat(meanRating) + 2.3).toFixed(1),
                    ].filter(r => r >= 0 && r <= 10 && r !== correctAnswer); // Basic validation
  
                     // Ensure unique incorrect options and enough options total
                     incorrectOptions = [...new Set(incorrectOptions)].slice(0, 3);
                     while(incorrectOptions.length < 3){
                         let dummy = (Math.random()*10).toFixed(1);
                         if(dummy !== correctAnswer && !incorrectOptions.includes(dummy)){
                              incorrectOptions.push(dummy);
                         }
                     }
  
                     const options = shuffleArray([correctAnswer, ...incorrectOptions]);
                    question = {
                        questionText: `What was the average rating for "${movie.title}"?`,
                        options: options,
                        correctAnswer: correctAnswer,
                        source: 'generated'
                    };
                }
            }
  
            // Type 2: When was this movie watched? (Requires watched_on)
            // This is harder to make multiple choice without giving it away
            // Maybe: "Which movie was watched on [Date]?"
            else { // Fallback or alternative question type
                if (movie.watched_on) {
                      const correctAnswer = movie.title;
                      const correctDate = new Date(movie.watched_on + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
  
                      // Find other movie titles watched nearby or randomly as incorrect options
                      let incorrectOptions = shuffledMovies
                          .filter(m => m.id !== movie.id)
                          .slice(0, 3) // Take first 3 other movies
                          .map(m => m.title);
  
                       while (incorrectOptions.length < 3) {
                          incorrectOptions.push(`Random Movie ${Math.floor(Math.random()*100)}`); // Filler
                       }
  
                      const options = shuffleArray([correctAnswer, ...incorrectOptions]);
                      question = {
                          questionText: `Which movie did the club watch on ${correctDate}?`,
                          options: options,
                          correctAnswer: correctAnswer,
                          source: 'generated'
                      };
                }
            }
  
            if (question && question.options.length > 1) { // Ensure question was generated and has options
                 questions.push(question);
             }
  
        } catch (error) {
            console.error("Error generating question for movie:", movie.title, error);
            // Handle error or skip question
        }
    }
  
    return questions;
  };
  
  
  /**
   * Formats a user-submitted question from the DB into the game format.
   * @param {object} dbQuestion Question object from user_trivia_questions table.
   * @returns {object} Formatted question object for the game.
   */
  export const formatUserQuestion = (dbQuestion) => {
    if (!dbQuestion || !dbQuestion.question_text || !dbQuestion.correct_answer || !dbQuestion.incorrect_answer_1) {
      return null; // Invalid question data
    }
    const options = [
      dbQuestion.correct_answer,
      dbQuestion.incorrect_answer_1,
      dbQuestion.incorrect_answer_2,
      dbQuestion.incorrect_answer_3,
    ].filter(opt => opt !== null && opt !== undefined); // Filter out null optional answers
  
    return {
      questionText: dbQuestion.question_text,
      options: shuffleArray(options),
      correctAnswer: dbQuestion.correct_answer,
      source: 'user', // Mark as user-submitted
      // Optionally include dbQuestion.watched_flick_id if needed for context
    };
  };