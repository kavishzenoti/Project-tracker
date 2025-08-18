import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Users, CheckCircle2, Circle, Clock, AlertCircle, PauseCircle, Edit3, X, Trash2, Check, User, LogOut, History, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import { useMagicLinkAuth } from '../contexts/MagicLinkAuthContext.jsx';
import GitHubAPI from '../utils/githubApi.js';
import { GITHUB_CONFIG } from '../config/github.js';
import BackendProxy from '../utils/backendProxy.js';
import { isBackendProxyEnabled } from '../config/backend.js';

// Style Tokens: central place to manage colors and sizing
const STYLE_TOKENS = {
  spacing: {
    categoryGap: 'mb-6', // 24px gap
  },
  sizes: {
    weekCell: 'w-16 min-w-16', // 64px min width
    taskCol: 'min-w-0 w-96',
  },
  status: {
    planned: 'bg-purple-500 border-purple-600',
    'in-progress': 'bg-blue-500 border-blue-600',
    completed: 'bg-green-500 border-green-600',
    blocked: 'bg-red-500 border-red-600',
    delayed: 'bg-orange-500 border-orange-600',
    default: 'bg-gray-400 border-gray-500',
  },
  priorityBorder: {
    high: 'border-l-red-500',
    medium: 'border-l-yellow-500',
    low: 'border-l-green-500',
    default: 'border-l-gray-300',
  },
  container: 'border border-gray-200 rounded-lg bg-white',
};

