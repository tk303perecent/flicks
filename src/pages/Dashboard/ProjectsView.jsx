// src/pages/Dashboard/ProjectsView.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext'; // Adjust path if needed
import { supabase } from '../../supabaseClient';    // Adjust path if needed
import { FiPlusCircle, FiLoader, FiEdit2, FiTrash2, FiBriefcase } from 'react-icons/fi'; // Added icons

const ProjectsView = () => {
    const { session } = useAuth();
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form State (remains the same)
    const [newProjectName, setNewProjectName] = useState('');
    const [newClientName, setNewClientName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);

    // Fetch projects on component load (useEffect remains the same)
    useEffect(() => {
        const fetchProjects = async () => {
            if (!session?.user) { setError("User session not found."); setIsLoading(false); return; }
            setIsLoading(true); setError(null);
            const { data, error: fetchError } = await supabase.from('projects').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
            if (fetchError) { console.error("Error fetching projects:", fetchError); setError("Could not load projects."); }
            else { setProjects(data || []); }
            setIsLoading(false);
        };
        fetchProjects();
    }, [session]);

    // Handle adding a new project (handler remains the same)
    const handleAddProject = async (e) => {
        e.preventDefault();
        if (!session?.user) { setFormError("You must be logged in."); return; }
        if (!newProjectName.trim()) { setFormError("Project name is required."); return; }
        setIsSubmitting(true); setFormError(null);
        const { data, error: insertError } = await supabase.from('projects').insert({ name: newProjectName.trim(), client_name: newClientName.trim() || null, user_id: session.user.id }).select().single();
        if (insertError) { console.error("Error adding project:", insertError); setFormError(`Failed to add project: ${insertError.message}`); }
        else if (data) { setProjects(prev => [data, ...prev]); setNewProjectName(''); setNewClientName(''); }
        setIsSubmitting(false);
    };

    // Placeholder for delete functionality (handler remains the same)
    const handleDeleteProject = async (projectId, projectName) => {
        if (!window.confirm(`Are you sure you want to delete project "${projectName}"...?`)) return;
        alert(`Deletion logic for project ID ${projectId} not fully implemented yet.`);
        // Implement actual delete logic here
    };


    // --- Render Logic ---
    if (isLoading) {
     return <div className="text-center p-6"><FiLoader className="animate-spin inline mr-2" /> Loading projects...</div>;
    }
    if (error) {
         return <div className="text-center p-6 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="p-4 sm:p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Projects</h2>

            {/* Add Project Form */}
            <div className="mb-8 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Add New Project</h3>
                <form onSubmit={handleAddProject} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="projectName" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Project Name <span className="text-red-500">*</span></label>
                            <input
                                type="text" id="projectName" value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="e.g., Website Redesign"
                                // --- UPDATED input focus style ---
                                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#38B2AC] focus:border-[#38B2AC]"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="clientName" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Client Name (Optional)</label>
                            <input
                                type="text" id="clientName" value={newClientName}
                                onChange={(e) => setNewClientName(e.target.value)}
                                placeholder="e.g., Acme Corp"
                                // --- UPDATED input focus style ---
                                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#38B2AC] focus:border-[#38B2AC]"
                            />
                        </div>
                    </div>
                    {formError && <p className="text-sm text-red-500">{formError}</p>}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            // --- UPDATED button background, hover, and focus styles ---
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#38B2AC] hover:bg-[#319795] text-white font-semibold rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38B2AC] dark:focus:ring-offset-gray-800"
                        >
                            {isSubmitting ? <FiLoader className="animate-spin" size={16} /> : <FiPlusCircle size={16} />}
                            {isSubmitting ? 'Adding...' : 'Add Project'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Project List */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Your Projects</h3>
                 {projects.length === 0 && (
                     <p className="text-center text-gray-500 dark:text-gray-400 italic py-4">No projects found. Add one above!</p>
                 )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map(project => (
                        <div key={project.id} className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow border dark:border-gray-600 flex justify-between items-start">
                            <div>
                                <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                    <FiBriefcase size={16} className="text-gray-500 dark:text-gray-400"/>
                                    {project.name}
                                </h4>
                                {project.client_name && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Client: {project.client_name}</p>
                                )}
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Created: {new Date(project.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="flex-shrink-0 space-x-1">
                                {/* --- UPDATED Edit button hover style --- */}
                                <button className="text-gray-400 hover:text-[#38B2AC] p-1" title="Edit Project (Not implemented)"> <FiEdit2 size={16}/> </button>
                                <button onClick={() => handleDeleteProject(project.id, project.name)} className="text-gray-400 hover:text-red-500 p-1" title="Delete Project"> <FiTrash2 size={16}/> </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProjectsView;