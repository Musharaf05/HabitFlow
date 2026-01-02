// --- DATA STATE ---
            let data = {
                tasks: [],
                goals: [],
                reminders: []
            };
            // --- GLOBAL VARIABLES ---
            let filterDate = null; // If null, show 7 days. If set (YYYY-MM-DD), show only that date.
            let calCurrentYear, calCurrentMonth;

            // --- CONSTANTS ---
            const STATUS_OPTS = [
                "NOT STARTED",
                "IN PROGRESS",
                "COMPLETED",
                "ON HOLD",
                "CANCELLED",
            ];
            const TAG_OPTS = ["PROJECTS", "HOMEWORK", "PERSONAL", "WORK"];
            const PRIORITY_OPTS = ["LOW", "MEDIUM", "HIGH"];
            const REPEAT_OPTS = [
                "NONE",
                "DAILY",
                "WEEKLY",
                "BI-WEEKLY",
                "MONTHLY",
            ];
            const MONTH_NAMES = [
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
            ];

            // --- RENDER MAIN LISTS ---
            function renderAll() {
                renderTasks();
                renderGoals();
                renderReminders();
                renderUpcoming();
                renderCalendar(calCurrentMonth, calCurrentYear);
            }

            function renderTasks() {
                const container = document.getElementById("taskListContainer");
                container.innerHTML = "";
                data.tasks.forEach((item, index) => {
                    const div = document.createElement("div");
                    div.className = "list-row grid-tasks";
                    div.dataset.type = "tasks";
                    div.dataset.index = index;
                    div.oncontextmenu = showContextMenu;
                    div.innerHTML = `
                    <span class="editable" onclick="editSelect(this, 'tasks', ${index}, 'status', STATUS_OPTS)">${item.status}</span>
                    <span class="editable" contenteditable="true" onblur="editText(this, 'tasks', ${index}, 'text')">${item.text}</span>
                    <span class="editable" onclick="editSelect(this, 'tasks', ${index}, 'tag', TAG_OPTS)">${item.tag}</span>
                    <span class="editable" onclick="editDate(this, 'tasks', ${index}, 'date')">${item.date}</span>
                `;
                    container.appendChild(div);
                });
            }

            function renderGoals() {
                const container = document.getElementById("goalListContainer");
                container.innerHTML = "";
                data.goals.forEach((item, index) => {
                    const div = document.createElement("div");
                    div.className = "list-row grid-goals";
                    div.dataset.type = "goals";
                    div.dataset.index = index;
                    div.oncontextmenu = showContextMenu;
                    div.innerHTML = `
                    <span class="editable" contenteditable="true" onblur="editText(this, 'goals', ${index}, 'text')">${item.text}</span>
                    <span class="editable" onclick="editSelect(this, 'goals', ${index}, 'priority', PRIORITY_OPTS)">${item.priority}</span>
                    <span class="editable" onclick="editDate(this, 'goals', ${index}, 'date')">${item.date}</span>
                `;
                    container.appendChild(div);
                });
            }

            function renderReminders() {
                const container = document.getElementById(
                    "reminderListContainer"
                );
                container.innerHTML = "";
                data.reminders.forEach((item, index) => {
                    const div = document.createElement("div");
                    div.className = "list-row grid-reminders";
                    div.dataset.type = "reminders";
                    div.dataset.index = index;
                    div.oncontextmenu = showContextMenu;
                    div.innerHTML = `
                    <span class="editable" contenteditable="true" onblur="editText(this, 'reminders', ${index}, 'text')">${item.text}</span>
                    <span class="editable" onclick="editDate(this, 'reminders', ${index}, 'date')">${item.date}</span>
                    <span class="editable" onclick="editTime(this, 'reminders', ${index}, 'time')">${item.time}</span>
                    <span class="editable" onclick="editSelect(this, 'reminders', ${index}, 'repeat', REPEAT_OPTS)">${item.repeat}</span>
                `;
                    container.appendChild(div);
                });
            }

            // --- RENDER UPCOMING (SMART FILTER) ---
            function renderUpcoming() {
                const container = document.getElementById("upcomingList");
                const titleEl = document.getElementById("upcomingTitle");
                container.innerHTML = "";

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // Logic to determine which items to show
                let filterFn;
                if (filterDate) {
                    // Specific Date Selected
                    titleEl.innerText = `EVENTS: ${filterDate}`;
                    filterFn = (dateStr) => dateStr === filterDate;
                } else {
                    // Default: Next 7 Days
                    titleEl.innerText = "UPCOMING (7 DAYS)";
                    const nextWeek = new Date(today);
                    nextWeek.setDate(today.getDate() + 7);

                    filterFn = (dateStr) => {
                        if (!dateStr) return false;
                        const d = new Date(dateStr);
                        // Standardize time for comparison
                        d.setHours(0, 0, 0, 0);
                        return d >= today && d <= nextWeek;
                    };
                }

                // Aggregate Items
                const allItems = [];
                data.tasks.forEach((i) => {
                    if (filterFn(i.date)) allItems.push({ ...i, type: "TASK" });
                });
                data.goals.forEach((i) => {
                    if (filterFn(i.date)) allItems.push({ ...i, type: "GOAL" });
                });
                data.reminders.forEach((i) => {
                    if (filterFn(i.date))
                        allItems.push({ ...i, type: "REMINDER" });
                });

                // Sort
                allItems.sort((a, b) => new Date(a.date) - new Date(b.date));

                allItems.forEach((item) => {
                    const div = document.createElement("div");
                    div.className = "upcoming-item";
                    div.innerHTML = `
                    <div class="up-meta">
                        <span>${item.type}</span>
                        <span>${item.date}</span>
                    </div>
                    <div style="font-weight:bold;">${item.text}</div>
                `;
                    container.appendChild(div);
                });

                if (allItems.length === 0) {
                    container.innerHTML =
                        '<div style="text-align:center; padding:20px; color:#555;">No events found</div>';
                }
            }

            function resetFilter() {
                filterDate = null;
                renderUpcoming();
                renderCalendar(calCurrentMonth, calCurrentYear); // Remove selection visuals
            }

            // --- CALENDAR LOGIC ---
            function initCalendar() {
                const now = new Date();
                calCurrentYear = now.getFullYear();
                calCurrentMonth = now.getMonth();
            }

            function changeMonth(dir) {
                calCurrentMonth += dir;
                if (calCurrentMonth < 0) {
                    calCurrentMonth = 11;
                    calCurrentYear--;
                } else if (calCurrentMonth > 11) {
                    calCurrentMonth = 0;
                    calCurrentYear++;
                }
                renderCalendar(calCurrentMonth, calCurrentYear);
            }

            function renderCalendar(month, year) {
                const container = document.getElementById("calDays");
                document.getElementById(
                    "calMonthYear"
                ).innerText = `${MONTH_NAMES[month]} ${year}`;

                container.innerHTML = "";

                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const today = new Date();

                // Empty slots
                for (let i = 0; i < firstDay; i++) {
                    const empty = document.createElement("div");
                    empty.className = "cal-day empty";
                    container.appendChild(empty);
                }

                // Days
                for (let day = 1; day <= daysInMonth; day++) {
                    const cell = document.createElement("div");
                    cell.className = "cal-day";
                    cell.innerText = day;

                    // Format YYYY-MM-DD
                    const mStr = (month + 1).toString().padStart(2, "0");
                    const dStr = day.toString().padStart(2, "0");
                    const dateStr = `${year}-${mStr}-${dStr}`;

                    // Classes
                    if (dateStr === filterDate) {
                        cell.classList.add("selected");
                    } else if (
                        today.getDate() === day &&
                        today.getMonth() === month &&
                        today.getFullYear() === year
                    ) {
                        cell.classList.add("today");
                    }

                    // Click Handler
                    cell.onclick = () => {
                        filterDate = dateStr;
                        renderUpcoming();
                        renderCalendar(month, year); // Re-render to update classes

                        // Optional: Also set the date inputs in the active form
                        setFormDate(dateStr);
                    };

                    container.appendChild(cell);
                }
            }

            function setFormDate(dateStr) {
                // Helper to auto-fill the date input of whatever tab is open
                const activeTab = document.querySelector(".tab-content.active");
                if (activeTab) {
                    const input = activeTab.querySelector('input[type="date"]');
                    if (input) input.value = dateStr;
                }
            }

            // --- ADD/EDIT/DELETE LOGIC (Same as previous) ---
            function addItem(type) {
                if (type === "tasks") {
                    const text = document.getElementById("taskInput").value.toUpperCase();
                    const tag = document.getElementById("taskTag").value;
                    const date = document.getElementById("taskDate").value;

                    if (!text) return;

                    fetch("/addTask", {
                        method: "POST",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({ text, tag, date })
                    })
                    .then(res => res.json())
                    .then(() => {
                        document.getElementById("taskInput").value = "";
                        loadTasksFromDB();  // Refresh list
                    });
}

            }

            function editText(el, type, index, field) {
                data[type][index][field] = el.innerText;
                renderUpcoming();
            }

            function editSelect(el, type, index, field, options) {
                if (el.querySelector("select")) return;
                const current = data[type][index][field];
                el.innerHTML = "";
                const select = document.createElement("select");
                options.forEach((opt) => {
                    const o = document.createElement("option");
                    o.value = opt;
                    o.innerText = opt;
                    if (opt === current) o.selected = true;
                    select.appendChild(o);
                });
                const save = () => {
                    data[type][index][field] = select.value;
                    renderAll();
                };
                select.addEventListener("blur", save);
                select.addEventListener("change", save);
                el.appendChild(select);
                select.focus();
            }

            function editDate(el, type, index, field) {
                if (el.querySelector("input")) return;
                const current = data[type][index][field];
                el.innerHTML = "";
                const input = document.createElement("input");
                input.type = "date";
                input.value = current;
                const save = () => {
                    if (input.value) data[type][index][field] = input.value;
                    renderAll();
                };
                input.addEventListener("blur", save);
                input.addEventListener("change", save);
                el.appendChild(input);
                input.focus();
            }

            function editTime(el, type, index, field) {
                if (el.querySelector("input")) return;
                const current = data[type][index][field];
                el.innerHTML = "";
                const input = document.createElement("input");
                input.type = "time";
                input.value = current;
                const save = () => {
                    if (input.value) data[type][index][field] = input.value;
                    renderAll();
                };
                input.addEventListener("blur", save);
                input.addEventListener("change", save);
                el.appendChild(input);
                input.focus();
            }

            // --- CONTEXT MENU ---
            let contextTarget = null;
            const menu = document.getElementById("contextMenu");

            function showContextMenu(e) {
                e.preventDefault();
                contextTarget = {
                    type: this.dataset.type,
                    index: parseInt(this.dataset.index),
                };
                menu.style.display = "block";
                menu.style.left = e.pageX + "px";
                menu.style.top = e.pageY + "px";
            }

            function deleteItem() {
                if (contextTarget) {
                    data[contextTarget.type].splice(contextTarget.index, 1);
                    renderAll();
                }
                menu.style.display = "none";
            }
            document.addEventListener(
                "click",
                () => (menu.style.display = "none")
            );

            // --- TABS ---
            function switchTab(tabName) {
                document
                    .querySelectorAll(".tab-btn")
                    .forEach((b) => b.classList.remove("active"));
                event.target.classList.add("active");
                document
                    .querySelectorAll(".tab-content")
                    .forEach((c) => c.classList.remove("active"));
                document
                    .getElementById("tab-" + tabName)
                    .classList.add("active");
            }

            // INIT
            initCalendar();
            renderAll();
            // ------------------API's-----------------------------------
            
            // ------------------Tab Switching---------------------------
            const API_URL = "http://127.0.0.1:5000"; // Update this if your port is different

                window.onload = () => {
                    switchTab('tasks'); // Default view
                    renderCalendar();
                };

                function switchTab(tabName) {
                    // 1. Update Button States
                    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                    event.currentTarget?.classList.add('active');

                    // 2. Update Content Visibility
                    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                    document.getElementById(`tab-${tabName}`).classList.add('active');

                    // 3. Load Fresh Data
                    if (tabName === 'tasks') fetchTasks();
                    if (tabName === 'goals') fetchGoals();
                    if (tabName === 'reminders') fetchReminders();
                }

                // --------------------CRUD-------------------------
                // FETCH TASKS
