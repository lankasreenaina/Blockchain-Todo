import React, { useState, useEffect, useMemo } from "react";
import { ethers } from "ethers";
import "./App.css";

// Your existing ABI (keep your exact ABI)
const OnchainTodoABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "content",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "TaskCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "TaskDeleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "completed",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "TaskUpdated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "content",
        "type": "string"
      }
    ],
    "name": "createTask",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "deleteTask",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMyTasks",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "content",
            "type": "string"
          },
          {
            "internalType": "bool",
            "name": "completed",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "updatedAt",
            "type": "uint256"
          }
        ],
        "internalType": "struct OnchainTodo.Task[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getMyTasks",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "content",
            "type": "string"
          },
          {
            "internalType": "bool",
            "name": "completed",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "updatedAt",
            "type": "uint256"
          }
        ],
        "internalType": "struct OnchainTodo.Task[]",
        "name": "out",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTaskCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "toggleTask",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Update this with your contract address
const HARDHAT_CHAIN_ID = "0x7a69";

// Enhanced Task with metadata
const enhanceTask = (task) => ({
  ...task,
  priority: task.priority || 'medium',
  category: task.category || 'personal',
  dueDate: task.dueDate || null,
  notes: task.notes || '',
});

// Stats Component
// Enhanced Stats Component with Dynamic Calculations
const StatsDisplay = ({ tasks }) => {
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // ✨ DYNAMIC DAY STREAK CALCULATION
    const dayStreak = calculateDayStreak(tasks);
    
    return { total, completed, active, completionRate, dayStreak };
  }, [tasks]);

  return (
    <div className="stats-dashboard">
      <div className="stat-card">
        <div className="stat-icon">📋</div>
        <div className="stat-number">{stats.total}</div>
        <div className="stat-label">Total Tasks</div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">✅</div>
        <div className="stat-number">{stats.completed}</div>
        <div className="stat-label">Completed</div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">🔥</div>
        <div className="stat-number">{stats.dayStreak}</div>
        <div className="stat-label">Day Streak</div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">📊</div>
        <div className="stat-number">{stats.completionRate}%</div>
        <div className="stat-label">Completion Rate</div>
      </div>
    </div>
  );
};


// Enhanced Task Form Component
const TaskForm = ({ onSubmit, loading }) => {
  const [taskData, setTaskData] = useState({
    content: '',
    priority: 'medium',
    category: 'personal',
    dueDate: '',
    notes: ''
  });

  const handleSubmit = () => {
    if (taskData.content.trim()) {
      onSubmit(taskData);
      setTaskData({
        content: '',
        priority: 'medium',
        category: 'personal',
        dueDate: '',
        notes: ''
      });
    }
  };

  return (
    <div className="task-form-section">
      <h2 className="section-title">Add New Task</h2>
      <div className="task-form">
        <input
          type="text"
          placeholder="What needs to be done?"
          value={taskData.content}
          onChange={(e) => setTaskData({...taskData, content: e.target.value})}
          className="task-input-main"
          onKeyPress={(e) => e.key === 'Enter' && !loading && handleSubmit()}
        />
        
        <div className="task-form-row">
          <select 
            value={taskData.priority}
            onChange={(e) => setTaskData({...taskData, priority: e.target.value})}
            className="task-select"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>

          <select 
            value={taskData.category}
            onChange={(e) => setTaskData({...taskData, category: e.target.value})}
            className="task-select"
          >
            <option value="personal">Personal</option>
            <option value="work">Work</option>
            <option value="shopping">Shopping</option>
            <option value="learning">Learning</option>
            <option value="health">Health</option>
            <option value="finance">Finance</option>
          </select>

          <input
            type="date"
            value={taskData.dueDate}
            onChange={(e) => setTaskData({...taskData, dueDate: e.target.value})}
            className="task-select"
            placeholder="dd-mm-yyyy"
          />
        </div>

        <textarea
          placeholder="Additional notes (optional)"
          value={taskData.notes}
          onChange={(e) => setTaskData({...taskData, notes: e.target.value})}
          className="task-notes"
          rows="3"
        />

        <button 
          onClick={handleSubmit}
          disabled={loading || !taskData.content.trim()}
          className="add-task-btn"
        >
          {loading ? 'Adding...' : 'Add Task'}
        </button>
      </div>
    </div>
  );
};

