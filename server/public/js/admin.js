// Ensure user is authenticated as Admin
if (!checkAuth('admin')) {
    throw new Error('Unauthenticated or unauthorized');
}

const statusFilterBtn = document.getElementById('status-filter');
const submissionsList = document.getElementById('submissions-list');

// Task Modal elements
const taskModal = document.getElementById('task-modal');
const taskModalContent = document.getElementById('task-modal-content');
const createTaskForm = document.getElementById('create-task-form');

// Verify Modal elements
const verifyModal = document.getElementById('verify-modal');
const verifyModalContent = document.getElementById('verify-modal-content');
const verifyForm = document.getElementById('verify-form');
const verifySubId = document.getElementById('verify-sub-id');
const verifyStatus = document.getElementById('verify-status');
const verifyFeedback = document.getElementById('verify-feedback');
const verifySubmitBtn = document.getElementById('verify-submit-btn');

async function initAdmin() {
    statusFilterBtn.addEventListener('change', () => {
        loadSubmissions(statusFilterBtn.value);
    });

    const intStatusFilter = document.getElementById('internship-status-filter');
    if (intStatusFilter) {
        intStatusFilter.addEventListener('change', () => {
            loadAllInternships(intStatusFilter.value);
        });
    }

    await loadStats();
    await loadSubmissions('pending');
    await loadAllInternships('pending');
}

async function loadStats() {
    try {
        const stats = await apiFetch('/admin/stats');
        document.getElementById('stat-users').textContent = stats.totalUsers;
        document.getElementById('stat-completed').textContent = stats.totalTasksCompleted;
        document.getElementById('stat-pending').textContent = stats.pendingApprovals;
    } catch (e) {
        console.error('Failed to load stats', e);
    }
}

async function loadSubmissions(status = '') {
    submissionsList.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-gray-500"><i class="fas fa-spinner fa-spin mr-2"></i> Loading...</td></tr>';

    try {
        const query = status ? `?status=${status}` : '';
        const subs = await apiFetch(`/admin/submissions${query}`);

        if (subs.length === 0) {
            submissionsList.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-gray-500">No submissions found.</td></tr>';
            return;
        }

        renderSubmissions(subs);
    } catch (error) {
        submissionsList.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-red-400">Error: ${error.message}</td></tr>`;
    }
}

