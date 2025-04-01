// import-flicks.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Raw historical data (paste your data here)
// Ensure it's EXACTLY as provided, especially the separator between columns (likely TABs)
const rawData = `
2025-01-26	Talk to Her (2002)	6	9.5		6
2024-12-30	Red Rooms (2023)	8.5	7	8	8.25
2024-10-20	Lord of War (2005)	6.5	9.5	6.4	6.45
2024-06-15	Hit Man	7.5	9	7	7.25
2024-05-12	Match Point (2005)	9		8.5	8.75
2024-02-25	Pulp Fiction (1994)	8	9.5	8	8
2023-12-30	Anatomy of a Fall (2023)	8.5	6.5	8.3	8.4
2023-12-24	The Holdovers (2023)	9.5	9	10	9.75
2023-10-29	Rosemary's Baby (1968)	8.5	7	9	8.75
2023-10-08	Carnage (2011)	4	5	3.5	3.75
2023-09-01	The Piano Teacher (2001)	7	6	7.9	7.45
2023-07-09	Another Round (2016)	9	8.5	7.9	8.45
2023-07-02	Arrival (2016)	8	5	7.4	7.7
2023-04-14	Sense and Sensibility (1995)	8.5	5	7.7	8.1
2023-03-31	One Flew Over the Cuckoo's Nest (1975)	7	7	7.8	7.4
2023-03-19	Glengarry Glen Ross (1992)	6.5	6	6.8	6.65
2023-03-03	Barefoot in the Park (1967)	6.5	5	6.5	6.5
2023-02-24	Brokeback Mountain (2005)	8	8.5	8.5	8.25
2023-02-10	Terms of Endearment (1983)	9.5	9.5	10	9.75
2023-02-05	Truly Madly Deepy (1990)	9	8	7	8
2023-01-07	The Talented Mr. Ripley (1999)	8	7	7.2	7.4
2021-12-31	Tar (2022)	9.5	9	10	9.5
2022-12-24	The Nightmare Before Christmas (1993)	7	5	7	6.3
2022-12-20	The Menu (2022)	5	6	4	5
2022-12-18	Everything Everywhere All At Once (2022)	9.5	7	8.2	8.23
2022-12-16	The Fighter (2010)	9	8	7.5	8.166666667
2022-10-30	Judgment at Nuremberg (1961)	9.5	9	8	8.83
2022-10-16	Kramer vs. Kramer (1979)	8	9.5	7.7	8.4
2022-10-09	Fight Club (1999)	8	8.5	7.7	8.06
2022-09-25	The Usual Suspects (1995)	8.5	9	7.5	8.33
2022-09-18	Almost Famous (2000)	7.5	6	7.5	7
2022-09-11	The Reader (2008)	9	9	9	9
2022-08-17	Ocean’s Eleven (2001)	8	7	6.8	7.26
2022-08-06	The Wrestler (2008)	7	8	9	8
2022-07-03	Little Miss Sunshine (2006)	7	8	6.5	7.16
2022-06-24	Boiling Point (2022)	7.5	8.5	7.8	7.93
2022-06-10	Edge of Tomorrow (2014)	8	7	7.1	7.36
`;

// Function to safely parse ratings, returning null if invalid/empty
function parseRating(ratingStr) {
    if (ratingStr === undefined || ratingStr === null || ratingStr.trim() === '') {
        return null;
    }
    const num = parseFloat(ratingStr);
    // Optional: Add range check if desired during import
    // if (isNaN(num) || num < 0 || num > 10) {
    //     console.warn(`Invalid rating value "${ratingStr}" found. Storing as null.`);
    //     return null;
    // }
    return isNaN(num) ? null : num;
}


// Process the raw data
const moviesToInsert = rawData
    .split('\n') // Split into lines
    .map(line => line.trim()) // Trim whitespace from each line
    .filter(line => line.length > 0) // Remove empty lines
    .map(line => {
        // Split by TAB character. ADJUST if your separator is different (e.g., multiple spaces)
        const parts = line.split('\t');
        if (parts.length < 5) { // Need at least date, title, and 3 rating spots
            console.warn(`Skipping malformed line (too few parts): "${line}"`);
            return null; // Skip this line
        }

        // Extract and format data
        const watched_on = parts[0]?.trim(); // YYYY-MM-DD format is fine
        const title = parts[1]?.trim();
        const rating_megan = parseRating(parts[2]);
        const rating_alex = parseRating(parts[3]);
        const rating_tim = parseRating(parts[4]);
        // We ignore parts[5] which is the calculated mean

        // Basic validation
        if (!watched_on || !title) {
             console.warn(`Skipping line with missing date or title: "${line}"`);
             return null;
        }

        return {
            watched_on,
            title,
            rating_megan,
            rating_alex,
            rating_tim
        };
    })
    .filter(movie => movie !== null); // Filter out any skipped lines


// --- Supabase Interaction ---
async function importMovies() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Error: Supabase URL or Key missing in .env file.");
        console.error("Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.");
        return;
    }

     if (moviesToInsert.length === 0) {
         console.log("No valid movie data found to import.");
         return;
     }

    console.log(`Attempting to insert ${moviesToInsert.length} movie records...`);

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    try {
        // Bulk insert the data
        // Note: This uses the ANON key. Your RLS policies MUST allow authenticated users to INSERT.
        const { data, error } = await supabase
            .from('watched_flicks')
            .insert(moviesToInsert)
            .select(); // Optional: select() returns the inserted data

        if (error) {
            console.error("Supabase insert error:", error);
            throw error; // Re-throw to be caught by outer catch
        }

        console.log(`Successfully inserted ${data?.length ?? 0} records.`);
        // console.log("Inserted data:", data); // Optional: Log the inserted data

    } catch (err) {
        console.error("-----------------------------------------");
        console.error("Import failed:", err.message);
        console.error("-----------------------------------------");
        console.log("Data prepared for insertion:", JSON.stringify(moviesToInsert, null, 2)); // Log the data that failed
    }
}

// Run the import function
importMovies();