// Change Log Modal Component - moved completely outside to prevent re-renders
const ChangeLogModal = ({ 
  changeLog, 
  userFilter, 
  actionFilter, 
  setUserFilter, 
  setActionFilter, 
  teamMembers, 
  onClose 
}) => {
  const filteredLogs = changeLog.filter(log => {
    if (userFilter !== 'all' && log.user !== userFilter) return false;
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    return true;
  });

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'login': return <User className="w-4 h-4 text-blue-600" />;
      case 'logout': return <LogOut className="w-4 h-4 text-gray-600" />;
      case 'task_created': return <Edit3 className="w-4 h-4 text-green-600" />;
      case 'task_edited': return <Edit3 className="w-4 h-4 text-blue-600" />;
      case 'task_deleted': return <Trash2 className="w-4 h-4 text-red-600" />;
      case 'task_reordered': return <History className="w-4 h-4 text-purple-600" />;
      case 'assignment': return <Users className="w-4 h-4 text-purple-600" />;
      case 'status_change': return <CheckCircle2 className="w-4 h-4 text-orange-600" />;
      case 'cell_cleared': return <X className="w-4 h-4 text-red-600" />;
      case 'commit': return <Check className="w-4 h-4 text-green-600" />;
      case 'sync': return <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
      default: return <Circle className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleClose = () => {
    console.log('Closing change log modal');
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      console.log('Closing modal via backdrop click');
      e.preventDefault();
      e.stopPropagation();
      handleClose();
    }
  };

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        console.log('Closing modal via escape key');
        e.preventDefault();
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  console.log('ChangeLogModal render - should only see this once per open');

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg p-6 max-w-4xl mx-4 shadow-xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Change Log</h2>
          <button
            onClick={(e) => {
              console.log('Close button clicked!');
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All Users</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.name}>{member.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All Actions</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="task_created">Task Created</option>
              <option value="task_edited">Task Edited</option>
              <option value="task_deleted">Task Deleted</option>
              <option value="task_reordered">Task Reordered</option>
              <option value="assignment">Assignment</option>
              <option value="status_change">Status Change</option>
              <option value="cell_cleared">Cell Cleared</option>
              <option value="commit">Commit</option>
              <option value="sync">Sync</option>
            </select>
          </div>
        </div>
        
        {/* Log Entries */}
        <div className="overflow-y-auto max-h-[60vh]">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No changes found</div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map(log => (
                <div key={log.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="mt-1">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{log.user}</span>
                      <span className="text-sm text-gray-500">{formatTimestamp(log.timestamp)}</span>
                    </div>
                    <div className="text-sm text-gray-700">{log.details}</div>
                    {log.taskName && (
                      <div className="text-xs text-gray-500 mt-1">
                        Task: {log.taskName}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DesignSystemTracker = () => {
  // Add custom styles for responsive behavior
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .responsive-task-input {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        min-width: 0;
        overflow: hidden;
      }
      
      .responsive-task-input .input-container {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        max-width: calc(100% - 80px); /* Reserve space for button */
        width: var(--add-input-width, 100%);
        flex-basis: 0;
        flex-grow: 1;
        flex-shrink: 1;
      }
      
      .responsive-task-input input {
        width: 100%;
        min-width: 0;
        max-width: 100%;
      }
      
      .responsive-task-input button {
        flex-shrink: 0;
        white-space: nowrap;
        min-width: 60px;
      }
      
      @media (max-width: 640px) {
        .responsive-task-input {
          gap: 0.25rem;
        }
        
        .responsive-task-input button {
          padding-left: 0.5rem;
          padding-right: 0.5rem;
        }
        
        .responsive-task-input .input-container {
          max-width: calc(100% - 70px);
        }
      }
      
      @media (max-width: 480px) {
        .responsive-task-input .input-container {
          max-width: calc(100% - 60px);
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Dynamically size the add-input width based on viewport to decouple from table width
  useEffect(() => {
    const updateAddInputWidth = () => {
      const widthPx = Math.max(140, window.innerWidth - 220); // reserve space for button/margins
      document.documentElement.style.setProperty('--add-input-width', `${widthPx}px`);
    };
    updateAddInputWidth();
    window.addEventListener('resize', updateAddInputWidth);
    return () => window.removeEventListener('resize', updateAddInputWidth);
  }, []);

  // Generate weeks starting from August 18th (fixed 16-week plan)
  const generateWeeks = () => {
    const weeks = [];
    // Start date: August 18th, 2024
    const startDate = new Date('2024-08-18');
    
    for (let i = 0; i < 16; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      weeks.push({
        id: i,
        label: `W${i + 1}`,
        startDate: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        endDate: weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    return weeks;
  };

  const weeks = generateWeeks();

  const initialTasks = [
    // Design Roadmap
    { id: 1, name: "Build a roadmap of AI Components in the UI", category: "Design Roadmap", priority: "high" },
    { id: 2, name: "Building widgets using AI - Research and POCs", category: "Design Roadmap", priority: "high" },
    { id: 3, name: "Icon set preparation for multiple modes", category: "Design Roadmap", priority: "medium" },
    { id: 4, name: "Shared CN Libraries themed in the Zenoti theme", category: "Design Roadmap", priority: "high" },
    { id: 5, name: "Mobile & tablet support from DS 3.0", category: "Design Roadmap", priority: "high" },
    
    // Audit
    { id: 18, name: "Define audit process for new designs", category: "Audit", priority: "high" },
    { id: 19, name: "Set up guidelines for design review", category: "Audit", priority: "high" },
    
    // Maintenance
    { id: 20, name: "Update button components for segmented buttons", category: "Maintenance", priority: "medium" },
    { id: 21, name: "Review & validate DS code", category: "Maintenance", priority: "high" },
    
    // Advocacy & Training
    { id: 23, name: "Enable Design to Code workflows", category: "Advocacy & Training", priority: "medium" },
    { id: 24, name: "Icons usage and visual layering style guide", category: "Advocacy & Training", priority: "medium" }
  ];

  const [tasks, setTasks] = useState(initialTasks);
  const [cellData, setCellData] = useState({});
  const [selectedCells, setSelectedCells] = useState(new Set());
  const [lastClickedCell, setLastClickedCell] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editingTaskName, setEditingTaskName] = useState('');
  const [newTaskInputs, setNewTaskInputs] = useState({});
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Category collapsed state
  const [collapsed, setCollapsed] = useState({});
  
  // Filter state
  const [showOnlyMyTasks, setShowOnlyMyTasks] = useState(false);
  
  // Drag and drop state for reordering
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverTask, setDragOverTask] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // User management and logging
  const [changeLog, setChangeLog] = useState([]);
  const [showChangeLog, setShowChangeLog] = useState(false);
  const [userFilter, setUserFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  
  // Commit state for tracking uncommitted changes
  const [hasUncommittedChanges, setHasUncommittedChanges] = useState(false);
  const [lastCommitTime, setLastCommitTime] = useState(null);
  const [githubTokenInput, setGithubTokenInput] = useState('');
  const [isTokenValid, setIsTokenValid] = useState(false);
  
  const contextMenuRef = useRef(null);
  
  // Get authentication context
  const { user: currentUser, logout: handleLogout } = useMagicLinkAuth();

  // Debug logging for user object
  useEffect(() => {
    if (currentUser) {
      console.log('Current user in DesignSystemTracker:', currentUser);
      console.log('isAdmin value:', currentUser.isAdmin);
      console.log('User email:', currentUser.email);
    }
  }, [currentUser]);

  // Local storage keys
  const STORAGE_KEYS = {
    TASKS: 'design_tracker_tasks',
    CELL_DATA: 'design_tracker_cell_data',
    COLLAPSED: 'design_tracker_collapsed',
    CHANGE_LOG: 'design_tracker_change_log'
  };

  // Load data from localStorage on component mount
  useEffect(() => {
    try {
      // Load tasks
      const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        setTasks(parsedTasks);
      }

      // Load cell data (assignments)
      const savedCellData = localStorage.getItem(STORAGE_KEYS.CELL_DATA);
      if (savedCellData) {
        const parsedCellData = JSON.parse(savedCellData);
        setCellData(parsedCellData);
      }

      // Load collapsed state
      const savedCollapsed = localStorage.getItem(STORAGE_KEYS.COLLAPSED);
      if (savedCollapsed) {
        const parsedCollapsed = JSON.parse(savedCollapsed);
        setCollapsed(parsedCollapsed);
      }

      // Load change log
      const savedChangeLog = localStorage.getItem(STORAGE_KEYS.CHANGE_LOG);
      if (savedChangeLog) {
        const parsedChangeLog = JSON.parse(savedChangeLog);
        setChangeLog(parsedChangeLog);
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks to localStorage:', error);
    }
  }, [tasks]);

  // Save cell data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CELL_DATA, JSON.stringify(cellData));
    } catch (error) {
      console.error('Error saving cell data to localStorage:', error);
    }
  }, [cellData]);

  // Save collapsed state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COLLAPSED, JSON.stringify(collapsed));
    } catch (error) {
      console.error('Error saving collapsed state to localStorage:', error);
    }
  }, [collapsed]);

  // Save change log to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CHANGE_LOG, JSON.stringify(changeLog));
    } catch (error) {
      console.error('Error saving change log to localStorage:', error);
    }
  }, [changeLog]);

  // Function to clear all stored data and reset to initial state
  const clearAllData = () => {
    try {
      // Clear localStorage
      localStorage.removeItem(STORAGE_KEYS.TASKS);
      localStorage.removeItem(STORAGE_KEYS.CELL_DATA);
      localStorage.removeItem(STORAGE_KEYS.COLLAPSED);
      localStorage.removeItem(STORAGE_KEYS.CHANGE_LOG);
      
      // Reset state to initial values
      setTasks(initialTasks);
      setCellData({});
      setCollapsed({});
      setChangeLog([]);
      setSelectedCells(new Set());
      setLastClickedCell(null);
      
      console.log('All data cleared and reset to initial state');
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };

  // Function to commit changes and share with other users
  const commitChanges = async () => {
    try {
      // Prepare data to commit
      const dataToCommit = {
        tasks,
        cellData,
        changeLog,
        lastUpdated: new Date().toISOString(),
        committedBy: currentUser.name,
        version: '1.0.0'
      };

      if (isBackendProxyEnabled()) {
        // Use secure backend proxy
        const backend = new BackendProxy();
        
        // First authenticate with backend
        try {
          await backend.authenticateUser(currentUser.email);
          console.log('✅ Authenticated with backend for commit');
        } catch (authError) {
          console.error('❌ Backend authentication failed for commit:', authError);
          throw new Error('Failed to authenticate with backend. Please try logging in again.');
        }
        
        await backend.commitData(dataToCommit, `Update by ${currentUser.name}`);
      } else {
        // Direct GitHub flow requires user token
        if (!currentUser.githubToken) {
          alert('GitHub token not found. Please add your GitHub Personal Access Token in the settings.');
          return;
        }
        const githubApi = new GitHubAPI(currentUser.githubToken);
        await githubApi.checkAccess();
        const commitMessage = GITHUB_CONFIG.COMMIT_MESSAGES.USER_UPDATE(currentUser.name);
        await githubApi.commitData(dataToCommit, commitMessage);
      }

      // Update the commit timestamp
      setLastCommitTime(new Date().toISOString());
      setHasUncommittedChanges(false);
      logChange('commit', `User ${currentUser.name} committed changes${isBackendProxyEnabled() ? ' via backend' : ' to GitHub'}`);
      alert('Changes committed successfully! Other users can now sync to see your updates.');
    } catch (error) {
      console.error('Error committing changes:', error);
      let errorMessage = 'Failed to commit changes. ' + (error.message || '');
      alert(errorMessage);
    }
  };

  // Function to sync data from GitHub
  const syncFromGitHub = async () => {
    // Create abort controller for this sync operation
    const abortController = new AbortController();
    
    try {
      const syncButton = document.querySelector('[data-sync-button]');
      if (syncButton) {
        syncButton.disabled = true;
        syncButton.innerHTML = `
          <div class="flex items-center gap-2">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Syncing...</span>
            <button 
              onclick="window.cancelCurrentSync()" 
              class="ml-2 px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded"
              title="Cancel sync"
            >
              ✕
            </button>
          </div>
        `;
        
        // Store abort controller globally so cancel button can access it
        window.cancelCurrentSync = () => {
          abortController.abort();
          syncButton.disabled = false;
          syncButton.innerHTML = hasUncommittedChanges 
            ? '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 6L9 17l-5-5" /></svg> Sync (Commit Changes)'
            : '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> Sync';
        };
      }

      let fetchedData = null;
      let sourceLabel = '';

      if (isBackendProxyEnabled()) {
        const backend = new BackendProxy();
        
        // First check if backend is healthy
        try {
          if (abortController.signal.aborted) throw new Error('Sync cancelled');
          
          // Update button to show health check step
          if (syncButton) {
            syncButton.innerHTML = `
              <div class="flex items-center gap-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Checking backend...</span>
                <button 
                  onclick="window.cancelCurrentSync()" 
                  class="ml-2 px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded"
                  title="Cancel sync"
                >
                  ✕
                </button>
              </div>
            `;
          }
          
          // Simple ping test first
          try {
            console.log('🔍 Testing backend connectivity...');
            const pingResponse = await fetch('https://project-tracker-backend-rejs.onrender.com/api/health', {
              method: 'GET',
              signal: abortController.signal
            });
            console.log('✅ Backend ping successful:', pingResponse.status);
            
            if (!pingResponse.ok) {
              throw new Error(`Backend responded with status: ${pingResponse.status}`);
            }
            
            const healthData = await pingResponse.json();
            console.log('✅ Backend health data:', healthData);
            
          } catch (pingError) {
            console.error('❌ Backend ping failed:', pingError);
            throw new Error('Cannot reach backend. Please check the URL or if the service is running.');
          }
          
          const isHealthy = await backend.checkBackendHealth();
          if (!isHealthy) {
            throw new Error('Backend is not responding. Please check if it\'s running.');
          }
          console.log('✅ Backend is healthy');
          
          if (abortController.signal.aborted) throw new Error('Sync cancelled');
          
          // Update button to show authentication step
          if (syncButton) {
            syncButton.innerHTML = `
              <div class="flex items-center gap-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Authenticating...</span>
                <button 
                  onclick="window.cancelCurrentSync()" 
                  class="ml-2 px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded"
                  title="Cancel sync"
                >
                  ✕
                </button>
              </div>
            `;
          }
          
          console.log('🔐 Starting authentication with email:', currentUser.email);
          await backend.authenticateUser(currentUser.email);
          console.log('✅ Authenticated with backend');
          
          if (abortController.signal.aborted) throw new Error('Sync cancelled');
          
          // Update button to show fetching step
          if (syncButton) {
            syncButton.innerHTML = `
              <div class="flex items-center gap-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Fetching data...</span>
                <button 
                  onclick="window.cancelCurrentSync()" 
                  class="ml-2 px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded"
                  title="Cancel sync"
                >
                  ✕
                </button>
              </div>
            `;
          }
          
        } catch (authError) {
          console.error('❌ Backend authentication failed:', authError);
          throw new Error('Failed to authenticate with backend. Please try logging in again.');
        }
        
        sourceLabel = 'backend';
        fetchedData = await backend.fetchData();
      } else {
        const hasToken = Boolean(currentUser?.githubToken);
        if (hasToken) {
          const githubApi = new GitHubAPI(currentUser.githubToken);
          await githubApi.checkAccess();
          sourceLabel = 'GitHub (auth)';
          fetchedData = await githubApi.fetchData();
        } else {
          // Public fetch (no token required)
          sourceLabel = 'GitHub (public)';
          const rawUrl = `https://raw.githubusercontent.com/${GITHUB_CONFIG.REPO_OWNER}/${GITHUB_CONFIG.REPO_NAME}/${GITHUB_CONFIG.DATA_BRANCH}/${GITHUB_CONFIG.DATA_FILE_PATH}`;
          const resp = await fetch(rawUrl, { cache: 'no-cache' });
          if (resp.status === 404) {
            fetchedData = null;
          } else if (!resp.ok) {
            throw new Error(`Failed to fetch data publicly: ${resp.status}`);
          } else {
            fetchedData = await resp.json();
          }
        }
      }

      if (fetchedData) {
        const currentLastUpdated = localStorage.getItem('last_updated') || '0';
        const fetchedLastUpdated = fetchedData.lastUpdated || '0';
        if (new Date(fetchedLastUpdated) > new Date(currentLastUpdated)) {
          const mergedData = mergeData(fetchedData);
          setTasks(mergedData.tasks);
          setCellData(mergedData.cellData);
          setChangeLog(mergedData.changeLog);
          localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(mergedData.tasks));
          localStorage.setItem(STORAGE_KEYS.cellData, JSON.stringify(mergedData.cellData));
          localStorage.setItem(STORAGE_KEYS.changeLog, JSON.stringify(mergedData.changeLog));
          localStorage.setItem('last_updated', fetchedLastUpdated);
          alert('New data found! Synced successfully.');
          logChange('sync', `User ${currentUser.name} synced latest data from ${sourceLabel}`);
        } else {
          alert('Already up to date! No new data to sync.');
        }
      } else {
        alert('No shared data found yet.');
      }
    } catch (error) {
      if (error.message === 'Sync cancelled') {
        console.log('Sync was cancelled by user');
        return;
      }
      console.error('Error syncing:', error);
      alert('Failed to sync. ' + (error.message || ''));
    } finally {
      const syncButton = document.querySelector('[data-sync-button]');
      if (syncButton) {
        syncButton.disabled = false;
        if (hasUncommittedChanges) {
          syncButton.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 6L9 17l-5-5" /></svg> Sync (Commit Changes)';
        } else {
          syncButton.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> Sync';
        }
      }
      // Clean up global cancel function
      delete window.cancelCurrentSync;
    }
  };

  // Function to merge fetched data with current data
  const mergeData = (fetchedData) => {
    // Merge tasks (new tasks get added, existing ones get updated)
    const mergedTasks = [...tasks];
    fetchedData.tasks.forEach(fetchedTask => {
      const existingIndex = mergedTasks.findIndex(task => task.id === fetchedTask.id);
      if (existingIndex >= 0) {
        // Update existing task
        mergedTasks[existingIndex] = { ...mergedTasks[existingIndex], ...fetchedTask };
      } else {
        // Add new task
        mergedTasks.push(fetchedTask);
      }
    });

    // Merge cell data (fetched data takes precedence for conflicts)
    const mergedCellData = { ...cellData, ...fetchedData.cellData };

    // Merge change log (append new changes)
    const mergedChangeLog = [...changeLog, ...fetchedData.changeLog];

    return {
      tasks: mergedTasks,
      cellData: mergedCellData,
      changeLog: mergedChangeLog
    };
  };

  const categories = ["Design Roadmap", "Audit", "Maintenance", "Advocacy & Training"];
  const statusOptions = [
    { value: "planned", label: "Planned", icon: Circle },
    { value: "in-progress", label: "In Progress", icon: Clock },
    { value: "completed", label: "Completed", icon: CheckCircle2 },
    { value: "blocked", label: "Blocked", icon: AlertCircle },
    { value: "delayed", label: "Delayed", icon: PauseCircle }
  ];
  const teamMembers = [
    { id: 7, name: "Adit", role: "Design System Governance", email: "aditk@zenoti.com", isAdmin: true },
    { id: 4, name: "Agam", role: "Design System Governance", email: "agamm@zenoti.com", isAdmin: false },
    { id: 1, name: "Charissa", role: "Design System Governance", email: "charissag@zenoti.com", isAdmin: false },
    { id: 6, name: "Kavish", role: "Design System Governance", email: "kavisht@zenoti.com", isAdmin: true },
    { id: 3, name: "Nitin", role: "Design System Governance", email: "nitinb@zenoti.com", isAdmin: false },
    { id: 2, name: "Praveen", role: "Design System Governance", email: "praveenh@zenoti.com", isAdmin: false },
    { id: 5, name: "Subhranta", role: "Design System Governance", email: "subhrantam@zenoti.com", isAdmin: false }
  ];
  const priorityOptions = ["high", "medium", "low"];

  // Logging function
  const logChange = (action, details, taskId = null, weekId = null) => {
    if (!currentUser) return;
    
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      user: currentUser.name,
      userId: currentUser.id,
      action,
      details,
      taskId,
      weekId,
      taskName: taskId ? tasks.find(t => t.id === taskId)?.name : null
    };
    
    setChangeLog(prev => [logEntry, ...prev]);
  };

  // Auto-assign function - respects admin privileges
  const autoAssignUser = (taskId, weekId) => {
    if (!currentUser) return;
    
    // Admin users can assign to anyone, regular users can only assign themselves
    const cellKey = getCellKey(taskId, weekId);
    const currentData = cellData[cellKey] || {};
    
    if (currentUser.isAdmin) {
      // Admin users - no auto-assignment, they choose manually
      return;
    } else {
      // Non-admin users are automatically assigned to cells they interact with
    if (currentData.assignee !== currentUser.name) {
      updateCellData(taskId, weekId, 'assignee', currentUser.name);
      }
    }
  };

  // User authentication
  const handleLogin = (user) => {
    // setCurrentUser(user); // This line was removed as per the new_code
    // setShowLogin(false); // This line was removed as per the new_code
    logChange('login', `User ${user.name} logged in`);
  };

  const handleLocalLogout = () => {
    // Clear only current user's personal data while keeping project data
    if (currentUser) {
      try {
        // Clear current user's assignments from cellData
        const updatedCellData = { ...cellData };
        Object.keys(updatedCellData).forEach(key => {
          if (updatedCellData[key].assignee === currentUser.name) {
            updatedCellData[key].assignee = '';
          }
        });
        setCellData(updatedCellData);
        
        // Log the logout
        logChange('logout', `User ${currentUser.name} logged out`);
        
        // Clear user's personal selections
    setSelectedCells(new Set());
        setLastClickedCell(null);
        
        console.log('User data cleared on logout');
      } catch (error) {
        console.error('Error clearing user data on logout:', error);
      }
    }
    
    // Call the actual logout function from context
    handleLogout();
  };

  // Close context menu when clicking outside or on escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setContextMenu(null);
      }
      
      // Clear selection if clicking outside of cells without modifier keys
      if (!event.target.closest('[data-cell]') && 
          !event.target.closest('[data-context-menu]') &&
          !(event.ctrlKey || event.metaKey || event.shiftKey)) {
        clearSelection();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setContextMenu(null);
        clearSelection();
      }
      if (event.key === 'Shift') {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === 'Shift') {
        setIsShiftPressed(false);
        setHoveredCell(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const getStatusIcon = (status) => {
    const statusOption = statusOptions.find(s => s.value === status);
    if (!statusOption) return <Circle className="w-3 h-3 text-white" />;
    const IconComponent = statusOption.icon;
    return <IconComponent className="w-3 h-3 text-white" />;
  };

  const getStatusColor = (status) => {
    return STYLE_TOKENS.status[status] || STYLE_TOKENS.status.default;
  };

  const getPriorityColor = (priority) => {
    return STYLE_TOKENS.priorityBorder[priority] || STYLE_TOKENS.priorityBorder.default;
  };

  const updateTaskPriority = (taskId, priority) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, priority } : task
    ));
    
    // Mark as having uncommitted changes
    setHasUncommittedChanges(true);
    
    // Log the priority change
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      logChange('task_edited', `Changed priority of "${task.name}" to ${priority}`, taskId);
    }
  };

  const getCellKey = (taskId, weekId) => `${taskId}-${weekId}`;

  const getCellData = (taskId, weekId) => {
    const key = getCellKey(taskId, weekId);
    return cellData[key] || { assignee: "", status: "" };
  };

  const updateCellData = (taskId, weekId, field, value) => {
    const key = getCellKey(taskId, weekId);
    const oldValue = cellData[key]?.[field] || '';
    
    setCellData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
    
    // Mark as having uncommitted changes
    if (oldValue !== value) {
      setHasUncommittedChanges(true);
      
      // Log the change
      const task = tasks.find(t => t.id === taskId);
      const week = weeks.find(w => w.id === weekId);
      const action = field === 'assignee' ? 'assignment' : 'status_change';
      const details = `Assigned ${task.name} to ${value || 'unassigned'} for ${week.label}`;
      
      logChange(action, details, taskId, weekId);
    }
  };

  const isCellScheduled = (taskId, weekId) => {
    const cellInfo = getCellData(taskId, weekId);
    return cellInfo.assignee || cellInfo.status;
  };

  const handleCellClick = (taskId, weekId, event) => {
    event.preventDefault();
    const cellKey = getCellKey(taskId, weekId);
    
    if (event.shiftKey && lastClickedCell) {
      // Shift+click: Range selection from last clicked cell to current cell
      const [lastTaskId, lastWeekId] = lastClickedCell.split('-').map(Number);
      
      // Only allow range selection within the same task
      if (lastTaskId === taskId) {
        const startWeek = Math.min(lastWeekId, weekId);
        const endWeek = Math.max(lastWeekId, weekId);
        
        // Create range of cells
        const rangeCells = new Set();
        for (let week = startWeek; week <= endWeek; week++) {
          const rangeKey = getCellKey(taskId, week);
          rangeCells.add(rangeKey);
          
          // Auto-schedule cells that aren't already scheduled
          if (!isCellScheduled(taskId, week)) {
            updateCellData(taskId, week, 'status', 'planned');
            // Auto-assign non-admin users
            autoAssignUser(taskId, week);
          }
        }
        
        if (event.ctrlKey || event.metaKey) {
          // Shift+Ctrl: Add range to existing selection
          setSelectedCells(prev => new Set([...prev, ...rangeCells]));
        } else {
          // Shift only: Replace selection with range
          setSelectedCells(rangeCells);
        }
      }
    } else if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd+click: Toggle individual cell in multi-select mode
      if (!isCellScheduled(taskId, weekId)) {
        updateCellData(taskId, weekId, 'status', 'planned');
        // Auto-assign non-admin users
        autoAssignUser(taskId, weekId);
      }
      
      setSelectedCells(prev => {
        const newSet = new Set(prev);
        if (newSet.has(cellKey)) {
          newSet.delete(cellKey);
        } else {
          newSet.add(cellKey);
        }
        return newSet;
      });
      setLastClickedCell(cellKey);
    } else {
      // Regular click: Single selection
      if (!isCellScheduled(taskId, weekId)) {
        updateCellData(taskId, weekId, 'status', 'planned');
        // Auto-assign non-admin users
        autoAssignUser(taskId, weekId);
      }
      setSelectedCells(new Set([cellKey]));
      setLastClickedCell(cellKey);
    }
  };

  const handleCellRightClick = (taskId, weekId, event) => {
    event.preventDefault();
    event.stopPropagation();
    const cellKey = getCellKey(taskId, weekId);
    
    // If right-clicking on unselected cell, select it
    if (!selectedCells.has(cellKey)) {
      if (!isCellScheduled(taskId, weekId)) {
        updateCellData(taskId, weekId, 'status', 'planned');
        // Auto-assign non-admin users
        autoAssignUser(taskId, weekId);
      }
      setSelectedCells(new Set([cellKey]));
      setLastClickedCell(cellKey);
    }
    
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      selectedCells: selectedCells.has(cellKey) ? selectedCells : new Set([cellKey])
    });
  };

  const applyToSelectedCells = (field, value) => {
    const cellsToUpdate = contextMenu?.selectedCells || selectedCells;
    
    cellsToUpdate.forEach(cellKey => {
      const [taskId, weekId] = cellKey.split('-').map(Number);
      if (field === 'remove') {
        const key = getCellKey(taskId, weekId);
        const currentData = cellData[key];
        
        // Only mark as uncommitted if there was actual data to remove
        if (currentData && (currentData.assignee || currentData.status)) {
          setHasUncommittedChanges(true);
          
          // Log the removal
          const task = tasks.find(t => t.id === taskId);
          const week = weeks.find(w => w.id === weekId);
          logChange('cell_cleared', `Cleared ${task.name} for ${week.label}`, taskId, weekId);
        }
        
        setCellData(prev => {
          const newData = { ...prev };
          delete newData[key];
          return newData;
        });
      } else {
        updateCellData(taskId, weekId, field, value);
      }
    });
    
    setContextMenu(null);
  };

  const addNewTask = (category) => {
    const taskName = newTaskInputs[category]?.trim();
    if (!taskName) return;
    
    const newId = Math.max(...tasks.map(t => t.id)) + 1;
    const newTask = {
      id: newId,
      name: taskName,
      category,
      priority: "medium"
    };
    
    setTasks(prev => [...prev, newTask]);
    setNewTaskInputs(prev => ({ ...prev, [category]: "" }));
    
    // Mark as having uncommitted changes
    setHasUncommittedChanges(true);
    
    // Log task creation
    logChange('task_created', `Created new task: ${taskName} in ${category}`, newId);
  };

  const handleNewTaskInputChange = (category, value) => {
    setNewTaskInputs(prev => ({ ...prev, [category]: value }));
  };

  const handleNewTaskKeyPress = (category, event) => {
    if (event.key === 'Enter') {
      addNewTask(category);
    }
  };

  const getTaskScheduledWeeks = (taskId) => {
    return weeks.filter(week => isCellScheduled(taskId, week.id));
  };

  // Filter tasks to show only current user's assignments
  const getFilteredTasks = (category) => {
    if (!showOnlyMyTasks || !currentUser) {
      return tasks.filter(task => task.category === category);
    }
    
    return tasks.filter(task => {
      if (task.category !== category) return false;
      
      // Check if user has any assignments for this task
      return weeks.some(week => {
        const cellInfo = getCellData(task.id, week.id);
        return cellInfo.assignee === currentUser.name;
      });
    });
  };

  const getPreviewRangeCells = () => {
    if (!isShiftPressed || !hoveredCell || !lastClickedCell) {
      return new Set();
    }
    
    const [lastTaskId, lastWeekId] = lastClickedCell.split('-').map(Number);
    const { taskId: hoverTaskId, weekId: hoverWeekId } = hoveredCell;
    
    // Only show preview if hovering within the same task
    if (lastTaskId !== hoverTaskId) {
      return new Set();
    }
    
    const startWeek = Math.min(lastWeekId, hoverWeekId);
    const endWeek = Math.max(lastWeekId, hoverWeekId);
    
    const rangeCells = new Set();
    for (let week = startWeek; week <= endWeek; week++) {
      rangeCells.add(getCellKey(hoverTaskId, week));
    }
    
    return rangeCells;
  };

  const clearSelection = () => {
    setSelectedCells(new Set());
    setLastClickedCell(null);
  };

  const handleCellMouseEnter = (taskId, weekId) => {
    setHoveredCell({ taskId, weekId });
  };

  const handleCellMouseLeave = () => {
    setHoveredCell(null);
  };

  const saveEditingTask = () => {
    if (editingTaskName.trim()) {
      const oldName = tasks.find(t => t.id === editingTask)?.name;
      setTasks(prev => prev.map(t => 
        t.id === editingTask ? { ...t, name: editingTaskName.trim() } : t
      ));
      
      // Log task name change and mark as uncommitted
      if (oldName !== editingTaskName.trim()) {
        logChange('task_edited', `Changed task name from "${oldName}" to "${editingTaskName.trim()}"`, editingTask);
        setHasUncommittedChanges(true);
      }
    }
    setEditingTask(null);
    setEditingTaskName('');
  };

  const cancelEditingTask = () => {
    setEditingTask(null);
    setEditingTaskName('');
  };

  // Drag and drop handlers for reordering
  const handleDragStart = (e, task) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ taskId: task.id, category: task.category }));
    setDraggedTask(task);
    setIsDragging(true);
    
    // Add visual feedback
    e.target.style.opacity = '0.5';
    e.target.style.transform = 'rotate(1deg)';
  };

  const handleDragEnd = (e) => {
    setDraggedTask(null);
    setDragOverTask(null);
    setIsDragging(false);
    
    // Remove visual feedback
    e.target.style.opacity = '1';
    e.target.style.transform = 'none';
  };

  const handleDragOver = (e, task) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedTask && draggedTask.id !== task.id && draggedTask.category === task.category) {
      setDragOverTask(task);
    }
  };

  const handleDragLeave = (e) => {
    // Only reset if we're leaving the task row entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverTask(null);
    }
  };

  const handleDrop = (e, targetTask) => {
    e.preventDefault();
    
    if (!draggedTask || draggedTask.id === targetTask.id || draggedTask.category !== targetTask.category) {
      return;
    }

    // Reorder tasks within the category
    setTasks(prevTasks => {
      // Find indices in the full tasks array
      const draggedIndex = prevTasks.findIndex(t => t.id === draggedTask.id);
      const targetIndex = prevTasks.findIndex(t => t.id === targetTask.id);
      
      if (draggedIndex === -1 || targetIndex === -1) return prevTasks;
      
      // Create new array with reordered tasks
      const newTasks = [...prevTasks];
      const [draggedTaskItem] = newTasks.splice(draggedIndex, 1);
      
      // Insert at target position
      newTasks.splice(targetIndex, 0, draggedTaskItem);
      
      // Log the reordering
      logChange('task_reordered', `Task "${draggedTask.name}" reordered within ${draggedTask.category}`, draggedTask.id);
      
      // Mark as having uncommitted changes
      setHasUncommittedChanges(true);
      
      return newTasks;
    });
    
    setDragOverTask(null);
  };

  // Context Menu Component
  const ContextMenu = ({ x, y, selectedCells }) => (
    <div
      ref={contextMenuRef}
      data-context-menu="true"
      className="fixed bg-white border border-gray-300 rounded-lg shadow-lg z-50 py-2 min-w-48"
      style={{ 
        left: Math.min(x, window.innerWidth - 200), 
        top: Math.min(y, window.innerHeight - 300),
        maxHeight: '300px',
        overflowY: 'auto'
      }}
    >
      <div className="px-3 py-1 text-xs font-medium text-gray-500 border-b border-gray-200 mb-1">
        {selectedCells.size} cell(s) selected
      </div>
      
      <div className="px-2">
        <div className="text-xs font-medium text-gray-700 px-2 py-1">Assign to:</div>
        {currentUser && (
          <>
            {currentUser.isAdmin ? (
          // Admin users can assign to anyone
          <>
            {teamMembers.map(member => (
              <button
                key={member.id}
                className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                onClick={() => applyToSelectedCells('assignee', member.name)}
              >
                {member.name}
              </button>
            ))}
            <button
              className="w-full text-left px-2 py-1 text-sm hover:bg-red-50 rounded text-red-600"
              onClick={() => applyToSelectedCells('assignee', '')}
            >
              Unassign
            </button>
          </>
        ) : (
          // Non-admin users can only assign to themselves
          <>
            <button
              className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded bg-blue-50"
              onClick={() => applyToSelectedCells('assignee', currentUser.name)}
            >
              {currentUser.name} (You)
            </button>
            <button
              className="w-full text-left px-2 py-1 text-sm hover:bg-red-50 rounded text-red-600"
              onClick={() => applyToSelectedCells('assignee', '')}
            >
              Unassign
            </button>
              </>
            )}
          </>
        )}
      </div>
      
      <div className="border-t border-gray-200 mt-2 pt-2 px-2">
        <div className="text-xs font-medium text-gray-700 px-2 py-1">Change status:</div>
        {statusOptions.map(status => {
          const IconComponent = status.icon;
          return (
            <button
              key={status.value}
              className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
              onClick={() => applyToSelectedCells('status', status.value)}
            >
              <div className={`w-3 h-3 ${getStatusColor(status.value)} rounded-sm flex items-center justify-center`}>
                <IconComponent className="w-2 h-2 text-white" />
              </div>
              {status.label}
            </button>
          );
        })}
      </div>
      
      <div className="border-t border-gray-200 mt-2 pt-2 px-2">
        <button
          className="w-full text-left px-2 py-1 text-sm hover:bg-red-50 rounded text-red-600"
          onClick={() => applyToSelectedCells('remove', null)}
        >
          Clear selected cells
        </button>
      </div>
    </div>
  );

  // Function to update task delivery date (admin only)
  const updateTaskDeliveryDate = (taskId, deliveryDate) => {
    if (!currentUser?.isAdmin) return;
    
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;
      const previous = task.deliveryDate || '';
      const next = deliveryDate || '';
      if (previous !== next) {
        const taskName = task.name;
        const label = next ? `Set delivery date for ${taskName} to ${formatDateHuman(next)}` : `Cleared delivery date for ${taskName}`;
        logChange('task_edited', label, taskId);
        setHasUncommittedChanges(true);
      }
      return { ...task, deliveryDate: next };
    }));
  };

  // Helper function to format date for human reading
  const formatDateHuman = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Helper function to format date for input field
  const formatDateForInput = (value) => {
    if (!value) return '';
    // If already YYYY-MM-DD, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Initialize GitHub token input from user data
  useEffect(() => {
    if (currentUser?.githubToken) {
      setGithubTokenInput(currentUser.githubToken);
      setIsTokenValid(true);
    }
  }, [currentUser?.githubToken]);

  // Function to save GitHub token
  const saveGitHubToken = async () => {
    try {
      if (!githubTokenInput.trim()) {
        alert('Please enter a GitHub token');
        return;
      }

      // Test the token by checking repository access
      const githubApi = new GitHubAPI(githubTokenInput);
      await githubApi.checkAccess();

      // Token is valid, save it
      const updatedUser = { ...currentUser, githubToken: githubTokenInput };
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      setIsTokenValid(true);
      
      // Show success message
      alert('GitHub token saved successfully! You can now commit and sync data.');
      
      // Force context update (simple approach)
      window.location.reload();
    } catch (error) {
      console.error('Error validating GitHub token:', error);
      alert('Invalid GitHub token. Please check your token and repository permissions.');
      setIsTokenValid(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-full mx-auto">
        <div className="mb-8 sticky top-0 z-20 bg-gray-50 pt-2 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Design System Task Tracker</h1>
            {currentUser && (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowChangeLog(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <History className="w-4 h-4" />
                  <span>Change Log</span>
                </button>
                <div className="flex items-center gap-4">
                  {/* Hide token input when backend proxy is enabled */}
                  {!isBackendProxyEnabled() && (
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        placeholder="GitHub Token"
                        value={githubTokenInput}
                        onChange={(e) => setGithubTokenInput(e.target.value)}
                        className={`px-3 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          isTokenValid ? 'border-green-300 bg-green-50' : 'border-gray-300'
                        }`}
                        title="Enter your GitHub Personal Access Token to enable data sharing"
                      />
                      <button
                        onClick={saveGitHubToken}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        title="Save and validate GitHub token"
                      >
                        Save
                      </button>
                      <a
                        href="https://github.com/settings/tokens"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs underline"
                        title="Create a new GitHub Personal Access Token"
                      >
                        Get Token
                      </a>
                    </div>
                  )}

                  <button
                    onClick={async () => {
                      if (hasUncommittedChanges) {
                        await commitChanges();
                      } else {
                        await syncFromGitHub();
                      }
                    }}
                    data-sync-button
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      hasUncommittedChanges 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                    title={hasUncommittedChanges 
                      ? "Commit and share your changes with other users" 
                      : "Sync latest data"
                    }
                  >
                    {hasUncommittedChanges ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Sync (Commit Changes)</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Sync</span>
                      </>
                    )}
                  </button>
                </div>
                
                {lastCommitTime && (
                  <div className="text-xs text-gray-500 px-2">
                    Last commit: {new Date(lastCommitTime).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      day: '2-digit', 
                      month: 'short' 
                    })}, {new Date(lastCommitTime).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </div>
                )}
                <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    {currentUser.picture ? (
                      <img 
                        src={currentUser.picture} 
                        alt={currentUser.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                    <User className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{currentUser.name}</span>
                      {currentUser.isAdmin && (
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="text-gray-500">{currentUser.email}</div>
                  </div>
                  <button
                    onClick={handleLocalLogout}
                    className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Weekly View</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{teamMembers.length} Team Members</span>
            </div>
            {currentUser && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowOnlyMyTasks(!showOnlyMyTasks)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    showOnlyMyTasks 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                  }`}
                  title={showOnlyMyTasks ? "Show all tasks" : "Show only my tasks"}
                >
                  {showOnlyMyTasks ? "My Tasks" : "All Tasks"}
                </button>
              </div>
            )}
            {selectedCells.size > 0 && (
              <div className="flex items-center gap-2 text-blue-600 font-medium">
                <span>{selectedCells.size} cell(s) selected</span>
                <button 
                  onClick={clearSelection}
                  className="text-red-600 hover:text-red-800 text-xs underline"
                >
                  Clear selection
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Legend & Instructions</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-gray-500 mb-2">Status</h4>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {statusOptions.map(status => {
                  const IconComponent = status.icon;
                  return (
                    <div key={status.value} className="flex items-center gap-2 text-xs flex-shrink-0">
                      <div className={`w-4 h-4 ${getStatusColor(status.value)} rounded-sm flex items-center justify-center`}>
                        <IconComponent className="w-2 h-2 text-white" />
                      </div>
                      <span>{status.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-gray-500 mb-2">Priority</h4>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                <div className="flex items-center gap-2 text-xs flex-shrink-0">
                  <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                  <span>High</span>
                </div>
                <div className="flex items-center gap-2 text-xs flex-shrink-0">
                  <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
                  <span>Medium</span>
                </div>
                <div className="flex items-center gap-2 text-xs flex-shrink-0">
                  <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                  <span>Low</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* How to Use Accordion in its own row */}
          <div className="border-t border-gray-200 pt-4">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors mb-2"
            >
              <span>How to Use</span>
              <div className={`w-5 h-5 transition-transform ${showInstructions ? 'rotate-180' : ''}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            {showInstructions && (
              <div className="text-sm text-gray-600 space-y-2 p-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div>• <strong>Click:</strong> Select single cell</div>
                    <div>• <strong>Shift+click:</strong> Select range from last clicked cell</div>
                    <div>• <strong>Shift+hover:</strong> Preview range selection</div>
                  </div>
                  <div className="space-y-1">
                    <div>• <strong>Cmd/Ctrl+click:</strong> Multi-select individual cells</div>
                    <div>• <strong>Right-click:</strong> Context menu for assignments</div>
                    <div>• <strong>Click outside or Escape:</strong> Clear selection</div>
                    <div>• <strong>Change Log:</strong> Track all user actions and changes</div>
                    <div>• <strong>Drag and Drop:</strong> Reorder tasks within categories</div>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="text-xs font-medium text-gray-700 mb-2">Role-Based Permissions:</div>
                  <div className="text-xs text-gray-600 space-y-1">
                  <div>• <strong>Admin Users (@zenoti.com):</strong> Can assign anyone to any task</div>
                    <div>• <strong>Regular Users:</strong> Automatically assigned to cells they interact with</div>
                    <div>• <strong>All Users:</strong> Can view change log and manage their own assignments</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Tracker Table */}
        <div className="rounded-lg overflow-hidden">
          {/* Drag and Drop Indicator */}
          {isDragging && (
            <div className="bg-blue-50 border-b border-blue-200 p-2 text-center text-sm text-blue-700">
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zm6-8a2 2 0 1 1-.001-4.001A2 2 0 0 1 13 6zm0 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z" />
                </svg>
                Drag to reorder tasks within the same category
              </span>
            </div>
          )}
          <div className="overflow-x-auto min-w-0">
            <table className="w-full min-w-0 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className={`text-left p-4 font-semibold text-gray-700 ${STYLE_TOKENS.sizes.taskCol}`}>Task</th>
                  {weeks.map(week => (
                    <th key={week.id} className={`text-center p-2 font-semibold text-gray-700 ${STYLE_TOKENS.sizes.weekCell}`}>
                      <div className="text-sm">{week.label}</div>
                      <div className="text-xs text-gray-500">{week.startDate}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map((category, idx) => (
                  <React.Fragment key={category}>
                    {idx > 0 && (
                      <tr>
                        <td colSpan={weeks.length + 1}>
                          <div className="h-6"></div>
                      </td>
                    </tr>
                    )}
                    {/* Category container */}
                    <tr>
                      <td colSpan={weeks.length + 1}>
                        <div className={`${STYLE_TOKENS.container} px-2 pt-2 pb-0`}>
                          {/* Header (no gray bg) */}
                          <button
                            type="button"
                            className="flex items-center justify-between w-full py-2 px-2 hover:bg-gray-50 rounded-md"
                            onClick={() => setCollapsed(prev => ({ ...prev, [category]: !prev[category] }))}
                          >
                            <h2 className="text-lg font-semibold text-gray-900">{category}</h2>
                            <div className={`w-5 h-5 transition-transform ${collapsed[category] ? '' : 'rotate-180'}`}>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </button>
                    
                    {/* Add task input row */}
                          <div className="px-2 pt-2 pb-0 mb-2">
                            <div className="responsive-task-input sticky left-0 z-10 bg-white pr-2">
                              <div className="input-container">
                          <input
                            type="text"
                            placeholder={`Add new task in ${category}...`}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={newTaskInputs[category] || ""}
                            onChange={(e) => handleNewTaskInputChange(category, e.target.value)}
                            onKeyPress={(e) => handleNewTaskKeyPress(category, e)}
                          />
                              </div>
                          <button
                            onClick={() => addNewTask(category)}
                                className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors min-w-[72px]"
                            disabled={!newTaskInputs[category]?.trim()}
                          >
                            <span>Add</span>
                          </button>
                            </div>
                          </div>

                          {/* Rows */}
                          {/* Rows are rendered directly in the main table body to keep columns aligned */}
                          
                        </div>
                      </td>
                    </tr>
                    {!collapsed[category] && getFilteredTasks(category).map(task => {
                      const scheduledWeeks = getTaskScheduledWeeks(task.id);
                      return (
                        <tr 
                          key={task.id} 
                          className={`hover:bg-gray-50 transition-all duration-200 group ${
                            draggedTask?.id === task.id ? 'opacity-50 scale-95 shadow-lg' : ''
                          } ${
                            dragOverTask?.id === task.id ? 'border-t-2 border-t-blue-400 bg-blue-50 shadow-md' : ''
                          } ${
                            isDragging && draggedTask?.id !== task.id && draggedTask?.category === task.category ? 'cursor-pointer' : ''
                          }`}
                          draggable={currentUser?.isAdmin}
                          onDragStart={(e) => handleDragStart(e, task)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleDragOver(e, task)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, task)}
                        >
                          <td className={`bg-white p-4 border-l-4 ${getPriorityColor(task.priority)} min-w-0`}>
                            <div className="flex items-start justify-between min-w-0">
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <div className="flex items-center gap-2 mb-1 min-w-0">
                                  {editingTask === task.id ? (
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <input
                                        type="text"
                                        value={editingTaskName}
                                        onChange={(e) => setEditingTaskName(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            saveEditingTask();
                                          } else if (e.key === 'Escape') {
                                            cancelEditingTask();
                                          }
                                        }}
                                        className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        className="p-1 text-green-600 hover:text-green-800 bg-white border rounded flex-shrink-0"
                                        title="Save changes"
                                        onMouseDown={saveEditingTask}
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        className="p-1 text-red-600 hover:text-red-800 bg-white border rounded flex-shrink-0"
                                        title="Cancel editing"
                                        onMouseDown={cancelEditingTask}
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      {currentUser?.isAdmin && (
                                        <div className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing flex-shrink-0">
                                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zm6-8a2 2 0 1 1-.001-4.001A2 2 0 0 1 13 6zm0 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z" />
                                          </svg>
                                        </div>
                                      )}
                                      <div className="font-medium text-gray-900 text-sm flex-1 min-w-0 leading-tight" 
                                           style={{ 
                                             display: '-webkit-box',
                                             WebkitLineClamp: 2,
                                             WebkitBoxOrient: 'vertical',
                                             overflow: 'hidden',
                                             lineHeight: '1.2',
                                             maxHeight: '2.4em'
                                           }}
                                           title={task.name} 
                                           aria-label={task.name}>
                                        {task.name}
                                      </div>
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          type="button"
                                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                                          title="Edit task name"
                                          onMouseDown={() => {
                                            setEditingTask(task.id);
                                            setEditingTaskName(task.name);
                                          }}
                                        >
                                          <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                          title="Delete task"
                                          onMouseDown={() => setDeleteConfirmation(task)}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-4 mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">Priority:</span>
                                    <select 
                                      className="text-xs p-1 border rounded bg-white"
                                      value={task.priority}
                                      onChange={(e) => updateTaskPriority(task.id, e.target.value)}
                                    >
                                      {priorityOptions.map(priority => (
                                        <option key={priority} value={priority}>
                                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">Delivery Date:</span>
                                    {currentUser?.isAdmin ? (
                                      <input
                                        type="date"
                                        className="text-xs p-1 border rounded bg-white"
                                        value={formatDateForInput(task.deliveryDate)}
                                        onChange={(e) => updateTaskDeliveryDate(task.id, e.target.value)}
                                      />
                                    ) : (
                                      <span className="text-xs text-gray-700">
                                        {task.deliveryDate ? formatDateHuman(task.deliveryDate) : '—'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                {scheduledWeeks.length > 0 && (
                                  <div className="space-y-1">
                                    <div className="text-xs font-medium text-gray-600">
                                      Scheduled: {scheduledWeeks.length} week(s)
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {scheduledWeeks.slice(0, 6).map(week => {
                                        const cellInfo = getCellData(task.id, week.id);
                                        return (
                                          <span 
                                            key={week.id}
                                            className={`text-xs px-2 py-1 rounded text-white ${getStatusColor(cellInfo.status)}`}
                                            title={`${week.label}: ${cellInfo.assignee || 'Unassigned'} - ${cellInfo.status || 'No status'}`}
                                          >
                                            {week.label}
                                            {cellInfo.assignee && `: ${cellInfo.assignee.substring(0, 2)}`}
                                          </span>
                                        );
                                      })}
                                      {scheduledWeeks.length > 6 && (
                                        <span className="text-xs text-gray-500">+{scheduledWeeks.length - 6} more</span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          {weeks.map(week => {
                            const cellInfo = getCellData(task.id, week.id);
                            const isScheduled = isCellScheduled(task.id, week.id);
                            const cellKey = getCellKey(task.id, week.id);
                            const isSelected = selectedCells.has(cellKey);
                            const isInPreviewRange = getPreviewRangeCells().has(cellKey);
                            
                            if (isScheduled) {
                              return (
                                <td key={week.id} className={`bg-white border-r border-gray-200 p-1 ${STYLE_TOKENS.sizes.weekCell}`}>
                                  <div 
                                    className={`h-8 border ${getStatusColor(cellInfo.status)} rounded-sm flex items-center justify-center relative cursor-pointer transition-all hover:opacity-80 ${
                                      isSelected ? 'ring-2 ring-blue-400 ring-offset-1' : ''
                                    } ${
                                      isInPreviewRange && !isSelected ? 'ring-2 ring-purple-300 ring-offset-1 opacity-80' : ''
                                    }`}
                                    data-cell="true"
                                    onClick={(e) => handleCellClick(task.id, week.id, e)}
                                    onContextMenu={(e) => handleCellRightClick(task.id, week.id, e)}
                                    onMouseEnter={() => handleCellMouseEnter(task.id, week.id)}
                                    onMouseLeave={handleCellMouseLeave}
                                    title={`${cellInfo.assignee || 'Unassigned'} - ${cellInfo.status || 'No status'}\nRight-click for options`}
                                  >
                                    {cellInfo.assignee && (
                                      <span className="text-xs font-bold text-white truncate px-1">
                                        {cellInfo.assignee.substring(0, 3)}
                                      </span>
                                    )}
                                    <div className="absolute top-1 right-1">
                                      {getStatusIcon(cellInfo.status)}
                                    </div>
                                  </div>
                                </td>
                              );
                            } else {
                              return (
                                <td key={week.id} className={`bg-white border-r border-gray-200 p-1 ${STYLE_TOKENS.sizes.weekCell}`}>
                                  <div 
                                    className={`h-8 bg-gray-50 border border-gray-200 rounded cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors ${
                                      isSelected ? 'ring-2 ring-blue-400 ring-offset-1 bg-blue-50' : ''
                                    } ${
                                      isInPreviewRange && !isSelected ? 'ring-2 ring-purple-300 ring-offset-1 bg-purple-50 border-purple-200' : ''
                                    }`}
                                    data-cell="true"
                                    onClick={(e) => handleCellClick(task.id, week.id, e)}
                                    onContextMenu={(e) => handleCellRightClick(task.id, week.id, e)}
                                    onMouseEnter={() => handleCellMouseEnter(task.id, week.id)}
                                    onMouseLeave={handleCellMouseLeave}
                                    title="Click to schedule\nRight-click for options"
                                  />
                                </td>
                              );
                            }
                          })}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map(category => {
            const categoryTasks = tasks.filter(task => task.category === category);
            const totalTasks = categoryTasks.length;
            
            const cellStats = { planned: 0, 'in-progress': 0, completed: 0, blocked: 0, delayed: 0 };
            let totalScheduledCells = 0;
            
            categoryTasks.forEach(task => {
              weeks.forEach(week => {
                if (isCellScheduled(task.id, week.id)) {
                  totalScheduledCells++;
                  const cellInfo = getCellData(task.id, week.id);
                  if (cellInfo.status && cellStats.hasOwnProperty(cellInfo.status)) {
                    cellStats[cellInfo.status]++;
                  }
                }
              });
            });
            
            return (
              <div key={category} className="bg-white p-4 rounded-lg shadow-sm border">
                <h3 className="font-semibold text-gray-700 text-sm mb-2 truncate" title={category}>
                  {category}
                </h3>
                <div className="text-2xl font-bold text-gray-900">{totalTasks}</div>
                <div className="text-sm text-gray-600 mb-2">
                  {totalScheduledCells} scheduled cells
                </div>
                <div className="text-xs text-gray-500">
                  <div>✓ {cellStats.completed} completed</div>
                  <div>⏳ {cellStats['in-progress']} in progress</div>
                  <div>🚧 {cellStats.blocked + cellStats.delayed} blocked/delayed</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Task</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "<span className="font-medium">{deleteConfirmation.name}</span>"? 
                This will also remove all scheduled cells for this task.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirmation(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const taskId = deleteConfirmation.id;
                    const taskName = deleteConfirmation.name;
                    
                    // Log task deletion
                    logChange('task_deleted', `Deleted task: ${taskName}`, taskId);
                    
                    // Remove task
                    setTasks(prev => prev.filter(t => t.id !== taskId));
                    
                    // Remove all cell data for this task
                    setCellData(prev => {
                      const newData = {};
                      Object.keys(prev).forEach(key => {
                        const [tId] = key.split('-');
                        if (parseInt(tId) !== taskId) {
                          newData[key] = prev[key];
                        }
                      });
                      return newData;
                    });
                    
                    // Remove from selected cells
                    setSelectedCells(prev => {
                      const newSet = new Set();
                      prev.forEach(cellKey => {
                        const [tId] = cellKey.split('-');
                        if (parseInt(tId) !== taskId) {
                          newSet.add(cellKey);
                        }
                      });
                      return newSet;
                    });
                    
                    setDeleteConfirmation(null);
                  }}
                  className="px-3 py-2 text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Context Menu */}
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            selectedCells={contextMenu.selectedCells}
          />
        )}



        {/* Change Log Modal */}
        {showChangeLog && (
          <ChangeLogModal 
            changeLog={changeLog} 
            userFilter={userFilter} 
            actionFilter={actionFilter} 
            setUserFilter={setUserFilter} 
            setActionFilter={setActionFilter} 
            teamMembers={teamMembers} 
            onClose={() => {
              console.log('onClose called, setting showChangeLog to false');
              console.log('Current showChangeLog state:', showChangeLog);
              setShowChangeLog(false);
              console.log('showChangeLog should now be false');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default DesignSystemTracker;
