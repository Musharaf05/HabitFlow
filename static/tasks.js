// --- DATA STATE ---
let data = {
    tasks: [],
    goals: [],
    reminders: [],
    habits: []
};

// --- LOADING STATE ---
let isLoading = {
    tasks: true,
    goals: true,
    reminders: true,
    habits: true
};

let filterDate = null;
let calCurrentYear, calCurrentMonth;

// --- CONSTANTS ---
const STATUS_OPTS = ["NOT STARTED", "IN PROGRESS", "COMPLETED", "ON HOLD", "CANCELLED"];
const TAG_OPTS = ["PROJECTS", "HOMEWORK", "PERSONAL", "WORK"];
const PRIORITY_OPTS = ["LOW", "MEDIUM", "HIGH"];
const REPEAT_OPTS = ["NONE", "DAILY", "WEEKLY", "BI-WEEKLY", "MONTHLY"];
const FREQUENCY_OPTS = ["Daily", "Mon-Fri", "Weekends", "Custom"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// --- COLOR CONSTANTS ---
const STATUS_COLORS = {
    "NOT STARTED": "#6b7280",
    "IN PROGRESS": "#3b82f6",
    "COMPLETED": "#22c55e",
    "ON HOLD": "#f59e0b",
    "CANCELLED": "#ef4444"
};

const PRIORITY_COLORS = {
    "LOW": "#22c55e",
    "MEDIUM": "#f59e0b",
    "HIGH": "#ef4444"
};

// --- DATE FORMATTING ---
function formatDateDisplay(dateStr) {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
}

// --- RENDER ---
function renderAll() {
    renderTasks();
    renderGoals();
    renderReminders();
    renderHabits();
    renderUpcoming();
    renderCalendar(calCurrentMonth, calCurrentYear);
}

function renderTasks() {
    const container = document.getElementById("taskListContainer");
    container.innerHTML = "";
    
    if (isLoading.tasks) {
        container.innerHTML = '<div class="loading-container"><div class="loader"></div><p>Loading tasks...</p></div>';
        return;
    }
    
    if (data.tasks.length === 0) {
        container.innerHTML = '<div class="empty-state">No tasks added yet. Create your first task below!</div>';
        return;
    }
    
    data.tasks.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "list-row grid-tasks";
        const displayTag = (item.tags && item.tags.length > 0) ? item.tags[0] : "";
        const statusUpper = (item.status || 'not started').toUpperCase();
        const statusColor = STATUS_COLORS[statusUpper] || "#6b7280";
        
        div.innerHTML = `
            <span class="editable" style="color: ${statusColor};" onclick="editSelect(this, 'tasks', ${index}, 'status', STATUS_OPTS)">${statusUpper}</span>
            <span class="editable" contenteditable="true" onblur="editText(this, 'tasks', ${index}, 'text')">${item.text}</span>
            <span class="editable" onclick="editSelect(this, 'tasks', ${index}, 'tags', TAG_OPTS)">${displayTag}</span>
            <span class="editable" onclick="editDate(this, 'tasks', ${index}, 'date')">${formatDateDisplay(item.date)}</span>
            <div class="row-actions">
                <div class="action-icon edit" onclick="triggerEdit(this.parentElement.parentElement)" title="Edit">
                    <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </div>
                <div class="action-icon delete" onclick="deleteItemDirect('tasks', ${index})" title="Delete">
                    <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function renderGoals() {
    const container = document.getElementById("goalListContainer");
    container.innerHTML = "";
    
    if (isLoading.goals) {
        container.innerHTML = '<div class="loading-container"><div class="loader"></div><p>Loading goals...</p></div>';
        return;
    }
    
    if (data.goals.length === 0) {
        container.innerHTML = '<div class="empty-state">No goals added yet. Set your first goal below!</div>';
        return;
    }
    
    data.goals.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "list-row grid-goals";
        const priorityUpper = (item.priority || 'medium').toUpperCase();
        const priorityColor = PRIORITY_COLORS[priorityUpper] || "#f59e0b";
        
        div.innerHTML = `
            <span class="editable" contenteditable="true" onblur="editText(this, 'goals', ${index}, 'text')">${item.text}</span>
            <span class="editable" style="color: ${priorityColor};" onclick="editSelect(this, 'goals', ${index}, 'priority', PRIORITY_OPTS)">${priorityUpper}</span>
            <span class="editable" onclick="editDate(this, 'goals', ${index}, 'date')">${formatDateDisplay(item.date)}</span>
            <div class="row-actions">
                <div class="action-icon edit" onclick="triggerEdit(this.parentElement.parentElement)" title="Edit">
                    <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </div>
                <div class="action-icon delete" onclick="deleteItemDirect('goals', ${index})" title="Delete">
                    <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function renderReminders() {
    const container = document.getElementById("reminderListContainer");
    container.innerHTML = "";
    
    if (isLoading.reminders) {
        container.innerHTML = '<div class="loading-container"><div class="loader"></div><p>Loading reminders...</p></div>';
        return;
    }
    
    if (data.reminders.length === 0) {
        container.innerHTML = '<div class="empty-state">No reminders added yet. Add your first reminder below!</div>';
        return;
    }
    
    data.reminders.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "list-row grid-reminders";
        div.innerHTML = `
            <span class="editable" contenteditable="true" onblur="editText(this, 'reminders', ${index}, 'text')">${item.text}</span>
            <span class="editable" onclick="editDate(this, 'reminders', ${index}, 'date')">${formatDateDisplay(item.date)}</span>
            <span class="editable" onclick="editTime(this, 'reminders', ${index}, 'time')">${item.time || ''}</span>
            <span class="editable" onclick="editSelect(this, 'reminders', ${index}, 'repeat', REPEAT_OPTS)">${item.repeat || 'NONE'}</span>
            <div class="row-actions">
                <div class="action-icon edit" onclick="triggerEdit(this.parentElement.parentElement)" title="Edit">
                    <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </div>
                <div class="action-icon delete" onclick="deleteItemDirect('reminders', ${index})" title="Delete">
                    <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function renderHabits() {
    const container = document.getElementById("habitListContainer");
    if (!container) return;
    
    container.innerHTML = "";
    
    if (isLoading.habits) {
        container.innerHTML = '<div class="loading-container"><div class="loader"></div><p>Loading habits...</p></div>';
        return;
    }
    
    if (data.habits.length === 0) {
        container.innerHTML = '<div class="empty-state">No habits added yet. Start tracking your first habit below!</div>';
        return;
    }
    
    data.habits.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "list-row grid-habits";
        
        const today = new Date().toISOString().split('T')[0];
        const isCompletedToday = (item.completed_dates || []).includes(today);
        
        div.innerHTML = `
            <span class="editable" contenteditable="true" onblur="editText(this, 'habits', ${index}, 'text')">${item.text}</span>
            <span class="editable" onclick="editSelect(this, 'habits', ${index}, 'frequency', FREQUENCY_OPTS)">${item.frequency || 'Daily'}</span>
            <button class="habit-check ${isCompletedToday ? 'completed' : ''}" onclick="toggleHabitToday(${index})">
                ${isCompletedToday ? '✓' : '○'}
            </button>
            <div class="row-actions">
                <div class="action-icon edit" onclick="triggerEdit(this.parentElement.parentElement)" title="Edit">
                    <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </div>
                <div class="action-icon delete" onclick="deleteItemDirect('habits', ${index})" title="Delete">
                    <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function renderUpcoming() {
    const container = document.getElementById("upcomingList");
    const titleEl = document.getElementById("upcomingTitle");
    container.innerHTML = "";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filterFn;
    if (filterDate) {
        titleEl.innerText = `EVENTS: ${formatDateDisplay(filterDate)}`;
        filterFn = (dateStr) => dateStr === filterDate;
    } else {
        titleEl.innerText = "UPCOMING (7 DAYS)";
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        filterFn = (dateStr) => {
            if (!dateStr) return false;
            const d = new Date(dateStr);
            d.setHours(0, 0, 0, 0);
            return d >= today && d <= nextWeek;
        };
    }

    const allItems = [];
    data.tasks.forEach((i) => { if (filterFn(i.date)) allItems.push({ ...i, type: "TASK" }); });
    data.goals.forEach((i) => { if (filterFn(i.date)) allItems.push({ ...i, type: "GOAL" }); });
    data.reminders.forEach((i) => { if (filterFn(i.date)) allItems.push({ ...i, type: "REMINDER" }); });

    allItems.sort((a, b) => new Date(a.date) - new Date(b.date));

    allItems.forEach((item) => {
        const div = document.createElement("div");
        div.className = "upcoming-item";
        div.innerHTML = `<div class="up-meta"><span>${item.type}</span><span>${formatDateDisplay(item.date)}</span></div><div style="font-weight:bold;">${item.text}</div>`;
        container.appendChild(div);
    });

    if (allItems.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#555;">No events found</div>';
    }
}

// --- CALENDAR ---
function initCalendar() {
    const now = new Date();
    calCurrentYear = now.getFullYear();
    calCurrentMonth = now.getMonth();
}

function changeMonth(dir) {
    calCurrentMonth += dir;
    if (calCurrentMonth < 0) { calCurrentMonth = 11; calCurrentYear--; }
    else if (calCurrentMonth > 11) { calCurrentMonth = 0; calCurrentYear++; }
    renderCalendar(calCurrentMonth, calCurrentYear);
}

function renderCalendar(month, year) {
    const container = document.getElementById("calDays");
    document.getElementById("calMonthYear").innerText = `${MONTH_NAMES[month]} ${year}`;
    container.innerHTML = "";

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement("div");
        empty.className = "cal-day empty";
        container.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement("div");
        cell.className = "cal-day";
        cell.innerText = day;

        const mStr = (month + 1).toString().padStart(2, "0");
        const dStr = day.toString().padStart(2, "0");
        const dateStr = `${year}-${mStr}-${dStr}`;

        if (dateStr === filterDate) cell.classList.add("selected");
        else if (today.getDate() === day && today.getMonth() === month && today.getFullYear() === year) cell.classList.add("today");

        cell.onclick = () => {
            filterDate = dateStr;
            renderUpcoming();
            renderCalendar(month, year);
            setFormDate(dateStr);
        };

        container.appendChild(cell);
    }
}

function setFormDate(dateStr) {
    const activeTab = document.querySelector(".tab-content.active");
    if (activeTab) {
        const input = activeTab.querySelector('input[type="date"]');
        if (input) input.value = dateStr;
    }
}

// --- ADD ---
function addItem(type) {
    if (type === "tasks") {
        const text = document.getElementById("taskInput").value.toUpperCase();
        const tag = document.getElementById("taskTag").value;
        const date = document.getElementById("taskDate").value;
        if (!text) return;

        fetch("/addTask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, tags: tag, date, status: "NOT STARTED" })
        }).then(() => {
            document.getElementById("taskInput").value = "";
            document.getElementById("taskDate").value = "";
            loadTasksFromDB();
        });
    }

    if (type === "goals") {
        const text = document.getElementById("goalInput").value.toUpperCase();
        const priority = document.getElementById("goalPriority").value;
        const date = document.getElementById("goalDate").value;
        if (!text) return;

        fetch("/addGoal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, priority, date })
        }).then(() => {
            document.getElementById("goalInput").value = "";
            document.getElementById("goalDate").value = "";
            loadGoalsFromDB();
        });
    }

    if (type === "reminders") {
        const text = document.getElementById("remInput").value.toUpperCase();
        const date = document.getElementById("remDate").value;
        const time = document.getElementById("remTime").value;
        const repeat = document.getElementById("remRepeat").value;
        if (!text) return;

        fetch("/addReminder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, date, time, repeat })
        }).then(() => {
            document.getElementById("remInput").value = "";
            document.getElementById("remDate").value = "";
            loadRemindersFromDB();
        });
    }
    
    if (type === "habits") {
        const text = document.getElementById("habitInput")?.value.toUpperCase();
        const frequency = document.getElementById("habitFrequency")?.value || "Daily";
        if (!text) return;

        fetch("/addHabit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, frequency })
        }).then(() => {
            document.getElementById("habitInput").value = "";
            loadHabitsFromDB();
        });
    }
}

