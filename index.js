// Import helper functions from utils
import { getTasks, createNewTask, patchTask, putTask, deleteTask } from './utils/taskFunctions.js';
// Import initial data for tasks
import { initialData } from './initialData.js';

/*************************************************
* FIX BUGS!!!
* ************************************************/

// Function to initialize data in local storage
function initializeData() {
  // Check if tasks are already stored in local storage
  if (!localStorage.getItem("tasks")) {
      // If not, set initial data and show sidebar
      localStorage.setItem("tasks", JSON.stringify(initialData));
      localStorage.setItem("showSideBar", "true");
  } else {
      // Log a message if data already exists
      console.log("Data already exists in localStorage");
  }
}

// Get elements from the DOM and store them in an object for easy access
const elements = {
  editSelectStatus: document.getElementById("edit-select-status"),
  filterDiv: document.getElementById("filterDiv"),
  deleteTaskBtn: document.getElementById("delete-task-btn"),
  hideSideBarBtn: document.getElementById("hide-side-bar-btn"),
  showSideBarBtn: document.getElementById("show-side-bar-btn"),
  themeSwitch: document.getElementById("switch"),
  addNewTaskBtn: document.getElementById("add-new-task-btn"),
  sideBar: document.getElementById("side-bar-div"),
  logo: document.getElementById("logo"),
  headerBoardName: document.getElementById("header-board-name"),
  editBoardBtn: document.getElementById("edit-board-btn"),
  editBoardDiv: document.getElementById("editBoardDiv"),
  columnDivs: document.querySelectorAll(".column-div"),
  modalWindow: document.getElementById("new-task-modal-window"),
  titleInput: document.getElementById("title-input"),
  descInput: document.getElementById("desc-input"),
  statusInput: document.getElementById("select-status"),
 saveTaskChangesBtn: document.getElementById("save-task-changes-btn"),
  createTaskBtn: document.getElementById("create-task-btn"),
  cancelAddTaskBtn: document.getElementById("cancel-add-task-btn"),
  editTaskTitleInput: document.getElementById("edit-task-title-input"),
  editTaskDescInput: document.getElementById("edit-task-desc-input"),
  editTaskModal: document.getElementsByClassName("edit-task-modal-window")[0],
  
};

let activeBoard = ""; // Variable to hold the currently active board
let currentTaskId = null; // To store the ID of the task being edited or deleted

// Extract unique board names from tasks and display them
function fetchAndDisplayBoardsAndTasks() {
  const tasks = getTasks(); // Fetch tasks from storage
  const boards = [...new Set(tasks.map(task => task.board).filter(Boolean))]; // Get unique boards
  displayBoards(boards); // Display boards in the UI
  if (boards.length > 0) {
      const localStorageBoard = JSON.parse(localStorage.getItem("activeBoard")); // Get active board from storage
      activeBoard = localStorageBoard || boards[0]; // Set active board to the first one if none stored
      elements.headerBoardName.textContent = activeBoard; // Update header with active board name
      styleActiveBoard(activeBoard); // Style the active board
      refreshTasksUI(); // Refresh the task display
  }
}

// Creates different boards in the DOM
function displayBoards(boards) {
  const boardsContainer = document.getElementById("boards-nav-links-div");
  boardsContainer.innerHTML = ""; // Clears the container for fresh display
  boards.forEach(board => {
      const boardElement = document.createElement("button"); // Create button for each board
      boardElement.textContent = board; // Set button text
      boardElement.classList.add("board-btn"); // Add CSS class for styling
      boardElement.addEventListener("click", () => { // Click event to switch boards
          elements.headerBoardName.textContent = board; // Update header with selected board
          filterAndDisplayTasksByBoard(board); // Filter tasks by selected board
          activeBoard = board; // Assign the new active board
          localStorage.setItem("activeBoard", JSON.stringify(activeBoard)); // Store active board in local storage
          styleActiveBoard(activeBoard); // Style the newly active board
      });
      boardsContainer.appendChild(boardElement); // Append the board button to the container
  });
}

