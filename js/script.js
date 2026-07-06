

document.addEventListener('DOMContentLoaded', () => {

  initNavToggle();
  setActiveNavLink();

  /* Only run planner code if we're on the planner page */
  if (document.getElementById('task-list')) {
    initPlanner();
  }

  /* Only run form code if we're on the contact page */
  if (document.getElementById('contact-form')) {
    initContactForm();
  }

});


/* 2. NAVIGATION — Mobile hamburger menu
   On mobile the nav links are hidden. A hamburger button
   toggles them open and closed by adding/removing a class.*/

function initNavToggle() {

  /* querySelector finds an element by CSS selector */
  const toggle = document.querySelector('.nav-toggle');
  const navUl  = document.querySelector('nav ul');

  /* Guard: if either element doesn't exist, stop here */
  if (!toggle || !navUl) return;

  toggle.addEventListener('click', () => {

    /* classList.toggle adds the class if absent, removes if present */
    navUl.classList.toggle('open');

    /* Flip the aria-expanded value for accessibility */
    const isOpen = navUl.classList.contains('open');
    toggle.setAttribute('aria-expanded', isOpen);

  });

  /* Close the menu if the user clicks a nav link */
  navUl.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navUl.classList.remove('open');
    });
  });

}


/* 3. ACTIVE NAV LINK*/

function setActiveNavLink() {

  /* window.location.pathname returns something like "/about.html" */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('nav a').forEach(link => {
    const linkPage = link.getAttribute('href');
    if (linkPage === currentPage) {
      link.classList.add('active');
    }
  });

}


/* 4. ACADEMIC PLANNER */

function initPlanner() {

  /* --- Find the HTML elements we need --- */
  const input       = document.getElementById('task-input');
  const addBtn      = document.getElementById('add-btn');
  const taskList    = document.getElementById('task-list');
  const taskCounter = document.getElementById('task-counter');
  const filterBtns  = document.querySelectorAll('.filter-btn');

  /* --- Load saved tasks from localStorage, or start empty --- */
  /* JSON.parse converts the saved string back into a real array */
  let tasks = JSON.parse(localStorage.getItem('planner-tasks')) || [];
  let currentFilter = 'all';


  /* --- SAVE to localStorage ---
     Every time tasks change, call this to persist the data */
  function saveTasks() {
    /* JSON.stringify converts the array to a string for storage */
    localStorage.setItem('planner-tasks', JSON.stringify(tasks));
  }


  /* --- RENDER: builds the task list HTML from the tasks array ---
     This function is called every time anything changes.
     It clears the list and rebuilds it cleanly from scratch. */
  function renderTasks() {

    /* Filter the tasks based on the current filter selection */
    const filtered = tasks.filter(task => {
      if (currentFilter === 'completed') return task.completed;
      if (currentFilter === 'pending')   return !task.completed;
      return true;  /* 'all' — show everything */
    });

    /* Clear the current list */
    taskList.innerHTML = '';

    /* If no tasks match the filter, show a message */
    if (filtered.length === 0) {
      taskList.innerHTML = `
        <li class="empty-state">
          ${currentFilter === 'all'
            ? ' No tasks yet. Add one above.'
            : ` No ${currentFilter} tasks.`}
        </li>`;
    } else {

      /* Loop through each matching task and create an <li> for it */
      filtered.forEach(task => {

        const li = document.createElement('li');  /* creates a new <li> element */
        li.className = 'task-item';
        li.dataset.id = task.id;  /* stores the task id on the element */

        /* innerHTML sets the HTML content of the element */
        li.innerHTML = `
          <button
            class="task-check ${task.completed ? 'checked' : ''}"
            aria-label="${task.completed ? 'Mark incomplete' : 'Mark complete'}"
            data-action="complete"
          ></button>
          <span class="task-text ${task.completed ? 'completed' : ''}">
            ${escapeHTML(task.text)}
          </span>
          <button
            class="task-delete"
            aria-label="Delete task"
            data-action="delete"
          >×</button>
        `;

        taskList.appendChild(li);  /* adds the <li> into the <ul> */

      });
    }

    updateCounter();

  }


  /* --- UPDATE COUNTER ---
     Counts how many tasks are not yet completed */
  function updateCounter() {
    const remaining = tasks.filter(t => !t.completed).length;
    taskCounter.textContent = `${remaining} task${remaining !== 1 ? 's' : ''} remaining`;
  }


  /* --- ADD TASK --- */
  function addTask() {

    const text = input.value.trim();  /* .trim() removes leading/trailing spaces */

    if (!text) {
      /* Shake the input to signal it's empty */
      input.style.borderColor = 'var(--error)';
      setTimeout(() => {
        input.style.borderColor = '';
      }, 1500);
      input.focus();
      return;
    }

    /* Create a task object */
    const newTask = {
      id: Date.now(),       /* unique id using current timestamp */
      text: text,
      completed: false
    };

    tasks.push(newTask);    /* add to the array */
    saveTasks();
    renderTasks();

    input.value = '';       /* clear the input field */
    input.focus();          /* bring cursor back to input */

  }


  /* --- COMPLETE or DELETE a task ---
     We use event delegation here: instead of attaching a
     click listener to every button, we attach ONE listener
     to the parent list and check which button was clicked.
     This works even for tasks added after the page loaded. */
  taskList.addEventListener('click', (event) => {

    /* .closest() finds the nearest ancestor matching the selector */
    const taskItem = event.target.closest('.task-item');
    if (!taskItem) return;

    const id     = Number(taskItem.dataset.id);
    const action = event.target.dataset.action;

    if (action === 'complete') {

      /* Find the task in the array and flip its completed value */
      const task = tasks.find(t => t.id === id);
      if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
      }

    } else if (action === 'delete') {

      /* .filter() creates a new array excluding the deleted task */
      tasks = tasks.filter(t => t.id !== id);
      saveTasks();
      renderTasks();

    }

  });


  /* --- FILTER BUTTONS --- */
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {

      /* Remove active class from all buttons */
      filterBtns.forEach(b => b.classList.remove('active'));

      /* Add active class to the clicked button */
      btn.classList.add('active');

      /* Update the current filter and re-render */
      currentFilter = btn.dataset.filter;
      renderTasks();

    });
  });


  /* --- ADD TASK on button click --- */
  addBtn.addEventListener('click', addTask);

  /* --- ADD TASK on Enter key press --- */
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') addTask();
  });


  /* --- Initial render when the page loads --- */
  renderTasks();

}