function renderSubmissions(subs) {
    submissionsList.innerHTML = '';

    subs.forEach(sub => {
        let statusBadge = '';
        if (sub.status === 'pending') statusBadge = '<span class="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 w-inline-block"><i class="fas fa-clock mr-1"></i> Pending</span>';
        else if (sub.status === 'approved') statusBadge = '<span class="px-2.5 py-1 text-xs font-semibold rounded-md bg-secondary/20 text-secondary border border-secondary/30 w-inline-block"><i class="fas fa-check mr-1"></i> Approved</span>';
        else if (sub.status === 'rejected') statusBadge = '<span class="px-2.5 py-1 text-xs font-semibold rounded-md bg-red-500/20 text-red-400 border border-red-500/30 w-inline-block"><i class="fas fa-times mr-1"></i> Rejected</span>';

        // Check if proof is a URL or uploaded file
        let proofHtml = sub.proof;
        const urlRegex = /^(http|https):\/\/[^ "]+$/;
        
        if (sub.proof && sub.proof.startsWith('/uploads/')) {
            proofHtml = `<a href="${sub.proof}" target="_blank" class="px-3 py-1.5 bg-primary/20 text-primary hover:bg-primary/30 rounded-lg transition-colors inline-flex items-center"><i class="fas fa-image mr-2"></i> View Image</a>`;
        } else if (urlRegex.test(sub.proof.trim())) {
            proofHtml = `<a href="${sub.proof.trim()}" target="_blank" class="text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center"><i class="fas fa-external-link-alt mr-1 text-xs"></i> View Link</a>`;
        } else if (sub.proof.length > 50) {
            proofHtml = `<span title="${sub.proof.replace(/"/g, '&quot;')}">${sub.proof.substring(0, 50)}...</span>`;
        }

        if (sub.githubValidation && sub.githubValidation.status !== 'none') {
            const v = sub.githubValidation;
            let vClass = v.status === 'valid' ? 'text-emerald-400' : v.status === 'pending' ? 'text-blue-400' : 'text-red-400';
            let vIcon = v.status === 'valid' ? 'fa-check-circle' : v.status === 'pending' ? 'fa-clock' : 'fa-exclamation-circle';
            proofHtml += `<div class="mt-2 text-xs font-medium ${vClass}"><i class="fas ${vIcon} mr-1"></i> GitHub <span>${v.status.charAt(0).toUpperCase() + v.status.slice(1)}</span></div>`;
            if (v.status === 'valid' && v.repoDetails) {
                 proofHtml += `<div class="text-[10px] text-gray-500 mt-1"><i class="fas fa-star text-yellow-500/80 mr-1"></i>${v.repoDetails.stars || 0} stars <span class="mx-1">•</span> <i class="fas fa-history mr-1"></i>Last push: ${new Date(v.repoDetails.lastCommit).toLocaleDateString()}</div>`;
            } else if (v.message) {
                 proofHtml += `<div class="text-[10px] text-red-400/80 mt-1">${v.message}</div>`;
            }
        }

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-800/40 transition-colors group';
        tr.innerHTML = `
            <td class="p-4">
                <div class="font-medium text-white">${sub.user?.name || 'Unknown'}</div>
                <div class="text-xs text-gray-400 mt-0.5">${sub.user?.email || ''}</div>
            </td>
            <td class="p-4 font-medium text-gray-200">${sub.task?.title || 'Unknown Task'}</td>
            <td class="p-4"><span class="text-[10px] uppercase tracking-wider font-bold bg-gray-800 px-2.5 py-1 rounded text-gray-300 border border-gray-700">${sub.task?.type || '-'}</span></td>
            <td class="p-4 text-gray-300">
                ${proofHtml}
            </td>
            <td class="p-4">${statusBadge}</td>
            <td class="p-4 text-right">
                ${sub.status === 'pending' ? `
                    <div class="flex justify-end space-x-2">
                        <button onclick="promptVerify('${sub._id}', 'approved')" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors border border-transparent hover:border-secondary/30" title="Approve"><i class="fas fa-check"></i></button>
                        <button onclick="promptVerify('${sub._id}', 'rejected')" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/30" title="Reject"><i class="fas fa-times"></i></button>
                    </div>
                ` : `<span class="text-xs text-gray-500 font-medium bg-gray-800/50 px-2 py-1 rounded border border-gray-700">Processed</span>`}
            </td>
        `;
        submissionsList.appendChild(tr);
    });
}

// ------ Task Creation ------

async function openTaskModal() {
    document.getElementById('create-task-form').reset();
    
    // Load students for assignment checkboxes
    const assignContainer = document.getElementById('assign-checkbox-list');
    assignContainer.innerHTML = '<label class="flex items-center space-x-2 text-sm text-gray-400"><i class="fas fa-spinner fa-spin"></i> <span>Loading students...</span></label>';

    try {
        // allStudents is declared in the global scope later in the file for attendance, but if it's empty, fetch here
        if (typeof allStudents === 'undefined' || allStudents.length === 0) {
            // we will just fetch it directly to be safe, caching as needed
            if(typeof window.adminUsersCache === 'undefined') {
                window.adminUsersCache = await apiFetch('/admin/users');
            }
        } else {
             window.adminUsersCache = allStudents;
        }
        
        const usersToRender = window.adminUsersCache || [];
        
        if (usersToRender.length === 0) {
            assignContainer.innerHTML = '<p class="text-sm text-gray-500 px-2 my-1">No students available.</p>';
        } else {
            assignContainer.innerHTML = usersToRender.map(student => `
                <label class="flex items-center space-x-3 cursor-pointer p-1.5 rounded-lg hover:bg-gray-800/60 transition-colors">
                    <input type="checkbox" name="assign_users" value="${student._id}" class="w-4 h-4 text-primary bg-darkBg border-gray-600 rounded focus:ring-primary focus:ring-2">
                    <span class="text-sm text-gray-300 font-medium">${student.name} <span class="text-xs text-gray-500 font-normal ml-1 hidden sm:inline-block">(${student.email})</span></span>
                </label>
            `).join('');
        }
    } catch(err) {
        assignContainer.innerHTML = '<p class="text-sm text-red-400">Failed to load students.</p>';
    }

    taskModal.classList.remove('hidden');
    taskModal.classList.add('flex');
    setTimeout(() => {
        taskModalContent.classList.remove('scale-95', 'opacity-0');
        taskModalContent.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function closeTaskModal() {
    taskModalContent.classList.remove('scale-100', 'opacity-100');
    taskModalContent.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        taskModal.classList.add('hidden');
        taskModal.classList.remove('flex');
    }, 300);
}

createTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('task-submit-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Creating...';

    const checkedBoxes = document.querySelectorAll('input[name="assign_users"]:checked');
    const assignedTo = Array.from(checkedBoxes).map(cb => cb.value);

    try {
        await apiFetch('/admin/tasks', {
            method: 'POST',
            body: JSON.stringify({
                title: document.getElementById('task-title').value,
                type: document.getElementById('task-type').value,
                description: document.getElementById('task-desc').value,
                day: document.getElementById('task-day').value || null,
                assignedTo: assignedTo // Empty array means global assignment
            })
        });
        closeTaskModal();
    } catch (err) {
        alert(err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Create Task';
    }
});

// ------ Student Creation ------
const studentModal = document.getElementById('student-modal');
const studentModalContent = document.getElementById('student-modal-content');
const createStudentForm = document.getElementById('create-student-form');

function openStudentModal() {
    createStudentForm.reset();
    studentModal.classList.remove('hidden');
    studentModal.classList.add('flex');
    setTimeout(() => {
        studentModalContent.classList.remove('scale-95', 'opacity-0');
        studentModalContent.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function closeStudentModal() {
    studentModalContent.classList.remove('scale-100', 'opacity-100');
    studentModalContent.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        studentModal.classList.add('hidden');
        studentModal.classList.remove('flex');
    }, 300);
}

createStudentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('student-submit-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Creating...';

    try {
        await apiFetch('/admin/users', {
            method: 'POST',
            body: JSON.stringify({
                name: document.getElementById('student-name').value,
                email: document.getElementById('student-email').value,
                password: document.getElementById('student-password').value
            })
        });
        
        // Clear caches so the new student appears in attendance/assign lists
        if (typeof allStudents !== 'undefined') allStudents = [];
        window.adminUsersCache = undefined;
        if (typeof loadStats === 'function') loadStats(); // Re-fetch total users number

        closeStudentModal();
        alert('Student account created successfully!');
    } catch (err) {
        alert(err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Create Account';
    }
});

// ------ Verification Flow ------

function promptVerify(id, status) {
    verifySubId.value = id;
    verifyStatus.value = status;
    verifyFeedback.value = '';

    if (status === 'approved') {
        verifySubmitBtn.className = 'px-5 py-2.5 rounded-lg text-sm font-medium text-white shadow-lg bg-secondary hover:bg-green-600 focus:ring-4 focus:ring-secondary/30 transition-colors flex items-center';
        verifySubmitBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Approve';
    } else {
        verifySubmitBtn.className = 'px-5 py-2.5 rounded-lg text-sm font-medium text-white shadow-lg bg-red-500 hover:bg-red-600 focus:ring-4 focus:ring-red-500/30 transition-colors flex items-center';
        verifySubmitBtn.innerHTML = '<i class="fas fa-times-circle mr-2"></i> Reject';
    }

    verifyModal.classList.remove('hidden');
    verifyModal.classList.add('flex');
    setTimeout(() => {
        verifyModalContent.classList.remove('scale-95', 'opacity-0');
        verifyModalContent.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function closeVerifyModal() {
    verifyModalContent.classList.remove('scale-100', 'opacity-100');
    verifyModalContent.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        verifyModal.classList.add('hidden');
        verifyModal.classList.remove('flex');
    }, 300);
}

verifyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    verifySubmitBtn.disabled = true;
    const originalContent = verifySubmitBtn.innerHTML;
    verifySubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';

    try {
        await apiFetch(`/admin/submissions/${verifySubId.value}`, {
            method: 'PUT',
            body: JSON.stringify({
                status: verifyStatus.value,
                feedback: verifyFeedback.value
            })
        });

        closeVerifyModal();
        await loadStats();
        await loadSubmissions(statusFilterBtn.value);
    } catch (err) {
        alert(err.message);
    } finally {
        verifySubmitBtn.disabled = false;
        verifySubmitBtn.innerHTML = originalContent;
    }
});

initAdmin();

const panelVerification = document.getElementById('panel-verification');
const panelAttendance = document.getElementById('panel-attendance');
const panelInternships = document.getElementById('panel-internships');
const panelStudents = document.getElementById('panel-students');

const navVerification = document.getElementById('nav-verification');
const navAttendance = document.getElementById('nav-attendance');
const navInternships = document.getElementById('nav-internships');
const navStudents = document.getElementById('nav-students');

const headerActions = document.getElementById('header-actions');
const headerTitle = document.getElementById('header-title');
const headerDesc = document.getElementById('header-desc');

window.switchTab = function (tab) {
    [panelVerification, panelAttendance, panelInternships, panelStudents].forEach(p => {
        if(p) p.classList.add('hidden')
    });
    [navVerification, navAttendance, navInternships, navStudents].forEach(n => {
        if(n) n.className = 'flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-cardHover hover:text-white transition-colors w-full'
    });

    if (tab !== 'verification') {
        if(headerActions) headerActions.classList.add('hidden');
    } else {
        if(headerActions) headerActions.classList.remove('hidden');
    }

    if (tab === 'verification') {
        panelVerification.classList.remove('hidden');
        navVerification.className = 'flex items-center space-x-3 px-4 py-3 rounded-lg bg-red-500/20 text-red-500 font-medium transition-colors w-full';
        if(headerTitle) headerTitle.textContent = "Verification Dashboard";
        if(headerDesc) headerDesc.textContent = "Manage tasks, exports, and verify submissions.";
    } else if (tab === 'attendance') {
        panelAttendance.classList.remove('hidden');
        navAttendance.className = 'flex items-center space-x-3 px-4 py-3 rounded-lg bg-red-500/20 text-red-500 font-medium transition-colors w-full';
        if(headerTitle) headerTitle.textContent = "Attendance Log";
        if(headerDesc) headerDesc.textContent = "Record and review staff and student daily check-ins.";
        loadAttendanceView();
    } else if (tab === 'internships') {
        if(panelInternships) panelInternships.classList.remove('hidden');
        if(navInternships) navInternships.className = 'flex items-center space-x-3 px-4 py-3 rounded-lg bg-red-500/20 text-red-500 font-medium transition-colors w-full';
        if(headerTitle) headerTitle.textContent = "Internships Pipeline";
        if(headerDesc) headerDesc.textContent = "Overview and validation of active student industry internships.";
    } else if (tab === 'students') {
        if(panelStudents) panelStudents.classList.remove('hidden');
        if(navStudents) navStudents.className = 'flex items-center space-x-3 px-4 py-3 rounded-lg bg-red-500/20 text-red-500 font-medium transition-colors w-full';
        if(headerTitle) headerTitle.textContent = "User Registry";
        if(headerDesc) headerDesc.textContent = "Centralized student directory profiles and historical progression records.";
        loadStudentsTab();
    }
};

const attendanceDateInput = document.getElementById('attendance-date');
const attendanceList = document.getElementById('attendance-list');
const saveAttendanceBtn = document.getElementById('save-attendance-btn');

let allStudents = [];
let currentAttendance = [];

if (attendanceDateInput) attendanceDateInput.addEventListener('change', loadAttendanceData);

async function loadAttendanceView() {
    if (!attendanceDateInput.value) {
        attendanceDateInput.value = new Date().toISOString().split('T')[0];
    }
    if (allStudents.length === 0) {
        try {
            allStudents = await apiFetch('/admin/users');
        } catch (e) {
            console.error('Failed to load students', e);
        }
    }
    loadAttendanceData();
}

async function loadAttendanceData() {
    attendanceList.innerHTML = '<tr><td colspan="3" class="p-8 text-center text-gray-500"><i class="fas fa-spinner fa-spin mr-2"></i> Loading data...</td></tr>';
    const date = attendanceDateInput.value;
    try {
        currentAttendance = await apiFetch(`/admin/attendance?date=${date}`);
        renderAttendance();
    } catch (e) {
        attendanceList.innerHTML = `<tr><td colspan="3" class="p-8 text-center text-red-400">Error: ${e.message}</td></tr>`;
    }
}

function renderAttendance() {
    attendanceList.innerHTML = '';
    if (allStudents.length === 0) {
        attendanceList.innerHTML = '<tr><td colspan="3" class="p-8 text-center text-gray-500">No students registered yet.</td></tr>';
        return;
    }

    allStudents.forEach(student => {
        const record = currentAttendance.find(a => a.user && (a.user._id === student._id || a.user === student._id));
        const status = record ? record.status : 'none';

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-800/40 transition-colors group';

        tr.innerHTML = `
            <td class="p-4 font-medium text-white">${student.name}</td>
            <td class="p-4 text-gray-400 text-sm">${student.email}</td>
            <td class="p-4 text-center">
                <div class="inline-flex rounded-lg border border-gray-600 p-1 bg-darkBg">
                    <label class="cursor-pointer relative">
                        <input type="radio" name="att_${student._id}" value="present" class="peer sr-only" ${status === 'present' ? 'checked' : ''}>
                        <div class="px-3 py-1.5 text-sm rounded-md peer-checked:bg-secondary/20 peer-checked:text-secondary text-gray-500 font-medium transition-colors hover:text-gray-300">Present</div>
                    </label>
                    <label class="cursor-pointer relative">
                        <input type="radio" name="att_${student._id}" value="absent" class="peer sr-only" ${status === 'absent' ? 'checked' : ''}>
                        <div class="px-3 py-1.5 text-sm rounded-md peer-checked:bg-red-500/20 peer-checked:text-red-400 text-gray-500 font-medium transition-colors hover:text-gray-300">Absent</div>
                    </label>
                    <label class="cursor-pointer relative">
                        <input type="radio" name="att_${student._id}" value="late" class="peer sr-only" ${status === 'late' ? 'checked' : ''}>
                        <div class="px-3 py-1.5 text-sm rounded-md peer-checked:bg-accent/20 peer-checked:text-accent text-gray-500 font-medium transition-colors hover:text-gray-300">Late</div>
                    </label>
                    <label class="cursor-pointer relative">
                        <input type="radio" name="att_${student._id}" value="none" class="peer sr-only" ${status === 'none' ? 'checked' : ''}>
                        <div class="px-3 py-1.5 text-sm rounded-md peer-checked:bg-gray-700 text-gray-500 font-medium transition-colors hover:text-gray-300">None</div>
                    </label>
                </div>
            </td>
        `;
        attendanceList.appendChild(tr);
    });
}

window.saveAttendance = async function () {
    const date = attendanceDateInput.value;
    if (!date) return alert('Please select a date');

    saveAttendanceBtn.disabled = true;
    const ogHtml = saveAttendanceBtn.innerHTML;
    saveAttendanceBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Saving...';

    const records = [];
    allStudents.forEach(student => {
        const selected = document.querySelector(`input[name="att_${student._id}"]:checked`);
        if (selected) {
            records.push({ userId: student._id, status: selected.value });
        }
    });

    try {
        await apiFetch('/admin/attendance', { method: 'POST', body: JSON.stringify({ date, records }) });
        saveAttendanceBtn.innerHTML = '<i class="fas fa-check mr-2"></i> Saved!';
        saveAttendanceBtn.classList.replace('bg-secondary', 'bg-blue-500');
        setTimeout(() => {
            saveAttendanceBtn.innerHTML = ogHtml;
            saveAttendanceBtn.classList.replace('bg-blue-500', 'bg-secondary');
            saveAttendanceBtn.disabled = false;
        }, 2000);
    } catch (e) {
        alert(e.message);
        saveAttendanceBtn.innerHTML = ogHtml;
        saveAttendanceBtn.disabled = false;
    }
};

// --- Export Reports ---
async function handleExportDownload(type, endpoint, btnId, originalHtml) {
    const btn = document.getElementById(btnId);
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Exporting...';
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin' + endpoint, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Export failed to generate');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `devtrack_report.${type}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (e) {
        alert(e.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}

window.downloadExcelReport = function() {
    handleExportDownload('xlsx', '/export/excel', 'btn-export-excel', '<i class="fas fa-file-excel mr-2"></i> Excel');
};

// --- Internships Admin Logic ---
const internshipsList = document.getElementById('admin-internship-list');
const verifyIntModal = document.getElementById('verify-int-modal');
const verifyIntModalContent = document.getElementById('verify-int-modal-content');
const verifyIntForm = document.getElementById('verify-int-form');
const verifyIntId = document.getElementById('verify-int-id');
const verifyIntStatus = document.getElementById('verify-int-status');
const verifyIntFeedback = document.getElementById('verify-int-feedback');
const verifyIntSubmitBtn = document.getElementById('verify-int-submit-btn');

async function loadAllInternships(status = '') {
    if(!internshipsList) return;
    internshipsList.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-gray-500"><i class="fas fa-spinner fa-spin mr-2"></i> Loading internships...</td></tr>';

    try {
        const query = status ? `?status=${status}` : '';
        const ints = await apiFetch(`/internships${query}`);

        if (ints.length === 0) {
            internshipsList.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-gray-500">No internships found.</td></tr>';
            return;
        }

        renderAdminInternships(ints);
    } catch (error) {
        internshipsList.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-400">Error: ${error.message}</td></tr>`;
    }
}