// --- UPDATE ---
function updateItemInDB(type, id, field, value) {
    let url = "";
    if (type === "tasks") url = `/updateTask/${id}`;
    if (type === "goals") url = `/updateGoal/${id}`;
    if (type === "reminders") url = `/updateReminder/${id}`;
    if (type === "habits") url = `/updateHabit/${id}`;

    fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value })
    })
    .then(response => {
        if (!response.ok) {
            console.error("Update failed");
            alert("Failed to update item");
        }
        return response.json();
    })
    .then(data => console.log("Update successful:", data))
    .catch(error => {
        console.error("Error updating:", error);
        alert("Error connecting to server");
    });
}

// --- EDIT ---
function editText(el, type, index, field) {
    const newValue = el.innerText;
    data[type][index][field] = newValue;
    const id = data[type][index].id;
    updateItemInDB(type, id, field, newValue);
    renderUpcoming();
}

function editSelect(el, type, index, field, options) {
    if (el.querySelector("select")) return;
    
    let current = data[type][index][field];
    if (field === "tags" && Array.isArray(current)) {
        current = current.length > 0 ? current[0] : "";
    }
    
    el.innerHTML = "";
    const select = document.createElement("select");
    options.forEach((opt) => {
        const o = document.createElement("option");
        o.value = opt;
        o.innerText = opt;
        if (opt === current || opt.toLowerCase() === current.toLowerCase()) o.selected = true;
        select.appendChild(o);
    });
    
    const save = () => {
        const newValue = select.value;
        if (field === "tags") {
            data[type][index][field] = [newValue];
        } else {
            data[type][index][field] = newValue;
        }
        const id = data[type][index].id;
        updateItemInDB(type, id, field, newValue);
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
    input.value = current || "";
    const save = () => {
        if (input.value) {
            const newValue = input.value;
            data[type][index][field] = newValue;
            const id = data[type][index].id;
            updateItemInDB(type, id, "date", newValue);
        }
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
    input.value = current || "";
    const save = () => {
        if (input.value) {
            const newValue = input.value;
            data[type][index][field] = newValue;
            const id = data[type][index].id;
            updateItemInDB(type, id, "time", newValue);
        }
        renderAll();
    };
    input.addEventListener("blur", save);
    input.addEventListener("change", save);
    el.appendChild(input);
    input.focus();
}

// --- HABIT TOGGLE ---
function toggleHabitToday(index) {
    const habit = data.habits[index];
    const id = habit.id;
    
    fetch(`/toggleHabit/${id}`, { method: "POST" })
        .then(response => response.json())
        .then(() => loadHabitsFromDB())
        .catch(error => console.error("Error toggling habit:", error));
}

// --- UPDATE HABIT ---
function updateHabit(id, field, value) {
    fetch(`/updateHabit/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value })
    })
    .then(response => {
        if (!response.ok) alert("Failed to update habit");
        return response.json();
    })
    .catch(error => {
        console.error("Error updating habit:", error);
        alert("Error connecting to server");
    });
}

// --- DELETE ---
function deleteItemDirect(type, index) {
    if (!confirm("Are you sure you want to delete this item?")) return;

    const item = data[type][index];
    const id = item.id;

    let url = "";
    if (type === "tasks") url = `/deleteTask/${id}`;
    if (type === "goals") url = `/deleteGoal/${id}`;
    if (type === "reminders") url = `/deleteReminder/${id}`;
    if (type === "habits") url = `/deleteHabit/${id}`;

    fetch(url, { method: "DELETE" })
        .then(response => {
            if (!response.ok) {
                alert("Failed to delete item");
                return;
            }
            if (type === "tasks") loadTasksFromDB();
            if (type === "goals") loadGoalsFromDB();
            if (type === "reminders") loadRemindersFromDB();
            if (type === "habits") loadHabitsFromDB();
        })
        .catch(error => {
            console.error("Error deleting:", error);
            alert("Error connecting to server");
        });
}

function triggerEdit(row) {
    const firstEditable = row.querySelector('.editable');
    if (firstEditable) {
        if (firstEditable.hasAttribute('contenteditable')) {
            firstEditable.focus();
        } else {
            firstEditable.click();
        }
    }
}

// --- TABS ---
function switchTab(tabName) {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    event.target.classList.add("active");
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
    document.getElementById("tab-" + tabName).classList.add("active");
}

// --- LOAD ---
function loadTasksFromDB() {
    isLoading.tasks = true;
    renderTasks();
    
    fetch("/getTasks")
        .then(res => res.json())
        .then(tasks => {
            data.tasks = tasks.map(t => ({ 
                id: t.id, 
                text: t.text, 
                tags: t.tags || [], 
                date: t.date, 
                note: t.note, 
                status: (t.status || 'NOT STARTED').toUpperCase()
            }));
            isLoading.tasks = false;
            renderTasks();
            renderUpcoming();
        })
        .catch(err => {
            console.error("Error loading tasks:", err);
            isLoading.tasks = false;
            renderTasks();
        });
}

function loadGoalsFromDB() {
    isLoading.goals = true;
    renderGoals();
    
    fetch("/getGoals")
        .then(res => res.json())
        .then(goals => {
            data.goals = goals.map(g => ({
                ...g,
                priority: (g.priority || 'MEDIUM').toUpperCase()
            }));
            isLoading.goals = false;
            renderGoals();
            renderUpcoming();
        })
        .catch(err => {
            console.error("Error loading goals:", err);
            isLoading.goals = false;
            renderGoals();
        });
}

function loadRemindersFromDB() {
    isLoading.reminders = true;
    renderReminders();
    
    fetch("/getReminders")
        .then(res => res.json())
        .then(rem => {
            data.reminders = rem;
            isLoading.reminders = false;
            renderReminders();
            renderUpcoming();
        })
        .catch(err => {
            console.error("Error loading reminders:", err);
            isLoading.reminders = false;
            renderReminders();
        });
}

function loadHabitsFromDB() {
    isLoading.habits = true;
    renderHabits();
    
    fetch("/getHabits")
        .then(res => res.json())
        .then(habits => {
            data.habits = habits;
            isLoading.habits = false;
            renderHabits();
        })
        .catch(err => {
            console.log("Habits not loaded:", err);
            isLoading.habits = false;
            renderHabits();
        });
}

// --- INIT ---
initCalendar();
renderCalendar(calCurrentMonth, calCurrentYear);
loadTasksFromDB();
loadGoalsFromDB();
loadRemindersFromDB();
loadHabitsFromDB();