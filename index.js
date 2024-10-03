// TASK: import helper functions from utils
import { getTasks, createNewTask, patchTask, putTask, deleteTask } from './utils/taskFunctions.js';
// TASK: import initialData
import { initialData } from './initialData.js';

/*************************************************************************************************************************************************
 * FIX BUGS!!!
 **********************************************************************************************************************************************/

// Function checks if local storage already has data, if not it loads initialData to localStorage
function initializeData() {
  if (!localStorage.getItem('tasks')) {
    localStorage.setItem('tasks', JSON.stringify(initialData)); 
    localStorage.setItem('showSideBar', 'true');
  } else {
    console.log('Data already exists in localStorage');
  }
}

// TASK: Get elements from the DOM
const elements = {
  sidebar: document.getElementById('side-bar-div'),
  showSideBarBtn: document.getElementById('show-side-bar-btn'),
  hideSideBarBtn: document.getElementById('hide-side-bar-btn'),
  themeSwitch: document.getElementById('switch'),
  createNewTaskBtn: document.getElementById('add-new-task-btn'),
  modalWindow: document.getElementById('new-task-modal-window'),
  editTaskModal: document.querySelector('.edit-task-modal-window'),
  filterDiv: document.getElementById('filterDiv'),
  headerBoardName: document.getElementById('header-board-name'),
  columnDivs: document.querySelectorAll('.column-div')
};


let activeBoard = "";


// Extracts unique board names from tasks
// TASK: FIX BUGS
function fetchAndDisplayBoardsAndTasks() {
  const tasks = getTasks();
  const boards = [...new Set(tasks.map(task => task.board).filter(Boolean))];
  displayBoards(boards);
  if (boards.length > 0) {
    const localStorageBoard = JSON.parse(localStorage.getItem("activeBoard"));
    activeBoard = localStorageBoard ? localStorageBoard : boards[0];
    elements.headerBoardName.textContent = activeBoard;
    styleActiveBoard(activeBoard);
    refreshTasksUI();
  }
}

// Creates different boards in the DOM
// TASK: Fix Bugs
function displayBoards(boards) {
  const boardsContainer = document.getElementById("boards-nav-links-div");
  boardsContainer.innerHTML = ''; // Clears the container
  boards.forEach(board => {
    const boardElement = document.createElement("button");
    boardElement.textContent = board;
    boardElement.classList.add("board-btn");
    boardElement.addEventListener('click', () => { 
      elements.headerBoardName.textContent = board;
      filterAndDisplayTasksByBoard(board);
      activeBoard = board; // assigns active board
      localStorage.setItem("activeBoard", JSON.stringify(activeBoard));
      styleActiveBoard(activeBoard);
    });
    boardsContainer.appendChild(boardElement);
  });
}

// Filters tasks corresponding to the board name and displays them on the DOM.
// TASK: Fix Bugs
function filterAndDisplayTasksByBoard(boardName) {
  const tasks = getTasks(); // Fetch tasks from a simulated local storage function
  const filteredTasks = tasks.filter(task => task.board === boardName);

  // Ensure the column titles are set outside of this function or correctly initialized before this function runs

  elements.columnDivs.forEach(column => {
    const status = column.getAttribute("data-status");
    // Reset column content while preserving the column title
    column.innerHTML = `<div class="column-head-div">
                          <span class="dot" id="${status}-dot"></span>
                          <h4 class="columnHeader">${status.toUpperCase()}</h4>
                        </div>`;

    const tasksContainer = document.createElement("div");
    tasksContainer.classList.add('tasks-container');
    column.appendChild(tasksContainer);

    filteredTasks.filter(task => task.status === status).forEach(task => { 
      const taskElement = document.createElement("div");
      taskElement.classList.add("task-div");
      taskElement.textContent = task.title;
      taskElement.setAttribute('data-task-id', task.id);

      // Listen for a click event on each task and open a modal
      taskElement.addEventListener('click', () => { 
        openEditTaskModal(task);
      });

      tasksContainer.appendChild(taskElement);
    });
  });
}

