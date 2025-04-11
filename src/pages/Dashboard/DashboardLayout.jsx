// src/pages/Dashboard/DashboardLayout.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiBriefcase, FiFileText, FiClock, FiLayers } from 'react-icons/fi';

// Import View Components
import ProjectsView from './ProjectsView';
import DocumentsView from './DocumentsView';
import FlashcardsView from './FlashcardsView';
import TimetrackingView from './TimetrackingView';

const DashboardLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // --- DEBUG LOG 1 ---
    console.log("DashboardLayout Render Start. Location State:", location.state);

    // Initialize state - default to 'projects'
    const [activeView, setActiveView] = useState('projects');

    // --- DEBUG LOG 2 ---
    console.log("DashboardLayout Initializing. Default activeView:", 'projects');


    // Effect to handle incoming navigation state
    useEffect(() => {
        const requestedView = location.state?.requestedView;

        // --- DEBUG LOG 3 ---
        console.log("DashboardLayout Effect Running. requestedView:", requestedView);

        if (requestedView) {
            // --- DEBUG LOG 4 ---
            console.log(`DashboardLayout Effect: Found requestedView '${requestedView}'. Calling setActiveView.`);
            setActiveView(requestedView);

            // Clear the state after using it
            const currentState = { ...location.state };
            delete currentState.requestedView;
             // --- DEBUG LOG 5 ---
             console.log("DashboardLayout Effect: Clearing location state.", { pathname: location.pathname, state: currentState });
            navigate(location.pathname, { state: currentState, replace: true });
        } else {
             // --- DEBUG LOG 6 ---
             console.log("DashboardLayout Effect: No requestedView found in location state.");
        }
    }, [location.state, location.pathname, navigate]);


    // Render the correct component based on state
    const renderContent = () => {
         // --- DEBUG LOG 7 ---
         console.log("DashboardLayout renderContent called. Current activeView:", activeView);
        switch (activeView) {
            case 'projects': return <ProjectsView />;
            case 'documents': return <DocumentsView />;
            case 'flashcards': return <FlashcardsView />;
            case 'timetracking': return <TimetrackingView />;
            default: return <ProjectsView />;
        }
    };

    // Helper function for sidebar item styling
    const getSidebarItemClasses = (viewName) => { /* ... same ... */ const baseClasses = "flex items-center px-4 py-2 mt-2 text-gray-100 rounded hover:bg-gray-700 hover:text-white transition-colors duration-200 w-full text-left"; const activeClasses = "bg-gray-700 text-white"; return `${baseClasses} ${activeView === viewName ? activeClasses : 'text-gray-400'}`; };

     // --- DEBUG LOG 8 ---
     console.log("DashboardLayout Returning JSX. Final activeView before render:", activeView);

    // Main component JSX
    return (
        <div className="flex flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200" style={{ height: 'calc(100vh - 4rem)' }}>
            <aside className="w-60 bg-gray-800 dark:bg-gray-900 p-4 overflow-y-auto flex-shrink-0 border-r border-gray-700 dark:border-gray-700">
                <nav className="mt-2">
                    {/* Sidebar buttons */}
                    <button onClick={() => setActiveView('projects')} className={getSidebarItemClasses('projects')}> <FiBriefcase className="w-5 h-5 mr-3 flex-shrink-0" /> <span className="truncate">Projects</span> </button>
                    <button onClick={() => setActiveView('documents')} className={getSidebarItemClasses('documents')}> <FiFileText className="w-5 h-5 mr-3 flex-shrink-0" /> <span className="truncate">Documents</span> </button>
                    <button onClick={() => setActiveView('flashcards')} className={getSidebarItemClasses('flashcards')}> <FiLayers className="w-5 h-5 mr-3 flex-shrink-0" /> <span className="truncate">Flashcards</span> </button>
                    <button onClick={() => setActiveView('timetracking')} className={getSidebarItemClasses('timetracking')}> <FiClock className="w-5 h-5 mr-3 flex-shrink-0" /> <span className="truncate">Timetracking</span> </button>
                </nav>
            </aside>
            <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto">
                {renderContent()}
            </main>
        </div>
    );
};

export default DashboardLayout;