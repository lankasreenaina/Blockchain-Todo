// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract OnchainTodo {
    struct Task {
        uint256 id;
        string content;
        bool completed;
        uint256 createdAt;
        uint256 updatedAt;
    }

    mapping(address => Task[]) private _tasks;
    mapping(address => uint256) private _taskCount;

    event TaskCreated(address indexed user, uint256 id, string content, uint256 timestamp);
    event TaskUpdated(address indexed user, uint256 id, bool completed, uint256 timestamp);
    event TaskDeleted(address indexed user, uint256 id, uint256 timestamp);

    /// @notice Create a new task
    function createTask(string calldata content) external {
        require(bytes(content).length > 0, "Task content cannot be empty");

        uint256 id = _taskCount[msg.sender];
        _taskCount[msg.sender]++;

        _tasks[msg.sender].push(
            Task(id, content, false, block.timestamp, block.timestamp)
        );

        emit TaskCreated(msg.sender, id, content, block.timestamp);
    }

    /// @notice Update task completion status
    function toggleTask(uint256 id) external {
        Task[] storage arr = _tasks[msg.sender];
        require(id < arr.length, "Task does not exist");

        Task storage task = arr[id];
        task.completed = !task.completed;
        task.updatedAt = block.timestamp;

        emit TaskUpdated(msg.sender, id, task.completed, block.timestamp);
    }

    /// @notice Delete a task (swap-and-pop)
    function deleteTask(uint256 id) external {
        Task[] storage arr = _tasks[msg.sender];
        require(id < arr.length, "Task does not exist");

        uint256 lastIndex = arr.length - 1;
        if (id != lastIndex) {
            arr[id] = arr[lastIndex];
            arr[id].id = id; // fix index after swap
        }
        arr.pop();

        emit TaskDeleted(msg.sender, id, block.timestamp);
    }

    /// @notice Get all tasks of the caller
    function getMyTasks() external view returns (Task[] memory) {
        return _tasks[msg.sender];
    }

    /// @notice Get tasks with pagination
    function getMyTasks(uint256 offset, uint256 limit) external view returns (Task[] memory out) {
        Task[] storage arr = _tasks[msg.sender];
        uint256 len = arr.length;
        if (offset >= len){
            return new Task[](0); 
        } 
        uint256 end = offset + limit;
        if (end > len) end = len;
        uint256 n = end - offset;
        out = new Task[](n);
        for (uint256 i = 0; i < n; i++) {
            out[i] = arr[offset + i];
        }
        return out;
    }

    /// @notice Get total task count for caller
    function getTaskCount() external view returns (uint256) {
        return _tasks[msg.sender].length;
    }
}