function renderAdminInternships(ints) {
    if(!internshipsList) return;
    internshipsList.innerHTML = '';

    ints.forEach(int => {
        let statusBadge = '';
        if (int.status === 'pending') statusBadge = '<span class="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 w-inline-block"><i class="fas fa-clock mr-1"></i> Pending</span>';
        else if (int.status === 'approved') statusBadge = '<span class="px-2.5 py-1 text-xs font-semibold rounded-md bg-secondary/20 text-secondary border border-secondary/30 w-inline-block"><i class="fas fa-check mr-1"></i> Approved</span>';
        else if (int.status === 'rejected') statusBadge = '<span class="px-2.5 py-1 text-xs font-semibold rounded-md bg-red-500/20 text-red-400 border border-red-500/30 w-inline-block"><i class="fas fa-times mr-1"></i> Rejected</span>';

        const docs = int.documents || {};
        let docLinks = '';
        if (docs.offerLetter) docLinks += `<a href="${docs.offerLetter}" target="_blank" class="text-xs bg-gray-800 hover:bg-gray-700 text-primary border border-gray-700 px-2 py-1 rounded mr-2 inline-flex items-center mb-1"><i class="fas fa-file-pdf mr-1.5"></i> Offer</a>`;
        if (docs.mailProof) docLinks += `<a href="${docs.mailProof}" target="_blank" class="text-xs bg-gray-800 hover:bg-gray-700 text-primary border border-gray-700 px-2 py-1 rounded mr-2 inline-flex items-center mb-1"><i class="fas fa-envelope mr-1.5"></i> Mail</a>`;
        if (docs.forms) docLinks += `<a href="${docs.forms}" target="_blank" class="text-xs bg-gray-800 hover:bg-gray-700 text-primary border border-gray-700 px-2 py-1 rounded mr-2 inline-flex items-center mb-1"><i class="fas fa-file-alt mr-1.5"></i> Forms</a>`;
        if (docs.certificate) docLinks += `<a href="${docs.certificate}" target="_blank" class="text-xs bg-gray-800 hover:bg-gray-700 text-primary border border-gray-700 px-2 py-1 rounded mr-2 inline-flex items-center mb-1"><i class="fas fa-certificate mr-1.5"></i> Cert</a>`;

        if (!docLinks) docLinks = '<span class="text-xs text-gray-500">No files</span>';

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-800/40 transition-colors group';
        tr.innerHTML = `
            <td class="p-4">
                <div class="font-medium text-white">${int.user?.name || 'Unknown'}</div>
                <div class="text-xs text-gray-400 mt-0.5">${int.user?.email || ''}</div>
            </td>
            <td class="p-4">
                <div class="font-medium text-gray-200">${int.companyName}</div>
                <div class="text-xs mt-1"><span class="bg-primary/20 text-primary px-1.5 py-0.5 rounded mr-1">${int.domain}</span><span class="bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded uppercase">${int.type}</span></div>
            </td>
            <td class="p-4 flex flex-wrap content-start items-center">${docLinks}</td>
            <td class="p-4">${statusBadge}</td>
            <td class="p-4 text-right">
                ${int.status === 'pending' ? `
                    <div class="flex justify-end space-x-2">
                        <button onclick="promptVerifyInt('${int._id}', 'approved')" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors border border-transparent hover:border-secondary/30" title="Approve"><i class="fas fa-check"></i></button>
                        <button onclick="promptVerifyInt('${int._id}', 'rejected')" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/30" title="Reject"><i class="fas fa-times"></i></button>
                    </div>
                ` : `<span class="text-xs text-gray-500 font-medium bg-gray-800/50 px-2 py-1 rounded border border-gray-700">Processed</span>`}
            </td>
        `;
        internshipsList.appendChild(tr);
    });
}