// Enhanced Productivity Chart Component (Dynamic Data)
const ProductivityChart = ({ tasks }) => {
  const productivityStats = useMemo(() => calculateProductivityStats(tasks), [tasks]);
  const { weeklyData, mostProductiveHour, bestCategory } = productivityStats;
  
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxValue = Math.max(...weeklyData, 1); // Ensure at least 1 for scaling

  return (
    <div className="productivity-section">
      <h3 className="section-title">Productivity Insights</h3>
      <div className="chart-container">
        <div className="chart">
          {weeklyData.map((value, index) => (
            <div key={index} className="chart-bar">
              <div 
                className="chart-fill"
                style={{ 
                  height: `${(value / maxValue) * 100}%`,
                  backgroundColor: value > 0 ? '#14b8a6' : '#e5e7eb',
                  minHeight: value > 0 ? '10px' : '4px'
                }}
                title={`${days[index]}: ${value} tasks completed`}
              ></div>
              <span className="chart-label">{days[index]}</span>
            </div>
          ))}
        </div>
        <div className="chart-insights">
          <div className="insight-item">
            <span className="insight-label">Most Productive:</span>
            <span className="insight-value">{mostProductiveHour}</span>
          </div>
          <div className="insight-item">
            <span className="insight-label">Best Category:</span>
            <span className="insight-value">{bestCategory}</span>
          </div>
          <div className="insight-item">
            <span className="insight-label">This Week:</span>
            <span className="insight-value">{weeklyData.reduce((a, b) => a + b, 0)} completed</span>
          </div>
        </div>
      </div>
    </div>
  );
};



