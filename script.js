// ==================== FIREBASE SETUP ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    setDoc,
    getDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyASFrFVBdzqV5AYvagRAQFyGfEzTebT3_A",
    authDomain: "student-placement-tracke-98e3d.firebaseapp.com",
    projectId: "student-placement-tracke-98e3d",
    storageBucket: "student-placement-tracke-98e3d.firebasestorage.app",
    messagingSenderId: "602557933834",
    appId: "1:602557933834:web:7f5bbe51c5145f9a8bf2f3",
    measurementId: "G-47QRJLQQKT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const applicationsCol = collection(db, "applications");
const profileDocRef = doc(db, "profile", "main");

// ==================== STATE ====================
let applications = [];

const statusColors = {
    Applied: "#3b82f6",
    Shortlisted: "#f59e0b",
    Interview: "#8b5cf6",
    Selected: "#16a34a",
    Rejected: "#dc2626"
};

// ==================== PROFILE ====================
async function saveProfile() {

    const name = document.getElementById("studentName").value;
    const branch = document.getElementById("branch").value;
    const skills = document.getElementById("skills").value;
    const resumeLink = document.getElementById("resumeLink").value;

    try {
        await setDoc(profileDocRef, { name, branch, skills, resumeLink });

        document.getElementById("profileMessage").innerText =
            "Profile saved successfully!";

        setTimeout(() => {
            document.getElementById("profileMessage").innerText = "";
        }, 2500);

        updateDashboard();
    } catch (err) {
        console.error("Error saving profile:", err);
        document.getElementById("profileMessage").innerText =
            "Error saving profile. Check console.";
    }
}

async function loadProfile() {
    try {
        const snap = await getDoc(profileDocRef);
        if (snap.exists()) {
            const data = snap.data();
            document.getElementById("studentName").value = data.name || "";
            document.getElementById("branch").value = data.branch || "";
            document.getElementById("skills").value = data.skills || "";
            document.getElementById("resumeLink").value = data.resumeLink || "";
        }
    } catch (err) {
        console.error("Error loading profile:", err);
    }
    updateDashboard();
}

// ==================== APPLICATIONS ====================
async function addApplication() {

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

    try {
        await addDoc(applicationsCol, {
            company,
            role,
            status,
            date: new Date().toLocaleDateString("en-IN"),
            createdAt: Date.now()
        });

        document.getElementById("company").value = "";
        document.getElementById("role").value = "";
    } catch (err) {
        console.error("Error adding application:", err);
        alert("Could not add application. Check console for details.");
    }
}

async function updateStatus(id, newStatus) {
    try {
        await updateDoc(doc(db, "applications", id), { status: newStatus });
    } catch (err) {
        console.error("Error updating status:", err);
    }
}

async function deleteApplication(id) {
    const confirmDelete = confirm("Are you sure you want to delete this application?");
    if (!confirmDelete) return;

    try {
        await deleteDoc(doc(db, "applications", id));
    } catch (err) {
        console.error("Error deleting application:", err);
    }
}

// Real-time listener - keeps data live-synced across all devices/browsers
function listenToApplications() {
    onSnapshot(applicationsCol, (snapshot) => {
        applications = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
        })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        displayApplications();
        updateDashboard();
    }, (err) => {
        console.error("Error listening to applications:", err);
    });
}

// ==================== RENDER ====================
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

    filtered.forEach(app => {

        const div = document.createElement("div");
        div.className = "application";

        div.innerHTML = `
            <div class="app-info">
                <strong>${escapeHTML(app.company)}</strong>
                ${app.role ? `<span class="role-tag">${escapeHTML(app.role)}</span>` : ""}
                <p class="app-date">Applied on: ${app.date || "—"}</p>
            </div>

            <div class="app-actions">
                <select onchange="updateStatus('${app.id}', this.value)" class="status-select status-${app.status}">
                    <option value="Applied" ${app.status === "Applied" ? "selected" : ""}>Applied</option>
                    <option value="Shortlisted" ${app.status === "Shortlisted" ? "selected" : ""}>Shortlisted</option>
                    <option value="Interview" ${app.status === "Interview" ? "selected" : ""}>Interview</option>
                    <option value="Selected" ${app.status === "Selected" ? "selected" : ""}>Selected</option>
                    <option value="Rejected" ${app.status === "Rejected" ? "selected" : ""}>Rejected</option>
                </select>

                <button class="delete-btn" onclick="deleteApplication('${app.id}')">Delete</button>
            </div>
        `;

        list.appendChild(div);
    });
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

    const skills = document.getElementById("skills").value || "";
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

// ==================== INIT ====================
window.onload = function () {

    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark");
        document.getElementById("themeToggle").innerText = "☀️";
    }

    document.getElementById("themeToggle").addEventListener("click", toggleTheme);

    loadProfile();
    listenToApplications();
};

// Expose functions used via inline onclick/onchange in HTML
// (needed because this file is loaded as an ES module)
window.saveProfile = saveProfile;
window.addApplication = addApplication;
window.updateStatus = updateStatus;
window.deleteApplication = deleteApplication;
window.exportData = exportData;
window.displayApplications = displayApplications;