function refreshTasksUI() {
  filterAndDisplayTasksByBoard(activeBoard);
}

// Styles the active board by adding an active class
// TASK: Fix Bugs
function styleActiveBoard(boardName) {
  document.querySelectorAll('.board-btn').forEach(btn => { 
    if(btn.textContent === boardName) {
      btn.classList.add('active');
    }
    else {
      btn.classList.remove('active'); 
    }
  });
}

function addTaskToUI(task) {
  const column = document.querySelector(`.column-div[data-status="${task.status}"]`); 
  if (!column) {
    console.error(`Column not found for status: ${task.status}`);
    return;
  }

  let tasksContainer = column.querySelector('.tasks-container');
  if (!tasksContainer) {
    console.warn(`Tasks container not found for status: ${task.status}, creating one.`);
    tasksContainer = document.createElement('div');
    tasksContainer.className = 'tasks-container';
    column.appendChild(tasksContainer);
  }

  const taskElement = document.createElement('div');
  taskElement.className = 'task-div';
  taskElement.textContent = task.title; // Modify as needed
  taskElement.setAttribute('data-task-id', task.id);
  
  taskElement.addEventListener('click', () => { 
    openEditTaskModal(task);
  });

  tasksContainer.appendChild(taskElement); 
}

function setupEventListeners() {
  // Cancel editing task event listener
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  cancelEditBtn.addEventListener('click', () => toggleModal(false, elements.editTaskModal));

  // Cancel adding new task event listener
  const cancelAddTaskBtn = document.getElementById('cancel-add-task-btn');
  cancelAddTaskBtn.addEventListener('click', () => {
    toggleModal(false);
    elements.filterDiv.style.display = 'none'; // Also hide the filter overlay
  });


  // Clicking outside the modal to close it
  elements.filterDiv.addEventListener('click', () => {
    toggleModal(false);
    elements.filterDiv.style.display = 'none'; // Also hide the filter overlay
  });

  // Show sidebar event listener
  elements.hideSideBarBtn.addEventListener('click', () => toggleSidebar(false));
  elements.showSideBarBtn.addEventListener('click', () => toggleSidebar(true));

  // Theme switch event listener
  elements.themeSwitch.addEventListener('change', toggleTheme);

  // Show Add New Task Modal event listener
  elements.createNewTaskBtn.addEventListener('click', () => {
    toggleModal(true);
    elements.filterDiv.style.display = 'block'; // Also show the filter overlay
  });

  // Add new task form submission event listener
  elements.modalWindow.addEventListener('submit',  (event) => {
    addTask(event);
  });
}

// Toggles tasks modal
// Task: Fix bugs
function toggleModal(show, modal = elements.modalWindow) {
  modal.style.display = show ? 'block' : 'none'; 
}

// ************************************************************************************************************************************************
// COMPLETE FUNCTION CODE
// **********************************************************************************************************************************************

function addTask(event) {
  event.preventDefault(); 

  // Assign user input to the task object
  const titleInput = document.getElementById('title-input');
  const descInput = document.getElementById('desc-input');
  const statusSelect = document.getElementById('select-status');

  const task = {
    title: titleInput.value.trim(),
    description: descInput.value.trim(),
    status: statusSelect.value,
    board: activeBoard
  };

  if (!task.title || !task.description) {
    alert('Please fill in all fields.');
    return;
  }

  const newTask = createNewTask(task);
  if (newTask) {
    addTaskToUI(newTask);
    toggleModal(false);
    elements.filterDiv.style.display = 'none'; // Also hide the filter overlay
    event.target.reset();
    refreshTasksUI();
  }
}

function toggleSidebar(show) {
  if (show) {
    elements.sidebar.classList.add('show-sidebar');
    localStorage.setItem('showSideBar', 'true');
    elements.showSideBarBtn.style.display = 'none';
    elements.hideSideBarBtn.style.display = 'block';
  } else {
    elements.sidebar.classList.remove('show-sidebar');
    localStorage.setItem('showSideBar', 'false');
    elements.showSideBarBtn.style.display = 'block';
    elements.hideSideBarBtn.style.display = 'none';
  }
}