window.promptVerifyInt = function(id, status) {
    verifyIntId.value = id;
    verifyIntStatus.value = status;
    verifyIntFeedback.value = '';

    if (status === 'approved') {
        verifyIntSubmitBtn.className = 'px-5 py-2.5 rounded-lg text-sm font-medium text-white shadow-lg bg-secondary hover:bg-green-600 focus:ring-4 focus:ring-secondary/30 transition-colors flex items-center';
        verifyIntSubmitBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Approve Internship';
    } else {
        verifyIntSubmitBtn.className = 'px-5 py-2.5 rounded-lg text-sm font-medium text-white shadow-lg bg-red-500 hover:bg-red-600 focus:ring-4 focus:ring-red-500/30 transition-colors flex items-center';
        verifyIntSubmitBtn.innerHTML = '<i class="fas fa-times-circle mr-2"></i> Reject Internship';
    }

    verifyIntModal.classList.remove('hidden');
    verifyIntModal.classList.add('flex');
    setTimeout(() => {
        verifyIntModalContent.classList.remove('scale-95', 'opacity-0');
        verifyIntModalContent.classList.add('scale-100', 'opacity-100');
    }, 10);
};

window.closeVerifyIntModal = function() {
    verifyIntModalContent.classList.remove('scale-100', 'opacity-100');
    verifyIntModalContent.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        verifyIntModal.classList.add('hidden');
        verifyIntModal.classList.remove('flex');
    }, 300);
};