// Filters tasks corresponding to the board name and displays them on the DOM
function filterAndDisplayTasksByBoard(boardName) {
  const tasks = getTasks(); // Fetch tasks from local storage
  const filteredTasks = tasks.filter(task => task.board === boardName); // Filter tasks by board name

  // Loop through each column and populate tasks
  elements.columnDivs.forEach(column => {
      const status = column.getAttribute("data-status"); // Get status of the column
      column.innerHTML = `<div class="column-head-div">
                          <span class="dot" id="${status}-dot"></span>
                          <h4 class="columnHeader">${status.toUpperCase()}</h4>
                        </div>`; 

      const tasksContainer = document.createElement("div"); // Create a container for tasks
      column.appendChild(tasksContainer); // Append tasks container to column

      // Filter tasks by status and populate the column
      filteredTasks.filter(task => task.status === status).forEach(task => {
          const taskElement = document.createElement("div"); // Create a task element
          taskElement.classList.add("task-div"); 
          taskElement.textContent = task.title; // Set task title
          taskElement.setAttribute("data-task-id", task.id); // Store task ID in attribute

          // Listen for a click event on each task and open a modal for editing
          taskElement.addEventListener("click", () => {
              openEditTaskModal(task); // Open edit modal with task details
          });

          tasksContainer.appendChild(taskElement); // Append task element to tasks container
      });
  });
}

// Refresh the displayed tasks UI
function refreshTasksUI() {
  filterAndDisplayTasksByBoard(activeBoard); // Refresh tasks based on the active board
}

// Styles the active board by adding an active class
function styleActiveBoard(boardName) {
  document.querySelectorAll('.board-btn').forEach(btn => {
      // Add or remove the active class based on the current board
      if (btn.textContent === boardName) {
          btn.classList.add('active');
      } else {
          btn.classList.remove('active');
      }
  });
}

// Adds a task to the UI
function addTaskToUI(task) {
  const column = document.querySelector(`.column-div[data-status="${task.status}"]`); // Find the column by status
  if (!column) {
      console.error(`Column not found for status: ${task.status}`); // Log an error if the column is missing
      return; // Exit the function
  }

  // Check for existing tasks container and create if it doesn't exist
  let tasksContainer = column.querySelector('.tasks-container');
  if (!tasksContainer) {
      console.warn(`Tasks container not found for status: ${task.status}, creating one.`); // Log a warning
      tasksContainer = document.createElement('div'); // Create a new tasks container
      tasksContainer.className = 'tasks-container'; // Set class for styling
      column.appendChild(tasksContainer); // Append to column
  }

  // Create and append the new task element
  const taskElement = document.createElement('div');
  taskElement.className = 'task-div'; // Set class for styling
  taskElement.textContent = task.title; // Set task title
  taskElement.setAttribute('data-task-id', task.id); // Store task ID

  tasksContainer.appendChild(taskElement); // Append task element to tasks container
}

// Sets up event listeners for various elements
function setupEventListeners() {
  const cancelEditBtn = document.getElementById('cancel-edit-btn'); // Get cancel edit button
  cancelEditBtn.addEventListener("click", () => toggleModal(false, elements.editTaskModal)); // Listener to close edit modal

  const cancelAddTaskBtn = elements.cancelAddTaskBtn; // Get cancel add task button
  cancelAddTaskBtn.addEventListener("click", () => {
      toggleModal(false); // Close the add task modal
      elements.filterDiv.style.display = "none"; // Hide the filter overlay
  });

  // Hide modal when filter overlay is clicked
  elements.filterDiv.addEventListener('click', () => {
      toggleModal(false);
      elements.filterDiv.style.display = 'none'; // Hide the filter overlay
  });

  // Set up sidebar toggle buttons
  elements.hideSideBarBtn.addEventListener("click", () => toggleSidebar(false)); // Hide sidebar
  elements.showSideBarBtn.addEventListener("click", () => toggleSidebar(true)); // Show sidebar

  // Set up theme switch listener
  elements.themeSwitch.addEventListener('change', toggleTheme);

  // Show modal for adding a new task
  elements.addNewTaskBtn.addEventListener('click', () => {
      toggleModal(true); // Show add task modal
      elements.filterDiv.style.display = 'block'; // Show the filter overlay
  });

  // Add task on form submission
  elements.modalWindow.addEventListener('submit', (event) => {
      addTask(event); // Call addTask function on form submit
  });

  // Save task changes listener
  elements.saveTaskChangesBtn.addEventListener('click', () => {
      if (currentTaskId) {
          saveTaskChanges(currentTaskId); // Pass the current task ID to save changes
      }
  });

  // Attach delete task listener
  elements.deleteTaskBtn.addEventListener('click', () => {
      if (currentTaskId) {
          deleteTask(currentTaskId); // Delete the current task
          refreshTasksUI(); // Refresh the UI to reflect changes
          toggleModal(false, elements.editTaskModal); // Close the edit modal
      }
  });
}

