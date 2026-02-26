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
let currentEditModal = null;

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

// --- TIME FORMATTING ---
function formatTime12Hour(time24) {
    if (!time24) return "";
    const [hours, minutes] = time24.split(':');
    let hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minutes} ${ampm}`;
}

// --- BADGE HELPER ---
function getBadgeClass(value) {
    const normalized = value.toUpperCase().replace(/ /g, '-').toLowerCase();
    return `badge badge-${normalized}`;
}

// --- NOTIFICATION BUBBLE (SIMPLE DOT ONLY) ---
function updateNotificationBubble() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    let hasNotifications = false;
    let notificationCount = 0;
    
    data.reminders.forEach(r => {
        if (r.date) {
            const d = new Date(r.date);
            d.setHours(0, 0, 0, 0);
            if (d >= today && d <= tomorrow) {
                hasNotifications = true;
                notificationCount++;
            }
        }
    });
    
    data.tasks.forEach(t => {
        if (t.date && t.status !== 'COMPLETED' && t.status !== 'CANCELLED') {
            const d = new Date(t.date);
            d.setHours(0, 0, 0, 0);
            if (d < today) {
                hasNotifications = true;
                notificationCount++;
            }
        }
    });
    
    const bubble = document.querySelector('.notification-bubble');
    if (bubble) {
        if (hasNotifications) {
            bubble.classList.add('show');
            // Send browser notification if permission granted
            sendBrowserNotifications(notificationCount);
        } else {
            bubble.classList.remove('show');
        }
    }
}

// --- BROWSER NOTIFICATIONS ---
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function sendBrowserNotifications(count) {
    if ('Notification' in window && Notification.permission === 'granted') {
        // Only send once per session to avoid spam
        const lastNotified = sessionStorage.getItem('lastNotified');
        const now = Date.now();
        
        if (!lastNotified || (now - lastNotified) > 3600000) { // 1 hour
            new Notification('HabitFlow Reminder', {
                body: `You have ${count} pending notification${count > 1 ? 's' : ''}`,
                icon: '/static/checklist_16688556.png',
                badge: '/static/checklist_16688556.png',
                tag: 'habitflow-notification',
                requireInteraction: false
            });
            sessionStorage.setItem('lastNotified', now);
        }
    }
}

// --- HABIT HELPERS ---
function calculateStreak(completedDates) {
    if (!completedDates || completedDates.length === 0) return 0;
    
    const sorted = [...completedDates].sort((a, b) => new Date(b) - new Date(a));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = new Date(today);
    
    for (let dateStr of sorted) {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        
        if (date.getTime() === currentDate.getTime()) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else if (date.getTime() < currentDate.getTime()) {
            break;
        }
    }
    
    return streak;
}

function calculateWeekProgress(completedDates) {
    if (!completedDates || completedDates.length === 0) return 0;
    
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    const recentCompletions = completedDates.filter(dateStr => {
        const date = new Date(dateStr);
        return date >= weekAgo && date <= today;
    }).length;
    
    return Math.min((recentCompletions / 7) * 100, 100);
}

// --- RENDER ALL ---
function renderAll() {
    renderTasks();
    renderGoals();
    renderReminders();
    renderHabits();
    renderUpcoming();
    renderUpcomingMobile();
    renderCalendar(calCurrentMonth, calCurrentYear);
    updateNotificationBubble();
}

// --- RENDER TASKS ---
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
        
        div.innerHTML = `
            <span class="${getBadgeClass(statusUpper)}">${statusUpper}</span>
            <span style="word-break: break-word;">${item.text}</span>
            <span class="${getBadgeClass(displayTag)}">${displayTag}</span>
            <span>${formatDateDisplay(item.date)}</span>
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

// --- RENDER GOALS ---
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
        
        div.innerHTML = `
            <span style="word-break: break-word;">${item.text}</span>
            <span class="${getBadgeClass(priorityUpper)}">${priorityUpper}</span>
            <span>${formatDateDisplay(item.date)}</span>
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

// --- RENDER REMINDERS ---
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
        const time12 = formatTime12Hour(item.time);
        const repeatUpper = (item.repeat || 'NONE').toUpperCase();
        div.innerHTML = `
            <span style="word-break: break-word;">${item.text}</span>
            <span>${formatDateDisplay(item.date)}</span>
            <span>${time12}</span>
            <span class="${getBadgeClass(repeatUpper)}">${repeatUpper}</span>
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