if (verifyIntForm) {
    verifyIntForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        verifyIntSubmitBtn.disabled = true;
        const originalContent = verifyIntSubmitBtn.innerHTML;
        verifyIntSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';

        try {
            await apiFetch(`/internships/${verifyIntId.value}`, {
                method: 'PUT',
                body: JSON.stringify({
                    status: verifyIntStatus.value,
                    feedback: verifyIntFeedback.value
                })
            });

            closeVerifyIntModal();
            const filter = document.getElementById('internship-status-filter');
            await loadAllInternships(filter ? filter.value : '');
        } catch (err) {
            alert(err.message);
        } finally {
            verifyIntSubmitBtn.disabled = false;
            verifyIntSubmitBtn.innerHTML = originalContent;
        }
    });
}

// --- Students Tab & Profile Logic ---
async function loadStudentsTab() {
    const grid = document.getElementById('students-grid');
    if (!grid) return;
    grid.innerHTML = '<div class="text-center text-gray-500 py-8 col-span-full"><i class="fas fa-spinner fa-spin mr-2"></i> Loading students...</div>';
    
    try {
        const users = await apiFetch('/admin/users');
        if (users.length === 0) {
            grid.innerHTML = '<div class="text-center text-gray-500 py-8 col-span-full">No students found.</div>';
            return;
        }

        grid.innerHTML = users.map(u => `
            <div class="bg-cardBg border border-gray-700/60 rounded-xl p-5 hover:border-gray-500 transition-colors cursor-pointer group shadow-sm flex items-center" onclick="openStudentProfile('${u._id}')">
                <div class="h-12 w-12 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-xl font-bold shadow-lg text-white mr-4 flex-shrink-0 group-hover:scale-110 transition-transform">
                    ${u.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h3 class="text-white font-bold text-lg">${u.name}</h3>
                    <p class="text-xs text-gray-400">${u.email}</p>
                    <div class="mt-2 text-xs font-medium text-primary"><i class="fas fa-fire mr-1"></i> Streak: ${u.streak || 0}</div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        grid.innerHTML = `<div class="text-red-400 py-8 col-span-full text-center">Error: ${e.message}</div>`;
    }
}

const spModal = document.getElementById('student-profile-modal');

window.openStudentProfile = async function(userId) {
    if (!spModal) return;
    document.getElementById('sp-tasks-container').innerHTML = '<div class="text-gray-500 text-center py-4"><i class="fas fa-spinner fa-spin mr-2"></i> Loading profile...</div>';
    document.getElementById('sp-internships-container').innerHTML = '';

    spModal.classList.remove('hidden');
    spModal.classList.add('flex');
    setTimeout(() => {
        spModal.classList.remove('scale-95', 'opacity-0');
        spModal.classList.add('scale-100', 'opacity-100');
    }, 10);

    try {
        const user = await apiFetch(`/admin/users/${userId}`);
        document.getElementById('sp-name').textContent = user.name;
        document.getElementById('sp-email').textContent = user.email;
        document.getElementById('sp-avatar').textContent = user.name.charAt(0).toUpperCase();
        document.getElementById('sp-streak').textContent = user.streak || 0;

        const subs = await apiFetch(`/admin/submissions?userId=${userId}`);
        const tasksContainer = document.getElementById('sp-tasks-container');
        
        if (subs.length === 0) {
            tasksContainer.innerHTML = '<div class="text-center py-8 text-gray-500">No tasks submitted yet.</div>';
        } else {
            tasksContainer.innerHTML = subs.map(s => {
                let badge = '';
                if(s.status === 'pending') badge = '<span class="text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded text-xs border border-blue-500/30">Pending</span>';
                if(s.status === 'approved') badge = '<span class="text-secondary bg-secondary/20 px-2 py-0.5 rounded text-xs border border-secondary/30">Approved</span>';
                if(s.status === 'rejected') badge = '<span class="text-red-400 bg-red-500/20 px-2 py-0.5 rounded text-xs border border-red-500/30">Rejected</span>';
                
                const note = s.feedback ? `<div class="mt-2 text-sm text-gray-300 bg-gray-800/80 p-3 rounded border-l-2 ${s.status === 'rejected' ? 'border-red-500' : 'border-secondary'}"><p class="text-xs text-gray-500 uppercase mb-1 font-bold">Your evaluation</p>${s.feedback}</div>` : '';

                return `
                    <div class="bg-gray-800/30 border border-gray-700/60 rounded-lg p-4">
                        <div class="flex justify-between items-start">
                            <div>
                                <h4 class="font-bold text-white mb-1"><span class="text-gray-400 mr-2 text-sm">#</span>${s.task?.title || 'Unknown'}</h4>
                                <span class="bg-gray-800 border border-gray-700 text-gray-400 px-2 py-0.5 rounded text-xs uppercase">${s.task?.type || 'Any'}</span>
                            </div>
                            <div class="flex flex-col items-end space-y-2">
                                ${badge}
                                ${s.proof ? `<a href="${s.proof}" target="_blank" class="text-xs text-primary hover:underline bg-gray-800 border border-gray-700 px-2 py-1 rounded"><i class="fas fa-external-link-alt mr-1"></i> Proof</a>` : ''}
                            </div>
                        </div>
                        ${note}
                    </div>
                `;
            }).join('');
        }

        const ints = await apiFetch(`/internships?userId=${userId}`);
        const intContainer = document.getElementById('sp-internships-container');

        if (ints.length === 0) {
            intContainer.innerHTML = '<div class="text-center py-8 text-gray-500">No internships submitted.</div>';
        } else {
            intContainer.innerHTML = ints.map(i => {
                let badge = '';
                if(i.status === 'pending') badge = '<span class="text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded text-xs border border-blue-500/30">Pending</span>';
                if(i.status === 'approved') badge = '<span class="text-secondary bg-secondary/20 px-2 py-0.5 rounded text-xs border border-secondary/30">Approved</span>';
                if(i.status === 'rejected') badge = '<span class="text-red-400 bg-red-500/20 px-2 py-0.5 rounded text-xs border border-red-500/30">Rejected</span>';

                const note = i.feedback ? `<div class="mt-2 text-sm text-gray-300 bg-gray-800/80 p-3 rounded border-l-2 ${i.status === 'rejected' ? 'border-red-500' : 'border-secondary'}"><p class="text-xs text-gray-500 uppercase mb-1 font-bold">Your evaluation</p>${i.feedback}</div>` : '';
                
                return `
                    <div class="bg-gray-800/30 border border-gray-700/60 rounded-lg p-4">
                        <div class="flex justify-between items-start">
                            <div>
                                <h4 class="font-bold text-white mb-1"><i class="fas fa-building text-gray-500 mr-2"></i>${i.companyName}</h4>
                                <span class="bg-gray-800 border border-gray-700 text-primary px-2 py-0.5 rounded text-xs">${i.domain}</span>
                            </div>
                            <div class="flex flex-col items-end space-y-2">
                                ${badge}
                                <div class="flex flex-wrap gap-1 mt-1 justify-end">
                                    ${i.documents.offerLetter ? `<a href="${i.documents.offerLetter}" target="_blank" class="text-[10px] text-gray-400 bg-gray-800 border border-gray-700 px-1.5 py-0.5 rounded"><i class="fas fa-file-pdf"></i></a>` : ''}
                                    ${i.documents.certificate ? `<a href="${i.documents.certificate}" target="_blank" class="text-[10px] text-gray-400 bg-gray-800 border border-gray-700 px-1.5 py-0.5 rounded"><i class="fas fa-certificate"></i></a>` : ''}
                                </div>
                            </div>
                        </div>
                        ${note}
                    </div>
                `;
            }).join('');
        }
    } catch(err) {
        document.getElementById('sp-tasks-container').innerHTML = `<div class="text-red-400 py-8 text-center bg-red-500/10 rounded-lg border border-red-500/20 h-full flex items-center justify-center">Error loading profile: ${err.message}</div>`;
    }
};

window.closeStudentProfile = function() {
    if (!spModal) return;
    spModal.classList.remove('scale-100', 'opacity-100');
    spModal.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        spModal.classList.add('hidden');
        spModal.classList.remove('flex');
    }, 300);
};