async function fetchTasks() {
    const res = await fetch(`${API_URL}/tasks`);
    const tasks = await res.json();
    const container = document.getElementById('taskListContainer');
    
    container.innerHTML = tasks.map(t => `
        <div class="list-item grid-tasks" oncontextmenu="showContextMenu(event, 'task', ${t.id})">
            <input type="checkbox" ${t.done ? 'checked' : ''} onclick="toggleStatus(${t.id})">
            <span>${t.content}</span>
            <span class="tag">${t.tag || 'PERSONAL'}</span>
            <span>${t.date || 'NO DATE'}</span>
        </div>
    `).join('');
}

// FETCH GOALS
async function fetchGoals() {
    const res = await fetch(`${API_URL}/goals`);
    const goals = await res.json();
    const container = document.getElementById('goalListContainer');
    
    container.innerHTML = goals.map(g => `
        <div class="list-item grid-goals" oncontextmenu="showContextMenu(event, 'goal', ${g.id})">
            <span>${g.title}</span>
            <span class="priority-${g.priority || 'MEDIUM'}">${g.priority || 'MEDIUM'}</span>
            <span>${g.date || 'PENDING'}</span>
        </div>
    `).join('');
}

async function addItem(type) {
    let payload = {};
    let endpoint = "";

    if (type === 'tasks') {
        payload = {
            content: document.getElementById('taskInput').value,
            tag: document.getElementById('taskTag').value,
            date: document.getElementById('taskDate').value
        };
        endpoint = "/tasks";
    } else if (type === 'goals') {
        payload = {
            title: document.getElementById('goalInput').value,
            priority: document.getElementById('goalPriority').value,
            date: document.getElementById('goalDate').value
        };
        endpoint = "/goals";
    }

    if (!payload.content && !payload.title) return alert("Please enter text!");

    await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    // Clear inputs and refresh
    document.querySelectorAll('input').forEach(i => i.value = '');
    switchTab(type);
}

let currentDeleteItem = { type: '', id: null };

function showContextMenu(e, type, id) {
    e.preventDefault();
    const menu = document.getElementById('contextMenu');
    menu.style.display = 'block';
    menu.style.left = `${e.pageX}px`;
    menu.style.top = `${e.pageY}px`;
    currentDeleteItem = { type, id };
}

// Close menu on click elsewhere
window.onclick = () => document.getElementById('contextMenu').style.display = 'none';

async function deleteItem() {
    const { type, id } = currentDeleteItem;
    await fetch(`${API_URL}/cleanup/${type}/${id}`, { method: 'DELETE' });
    switchTab(type === 'task' ? 'tasks' : 'goals');
}