// --- RENDER HABITS ---
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
        const completedDates = item.completed_dates || [];
        const isCompletedToday = completedDates.includes(today);
        
        const streak = calculateStreak(completedDates);
        const weekProgress = calculateWeekProgress(completedDates);
        
        div.innerHTML = `
            <div class="habit-content">
                <div class="habit-text">${item.text}</div>
                <div class="habit-progress">
                    <div class="habit-progress-bar" style="width: ${weekProgress}%"></div>
                </div>
            </div>
            <span class="${getBadgeClass(item.frequency || 'Daily')}">${item.frequency || 'Daily'}</span>
            <button class="habit-check ${isCompletedToday ? 'completed' : ''}" onclick="toggleHabitToday(${index})">
                ${isCompletedToday ? '✓' : '○'}
            </button>
            <div class="habit-streak ${streak > 0 ? 'active' : ''}">
                🔥 ${streak} day${streak !== 1 ? 's' : ''}
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

// --- RENDER UPCOMING ---
function renderUpcoming() {
    renderUpcomingList("upcomingList", "upcomingTitle");
}

function renderUpcomingMobile() {
    renderUpcomingList("upcomingListMobile", "upcomingTitleMobile");
}

function renderUpcomingList(containerId, titleId) {
    const container = document.getElementById(containerId);
    const titleEl = document.getElementById(titleId);
    
    if (!container || !titleEl) return;
    
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

function resetFilter() {
    filterDate = null;
    renderUpcoming();
    renderUpcomingMobile();
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
    renderCalendarGrid("calDays", "calMonthYear", month, year);
    renderCalendarGrid("calDaysMobile", "calMonthYearMobile", month, year);
}

function renderCalendarGrid(containerId, titleId, month, year) {
    const container = document.getElementById(containerId);
    const titleEl = document.getElementById(titleId);
    
    if (!container) return;
    
    if (titleEl) {
        titleEl.innerText = `${MONTH_NAMES[month]} ${year}`;
    }
    
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

        if (dateStr === filterDate) {
            cell.classList.add("selected");
        } else if (today.getDate() === day && today.getMonth() === month && today.getFullYear() === year) {
            cell.classList.add("today");
        }

        cell.onclick = () => {
            filterDate = dateStr;
            renderUpcoming();
            renderUpcomingMobile();
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

// --- ADD ITEMS ---
function addItem(type) {
    if (type === "tasks") {
        const text = document.getElementById("taskInput").value.toUpperCase();
        const tag = document.getElementById("taskTag").value;
        const date = document.getElementById("taskDate").value;
        
        if (!text) {
            alert("Task text is required!");
            return;
        }
        if (!date) {
            alert("Task date is required!");
            return;
        }

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
        
        if (!text) {
            alert("Goal text is required!");
            return;
        }
        if (!date) {
            alert("Goal date is required!");
            return;
        }

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
        
        if (!text) {
            alert("Reminder text is required!");
            return;
        }
        if (!date) {
            alert("Reminder date is required!");
            return;
        }
        if (!time) {
            alert("Reminder time is required!");
            return;
        }

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
        
        if (!text) {
            alert("Habit text is required!");
            return;
        }

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

// --- EDIT MODAL ---
function openEditModal(type, index) {
    currentEditModal = { type, index };
    const item = data[type][index];
    
    const modal = document.getElementById("editModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalBody = document.getElementById("modalBody");
    
    modalTitle.innerText = `EDIT ${type.toUpperCase().slice(0, -1)}`;
    
    let formHTML = '';
    
    if (type === 'tasks') {
        const displayTag = (item.tags && item.tags.length > 0) ? item.tags[0] : 'PERSONAL';
        formHTML = `
            <div class="form-group">
                <label class="form-label">TASK TEXT</label>
                <input type="text" id="editText" value="${item.text}" class="input-text" required>
            </div>
            <div class="form-group">
                <label class="form-label">STATUS</label>
                <select id="editStatus" class="input-text">
                    ${STATUS_OPTS.map(opt => `<option value="${opt}" ${opt === item.status ? 'selected' : ''}>${opt}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">TAG</label>
                <select id="editTag" class="input-text">
                    ${TAG_OPTS.map(opt => `<option value="${opt}" ${opt === displayTag ? 'selected' : ''}>${opt}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">DATE</label>
                <input type="date" id="editDate" value="${item.date || ''}" class="input-text" required>
            </div>
        `;
    } else if (type === 'goals') {
        formHTML = `
            <div class="form-group">
                <label class="form-label">GOAL TEXT</label>
                <input type="text" id="editText" value="${item.text}" class="input-text" required>
            </div>
            <div class="form-group">
                <label class="form-label">PRIORITY</label>
                <select id="editPriority" class="input-text">
                    ${PRIORITY_OPTS.map(opt => `<option value="${opt}" ${opt === item.priority ? 'selected' : ''}>${opt}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">DATE</label>
                <input type="date" id="editDate" value="${item.date || ''}" class="input-text" required>
            </div>
        `;
    } else if (type === 'reminders') {
        formHTML = `
            <div class="form-group">
                <label class="form-label">REMINDER TEXT</label>
                <input type="text" id="editText" value="${item.text}" class="input-text" required>
            </div>
            <div class="form-group">
                <label class="form-label">DATE</label>
                <input type="date" id="editDate" value="${item.date || ''}" class="input-text" required>
            </div>
            <div class="form-group">
                <label class="form-label">TIME</label>
                <input type="time" id="editTime" value="${item.time || ''}" class="input-text" required>
            </div>
            <div class="form-group">
                <label class="form-label">REPEAT</label>
                <select id="editRepeat" class="input-text">
                    ${REPEAT_OPTS.map(opt => `<option value="${opt}" ${opt === item.repeat ? 'selected' : ''}>${opt}</option>`).join('')}
                </select>
            </div>
        `;
    } else if (type === 'habits') {
        formHTML = `
            <div class="form-group">
                <label class="form-label">HABIT TEXT</label>
                <input type="text" id="editText" value="${item.text}" class="input-text" required>
            </div>
            <div class="form-group">
                <label class="form-label">FREQUENCY</label>
                <select id="editFrequency" class="input-text">
                    ${FREQUENCY_OPTS.map(opt => `<option value="${opt}" ${opt === item.frequency ? 'selected' : ''}>${opt}</option>`).join('')}
                </select>
            </div>
        `;
    }
    
    modalBody.innerHTML = `<form class="modal-form" onsubmit="event.preventDefault(); saveEditModal();">${formHTML}</form>`;
    modal.classList.add('active');
}

function closeEditModal() {
    const modal = document.getElementById("editModal");
    if (modal) modal.classList.remove('active');
    currentEditModal = null;
}

function saveEditModal() {
    if (!currentEditModal) return;
    
    const { type, index } = currentEditModal;
    const item = data[type][index];
    const id = item.id;
    
    let updateData = {};
    let url = '';
    
    if (type === 'tasks') {
        const text = document.getElementById('editText').value.trim().toUpperCase();
        const status = document.getElementById('editStatus').value;
        const tag = document.getElementById('editTag').value;
        const date = document.getElementById('editDate').value;
        
        if (!text || !date) {
            alert('All fields are required!');
            return;
        }
        
        updateData = { text, status, tags: tag, date };
        url = `/updateTask/${id}`;
    } else if (type === 'goals') {
        const text = document.getElementById('editText').value.trim().toUpperCase();
        const priority = document.getElementById('editPriority').value;
        const date = document.getElementById('editDate').value;
        
        if (!text || !date) {
            alert('All fields are required!');
            return;
        }
        
        updateData = { text, priority, date };
        url = `/updateGoal/${id}`;
    } else if (type === 'reminders') {
        const text = document.getElementById('editText').value.trim().toUpperCase();
        const date = document.getElementById('editDate').value;
        const time = document.getElementById('editTime').value;
        const repeat = document.getElementById('editRepeat').value;
        
        if (!text || !date || !time) {
            alert('All fields are required!');
            return;
        }
        
        updateData = { text, date, time, repeat };
        url = `/updateReminder/${id}`;
    } else if (type === 'habits') {
        const text = document.getElementById('editText').value.trim().toUpperCase();
        const frequency = document.getElementById('editFrequency').value;
        
        if (!text) {
            alert('Habit text is required!');
            return;
        }
        
        updateData = { text, frequency };
        url = `/updateHabit/${id}`;
    }
    
    fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
    })
    .then(response => response.json())
    .then(() => {
        if (type === 'tasks') loadTasksFromDB();
        if (type === 'goals') loadGoalsFromDB();
        if (type === 'reminders') loadRemindersFromDB();
        if (type === 'habits') loadHabitsFromDB();
        closeEditModal();
    })
    .catch(error => {
        console.error('Update error:', error);
        alert('Error updating item');
    });
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

// --- TABS ---
function switchTab(tabName) {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    event.target.classList.add("active");
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
    document.getElementById("tab-" + tabName).classList.add("active");
}

// --- MOBILE SIDEBAR ---
function toggleMobileSidebar() {
    const overlay = document.getElementById('sidebarOverlay');
    const panel = document.getElementById('sidebarPanel');
    
    if (overlay && panel) {
        if (overlay.classList.contains('active')) {
            overlay.classList.remove('active');
            panel.classList.remove('active');
        } else {
            overlay.classList.add('active');
            panel.classList.add('active');
        }
    }
}

function closeMobileSidebar() {
    const overlay = document.getElementById('sidebarOverlay');
    const panel = document.getElementById('sidebarPanel');
    if (overlay) overlay.classList.remove('active');
    if (panel) panel.classList.remove('active');
}

// --- NOTIFICATION PANEL ---
function toggleNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    if (panel) {
        if (panel.classList.contains('active')) {
            panel.classList.remove('active');
        } else {
            renderNotificationPanel();
            panel.classList.add('active');
        }
    }
}

function closeNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    if (panel) panel.classList.remove('active');
}

function renderNotificationPanel() {
    const content = document.getElementById('notificationPanelContent');
    const clearBtn = document.getElementById('clearAllBtn');
    if (!content) return;
    
    content.innerHTML = '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    let notifications = [];
    
    // Upcoming reminders (today and tomorrow)
    data.reminders.forEach(r => {
        if (r.date) {
            const d = new Date(r.date);
            d.setHours(0, 0, 0, 0);
            if (d >= today && d <= tomorrow) {
                notifications.push({
                    type: 'REMINDER',
                    text: r.text,
                    date: formatDateDisplay(r.date),
                    time: r.time ? formatTime12Hour(r.time) : '',
                    isOverdue: false,
                    id: r.id,
                    itemType: 'reminder'
                });
            }
        }
    });
    
    // Overdue tasks
    data.tasks.forEach(t => {
        if (t.date && t.status !== 'COMPLETED' && t.status !== 'CANCELLED') {
            const d = new Date(t.date);
            d.setHours(0, 0, 0, 0);
            if (d < today) {
                notifications.push({
                    type: 'OVERDUE TASK',
                    text: t.text,
                    date: formatDateDisplay(t.date),
                    isOverdue: true,
                    id: t.id,
                    itemType: 'task'
                });
            }
        }
    });
    
    if (notifications.length === 0) {
        content.innerHTML = '<div class="notification-empty">✓ All caught up!<br><span style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 8px; display: block;">No pending notifications</span></div>';
        if (clearBtn) clearBtn.style.display = 'none';
        return;
    }
    
    // Show Clear All button
    if (clearBtn) clearBtn.style.display = 'block';
    
    // Sort: overdue first, then by date
    notifications.sort((a, b) => {
        if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
        return 0;
    });
    
    notifications.forEach(n => {
        const div = document.createElement('div');
        div.className = 'notification-item';
        div.innerHTML = `
            <div class="notification-item-type ${n.isOverdue ? 'overdue' : ''}">${n.type}</div>
            <div class="notification-item-text">${n.text}</div>
            <div class="notification-item-date">${n.date}${n.time ? ' • ' + n.time : ''}</div>
        `;
        content.appendChild(div);
    });
}

