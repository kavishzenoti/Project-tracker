import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Users, CheckCircle2, Circle, Clock, AlertCircle, PauseCircle, Edit3, X, Trash2, Check, User, LogOut, History, Filter } from 'lucide-react';
import { useMagicLinkAuth } from '../contexts/MagicLinkAuthContext.jsx';

const DesignSystemTracker = () => {
  // Generate weeks starting from current week
  const generateWeeks = () => {
    const weeks = [];
    const today = new Date();
    const currentWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    
    for (let i = 0; i < 12; i++) {
      const weekStart = new Date(currentWeek);
      weekStart.setDate(currentWeek.getDate() + (i * 7));
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
  const [showInstructions, setShowInstructions] = useState(true);
  
  // User management and logging
  const [changeLog, setChangeLog] = useState([]);
  const [showChangeLog, setShowChangeLog] = useState(false);
  const [userFilter, setUserFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  
  const contextMenuRef = useRef(null);
  
  // Get authentication context
  const { user: currentUser, logout: handleLogout } = useMagicLinkAuth();

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

  // Auto-assign function for non-admin users
  const autoAssignUser = (taskId, weekId) => {
    if (!currentUser || (currentUser.email && currentUser.email.endsWith('@zenoti.com'))) return;
    
    // Non-admin users are automatically assigned to cells they interact with
    const cellKey = getCellKey(taskId, weekId);
    const currentData = cellData[cellKey] || {};
    
    if (currentData.assignee !== currentUser.name) {
      updateCellData(taskId, weekId, 'assignee', currentUser.name);
    }
  };

  // User authentication
  const handleLogin = (user) => {
    setCurrentUser(user);
    setShowLogin(false);
    logChange('login', `User ${user.name} logged in`);
  };

  const handleLocalLogout = () => {
    if (currentUser) {
      logChange('logout', `User ${currentUser.name} logged out`);
    }
    setSelectedCells(new Set());
    setContextMenu(null);
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
    switch (status) {
      case "completed": return "bg-green-500 border-green-600";
      case "in-progress": return "bg-blue-500 border-blue-600";
      case "blocked": return "bg-red-500 border-red-600";
      case "delayed": return "bg-orange-500 border-orange-600";
      case "planned": return "bg-purple-500 border-purple-600";
      default: return "bg-gray-400 border-gray-500";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "border-l-red-500";
      case "medium": return "border-l-yellow-500";
      case "low": return "border-l-green-500";
      default: return "border-l-gray-300";
    }
  };

  const updateTaskPriority = (taskId, priority) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, priority } : task
    ));
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
    
    // Log the change
    if (oldValue !== value) {
      const task = tasks.find(t => t.id === taskId);
      const week = weeks.find(w => w.id === weekId);
      const action = field === 'assignee' ? 'assignment' : 'status_change';
      const details = field === 'assignee' 
        ? `Assigned ${task.name} to ${value || 'unassigned'} for ${week.label}`
        : `Changed status of ${task.name} to ${value} for ${week.label}`;
      
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
      
      // Log task name change
      if (oldName !== editingTaskName.trim()) {
        logChange('task_edited', `Changed task name from "${oldName}" to "${editingTaskName.trim()}"`, editingTask);
      }
    }
    setEditingTask(null);
    setEditingTaskName('');
  };

  const cancelEditingTask = () => {
    setEditingTask(null);
    setEditingTaskName('');
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
        {currentUser?.email && currentUser.email.endsWith('@zenoti.com') ? (
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



  // Change Log Modal Component
  const ChangeLogModal = () => {
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
        case 'assignment': return <Users className="w-4 h-4 text-purple-600" />;
        case 'status_change': return <CheckCircle2 className="w-4 h-4 text-orange-600" />;
        default: return <Circle className="w-4 h-4 text-gray-600" />;
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl mx-4 shadow-xl max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Change Log</h2>
            <button
              onClick={() => setShowChangeLog(false)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
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
                <option value="assignment">Assignment</option>
                <option value="status_change">Status Change</option>
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-full mx-auto">
        <div className="mb-8">
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
                      {currentUser.email && currentUser.email.endsWith('@zenoti.com') && (
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
              <div className="text-sm text-gray-600 space-y-2 bg-gray-50 p-3 rounded-lg">
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
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-700 min-w-96">Task</th>
                  {weeks.map(week => (
                    <th key={week.id} className="text-center p-2 font-semibold text-gray-700 min-w-20">
                      <div className="text-sm">{week.label}</div>
                      <div className="text-xs text-gray-500">{week.startDate}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map(category => (
                  <React.Fragment key={category}>
                    <tr className="bg-gray-100">
                      <td colSpan={weeks.length + 1} className="p-3 font-semibold text-gray-800 bg-gradient-to-r from-gray-100 to-gray-50">
                        <span className="flex-1 min-w-0">{category}</span>
                      </td>
                    </tr>
                    
                    {/* Add task input row */}
                    <tr className="bg-gray-50">
                      <td colSpan={weeks.length + 1} className="p-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder={`Add new task in ${category}...`}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0"
                            value={newTaskInputs[category] || ""}
                            onChange={(e) => handleNewTaskInputChange(category, e.target.value)}
                            onKeyPress={(e) => handleNewTaskKeyPress(category, e)}
                          />
                          <button
                            onClick={() => addNewTask(category)}
                            className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors flex-shrink-0"
                            disabled={!newTaskInputs[category]?.trim()}
                          >
                            <span>Add</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {tasks.filter(task => task.category === category).map(task => {
                      const scheduledWeeks = getTaskScheduledWeeks(task.id);
                      
                      return (
                        <tr 
                          key={task.id} 
                          className="border-b border-gray-100 hover:bg-gray-50 transition-all group"
                        >
                          <td className={`p-4 border-l-4 ${getPriorityColor(task.priority)}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {editingTask === task.id ? (
                                    <div className="flex items-center gap-2 flex-1">
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
                                        className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        className="p-1 text-green-600 hover:text-green-800 bg-white border rounded"
                                        title="Save changes"
                                        onMouseDown={saveEditingTask}
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        className="p-1 text-red-600 hover:text-red-800 bg-white border rounded"
                                        title="Cancel editing"
                                        onMouseDown={cancelEditingTask}
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 flex-1">
                                      <div className="font-medium text-gray-900 text-sm flex-1">
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
                                <td key={week.id} className="p-1">
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
                                <td key={week.id} className="p-1">
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
        {showChangeLog && <ChangeLogModal />}
      </div>
    </div>
  );
};

export default DesignSystemTracker;