// Toggles tasks modal visibility
function toggleModal(show, modal = elements.modalWindow) {
  if (show) {
      modal.style.display = 'block'; // Show the modal
  } else {
      modal.style.display = 'none'; // Hide the modal
  }
}

/*************************************************
* COMPLETE FUNCTION CODE
* ************************************************/ 

// Function to add a new task
function addTask(event) {
  event.preventDefault(); // Prevent default form submission behavior

  // Create a task object with input values
  const task = {
      title: elements.titleInput.value,
      description: elements.descInput.value,
      status: elements.statusInput.value,
      board: activeBoard, // Assign current active board
  };

  const newTask = createNewTask(task); // Create a new task using the helper function
  if (newTask) {
      addTaskToUI(newTask); // Add the new task to the UI
      toggleModal(false, elements.modalWindow); // Close the modal
      elements.filterDiv.style.display = 'none'; // Hide the filter overlay
      event.target.reset(); // Reset the form inputs
      refreshTasksUI(); // Refresh the task display
  }
}

// Function to toggle the sidebar visibility
function toggleSidebar(show) {
  if (show) {
      elements.showSideBarBtn.style.display = 'none'; // Hide the show button
      elements.sideBar.style.display = 'block'; // Show the sidebar
      elements.hideSideBarBtn.style.display = 'block'; // Show the hide button
  } else {
      elements.showSideBarBtn.style.display = 'block'; // Show the show button
      elements.sideBar.style.display = 'none'; // Hide the sidebar
      elements.hideSideBarBtn.style.display = 'none'; // Hide the hide button
  }
}


// Function to switch the theme
function toggleTheme(event) {
  const isLightTheme = document.body.classList.toggle("light-theme"); // Toggle light theme class
  elements.themeSwitch.checked = isLightTheme ? true : false; // Update switch state

  // Switch logo image based on current theme
  elements.logo.src = elements.logo.src.includes("dark") 
      ? elements.logo.src.replace("dark", "light") 
      : elements.logo.src.replace("light", "dark");
}

// Opens the edit task modal and sets its values
function openEditTaskModal(task) {
  elements.editTaskTitleInput.value = task.title; // Set title input value
  elements.editTaskDescInput.value = task.description; // Set description input value
  elements.editSelectStatus.value = task.status; // Set status dropdown value

  currentTaskId = task.id; // Store the task ID for saving changes or deleting
  toggleModal(true, elements.editTaskModal); // Show the edit task modal
}

// Saves changes to a task
function saveTaskChanges(taskId) {
  if (!taskId) return; // If there's no task ID, do nothing

  // Create an updated task object
  const updatedTask = {
      id: taskId, // Preserve existing task ID
      title: elements.editTaskTitleInput.value, // Get updated title
      description: elements.editTaskDescInput.value, // Get updated description
      status: elements.editSelectStatus.value, // Get updated status
      board: activeBoard, // Keep the active board
  };

  putTask(taskId, updatedTask); // Update task using the helper function
  toggleModal(false, elements.editTaskModal); // Close the edit modal
  refreshTasksUI(); // Refresh the UI to reflect the changes
}

// Initialization process
document.addEventListener('DOMContentLoaded', function() {
  init(); // Call init function when the DOM is fully loaded
});

// Execute the initialization function
function init() {
  initializeData(); // Initialize data in local storage
  setupEventListeners(); // Set up event listeners for UI elements
  const showSidebar = localStorage.getItem('showSideBar') === 'true'; // Check sidebar visibility state
  toggleSidebar(showSidebar); // Toggle sidebar based on stored state
  const isLightTheme = localStorage.getItem('light-theme') === 'enabled'; // Check for light theme preference
  document.body.classList.toggle('light-theme', isLightTheme); // Apply the light theme if preferred
  fetchAndDisplayBoardsAndTasks(); // Initial display of boards and tasks
}