function clearAllNotifications() {
    if (!confirm('Clear all notifications? This will mark overdue tasks as completed.')) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let updatePromises = [];
    
    // Mark all overdue tasks as completed
    data.tasks.forEach((t) => {
        if (t.date && t.status !== 'COMPLETED' && t.status !== 'CANCELLED') {
            const d = new Date(t.date);
            d.setHours(0, 0, 0, 0);
            if (d < today) {
                // Update status to completed
                const promise = fetch(`/updateTask/${t.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        text: t.text,
                        status: 'COMPLETED',
                        tags: (t.tags && t.tags.length > 0) ? t.tags[0] : 'PERSONAL',
                        date: t.date
                    })
                }).catch(err => console.error('Error updating task:', err));
                updatePromises.push(promise);
            }
        }
    });
    
    // Wait for all updates, then reload
    Promise.all(updatePromises).then(() => {
        loadTasksFromDB();
        loadRemindersFromDB();
        closeNotificationPanel();
        
        // Show success message
        alert('✓ All notifications cleared!');
    });
}

// --- LOAD DATA ---
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
            renderUpcomingMobile();
            updateNotificationBubble();
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
            renderUpcomingMobile();
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
            renderUpcomingMobile();
            updateNotificationBubble();
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

// Request notification permission
setTimeout(() => {
    requestNotificationPermission();
}, 2000);

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('editModal');
    if (e.target === modal) {
        closeEditModal();
    }
});

// Close sidebar when clicking overlay
document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'sidebarOverlay') {
        closeMobileSidebar();
    }
});

// Close notification panel when clicking outside
document.addEventListener('click', (e) => {
    const panel = document.getElementById('notificationPanel');
    const iconWrapper = document.querySelector('.notification-icon-wrapper');
    if (panel && !panel.contains(e.target) && iconWrapper && !iconWrapper.contains(e.target)) {
        closeNotificationPanel();
    }
});