/* 5. CONTACT FORM VALIDATION*/

function initContactForm() {

  const form       = document.getElementById('contact-form');
  const submitBtn  = document.getElementById('submit-btn');
  const successMsg = document.getElementById('success-msg');


  /* --- SHOW ERROR on a field ---
     Adds error text and red border to a form group */
  function showError(inputId, message) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(`${inputId}-error`);
    const group = input.closest('.form-group');

    error.textContent = message;
    group.classList.add('has-error');
  }


  /* --- CLEAR ERROR on a field --- */
  function clearError(inputId) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(`${inputId}-error`);
    const group = input.closest('.form-group');

    error.textContent = '';
    group.classList.remove('has-error');
  }


  /* --- VALIDATE ALL FIELDS ---
     Returns true if everything is valid, false if not */
  function validateForm() {

    let isValid = true;   /* assume valid until we find an error */

    /* --- Name: must not be empty --- */
    const name = document.getElementById('name').value.trim();
    if (!name) {
      showError('name', 'Please enter your name.');
      isValid = false;
    } else {
      clearError('name');
    }

    /* --- Email: must match standard email pattern ---
       This is called a Regular Expression (regex). It's a
       pattern for matching text. The pattern below checks:
       - some characters before @
       - @ symbol
       - some characters after @
       - a dot followed by 2 or more characters (.com, .ng etc) */
    const email = document.getElementById('email').value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!email) {
      showError('email', 'Please enter your email address.');
      isValid = false;
    } else if (!emailPattern.test(email)) {
      showError('email', 'Please enter a valid email (e.g. student@gmail.com).');
      isValid = false;
    } else {
      clearError('email');
    }

    /* --- Phone: must contain only digits, 7–15 characters ---
       The regex /^\d+$/ means: only digit characters (0-9),
       from start (^) to end ($) of the string. */
    const phone = document.getElementById('phone').value.trim();
    const phonePattern = /^\d{7,15}$/;

    if (!phone) {
      showError('phone', 'Please enter your phone number.');
      isValid = false;
    } else if (!phonePattern.test(phone)) {
      showError('phone', 'Phone number must contain only digits (7–15 numbers).');
      isValid = false;
    } else {
      clearError('phone');
    }

    /* --- Message: must not be empty, at least 10 characters --- */
    const message = document.getElementById('message').value.trim();
    if (!message) {
      showError('message', 'Please enter your message.');
      isValid = false;
    } else if (message.length < 10) {
      showError('message', 'Your message must be at least 10 characters.');
      isValid = false;
    } else {
      clearError('message');
    }

    return isValid;

  }


  /* --- REAL-TIME VALIDATION ---
     Clear an error as soon as the user starts correcting a field.
     This gives immediate positive feedback rather than waiting
     for them to submit again. */
  ['name', 'email', 'phone', 'message'].forEach(fieldId => {
    const field = document.getElementById(fieldId);
    field.addEventListener('input', () => clearError(fieldId));
  });


  /* --- FORM SUBMIT --- */
  form.addEventListener('submit', (event) => {

    /* Stop the browser's default behaviour (page refresh) */
    event.preventDefault();

    if (!validateForm()) return;  /* stop if validation fails */

    /* Simulate a successful submission */
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    /* In a real project you would send the data to a server here.
       For now we wait 1.5 seconds and show a success message. */
    setTimeout(() => {

      successMsg.classList.add('visible');
      form.reset();             /* clears all fields */
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';

      /* Hide the success message after 5 seconds */
      setTimeout(() => {
        successMsg.classList.remove('visible');
      }, 5000);

    }, 1500);

  });

}


/* ============================================================
   6. UTILITY: Escape HTML
   When we insert user-typed text into the DOM using innerHTML,
   we must sanitise it first. Without this, a user could type
   <script>alert('hacked')</script> as a task name and execute
   malicious code. This is called an XSS (Cross-Site Scripting)
   attack — very relevant to your cybersecurity studies.
   This function converts dangerous characters to safe ones.
   ============================================================ */

function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}