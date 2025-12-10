// --- DATA STATE ---
            let data = {
                tasks: [
                    {
                        id: 1,
                        text: "MAKE BQ SITE",
                        status: "IN PROGRESS",
                        tag: "PROJECTS",
                        date: "2025-06-24",
                    },
                    {
                        id: 2,
                        text: "ASSIGNMENT",
                        status: "NOT STARTED",
                        tag: "HOMEWORK",
                        date: "2025-07-06",
                    },
                ],
                goals: [
                    {
                        id: 1,
                        text: "MAKE 100K",
                        priority: "MEDIUM",
                        date: "2025-06-24",
                    },
                    {
                        id: 2,
                        text: "GET A JOB",
                        priority: "HIGH",
                        date: "2025-08-20",
                    },
                ],
                reminders: [
                    {
                        id: 1,
                        text: "JEFF BOT HOSTING",
                        date: "2025-06-24",
                        time: "14:00",
                        repeat: "BI-WEEKLY",
                    },
                    {
                        id: 2,
                        text: "BUY APPLES",
                        date: "2025-08-20",
                        time: "09:00",
                        repeat: "NONE",
                    },
                ],
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
                    const text = document
                        .getElementById("taskInput")
                        .value.toUpperCase();
                    const tag = document.getElementById("taskTag").value;
                    const date =
                        document.getElementById("taskDate").value ||
                        new Date().toISOString().split("T")[0];
                    if (!text) return;
                    data.tasks.push({ text, tag, date, status: "NOT STARTED" });
                    document.getElementById("taskInput").value = "";
                } else if (type === "goals") {
                    const text = document
                        .getElementById("goalInput")
                        .value.toUpperCase();
                    const priority =
                        document.getElementById("goalPriority").value;
                    const date =
                        document.getElementById("goalDate").value ||
                        new Date().toISOString().split("T")[0];
                    if (!text) return;
                    data.goals.push({ text, priority, date });
                    document.getElementById("goalInput").value = "";
                } else if (type === "reminders") {
                    const text = document
                        .getElementById("remInput")
                        .value.toUpperCase();
                    const repeat = document.getElementById("remRepeat").value;
                    const time = document.getElementById("remTime").value;
                    const date =
                        document.getElementById("remDate").value ||
                        new Date().toISOString().split("T")[0];
                    if (!text) return;
                    data.reminders.push({ text, repeat, time, date });
                    document.getElementById("remInput").value = "";
                }
                renderAll();
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