function toggleTheme() {
  const isLightTheme = elements.themeSwitch.checked;
  document.body.classList.toggle('light-theme', isLightTheme);
  localStorage.setItem('light-theme', isLightTheme ? 'enabled' : 'disabled');
  
  // Toggle logo visibility
  const logoDark = document.getElementById('logo');
  const logoLight = document.getElementById('logo-light');
  
  if (isLightTheme) {
    logoDark.style.display = 'none';
    logoLight.style.display = 'block';
  } else {
    logoDark.style.display = 'block';
    logoLight.style.display = 'none';
  }
}

function openEditTaskModal(task) {
  // Set task details in modal inputs
  const editModal = elements.editTaskModal;
  const editTaskForm = editModal.querySelector('#edit-task-form');
  const titleInput = editTaskForm.querySelector('#edit-task-title-input');
  const descInput = editTaskForm.querySelector('#edit-task-desc-input');
  const statusSelect = editTaskForm.querySelector('#edit-select-status');

  titleInput.value = task.title;
  descInput.value = task.description;
  statusSelect.value = task.status;

  // Store task ID in the form for later reference
  editTaskForm.setAttribute('data-task-id', task.id);

  // Call saveTaskChanges upon click of Save Changes button
  const saveTaskChangesBtn = editTaskForm.querySelector('#save-task-changes-btn');
  saveTaskChangesBtn.onclick = () => {
    saveTaskChanges(task.id);
  };

  // Delete task using a helper function and close the task modal
  const deleteTaskBtn = editTaskForm.querySelector('#delete-task-btn');
  deleteTaskBtn.onclick = () => {
    const confirmed = confirm('Are you sure you want to delete this task?');
    if (confirmed) {
      deleteTask(task.id);
      refreshTasksUI();
      toggleModal(false, editModal);
    }
  };

  // Cancel edit
  const cancelEditBtn = editTaskForm.querySelector('#cancel-edit-btn');
  cancelEditBtn.onclick = () => {
    toggleModal(false, editModal);
  };

  toggleModal(true, editModal); // Show the edit task modal
}

function saveTaskChanges(taskId) {
  const editTaskForm = elements.editTaskModal.querySelector('#edit-task-form');
  const titleInput = editTaskForm.querySelector('#edit-task-title-input');
  const descInput = editTaskForm.querySelector('#edit-task-desc-input');
  const statusSelect = editTaskForm.querySelector('#edit-select-status');

  const updatedTask = {
    title: titleInput.value.trim(),
    description: descInput.value.trim(),
    status: statusSelect.value,
    board: activeBoard
  };

  if (!updatedTask.title || !updatedTask.description) {
    alert('Please fill in all fields.');
    return;
  }

  patchTask(taskId, updatedTask);
  refreshTasksUI();
  toggleModal(false, elements.editTaskModal);
}

/*************************************************************************************************************************************************
 * COMPLETE FUNCTION CODE
 **********************************************************************************************************************************************/

document.addEventListener('DOMContentLoaded', function() {
  initializeData();
  init(); // init is called after the DOM is fully loaded
});


function init() {
  setupEventListeners();
  const showSidebar = localStorage.getItem('showSideBar') === 'true';
  toggleSidebar(showSidebar);
  const isLightTheme = localStorage.getItem('light-theme') === 'enabled';
  document.body.classList.toggle('light-theme', isLightTheme);
  elements.themeSwitch.checked = isLightTheme;

  const logoDark = document.getElementById('logo');
  const logoLight = document.getElementById('logo-light');

   if (!logoDark || !logoLight) {
    console.error('Logo elements not found during initialization');
    return;
  }
  
  if (isLightTheme) {
    logoDark.style.display = 'none';
    logoLight.style.display = 'block';
    console.log('Initialized with light theme');
  } else {
    logoDark.style.display = 'block';
    logoLight.style.display = 'none';
    console.log('Initialized with dark theme');
  }

  fetchAndDisplayBoardsAndTasks(); // Initial display of boards and tasks
}