// Filter Bar Component
const FilterBar = ({ 
  filter, onFilterChange, 
  searchTerm, onSearchChange,
  sortBy, onSortByChange,
  taskCount 
}) => {
  const filterOptions = [
    { value: 'all', label: 'All', color: '#6b7280' },
    { value: 'active', label: 'Active', color: '#3b82f6' },
    { value: 'completed', label: 'Completed', color: '#10b981' },
    { value: 'high-priority', label: 'High Priority', color: '#ef4444' },
    { value: 'due-today', label: 'Due Today', color: '#f59e0b' },
    { value: 'overdue', label: 'Overdue', color: '#dc2626' }
  ];

  return (
    <div className="filter-section">
      <div className="search-container">
        <div className="search-input-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="filter-buttons">
        {filterOptions.map(option => (
          <button
            key={option.value}
            className={`filter-btn ${filter === option.value ? 'active' : ''}`}
            onClick={() => onFilterChange(option.value)}
            style={{
              backgroundColor: filter === option.value ? option.color : 'transparent',
              borderColor: option.color,
              color: filter === option.value ? 'white' : option.color
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="sort-container">
        <select 
          value={sortBy} 
          onChange={(e) => onSortByChange(e.target.value)}
          className="sort-select"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="priority">Priority</option>
          <option value="dueDate">Due Date</option>
          <option value="alphabetical">Alphabetical</option>
        </select>
      </div>
    </div>
  );
};
// 🔥 DYNAMIC DAY STREAK CALCULATOR
const calculateDayStreak = (tasks) => {
  if (!tasks.length) return 0;

  // Get completed tasks sorted by completion date (most recent first)
  const completedTasks = tasks
    .filter(task => task.completed)
    .map(task => ({
      ...task,
      completionDate: new Date(Number(task.updatedAt) * 1000)
    }))
    .sort((a, b) => b.completionDate - a.completionDate);

  if (!completedTasks.length) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); // Start of today

  // Check each day backwards from today
  for (let i = 0; i < 30; i++) { // Check last 30 days max
    const checkDate = new Date(currentDate);
    checkDate.setDate(currentDate.getDate() - i);
    
    const dayStart = new Date(checkDate);
    const dayEnd = new Date(checkDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Check if any task was completed on this day
    const tasksCompletedThisDay = completedTasks.filter(task => 
      task.completionDate >= dayStart && task.completionDate <= dayEnd
    );

    if (tasksCompletedThisDay.length > 0) {
      streak++;
    } else if (i > 0) {
      // Break streak if no tasks completed (but allow today to be empty if it's current day)
      break;
    }
  }

  return streak;
};

// 📊 PRODUCTIVITY ANALYTICS
const calculateProductivityStats = (tasks) => {
  if (!tasks.length) return {
    weeklyData: [0, 0, 0, 0, 0, 0, 0],
    mostProductiveHour: '10 AM',
    bestCategory: 'Work'
  };

  // Calculate weekly completion data (last 7 days)
  const weeklyData = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    
    const completedOnDay = tasks.filter(task => {
      if (!task.completed) return false;
      const completionDate = new Date(Number(task.updatedAt) * 1000);
      return completionDate >= date && completionDate < nextDay;
    }).length;
    
    weeklyData.push(completedOnDay);
  }

  // Calculate most productive hour (simplified)
  const completedTasks = tasks.filter(t => t.completed);
  const hourCounts = {};
  
  completedTasks.forEach(task => {
    const hour = new Date(Number(task.updatedAt) * 1000).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  let mostProductiveHour = '10 AM';
  let maxCount = 0;
  
  for (const [hour, count] of Object.entries(hourCounts)) {
    if (count > maxCount) {
      maxCount = count;
      const h = parseInt(hour);
      mostProductiveHour = h === 0 ? '12 AM' : 
                          h < 12 ? `${h} AM` : 
                          h === 12 ? '12 PM' : `${h - 12} PM`;
    }
  }

  // Calculate best category
  const categoryCounts = {};
  completedTasks.forEach(task => {
    const category = task.category || 'personal';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });
  
  let bestCategory = 'Work';
  let maxCategoryCount = 0;
  
  for (const [category, count] of Object.entries(categoryCounts)) {
    if (count > maxCategoryCount) {
      maxCategoryCount = count;
      bestCategory = category.charAt(0).toUpperCase() + category.slice(1);
    }
  }

  return {
    weeklyData,
    mostProductiveHour,
    bestCategory
  };
};

// Main App Component
function App() {
  // Your existing state variables
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [account, setAccount] = useState("");
  const [networkError, setNetworkError] = useState(false);
  const [contractError, setContractError] = useState("");

  // Enhanced state for new features
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedTasks, setSelectedTasks] = useState([]);

  // Your existing wallet connection functions (keep them as they are)
  const addHardhatNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: HARDHAT_CHAIN_ID,
          chainName: 'Hardhat Local',
          rpcUrls: ['http://127.0.0.1:8545/'],
          nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
          },
        }],
      });
      return true;
    } catch (addError) {
      console.error("Error adding Hardhat network:", addError);
      setStatusMessage("Failed to add Hardhat network to MetaMask");
      return false;
    }
  };

  const switchToHardhatNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: HARDHAT_CHAIN_ID }],
      });
      return true;
    } catch (switchError) {
      if (switchError.code === 4902) {
        return await addHardhatNetwork();
      }
      console.error("Error switching to Hardhat network:", switchError);
      return false;
    }
  };

  const checkNetwork = async () => {
    if (window.ethereum) {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const isCorrectNetwork = chainId === HARDHAT_CHAIN_ID;
        setNetworkError(!isCorrectNetwork);
        return isCorrectNetwork;
      } catch (error) {
        console.error("Error checking network:", error);
        setNetworkError(true);
        return false;
      }
    }
    return false;
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const isCorrectNetwork = await checkNetwork();
        if (!isCorrectNetwork) {
          const switched = await switchToHardhatNetwork();
          if (!switched) {
            setStatusMessage("Please connect to Hardhat Local Network in MetaMask");
            return;
          }
          window.location.reload();
          return;
        }
        
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        const newSigner = await newProvider.getSigner();
        setSigner(newSigner);
        const accounts = await newProvider.listAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0].address);
        }

        const todoContract = new ethers.Contract(CONTRACT_ADDRESS, OnchainTodoABI, newSigner);
        setContract(todoContract);

        try {
          const taskCount = await todoContract.getTaskCount();
          console.log("Contract connected successfully. Task count:", taskCount.toString());
          setContractError("");
          await loadTasks(todoContract);
          setStatusMessage("Wallet connected! Ready to use.");
        } catch (error) {
          console.error("Contract test call failed:", error);
          setContractError("Contract not found at address. Please deploy the contract first.");
          setStatusMessage("Contract not found. Please deploy the contract to localhost.");
        }

        window.ethereum.on('accountsChanged', (accounts) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            window.location.reload();
          } else {
            setAccount("");
            setSigner(null);
            setContract(null);
            setTasks([]);
            setStatusMessage("Please connect your wallet.");
          }
        });

        window.ethereum.on('chainChanged', (chainId) => {
          setNetworkError(chainId !== HARDHAT_CHAIN_ID);
          window.location.reload();
        });

      } catch (error) {
        console.error("Error connecting wallet:", error);
        if (error.code === 4001) {
          setStatusMessage("Please connect your wallet to continue.");
        } else {
          setStatusMessage("Failed to connect wallet. Please ensure MetaMask is unlocked.");
        }
      }
    } else {
      setStatusMessage(
        <span>
          MetaMask not found. Please install it to use this DApp.{" "}
          <a href="https://metamask.io/download.html" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
            Download MetaMask
          </a>
        </span>
      );
    }
  };
  const loadTasks = async (todoContract) => {
  if (!todoContract) return;
  setLoading(true);
  try {
    const taskCount = await todoContract.getTaskCount();
    console.log("📊 Task count from contract:", taskCount.toString());
    
    if (taskCount > 0) {
      const allTasks = await todoContract.getMyTasks(0, taskCount);
      console.log("📋 Raw tasks from contract:", allTasks);
      
      const enhancedTasks = allTasks.map((task, arrayIndex) => {
        const enhancedTask = enhanceTask({
          id: arrayIndex.toString(), // Use array index as ID instead of task.id
          content: task.content,
          completed: task.completed,
          createdAt: task.createdAt.toString(),
          updatedAt: task.updatedAt.toString(),
          originalId: task.id.toString() // Keep original ID for reference
        });
        
        console.log(`Task at index ${arrayIndex}:`, enhancedTask);
        return enhancedTask;
      });
      
      setTasks(enhancedTasks);
      setStatusMessage(`Loaded ${enhancedTasks.length} tasks`);
    } else {
      setTasks([]);
      setStatusMessage("No tasks found. Create your first task!");
    }
  } catch (err) {
    console.error("❌ Error loading tasks:", err);
    setStatusMessage(`Failed to load tasks: ${err.reason || err.message}`);
  } finally {
    setLoading(false);
  }
};


  const addTask = async (taskData) => {
  if (!taskData.content.trim() || !contract) {
    setStatusMessage("Task cannot be empty or wallet not connected.");
    return;
  }
  setLoading(true);
  try {
    const tx = await contract.createTask(taskData.content);
    setStatusMessage("⏳ Transaction sent. Waiting for confirmation...");
    await tx.wait();
    
    // Reload tasks immediately after successful creation
    await loadTasks(contract);
    setStatusMessage("✅ Task created successfully!");
  } catch (err) {
    console.error("❌ Error adding task:", err);
    setStatusMessage(`Failed to add task: ${err.reason || err.message}`);
  } finally {
    setLoading(false);
  }
};

  const toggleTask = async (id) => {
  if (!contract) return;
  setLoading(true);
  try {
    console.log("🔄 Toggling task with frontend ID:", id);
    
    // Optimistic update for immediate UI feedback
    const updatedTasks = tasks.map(task => 
      task.id === id 
        ? { ...task, completed: !task.completed, updatedAt: Date.now().toString() }
        : task
    );
    setTasks(updatedTasks);
    
    const arrayIndex = parseInt(id);
    console.log("📍 Using array index:", arrayIndex);
    
    const taskCount = await contract.getTaskCount();
    if (arrayIndex >= taskCount) {
      throw new Error(`Task index ${arrayIndex} is out of range. Only ${taskCount} tasks exist.`);
    }
    
    const tx = await contract.toggleTask(arrayIndex);
    setStatusMessage("🔄 Toggling task...");
    await tx.wait();
    
    // Reload tasks from blockchain to ensure consistency
    await loadTasks(contract);
    setStatusMessage("✅ Task toggled successfully!");
  } catch (err) {
    // Revert optimistic update on error
    await loadTasks(contract);
    console.error("❌ Error toggling task:", err);
    setStatusMessage(`Failed to toggle task: ${err.reason || err.message}`);
  } finally {
    setLoading(false);
  }
};

  const deleteTask = async (id) => {
  if (!contract) return;
  setLoading(true);
  try {
    console.log("🗑️ Deleting task with frontend ID:", id);
    
    // Use the frontend ID (which is the array index) directly
    const arrayIndex = parseInt(id);
    console.log("📍 Using array index:", arrayIndex);
    
    // Verify the task exists before attempting to delete
    const taskCount = await contract.getTaskCount();
    if (arrayIndex >= taskCount) {
      throw new Error(`Task index ${arrayIndex} is out of range. Only ${taskCount} tasks exist.`);
    }
    
    const tx = await contract.deleteTask(arrayIndex);
    setStatusMessage("🗑️ Deleting task...");
    await tx.wait();
    
    // Reload tasks immediately after successful deletion
    await loadTasks(contract);
    setStatusMessage("✅ Task deleted successfully!");
  } catch (err) {
    console.error("❌ Error deleting task:", err);
    setStatusMessage(`Failed to delete task: ${err.reason || err.message}`);
  } finally {
    setLoading(false);
  }
};
const forceRefreshTasks = async () => {
  if (!contract) return;
  console.log("🔄 Force refreshing tasks...");
  await loadTasks(contract);
};

  // Bulk operations
  const bulkComplete = async () => {
    for (const taskId of selectedTasks) {
      await toggleTask(taskId);
    }
    setSelectedTasks([]);
  };

  const bulkDelete = async () => {
    for (const taskId of selectedTasks) {
      await deleteTask(taskId);
    }
    setSelectedTasks([]);
  };

  // Enhanced filtering and sorting
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks];

    // Apply filters
    switch (filter) {
      case 'active':
        filtered = filtered.filter(task => !task.completed);
        break;
      case 'completed':
        filtered = filtered.filter(task => task.completed);
        break;
      case 'high-priority':
        filtered = filtered.filter(task => task.priority === 'high');
        break;
      case 'due-today':
        const today = new Date().toDateString();
        filtered = filtered.filter(task => 
          task.dueDate && new Date(task.dueDate).toDateString() === today
        );
        break;
      case 'overdue':
        const now = new Date();
        filtered = filtered.filter(task => 
          task.dueDate && new Date(task.dueDate) < now && !task.completed
        );
        break;
    }

    // Apply search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(task =>
        task.content.toLowerCase().includes(term) ||
        (task.notes && task.notes.toLowerCase().includes(term)) ||
        task.category.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return parseInt(a.createdAt) - parseInt(b.createdAt);
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        case 'alphabetical':
          return a.content.localeCompare(b.content);
        default: // newest
          return parseInt(b.createdAt) - parseInt(a.createdAt);
      }
    });

    return filtered;
  }, [tasks, filter, searchTerm, sortBy]);

  useEffect(() => {
    if (window.ethereum) {
      connectWallet();
    } else {
      setStatusMessage(
        <span>
          MetaMask not found. Please install it to use this DApp.{" "}
          <a href="https://metamask.io/download.html" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
            Download MetaMask
          </a>
        </span>
      );
    }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <div className="app-logo">🧱</div>
            <h1 className="app-title">Blockchain Todo</h1>
            {account && (
              <div className="wallet-info">
                <span className="wallet-indicator">●</span>
                <span className="wallet-address">
                  {account.substring(0, 6)}...{account.substring(account.length - 4)}
                </span>
              </div>
            )}
          </div>
          <div className="header-right">
            <span className="network-badge">Hardhat Local</span>
          </div>
        </div>
      </header>

      <main className="main-content">
        {!signer ? (
          <div className="connect-wallet-section">
            <div className="connect-card">
              <h2>Connect Your Wallet</h2>
              <p>Connect to MetaMask to start managing your blockchain tasks</p>
              <button onClick={connectWallet} className="connect-btn">
                Connect Wallet
              </button>
              {statusMessage && <p className="status-message">{statusMessage}</p>}
            </div>
          </div>
        ) : (
          <div className="dashboard">
            <StatsDisplay tasks={tasks} />
            
            <div className="main-grid">
              <div className="left-column">
                <TaskForm onSubmit={addTask} loading={loading} />
              </div>
              
              <div className="right-column">
                <ProductivityChart tasks={tasks} />
              </div>

            </div>

            <FilterBar
              filter={filter}
              onFilterChange={setFilter}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              taskCount={filteredAndSortedTasks.length}
            />

            <div className="tasks-section">
              <div className="tasks-header">
                <h2 className="section-title">Your Tasks</h2>
                <div className="tasks-header">
                  <h2 className="section-title">Your Tasks</h2>
                  <div className="header-actions">
                    <button onClick={forceRefreshTasks} className="refresh-btn" disabled={loading}>
                      🔄 Refresh
                    </button>
                    {selectedTasks.length > 0 && (
                      <div className="bulk-actions">
                        <button onClick={bulkComplete} className="bulk-btn complete-btn">
                          Complete Selected
                        </button>
                        <button onClick={bulkDelete} className="bulk-btn delete-btn">
                          Delete Selected
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {selectedTasks.length > 0 && (
                  <div className="bulk-actions">
                    <button onClick={bulkComplete} className="bulk-btn complete-btn">
                      Complete Selected
                    </button>
                    <button onClick={bulkDelete} className="bulk-btn delete-btn">
                      Delete Selected
                    </button>
                  </div>
                )}
              </div>

              {loading && filteredAndSortedTasks.length === 0 ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <span>Loading tasks...</span>
                </div>
              ) : filteredAndSortedTasks.length > 0 ? (
                <div className="tasks-list">
                  {filteredAndSortedTasks.map((task) => (
                    <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                      <div className="task-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedTasks.includes(task.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTasks([...selectedTasks, task.id]);
                            } else {
                              setSelectedTasks(selectedTasks.filter(id => id !== task.id));
                            }
                          }}
                        />
                      </div>
                      
                      <div className="task-content">
                        <div className="task-header">
                          <h3 className="task-title">{task.content}</h3>
                          <div className="task-meta">
                            <span className={`priority-badge ${task.priority}`}>
                              {task.priority}
                            </span>
                            <span className="category-badge">
                              {task.category}
                            </span>
                            {task.dueDate && (
                              <span className="due-date-badge">
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {task.notes && (
                          <p className="task-notes">{task.notes}</p>
                        )}
                        
                        <div className="task-footer">
                          <small className="task-date">
                            Created: {new Date(Number(task.createdAt) * 1000).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                      
                      <div className="task-actions">
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={`action-btn ${task.completed ? 'undo-btn' : 'complete-btn'}`}
                          disabled={loading}
                        >
                          {task.completed ? '↶' : '✓'}
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="action-btn delete-btn"
                          disabled={loading}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <h3>No tasks found</h3>
                  <p>
                    {searchTerm || filter !== 'all' 
                      ? "Try adjusting your filters or search terms"
                      : "Create your first task to get started!"
                    }
                  </p>
                </div>
              )}
            </div>

            {statusMessage && (
              <div className="status-bar">
                <span>{statusMessage}</span>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
