let applications =
    JSON.parse(localStorage.getItem("applications")) || [];

const statusColors = {
    Applied: "#3b82f6",
    Shortlisted: "#f59e0b",
    Interview: "#8b5cf6",
    Selected: "#16a34a",
    Rejected: "#dc2626"
};

function saveProfile() {

    const name = document.getElementById("studentName").value;
    const branch = document.getElementById("branch").value;
    const skills = document.getElementById("skills").value;
    const resumeLink = document.getElementById("resumeLink").value;

    localStorage.setItem("studentName", name);
    localStorage.setItem("branch", branch);
    localStorage.setItem("skills", skills);
    localStorage.setItem("resumeLink", resumeLink);

    document.getElementById("profileMessage").innerText =
        "Profile saved successfully!";

    setTimeout(() => {
        document.getElementById("profileMessage").innerText = "";
    }, 2500);

    updateDashboard();
}

function addApplication() {

    const company = document.getElementById("company").value.trim();
    const role = document.getElementById("role").value.trim();
    const status = document.getElementById("status").value;

    if (company === "") {
        alert("Please enter company name");
        return;
    }

    const duplicate = applications.some(app =>
        app.company.toLowerCase() === company.toLowerCase() &&
        (app.role || "").toLowerCase() === role.toLowerCase()
    );

    if (duplicate) {
        alert("You've already added an application for this company & role!");
        return;
    }

    const application = {
        id: Date.now(),
        company: company,
        role: role,
        status: status,
        date: new Date().toLocaleDateString("en-IN")
    };

    applications.push(application);
    persist();

    document.getElementById("company").value = "";
    document.getElementById("role").value = "";

    displayApplications();
    updateDashboard();
}

function updateStatus(id, newStatus) {
    const app = applications.find(a => a.id === id);
    if (app) {
        app.status = newStatus;
        persist();
        displayApplications();
        updateDashboard();
    }
}

function displayApplications() {

    const list = document.getElementById("applicationList");
    const search = document.getElementById("searchBox").value.toLowerCase();
    const filter = document.getElementById("filterStatus").value;

    let filtered = applications.filter(app => {
        const matchesSearch = app.company.toLowerCase().includes(search);
        const matchesFilter = filter === "All" || app.status === filter;
        return matchesSearch && matchesFilter;
    });

    list.innerHTML = "";

    if (filtered.length === 0) {
        list.innerHTML = "<p class='empty-text'>No applications found.</p>";
        return;
    }

    filtered.slice().reverse().forEach(app => {

        const div = document.createElement("div");
        div.className = "application";

        div.innerHTML = `
            <div class="app-info">
                <strong>${escapeHTML(app.company)}</strong>
                ${app.role ? `<span class="role-tag">${escapeHTML(app.role)}</span>` : ""}
                <p class="app-date">Applied on: ${app.date || "—"}</p>
            </div>

            <div class="app-actions">
                <select onchange="updateStatus(${app.id}, this.value)" class="status-select status-${app.status}">
                    <option value="Applied" ${app.status === "Applied" ? "selected" : ""}>Applied</option>
                    <option value="Shortlisted" ${app.status === "Shortlisted" ? "selected" : ""}>Shortlisted</option>
                    <option value="Interview" ${app.status === "Interview" ? "selected" : ""}>Interview</option>
                    <option value="Selected" ${app.status === "Selected" ? "selected" : ""}>Selected</option>
                    <option value="Rejected" ${app.status === "Rejected" ? "selected" : ""}>Rejected</option>
                </select>

                <button class="delete-btn" onclick="deleteApplication(${app.id})">Delete</button>
            </div>
        `;

        list.appendChild(div);
    });
}

function deleteApplication(id) {
    const confirmDelete = confirm("Are you sure you want to delete this application?");
    if (!confirmDelete) return;

    applications = applications.filter(app => app.id !== id);
    persist();
    displayApplications();
    updateDashboard();
}

function persist() {
    localStorage.setItem("applications", JSON.stringify(applications));
}

function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function updateDashboard() {

    document.getElementById("totalApplications").innerText = applications.length;

    document.getElementById("shortlisted").innerText =
        applications.filter(app => app.status === "Shortlisted").length;

    document.getElementById("interviews").innerText =
        applications.filter(app => app.status === "Interview").length;

    const skills = localStorage.getItem("skills") || "";
    const skillCount = skills.split(",").map(s => s.trim()).filter(s => s !== "").length;
    document.getElementById("skillsCount").innerText = skillCount;

    renderChart();
}

function renderChart() {
    const chartDiv = document.getElementById("chartBars");

    if (applications.length === 0) {
        chartDiv.innerHTML = "<p class='empty-text'>Add applications to see the chart.</p>";
        return;
    }

    const counts = {};
    applications.forEach(app => {
        counts[app.status] = (counts[app.status] || 0) + 1;
    });

    const max = Math.max(...Object.values(counts));

    chartDiv.innerHTML = "";
    Object.keys(statusColors).forEach(status => {
        const count = counts[status] || 0;
        const height = max > 0 ? (count / max) * 100 : 0;

        const bar = document.createElement("div");
        bar.className = "bar-group";
        bar.innerHTML = `
            <div class="bar-count">${count}</div>
            <div class="bar" style="height:${height}%; background:${statusColors[status]}"></div>
            <div class="bar-label">${status}</div>
        `;
        chartDiv.appendChild(bar);
    });
}

function exportData() {
    if (applications.length === 0) {
        alert("No applications to export yet!");
        return;
    }

    let csv = "Company,Role,Status,Date\n";
    applications.forEach(app => {
        csv += `${app.company},${app.role || ""},${app.status},${app.date || ""}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "placement_applications.csv";
    a.click();
    URL.revokeObjectURL(url);
}

function toggleTheme() {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    document.getElementById("themeToggle").innerText = isDark ? "☀️" : "🌙";
}

window.onload = function () {

    document.getElementById("studentName").value = localStorage.getItem("studentName") || "";
    document.getElementById("branch").value = localStorage.getItem("branch") || "";
    document.getElementById("skills").value = localStorage.getItem("skills") || "";
    document.getElementById("resumeLink").value = localStorage.getItem("resumeLink") || "";

    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark");
        document.getElementById("themeToggle").innerText = "☀️";
    }

    document.getElementById("themeToggle").addEventListener("click", toggleTheme);

    displayApplications();
    updateDashboard();
};