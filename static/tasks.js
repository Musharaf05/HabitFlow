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

// --- BADGE CONFIG ---
const STATUS_CONFIG = {
    "NOT STARTED": { color: "#6b7280", bg: "rgba(107,114,128,0.15)", icon: "○" },
    "IN PROGRESS": { color: "#3b82f6", bg: "rgba(59,130,246,0.15)", icon: "◑" },
    "COMPLETED":   { color: "#22c55e", bg: "rgba(34,197,94,0.15)",  icon: "✓" },
    "ON HOLD":     { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", icon: "⏸" },
    "CANCELLED":   { color: "#ef4444", bg: "rgba(239,68,68,0.15)",  icon: "✕" }
};

const PRIORITY_CONFIG = {
    "LOW":    { color: "#22c55e", bg: "rgba(34,197,94,0.15)",  dot: "#22c55e" },
    "MEDIUM": { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", dot: "#f59e0b" },
    "HIGH":   { color: "#ef4444", bg: "rgba(239,68,68,0.15)",  dot: "#ef4444" }
};

// --- BADGE BUILDERS ---
function statusBadge(status) {
    const s = (status || "NOT STARTED").toUpperCase();
    const cfg = STATUS_CONFIG[s] || STATUS_CONFIG["NOT STARTED"];
    return `<span class="badge status-badge" style="color:${cfg.color};background:${cfg.bg};border-color:${cfg.color}33;">
        <span class="badge-icon">${cfg.icon}</span>${s}
    </span>`;
}

function priorityBadge(priority) {
    const p = (priority || "MEDIUM").toUpperCase();
    const cfg = PRIORITY_CONFIG[p] || PRIORITY_CONFIG["MEDIUM"];
    return `<span class="badge priority-badge" style="color:${cfg.color};background:${cfg.bg};border-color:${cfg.color}33;">
        <span class="badge-dot" style="background:${cfg.dot};"></span>${p}
    </span>`;
}

function tagBadge(tags) {
    const tag = (Array.isArray(tags) ? tags[0] : tags) || "";
    if (!tag) return '<span class="badge tag-badge">—</span>';
    return `<span class="badge tag-badge">${tag}</span>`;
}

function repeatBadge(repeat) {
    const r = repeat || "NONE";
    const isActive = r !== "NONE";
    return `<span class="badge repeat-badge ${isActive ? 'repeat-active' : ''}">${r}</span>`;
}

function freqBadge(freq) {
    const f = freq || "Daily";
    return `<span class="badge freq-badge">${f}</span>`;
}

// --- DATE FORMATTING ---
function formatDateDisplay(dateStr) {
    if (!dateStr) return '<span class="no-date">—</span>';
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
}

function formatTime12Hour(time24) {
    if (!time24) return "—";
    const [hours, minutes] = time24.split(':');
    let hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minutes} <span class="ampm">${ampm}</span>`;
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
        container.innerHTML = '<div class="empty-state">No tasks yet. Add your first task below!</div>';
        return;
    }
    data.tasks.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "list-row grid-tasks";
        div.innerHTML = `
            ${statusBadge(item.status)}
            <span class="cell-text">${item.text}</span>
            ${tagBadge(item.tags)}
            <span class="cell-date">${formatDateDisplay(item.date)}</span>
            <div class="row-actions">
                <div class="action-icon edit" onclick="openEditModal('tasks', ${index})" title="Edit">
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
        container.innerHTML = '<div class="empty-state">No goals yet. Set your first goal below!</div>';
        return;
    }
    data.goals.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "list-row grid-goals";
        div.innerHTML = `
            <span class="cell-text">${item.text}</span>
            ${priorityBadge(item.priority)}
            <span class="cell-date">${formatDateDisplay(item.date)}</span>
            <div class="row-actions">
                <div class="action-icon edit" onclick="openEditModal('goals', ${index})" title="Edit">
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
        container.innerHTML = '<div class="empty-state">No reminders yet. Add your first reminder below!</div>';
        return;
    }
    data.reminders.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "list-row grid-reminders";
        div.innerHTML = `
            <span class="cell-text">${item.text}</span>
            <span class="cell-date">${formatDateDisplay(item.date)}</span>
            <span class="cell-time">${formatTime12Hour(item.time)}</span>
            ${repeatBadge(item.repeat)}
            <div class="row-actions">
                <div class="action-icon edit" onclick="openEditModal('reminders', ${index})" title="Edit">
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
        container.innerHTML = '<div class="empty-state">No habits yet. Start tracking your first habit below!</div>';
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    data.habits.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "list-row grid-habits";
        const isCompletedToday = (item.completed_dates || []).includes(today);
        const streak = computeStreak(item.completed_dates || []);

        div.innerHTML = `
            <div class="habit-info">
                <span class="cell-text">${item.text}</span>
                ${streak > 0 ? `<span class="streak-badge">🔥 ${streak} day streak</span>` : ''}
            </div>
            ${freqBadge(item.frequency)}
            <div class="habit-check-wrap">
                <button class="habit-check ${isCompletedToday ? 'completed' : ''}" onclick="toggleHabitToday(${index})" title="${isCompletedToday ? 'Mark incomplete' : 'Mark complete'}">
                    ${isCompletedToday 
                        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>` 
                        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle></svg>`}
                </button>
            </div>
            <div class="row-actions">
                <div class="action-icon edit" onclick="openEditModal('habits', ${index})" title="Edit">
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

function computeStreak(completedDates) {
    if (!completedDates || completedDates.length === 0) return 0;
    const sorted = [...completedDates].sort().reverse();
    const today = new Date();
    today.setHours(0,0,0,0);
    let streak = 0;
    let checkDate = new Date(today);
    for (let i = 0; i < 365; i++) {
        const ds = checkDate.toISOString().split('T')[0];
        if (sorted.includes(ds)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else break;
    }
    return streak;
}

// --- UPCOMING ---
function renderUpcoming() {
    const container = document.getElementById("upcomingList");
    const titleEl = document.getElementById("upcomingTitle");
    container.innerHTML = "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let filterFn;
    if (filterDate) {
        titleEl.innerText = `EVENTS: ${formatDateDisplay(filterDate).replace(/<[^>]*>/g,'') }`;
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
        const typeColors = { TASK: "#3b82f6", GOAL: "#a855f7", REMINDER: "#f59e0b" };
        const div = document.createElement("div");
        div.className = "upcoming-item";
        div.innerHTML = `
            <div class="up-meta">
                <span class="up-type-badge" style="color:${typeColors[item.type]};background:${typeColors[item.type]}22;">${item.type}</span>
                <span class="up-date">${item.date ? item.date.slice(5).replace('-','/') : ''}</span>
            </div>
            <div class="up-text">${item.text}</div>
        `;
        container.appendChild(div);
    });
    if (allItems.length === 0) {
        container.innerHTML = '<div class="empty-state" style="padding:30px 10px;">Nothing scheduled</div>';
    }
}

function resetFilter() {
    filterDate = null;
    renderUpcoming();
    renderCalendar(calCurrentMonth, calCurrentYear);
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

// --- ADD (with required field validation) ---
function addItem(type) {
    if (type === "tasks") {
        const textEl = document.getElementById("taskInput");
        const tagEl  = document.getElementById("taskTag");
        const dateEl = document.getElementById("taskDate");
        const text = textEl.value.trim().toUpperCase();
        const tag  = tagEl.value;
        const date = dateEl.value;
        if (!text)  { showFieldError(textEl, "Task description is required"); return; }
        if (!date)  { showFieldError(dateEl, "Date is required"); return; }
        fetch("/addTask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, tags: tag, date, status: "NOT STARTED" })
        }).then(() => {
            textEl.value = "";
            dateEl.value = "";
            loadTasksFromDB();
        });
    }

    if (type === "goals") {
        const textEl     = document.getElementById("goalInput");
        const priorityEl = document.getElementById("goalPriority");
        const dateEl     = document.getElementById("goalDate");
        const text = textEl.value.trim().toUpperCase();
        const priority = priorityEl.value;
        const date = dateEl.value;
        if (!text) { showFieldError(textEl, "Goal description is required"); return; }
        if (!date) { showFieldError(dateEl, "Date is required"); return; }
        fetch("/addGoal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, priority, date })
        }).then(() => {
            textEl.value = "";
            dateEl.value = "";
            loadGoalsFromDB();
        });
    }

    if (type === "reminders") {
        const textEl   = document.getElementById("remInput");
        const dateEl   = document.getElementById("remDate");
        const timeEl   = document.getElementById("remTime");
        const repeatEl = document.getElementById("remRepeat");
        const text   = textEl.value.trim().toUpperCase();
        const date   = dateEl.value;
        const time   = timeEl.value;
        const repeat = repeatEl.value;
        if (!text) { showFieldError(textEl, "Reminder text is required"); return; }
        if (!date) { showFieldError(dateEl, "Date is required"); return; }
        if (!time) { showFieldError(timeEl, "Time is required"); return; }
        fetch("/addReminder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, date, time, repeat })
        }).then(() => {
            textEl.value = "";
            dateEl.value = "";
            loadRemindersFromDB();
        });
    }

    if (type === "habits") {
        const textEl  = document.getElementById("habitInput");
        const freqEl  = document.getElementById("habitFrequency");
        const text    = textEl?.value.trim().toUpperCase();
        const frequency = freqEl?.value || "Daily";
        if (!text) { showFieldError(textEl, "Habit description is required"); return; }
        fetch("/addHabit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, frequency })
        }).then(() => {
            textEl.value = "";
            loadHabitsFromDB();
        });
    }
}

function showFieldError(el, msg) {
    el.classList.add("field-error");
    el.placeholder = msg;
    el.addEventListener("focus", () => {
        el.classList.remove("field-error");
        el.placeholder = el.getAttribute("data-placeholder") || "";
    }, { once: true });
}

// --- EDIT MODAL ---
function openEditModal(type, index) {
    const item = data[type][index];
    const modal = document.getElementById("editModal");
    const modalBody = document.getElementById("editModalBody");
    const modalTitle = document.getElementById("editModalTitle");

    const typeLabels = { tasks: "EDIT TASK", goals: "EDIT GOAL", reminders: "EDIT REMINDER", habits: "EDIT HABIT" };
    modalTitle.textContent = typeLabels[type] || "EDIT";

    let fieldsHTML = "";

    if (type === "tasks") {
        const tag = Array.isArray(item.tags) ? item.tags[0] : (item.tags || "");
        fieldsHTML = `
            <div class="modal-field">
                <label>TASK *</label>
                <input type="text" id="mEdit_text" value="${escapeHtml(item.text)}" placeholder="Task description" required />
            </div>
            <div class="modal-row">
                <div class="modal-field">
                    <label>STATUS</label>
                    <select id="mEdit_status">${STATUS_OPTS.map(o => `<option value="${o}" ${(item.status||'').toUpperCase()===o?'selected':''}>${o}</option>`).join('')}</select>
                </div>
                <div class="modal-field">
                    <label>TAG</label>
                    <select id="mEdit_tag">${TAG_OPTS.map(o => `<option value="${o}" ${tag===o?'selected':''}>${o}</option>`).join('')}</select>
                </div>
            </div>
            <div class="modal-field">
                <label>DATE *</label>
                <input type="date" id="mEdit_date" value="${item.date || ''}" required />
            </div>
        `;
    } else if (type === "goals") {
        fieldsHTML = `
            <div class="modal-field">
                <label>GOAL *</label>
                <input type="text" id="mEdit_text" value="${escapeHtml(item.text)}" placeholder="Goal description" required />
            </div>
            <div class="modal-row">
                <div class="modal-field">
                    <label>PRIORITY</label>
                    <select id="mEdit_priority">${PRIORITY_OPTS.map(o => `<option value="${o}" ${(item.priority||'').toUpperCase()===o?'selected':''}>${o}</option>`).join('')}</select>
                </div>
                <div class="modal-field">
                    <label>DATE *</label>
                    <input type="date" id="mEdit_date" value="${item.date || ''}" required />
                </div>
            </div>
        `;
    } else if (type === "reminders") {
        fieldsHTML = `
            <div class="modal-field">
                <label>REMINDER *</label>
                <input type="text" id="mEdit_text" value="${escapeHtml(item.text)}" placeholder="Reminder description" required />
            </div>
            <div class="modal-row">
                <div class="modal-field">
                    <label>DATE *</label>
                    <input type="date" id="mEdit_date" value="${item.date || ''}" required />
                </div>
                <div class="modal-field">
                    <label>TIME *</label>
                    <input type="time" id="mEdit_time" value="${item.time || ''}" required />
                </div>
            </div>
            <div class="modal-field">
                <label>REPEAT</label>
                <select id="mEdit_repeat">${REPEAT_OPTS.map(o => `<option value="${o}" ${(item.repeat||'NONE')===o?'selected':''}>${o}</option>`).join('')}</select>
            </div>
        `;
    } else if (type === "habits") {
        fieldsHTML = `
            <div class="modal-field">
                <label>HABIT *</label>
                <input type="text" id="mEdit_text" value="${escapeHtml(item.text)}" placeholder="Habit description" required />
            </div>
            <div class="modal-field">
                <label>FREQUENCY</label>
                <select id="mEdit_frequency">${FREQUENCY_OPTS.map(o => `<option value="${o}" ${item.frequency===o?'selected':''}>${o}</option>`).join('')}</select>
            </div>
        `;
    }

    modalBody.innerHTML = fieldsHTML;
    modal.dataset.editType = type;
    modal.dataset.editIndex = index;

    modal.classList.add("open");
    document.getElementById("modalOverlay").classList.add("open");

    // Focus first input
    setTimeout(() => {
        const first = modalBody.querySelector("input");
        if (first) first.focus();
    }, 50);
}

function closeEditModal() {
    document.getElementById("editModal").classList.remove("open");
    document.getElementById("modalOverlay").classList.remove("open");
}

function saveEditModal() {
    const modal = document.getElementById("editModal");
    const type = modal.dataset.editType;
    const index = parseInt(modal.dataset.editIndex);
    const item = data[type][index];
    const id = item.id;

    const updates = {};

    if (type === "tasks") {
        const text = document.getElementById("mEdit_text")?.value.trim().toUpperCase();
        const status = document.getElementById("mEdit_status")?.value;
        const tag = document.getElementById("mEdit_tag")?.value;
        const date = document.getElementById("mEdit_date")?.value;
        if (!text) { showModalFieldError("mEdit_text"); return; }
        if (!date) { showModalFieldError("mEdit_date"); return; }
        updates.text = text;
        updates.status = status;
        updates.tags = [tag];
        updates.date = date;
    } else if (type === "goals") {
        const text = document.getElementById("mEdit_text")?.value.trim().toUpperCase();
        const priority = document.getElementById("mEdit_priority")?.value;
        const date = document.getElementById("mEdit_date")?.value;
        if (!text) { showModalFieldError("mEdit_text"); return; }
        if (!date) { showModalFieldError("mEdit_date"); return; }
        updates.text = text;
        updates.priority = priority;
        updates.date = date;
    } else if (type === "reminders") {
        const text = document.getElementById("mEdit_text")?.value.trim().toUpperCase();
        const date = document.getElementById("mEdit_date")?.value;
        const time = document.getElementById("mEdit_time")?.value;
        const repeat = document.getElementById("mEdit_repeat")?.value;
        if (!text) { showModalFieldError("mEdit_text"); return; }
        if (!date) { showModalFieldError("mEdit_date"); return; }
        if (!time) { showModalFieldError("mEdit_time"); return; }
        updates.text = text;
        updates.date = date;
        updates.time = time;
        updates.repeat = repeat;
    } else if (type === "habits") {
        const text = document.getElementById("mEdit_text")?.value.trim().toUpperCase();
        const frequency = document.getElementById("mEdit_frequency")?.value;
        if (!text) { showModalFieldError("mEdit_text"); return; }
        updates.text = text;
        updates.frequency = frequency;
    }

    // Apply updates locally
    Object.assign(item, updates);

    // Push to DB
    let url = "";
    if (type === "tasks") url = `/updateTask/${id}`;
    if (type === "goals") url = `/updateGoal/${id}`;
    if (type === "reminders") url = `/updateReminder/${id}`;
    if (type === "habits") url = `/updateHabit/${id}`;

    fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
    }).then(r => {
        if (!r.ok) alert("Failed to update");
        else {
            if (type === "tasks") loadTasksFromDB();
            else if (type === "goals") loadGoalsFromDB();
            else if (type === "reminders") loadRemindersFromDB();
            else if (type === "habits") loadHabitsFromDB();
        }
    }).catch(() => alert("Error connecting to server"));

    closeEditModal();
}

function showModalFieldError(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add("field-error");
    el.focus();
    setTimeout(() => el.classList.remove("field-error"), 2000);
}

function escapeHtml(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// --- HABIT TOGGLE ---
function toggleHabitToday(index) {
    const habit = data.habits[index];
    fetch(`/toggleHabit/${habit.id}`, { method: "POST" })
        .then(r => r.json())
        .then(() => loadHabitsFromDB())
        .catch(err => console.error("Error toggling habit:", err));
}

// --- DELETE ---
function deleteItemDirect(type, index) {
    if (!confirm("Delete this item?")) return;
    const item = data[type][index];
    const id = item.id;
    const urls = { tasks: `/deleteTask/${id}`, goals: `/deleteGoal/${id}`, reminders: `/deleteReminder/${id}`, habits: `/deleteHabit/${id}` };
    fetch(urls[type], { method: "DELETE" })
        .then(r => {
            if (!r.ok) { alert("Failed to delete"); return; }
            if (type === "tasks") loadTasksFromDB();
            if (type === "goals") loadGoalsFromDB();
            if (type === "reminders") loadRemindersFromDB();
            if (type === "habits") loadHabitsFromDB();
        })
        .catch(() => alert("Error connecting to server"));
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
        .catch(() => { isLoading.tasks = false; renderTasks(); });
}

function loadGoalsFromDB() {
    isLoading.goals = true;
    renderGoals();
    fetch("/getGoals")
        .then(res => res.json())
        .then(goals => {
            data.goals = goals.map(g => ({ ...g, priority: (g.priority || 'MEDIUM').toUpperCase() }));
            isLoading.goals = false;
            renderGoals();
            renderUpcoming();
        })
        .catch(() => { isLoading.goals = false; renderGoals(); });
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
        .catch(() => { isLoading.reminders = false; renderReminders(); });
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
        .catch(() => { isLoading.habits = false; renderHabits(); });
}

// --- INIT ---
initCalendar();
renderCalendar(calCurrentMonth, calCurrentYear);
loadTasksFromDB();
loadGoalsFromDB();
loadRemindersFromDB();
loadHabitsFromDB();