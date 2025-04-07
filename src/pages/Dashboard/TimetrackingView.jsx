// src/pages/Dashboard/TimetrackingView.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext'; // Adjust path if needed
import { supabase } from '../../supabaseClient';    // Adjust path if needed
import { FiPlusCircle, FiLoader, FiEdit2, FiTrash2, FiClock, FiBriefcase, FiEdit3 } from 'react-icons/fi'; // Added icons

// Helper functions (formatDateTime, formatDateTimeForInput, calculateDuration) remain the same...
const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    try {
        const date = new Date(dateTimeString);
        return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (e) { return 'Invalid Date'; }
};
const formatDateTimeForInput = (dateTimeString) => {
    if (!dateTimeString) return '';
    try {
        const date = new Date(dateTimeString);
        const timezoneOffset = date.getTimezoneOffset() * 60000;
        const localISOTime = new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
        return localISOTime;
    } catch (e) { return ''; }
};
const calculateDuration = (start, end) => {
    if (!start || !end) return 'N/A';
    try {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffMs = endDate - startDate;
        if (diffMs < 0) return 'Invalid';
        const totalMinutes = Math.floor(diffMs / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}h ${minutes}m`;
    } catch (e) { return 'Error'; }
};

const TimetrackingView = () => {
    const { session } = useAuth();
    const [projects, setProjects] = useState([]);
    const [timeEntries, setTimeEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form state (remains the same)
    const [formProjectId, setFormProjectId] = useState('');
    const [formStartTime, setFormStartTime] = useState('');
    const [formEndTime, setFormEndTime] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);

    // Fetch projects and time entries (useEffect remains the same)
    useEffect(() => {
        const fetchData = async () => {
            if (!session?.user) { setError("User session not found."); setIsLoading(false); return; }
            setIsLoading(true); setError(null);
            try {
                const { data: projectsData, error: projectsError } = await supabase.from('projects').select('id, name').eq('user_id', session.user.id).order('name', { ascending: true });
                if (projectsError) throw projectsError;
                setProjects(projectsData || []);

                const { data: entriesData, error: entriesError } = await supabase.from('time_entries').select(`*, projects ( name )`).eq('user_id', session.user.id).order('start_time', { ascending: false });
                if (entriesError) throw entriesError;
                setTimeEntries(entriesData || []);
            } catch (err) {
                console.error("Error fetching data:", err); setError(`Failed to load data: ${err.message}`);
            } finally { setIsLoading(false); }
        };
        fetchData();
    }, [session]);

    // Handle adding a new time entry (handler remains the same)
    const handleAddEntry = async (e) => {
        e.preventDefault();
        if (!session?.user) return;
        if (!formStartTime || !formEndTime) { setFormError("Start time and End time are required."); return; }
        const startTime = new Date(formStartTime); const endTime = new Date(formEndTime);
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) { setFormError("Invalid date/time format entered."); return; }
        if (endTime <= startTime) { setFormError("End time must be after start time."); return; }

        setIsSubmitting(true); setFormError(null);
        const newEntry = { user_id: session.user.id, project_id: formProjectId === '' ? null : parseInt(formProjectId, 10), start_time: startTime.toISOString(), end_time: endTime.toISOString(), description: formDescription.trim() || null };
        const { data, error: insertError } = await supabase.from('time_entries').insert(newEntry).select(`*, projects ( name )`).single();

        if (insertError) {
            console.error("Error adding time entry:", insertError); setFormError(`Failed to add entry: ${insertError.message}`);
        } else if (data) {
            setTimeEntries(prev => [data, ...prev].sort((a, b) => new Date(b.start_time) - new Date(a.start_time)));
            setFormProjectId(''); setFormStartTime(''); setFormEndTime(''); setFormDescription('');
        }
        setIsSubmitting(false);
    };

    // Placeholder for delete functionality (handler remains the same)
    const handleDeleteEntry = async (entryId) => {
        if (!window.confirm(`Are you sure you want to delete this time entry?`)) return;
        alert(`Deletion logic for time entry ID ${entryId} not implemented yet.`);
        // Implement actual delete logic here
    };

    // --- Render Logic ---
    if (isLoading) {
        return <div className="text-center p-6"><FiLoader className="animate-spin inline mr-2" /> Loading time tracking data...</div>;
    }
    if (error) {
        return <div className="text-center p-6 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="p-4 sm:p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Timetracking</h2>

            {/* Add Time Entry Form */}
            <div className="mb-8 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Log Time Entry</h3>
                <form onSubmit={handleAddEntry} className="space-y-4">
                    {/* Project Selection */}
                    <div>
                        <label htmlFor="projectSelect" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Project (Optional)</label>
                        <select
                            id="projectSelect"
                            value={formProjectId}
                            onChange={(e) => setFormProjectId(e.target.value)}
                            // --- UPDATED select focus style ---
                            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#38B2AC] focus:border-[#38B2AC]"
                        >
                            <option value="">-- No Project --</option>
                            {projects.map(proj => (
                                <option key={proj.id} value={proj.id}>{proj.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Start & End Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startTime" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Start Time <span className="text-red-500">*</span></label>
                            <input
                                type="datetime-local" id="startTime" value={formStartTime}
                                onChange={e => setFormStartTime(e.target.value)}
                                // --- UPDATED input focus style ---
                                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#38B2AC] focus:border-[#38B2AC]"
                                required
                             />
                        </div>
                        <div>
                            <label htmlFor="endTime" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">End Time <span className="text-red-500">*</span></label>
                            <input
                                type="datetime-local" id="endTime" value={formEndTime}
                                onChange={e => setFormEndTime(e.target.value)}
                                // --- UPDATED input focus style ---
                                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#38B2AC] focus:border-[#38B2AC]"
                                required
                             />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Description (Optional)</label>
                        <textarea
                            id="description" rows="3" value={formDescription}
                            onChange={e => setFormDescription(e.target.value)}
                            placeholder="What did you work on?"
                            // --- UPDATED textarea focus style ---
                            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#38B2AC] focus:border-[#38B2AC]"
                        />
                    </div>

                    {formError && <p className="text-sm text-red-500">{formError}</p>}
                    <div className="flex justify-end">
                        <button
                            type="submit" disabled={isSubmitting}
                            // --- UPDATED button background, hover, and focus styles ---
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#38B2AC] hover:bg-[#319795] text-white font-semibold rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38B2AC] dark:focus:ring-offset-gray-800"
                        >
                            {isSubmitting ? <FiLoader className="animate-spin" size={16} /> : <FiPlusCircle size={16} />}
                            {isSubmitting ? 'Logging...' : 'Log Entry'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Time Entry List */}
            <div className="space-y-3 mt-6">
                 <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Logged Time Entries</h3>
                 {timeEntries.length === 0 && (
                     <p className="text-center text-gray-500 dark:text-gray-400 italic py-4">No time entries logged yet.</p>
                 )}
                <div className="overflow-x-auto">
                     <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                         <thead className="bg-gray-100 dark:bg-gray-700">
                             <tr>
                                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Project</th>
                                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Start Time</th>
                                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">End Time</th>
                                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                                 <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                             </tr>
                         </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                              {timeEntries.map(entry => (
                                  <tr key={entry.id} className="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                                          <span className="flex items-center gap-1">
                                              {entry.projects?.name ? <FiBriefcase size={12} className="text-gray-400"/> : ''}
                                              {entry.projects?.name || <span className="italic text-gray-400">None</span>}
                                          </span>
                                      </td>
                                      <td className="px-4 py-3 text-sm">{entry.description || <span className="italic text-gray-400">No description</span>}</td>
                                      <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDateTime(entry.start_time)}</td>
                                      <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDateTime(entry.end_time)}</td>
                                      <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">{calculateDuration(entry.start_time, entry.end_time)}</td>
                                      <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                                          {/* --- UPDATED Edit button hover style --- */}
                                          <button className="text-gray-400 hover:text-[#38B2AC] p-1" title="Edit Entry (Not implemented)"> <FiEdit3 size={16}/> </button>
                                          <button onClick={() => handleDeleteEntry(entry.id)} className="text-gray-400 hover:text-red-500 p-1" title="Delete Entry"> <FiTrash2 size={16}/> </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                     </table>
                 </div>
            </div>
        </div>
    );
};

export default TimetrackingView;