// Main application logic
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginPage = document.getElementById('login-page');
    const appContainer = document.getElementById('app-container');
    const secretaryMenu = document.getElementById('secretary-menu');
    const doctorMenu = document.getElementById('doctor-menu');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Initialize app
    initializeApp();
    setupEventListeners();
    
    // Initialize the application
    function initializeApp() {
        // Set today's date for appointments filter
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('appointments-date-filter').value = today;
        
        // Add class to body for mobile detection
        if (window.innerWidth <= 768) {
            document.body.classList.add('mobile-view');
        }
        
        // Create toast container for notifications
        createToastContainer();
        
        // Request notification permission
        requestNotificationPermission();
        
        // If user is already logged in (should not happen on first load)
        if (authManager.isLoggedIn()) {
            showApp();
        } else {
            showLogin();
        }
        
        // Setup automatic reminder checker every 5 minutes
        setupAutomaticReminders();
    }
    
    // Create toast container for notifications
    function createToastContainer() {
        if (!document.getElementById('toast-container')) {
            const toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }
    }
    
    // Request notification permission
    function requestNotificationPermission() {
        if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission();
        }
    }
    
    // Setup automatic reminders
    function setupAutomaticReminders() {
        // Check for reminders immediately
        checkAndSendReminders(true);
        
        // Set up timer to check every 5 minutes
        setInterval(() => {
            checkAndSendReminders(true);
        }, 5 * 60 * 1000);
    }
    
    // Check and send reminders
    function checkAndSendReminders(silent = false) {
        const remindersSent = secretary.sendAppointmentReminders();
        
        if (!silent && remindersSent > 0) {
            alert(`تم تحديث ${remindersSent} تذكير للمرضى`);
        } else if (!silent) {
            alert('لا توجد مواعيد تحتاج إلى تذكير في الوقت الحالي');
        }
        
        // If reminders were sent automatically, show a desktop notification if supported
        if (silent && remindersSent > 0 && "Notification" in window) {
            if (Notification.permission === "granted") {
                new Notification(`تنبيه نظام العيادة`, {
                    body: `تم تحديث ${remindersSent} تذكير تلقائي للمرضى`,
                    icon: 'data:image/svg+xml;utf8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 24 24%22 width%3D%2224%22 height%3D%2224%22%3E%3Cpath fill%3D%22none%22 d%3D%22M0 0h24v24H0z%22%2F%3E%3Cpath d%3D%22M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z%22 fill%3D%22rgba(255%2C107%2C157%2C1)%22%2F%3E%3C%2Fsvg%3E'
                });
            } else if (Notification.permission !== "denied") {
                Notification.requestPermission();
            }
        }
        
        return remindersSent;
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Login form submission
        loginForm.addEventListener('submit', handleLogin);
        
        // Logout button
        logoutBtn.addEventListener('click', handleLogout);
        
        // Check reminders button
        document.getElementById('check-reminders-btn').addEventListener('click', function() {
            checkAndSendReminders();
        });
        
        // Menu buttons
        document.querySelectorAll('.menu-btn').forEach(button => {
            button.addEventListener('click', function() {
                // Skip for logout button
                if (this.id === 'logout-btn') return;
                
                // Remove active class from all buttons
                document.querySelectorAll('.menu-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Show the corresponding section
                const targetId = this.getAttribute('data-target');
                showSection(targetId);
            });
        });
        
        // Appointment form
        setupAppointmentForm();
        
        // Secretary section event listeners
        setupSecretaryEventListeners();
        
        // Doctor section event listeners
        setupDoctorEventListeners();
        
        window.addEventListener('resize', function() {
            if (window.innerWidth <= 768) {
                document.body.classList.add('mobile-view');
            } else {
                document.body.classList.remove('mobile-view');
            }
        });
    }
    
    // Handle login
    function handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const userType = document.getElementById('user-type').value;
        
        if (authManager.login(username, password, userType)) {
            showApp();
        } else {
            alert('خطأ في اسم المستخدم أو كلمة المرور!');
        }
    }
    
    // Handle logout
    function handleLogout() {
        authManager.logout();
        showLogin();
    }
    
    // Show login page
    function showLogin() {
        loginPage.classList.remove('d-none');
        appContainer.classList.add('d-none');
    }
    
    // Show main app
    function showApp() {
        loginPage.classList.add('d-none');
        appContainer.classList.remove('d-none');
        
        // Show correct menu based on user type
        if (authManager.isDoctor()) {
            secretaryMenu.classList.add('d-none');
            doctorMenu.classList.remove('d-none');
            showSection('patient-files');
            loadTodayPatients();
        } else {
            secretaryMenu.classList.remove('d-none');
            doctorMenu.classList.add('d-none');
            showSection('appointments');
            loadTodayAppointments();
        }
    }
    
    // Show a specific section
    function showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('d-none');
        });
        
        // Show the requested section
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.remove('d-none');
            
            // Load data for specific sections
            if (sectionId === 'appointments') {
                loadTodayAppointments();
            } else if (sectionId === 'patients') {
                loadPatientsList();
            } else if (sectionId === 'secretary-stats') {
                loadSecretaryStats();
            } else if (sectionId === 'patient-files') {
                loadTodayPatients();
            } else if (sectionId === 'doctor-stats') {
                loadDoctorStats();
            } else if (sectionId === 'settings') {
                loadSettings();
            }
        }
    }
    
    // Setup appointment form
    function setupAppointmentForm() {
        const appointmentForm = document.getElementById('appointment-form');
        const paymentSection = document.getElementById('payment-section');
        const bookingTypeRadios = document.querySelectorAll('input[name="booking-type"]');
        
        // Toggle payment section based on booking type
        bookingTypeRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.value === 'clinic') {
                    paymentSection.classList.remove('d-none');
                } else {
                    paymentSection.classList.add('d-none');
                }
            });
        });
        
        // Handle appointment form submission
        appointmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('patient-name').value;
            const phone = document.getElementById('patient-phone').value;
            const address = document.getElementById('patient-address').value;
            const appointmentDate = document.getElementById('appointment-date').value;
            const appointmentType = document.getElementById('appointment-type').value;
            const notes = document.getElementById('appointment-notes').value;
            const bookingType = document.querySelector('input[name="booking-type"]:checked').value;
            
            let payment = null;
            let status = 'unconfirmed';
            
            if (bookingType === 'clinic') {
                payment = parseFloat(document.getElementById('payment-amount').value) || 0;
                status = document.getElementById('payment-confirmed').checked ? 'confirmed' : 'unconfirmed';
            }
            
            // Create appointment
            secretary.addAppointment({
                name,
                phone,
                address,
                appointmentDate,
                type: appointmentType,
                bookingType,
                notes,
                status,
                payment
            });
            
            // Reset form and reload appointments
            appointmentForm.reset();
            loadTodayAppointments();
            
            alert('تم حفظ الموعد بنجاح');
        });
    }
    
    // Secretary event listeners
    function setupSecretaryEventListeners() {
        // Date filter for appointments
        document.getElementById('appointments-date-filter').addEventListener('change', function() {
            loadAppointmentsByDate(this.value);
        });
        
        // Check reminders button event listener (additional one for convenience)
        document.getElementById('send-reminders-btn').addEventListener('click', function() {
            checkAndSendReminders();
        });
        
        // Patient search
        document.getElementById('search-patient-btn').addEventListener('click', function() {
            const query = document.getElementById('patient-search').value;
            if (query) {
                searchPatients(query);
            }
        });
        
        // Appointment confirmation modal
        document.getElementById('save-confirmation-btn').addEventListener('click', confirmAppointment);
        
        // Stats period selector
        document.getElementById('stats-period-select').addEventListener('change', function() {
            loadSecretaryStats(this.value);
        });
        
        // Export stats button
        document.getElementById('export-stats-btn').addEventListener('click', exportSecretaryStats);
    }
    
    // Doctor event listeners
    function setupDoctorEventListeners() {
        // Patient search
        document.getElementById('doctor-search-patient-btn').addEventListener('click', function() {
            const query = document.getElementById('doctor-patient-search').value;
            if (query) {
                searchPatientsForDoctor(query);
            }
        });
        
        // Follow-up type selector
        document.getElementById('follow-up-type').addEventListener('change', function() {
            showFollowUpTypeSection(this.value);
        });
        
        // Follow-up form submission
        document.getElementById('follow-up-form').addEventListener('submit', function(e) {
            e.preventDefault();
            saveFollowUp();
        });
        
        // Print prescription button
        document.getElementById('print-prescription-btn').addEventListener('click', printPrescription);
        
        // Stats period selector
        document.getElementById('doctor-stats-period').addEventListener('change', function() {
            loadDoctorStats(this.value);
        });
        
        // Export doctor stats
        document.getElementById('export-doctor-stats').addEventListener('click', exportDoctorStats);
        
        // Save clinic settings
        document.getElementById('save-clinic-settings').addEventListener('click', saveClinicSettings);
        
        // Factory reset button
        document.getElementById('factory-reset-btn').addEventListener('click', function() {
            if (confirm('هل أنت متأكد من إعادة ضبط النظام لإعدادات المصنع؟ سيتم فقدان جميع البيانات!')) {
                doctor.resetToFactory();
                alert('تم إعادة تعيين النظام بنجاح');
                window.location.reload();
            }
        });
        
        // System initialization button
        document.getElementById('clinic-init-btn').addEventListener('click', function() {
            if (confirm('هل أنت متأكد من تهيئة النظام؟')) {
                initializeClinicSystem();
            }
        });
        
        // User settings form
        document.getElementById('user-settings-form').addEventListener('submit', function(e) {
            e.preventDefault();
            saveUserSettings();
        });
    }
    
    // Load today's appointments
    function loadTodayAppointments() {
        const appointments = secretary.getTodayAppointments();
        renderAppointmentsList(appointments);
    }
    
    // Load appointments by date
    function loadAppointmentsByDate(dateStr) {
        const date = new Date(dateStr);
        const appointments = secretary.getAppointmentsByDate(date);
        renderAppointmentsList(appointments);
    }
    
    // Render appointments list
    function renderAppointmentsList(appointments) {
        const appointmentsList = document.getElementById('appointments-list');
        appointmentsList.innerHTML = '';
        
        if (appointments.length === 0) {
            appointmentsList.innerHTML = '<div class="alert alert-info">لا توجد مواعيد في هذا اليوم</div>';
            return;
        }
        
        // Sort appointments by time
        appointments.sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
        
        appointments.forEach(appointment => {
            const patient = db.findPatientById(appointment.patientId);
            if (!patient) return;
            
            const appointmentDate = new Date(appointment.appointmentDate);
            const timeStr = appointmentDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
            
            const appointmentItem = document.createElement('li');
            appointmentItem.className = 'appointment-item';
            appointmentItem.dataset.id = appointment.id;
            
            const statusClass = appointment.status === 'confirmed' ? 'status-confirmed' : 'status-unconfirmed';
            const statusText = appointment.status === 'confirmed' ? 'مؤكد' : 'غير مؤكد';
            
            const bookingTypeClass = appointment.bookingType === 'phone' ? 'booking-type-phone' : 'booking-type-clinic';
            const bookingTypeText = appointment.bookingType === 'phone' ? 'هاتف' : 'عيادة';
            const bookingTypeIcon = appointment.bookingType === 'phone' ? '<i class="bi bi-telephone"></i>' : '<i class="bi bi-building"></i>';
            
            const appointmentTypeClass = appointment.type === 'new' ? 'appointment-type-new' : 'appointment-type-follow';
            const appointmentTypeText = appointment.type === 'new' ? 'كشف جديد' : 'إعادة كشف';
            
            appointmentItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span class="time">${timeStr}</span> - 
                        <span class="name">${patient.name}</span>
                        <div class="phone">${patient.phone}</div>
                        <div class="mt-1">
                            <span class="booking-type ${bookingTypeClass}">${bookingTypeIcon} ${bookingTypeText}</span>
                            <span class="appointment-type ${appointmentTypeClass}">${appointmentTypeText}</span>
                        </div>
                    </div>
                    <div>
                        <span class="status ${statusClass}">${statusText}</span>
                        ${appointment.status !== 'confirmed' ? 
                            `<button class="btn btn-sm btn-primary confirm-btn ms-2" data-id="${appointment.id}">تأكيد</button>` : 
                            ''}
                    </div>
                </div>
            `;
            
            appointmentsList.appendChild(appointmentItem);
        });
        
        // Add event listeners to confirm buttons
        document.querySelectorAll('.confirm-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const appointmentId = this.getAttribute('data-id');
                openConfirmationModal(appointmentId);
            });
        });
    }
    
    // Open confirmation modal for appointment
    function openConfirmationModal(appointmentId) {
        const modal = new bootstrap.Modal(document.getElementById('appointment-confirm-modal'));
        document.getElementById('confirm-appointment-id').value = appointmentId;
        modal.show();
    }
    
    // Confirm appointment
    function confirmAppointment() {
        const appointmentId = document.getElementById('confirm-appointment-id').value;
        const payment = parseFloat(document.getElementById('confirm-payment-amount').value) || 0;
        const isConfirmed = document.getElementById('confirm-payment-checkbox').checked;
        
        if (isConfirmed && payment > 0) {
            secretary.confirmAppointment(appointmentId, payment);
            
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('appointment-confirm-modal')).hide();
            
            // Reload appointments
            const dateStr = document.getElementById('appointments-date-filter').value;
            loadAppointmentsByDate(dateStr);
            
            alert('تم تأكيد الموعد بنجاح');
        } else {
            alert('يرجى إدخال المبلغ المدفوع وتأكيد الدفع');
        }
    }
    
    // Load patients list
    function loadPatientsList() {
        const patients = db.patients;
        const patientsTable = document.getElementById('patients-table').querySelector('tbody');
        patientsTable.innerHTML = '';
        
        if (patients.length === 0) {
            patientsTable.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">لا يوجد مرضى مسجلين</td>
                </tr>
            `;
            return;
        }
        
        patients.forEach(patient => {
            const lastVisitDate = patient.lastVisit ? 
                new Date(patient.lastVisit).toLocaleDateString('ar-EG') : 'لا توجد زيارات';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${patient.name}</td>
                <td>${patient.phone}</td>
                <td>${patient.address || '-'}</td>
                <td>${lastVisitDate}</td>
                <td>
                    <button class="btn btn-sm btn-info view-patient-btn" data-id="${patient.id}">عرض</button>
                </td>
            `;
            
            patientsTable.appendChild(tr);
        });
        
        // Add event listeners to view buttons
        document.querySelectorAll('.view-patient-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const patientId = this.getAttribute('data-id');
                openPatientModal(patientId);
            });
        });
    }
    
    // Search patients
    function searchPatients(query) {
        const results = secretary.searchPatients(query);
        const patientsTable = document.getElementById('patients-table').querySelector('tbody');
        patientsTable.innerHTML = '';
        
        if (results.length === 0) {
            patientsTable.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">لا توجد نتائج للبحث</td>
                </tr>
            `;
            return;
        }
        
        results.forEach(patient => {
            const lastVisitDate = patient.lastVisit ? 
                new Date(patient.lastVisit).toLocaleDateString('ar-EG') : 'لا توجد زيارات';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${patient.name}</td>
                <td>${patient.phone}</td>
                <td>${patient.address || '-'}</td>
                <td>${lastVisitDate}</td>
                <td>
                    <button class="btn btn-sm btn-info view-patient-btn" data-id="${patient.id}">عرض</button>
                </td>
            `;
            
            patientsTable.appendChild(tr);
        });
        
        // Add event listeners to view buttons
        document.querySelectorAll('.view-patient-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const patientId = this.getAttribute('data-id');
                openPatientModal(patientId);
            });
        });
    }
    
    // Open patient modal
    function openPatientModal(patientId) {
        const patient = db.findPatientById(patientId);
        const appointments = secretary.getPatientAppointments(patientId);
        
        if (!patient) return;
        
        const modalBody = document.getElementById('patient-modal-body');
        modalBody.innerHTML = `
            <div class="patient-info">
                <h4>${patient.name}</h4>
                <p><strong>رقم الهاتف:</strong> ${patient.phone}</p>
                <p><strong>العنوان:</strong> ${patient.address || '-'}</p>
                <p><strong>تاريخ التسجيل:</strong> ${new Date(patient.registrationDate).toLocaleDateString('ar-EG')}</p>
                ${patient.lastVisit ? 
                    `<p><strong>تاريخ آخر زيارة:</strong> ${new Date(patient.lastVisit).toLocaleDateString('ar-EG')}</p>` : ''}
            </div>
            <hr>
            <h5>سجل الزيارات</h5>
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>نوع الكشف</th>
                            <th>الحالة</th>
                            <th>ملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${appointments.length > 0 ? 
                            appointments.map(app => {
                                const date = new Date(app.appointmentDate).toLocaleString('ar-EG');
                                const type = app.type === 'new' ? 'كشف جديد' : 'إعادة كشف';
                                const status = app.status === 'confirmed' ? 'مؤكد' : 'غير مؤكد';
                                return `
                                    <tr>
                                        <td>${date}</td>
                                        <td>${type}</td>
                                        <td>${status}</td>
                                        <td>${app.notes || '-'}</td>
                                    </tr>
                                `;
                            }).join('') : 
                            '<tr><td colspan="4" class="text-center">لا توجد زيارات</td></tr>'
                        }
                    </tbody>
                </table>
            </div>
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('patient-modal'));
        modal.show();
    }
    
    // Load secretary statistics
    function loadSecretaryStats(period = 'daily') {
        let stats;
        const date = new Date();
        
        if (period === 'monthly') {
            stats = secretary.getMonthlyStats(date.getFullYear(), date.getMonth() + 1);
        } else if (period === 'yearly') {
            stats = secretary.getYearlyStats(date.getFullYear());
        } else {
            stats = secretary.getDailyStats(date);
        }
        
        // Update statistics display
        document.getElementById('total-payments').textContent = `${stats.totalPayments} ج.م`;
        document.getElementById('total-visits').textContent = stats.totalVisits;
        document.getElementById('confirmed-appointments').textContent = stats.confirmedAppointments;
        document.getElementById('unconfirmed-appointments').textContent = stats.unconfirmedAppointments;
        
        // Update chart
        updateStatsChart(stats, period);
    }
    
    // Update statistics chart
    function updateStatsChart(stats, period) {
        const ctx = document.getElementById('stats-chart').getContext('2d');
        
        // Destroy previous chart if exists
        if (window.statsChart) {
            window.statsChart.destroy();
        }
        
        // Create new chart
        window.statsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['الزيارات', 'المواعيد المؤكدة', 'المواعيد غير المؤكدة'],
                datasets: [{
                    label: 'إحصائيات العيادة',
                    data: [stats.totalVisits, stats.confirmedAppointments, stats.unconfirmedAppointments],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 99, 132, 0.2)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 99, 132, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                responsive: true
            }
        });
    }
    
    // Export secretary statistics
    function exportSecretaryStats() {
        const period = document.getElementById('stats-period-select').value;
        const date = new Date();
        let stats;
        let periodText;
        
        if (period === 'monthly') {
            stats = secretary.getMonthlyStats(date.getFullYear(), date.getMonth() + 1);
            periodText = `شهر ${date.toLocaleString('ar-EG', { month: 'long' })} ${date.getFullYear()}`;
        } else if (period === 'yearly') {
            stats = secretary.getYearlyStats(date.getFullYear());
            periodText = `سنة ${date.getFullYear()}`;
        } else {
            stats = secretary.getDailyStats(date);
            periodText = `يوم ${date.toLocaleDateString('ar-EG')}`;
        }
        
        // Create PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add clinic info
        doc.setFont("courier", "normal");
        doc.setFontSize(18);
        doc.text("تقرير إحصائيات العيادة", 105, 20, { align: "center" });
        
        doc.setFontSize(14);
        doc.text(`الفترة: ${periodText}`, 105, 30, { align: "center" });
        
        // Add stats
        doc.setFontSize(12);
        doc.text(`إجمالي المبالغ المدفوعة: ${stats.totalPayments} ج.م`, 200, 50, { align: "right" });
        doc.text(`عدد الزيارات: ${stats.totalVisits}`, 200, 60, { align: "right" });
        doc.text(`عدد المواعيد المؤكدة: ${stats.confirmedAppointments}`, 200, 70, { align: "right" });
        doc.text(`عدد المواعيد غير المؤكدة: ${stats.unconfirmedAppointments}`, 200, 80, { align: "right" });
        
        // Save PDF
        doc.save(`clinic_stats_${period}_${new Date().getTime()}.pdf`);
    }
    
    // Load today's patients for doctor
    function loadTodayPatients() {
        const patients = doctor.getTodayPatients();
        const patientsTable = document.getElementById('doctor-patients-table').querySelector('tbody');
        patientsTable.innerHTML = '';
        
        if (patients.length === 0) {
            patientsTable.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">لا يوجد مرضى اليوم</td>
                </tr>
            `;
            return;
        }
        
        patients.forEach(({ patient, appointment }) => {
            const appointmentDate = new Date(appointment.appointmentDate);
            const timeStr = appointmentDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
            const appointmentType = appointment.type === 'new' ? 'كشف جديد' : 'إعادة كشف';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${patient.name}</td>
                <td>${patient.phone}</td>
                <td>${appointmentType}</td>
                <td>${timeStr}</td>
                <td>
                    <button class="btn btn-sm btn-primary open-file-btn" data-id="${patient.id}">فتح الملف</button>
                </td>
            `;
            
            patientsTable.appendChild(tr);
        });
        
        // Add event listeners to file buttons
        document.querySelectorAll('.open-file-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const patientId = this.getAttribute('data-id');
                openPatientFile(patientId);
            });
        });
    }
    
    // Search patients for doctor
    function searchPatientsForDoctor(query) {
        const results = doctor.searchPatients(query);
        const patientsTable = document.getElementById('doctor-patients-table').querySelector('tbody');
        patientsTable.innerHTML = '';
        
        if (results.length === 0) {
            patientsTable.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">لا توجد نتائج للبحث</td>
                </tr>
            `;
            return;
        }
        
        results.forEach(patient => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${patient.name}</td>
                <td>${patient.phone}</td>
                <td>-</td>
                <td>-</td>
                <td>
                    <button class="btn btn-sm btn-primary open-file-btn" data-id="${patient.id}">فتح الملف</button>
                </td>
            `;
            
            patientsTable.appendChild(tr);
        });
        
        // Add event listeners to file buttons
        document.querySelectorAll('.open-file-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const patientId = this.getAttribute('data-id');
                openPatientFile(patientId);
            });
        });
    }
    
    // Open patient file
    function openPatientFile(patientId) {
        // Switch to follow-up section
        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('[data-target="follow-up"]').classList.add('active');
        showSection('follow-up');
        
        // Get patient file
        const patientFile = doctor.getPatientFile(patientId);
        
        if (!patientFile) return;
        
        // Show patient file
        const patientFileContainer = document.getElementById('patient-file-container');
        const followUpFormContainer = document.getElementById('follow-up-form-container');
        
        patientFileContainer.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h5>ملف المريض: ${patientFile.patient.name}</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="patient-info">
                                <p><strong>رقم الهاتف:</strong> ${patientFile.patient.phone}</p>
                                <p><strong>العنوان:</strong> ${patientFile.patient.address || '-'}</p>
                                <p><strong>تاريخ التسجيل:</strong> ${new Date(patientFile.patient.registrationDate).toLocaleDateString('ar-EG')}</p>
                                ${patientFile.patient.lastVisit ? 
                                    `<p><strong>تاريخ آخر زيارة:</strong> ${new Date(patientFile.patient.lastVisit).toLocaleDateString('ar-EG')}</p>` : ''}
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="previous-visits">
                                <h6>الزيارات السابقة:</h6>
                                ${patientFile.appointments.length > 0 ? 
                                    `<ul class="list-group">
                                        ${patientFile.appointments.slice(-3).map(app => {
                                            const date = new Date(app.appointmentDate).toLocaleDateString('ar-EG');
                                            const type = app.type === 'new' ? 'كشف جديد' : 'إعادة كشف';
                                            return `<li class="list-group-item">${date} - ${type}</li>`;
                                        }).join('')}
                                    </ul>` : 
                                    '<p>لا توجد زيارات سابقة</p>'}
                            </div>
                        </div>
                    </div>
                    
                    ${patientFile.followUps.length > 0 ? `
                        <div class="row mt-4">
                            <div class="col-12">
                                <h6>سجل المتابعة:</h6>
                                <div class="medical-records">
                                    ${patientFile.followUps.map(followUp => {
                                        const date = new Date(followUp.createdAt).toLocaleDateString('ar-EG');
                                        let followUpTypeText = '';
                                        if (followUp.type === 'pregnancy') followUpTypeText = 'متابعة حمل';
                                        else if (followUp.type === 'ovulation') followUpTypeText = 'متابعة تبويض';
                                        else if (followUp.type === 'delivery') followUpTypeText = 'متابعة ولادة';
                                        
                                        return `
                                            <div class="medical-record">
                                                <h5>${date} - ${followUpTypeText}</h5>
                                                <div class="medical-info">
                                                    ${followUp.type === 'pregnancy' ? `
                                                        <div class="medical-info-item">
                                                            <span class="info-label">أسبوع الحمل:</span> ${followUp.pregnancyWeek || '-'}
                                                        </div>
                                                        <div class="medical-info-item">
                                                            <span class="info-label">قياسات الجنين:</span> ${followUp.fetusMeasurements || '-'}
                                                        </div>
                                                    ` : ''}
                                                    
                                                    ${followUp.type === 'ovulation' ? `
                                                        <div class="medical-info-item">
                                                            <span class="info-label">يوم الدورة:</span> ${followUp.cycleDay || '-'}
                                                        </div>
                                                        <div class="medical-info-item">
                                                            <span class="info-label">حجم البويضة:</span> ${followUp.follicleSize || '-'}
                                                        </div>
                                                    ` : ''}
                                                </div>
                                                <div class="mt-2">
                                                    <div><span class="info-label">ملاحظات الطبيب:</span></div>
                                                    <p>${followUp.doctorNotes || '-'}</p>
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="card-footer">
                    <button id="start-follow-up-btn" class="btn btn-primary" data-id="${patientFile.patient.id}">بدء متابعة جديدة</button>
                </div>
            </div>
        `;
        
        // Store patient ID in the form container for later use
        followUpFormContainer.dataset.patientId = patientFile.patient.id;
        
        // Add event listener to start follow-up button
        document.getElementById('start-follow-up-btn').addEventListener('click', function() {
            const patientId = this.getAttribute('data-id');
            startNewFollowUp(patientId);
        });
    }
    
    // Start new follow-up
    function startNewFollowUp(patientId) {
        const patientFileContainer = document.getElementById('patient-file-container');
        const followUpFormContainer = document.getElementById('follow-up-form-container');
        
        patientFileContainer.classList.add('d-none');
        followUpFormContainer.classList.remove('d-none');
        
        // Reset form
        document.getElementById('follow-up-form').reset();
        
        // Hide all follow-up type sections
        document.querySelectorAll('.follow-up-type-section').forEach(section => {
            section.classList.add('d-none');
        });
    }
    
    // Show follow-up type section
    function showFollowUpTypeSection(type) {
        // Hide all follow-up type sections
        document.querySelectorAll('.follow-up-type-section').forEach(section => {
            section.classList.add('d-none');
        });
        
        // Show selected type section
        if (type === 'pregnancy') {
            document.getElementById('pregnancy-follow-up').classList.remove('d-none');
        } else if (type === 'ovulation') {
            document.getElementById('ovulation-follow-up').classList.remove('d-none');
        }
    }
    
    // Save follow-up
    function saveFollowUp() {
        const patientId = document.getElementById('follow-up-form-container').dataset.patientId;
        const followUpType = document.getElementById('follow-up-type').value;
        const doctorNotes = document.getElementById('doctor-notes').value;
        const prescription = document.getElementById('prescription').value;
        const nextVisit = document.getElementById('next-visit').value;
        
        let followUpData = {
            patientId,
            type: followUpType,
            doctorNotes,
            prescription,
            nextVisit
        };
        
        // Add type-specific data
        if (followUpType === 'pregnancy') {
            followUpData.pregnancyWeek = document.getElementById('pregnancy-week').value;
            followUpData.fetusMeasurements = document.getElementById('fetus-measurements').value;
        } else if (followUpType === 'ovulation') {
            followUpData.cycleDay = document.getElementById('cycle-day').value;
            followUpData.follicleSize = document.getElementById('follicle-size').value;
        }
        
        // Save follow-up
        doctor.addFollowUp(followUpData);
        
        // Hide form and show patient file
        const patientFileContainer = document.getElementById('patient-file-container');
        const followUpFormContainer = document.getElementById('follow-up-form-container');
        
        followUpFormContainer.classList.add('d-none');
        patientFileContainer.classList.remove('d-none');
        
        // Reload patient file
        openPatientFile(patientId);
        
        alert('تم حفظ المتابعة بنجاح');
    }
    
    // Print prescription
    function printPrescription() {
        const patientId = document.getElementById('follow-up-form-container').dataset.patientId;
        const patient = db.findPatientById(patientId);
        const prescription = document.getElementById('prescription').value;
        
        if (!prescription) {
            alert('الرجاء كتابة الروشتة أولاً');
            return;
        }
        
        // Create print area
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>روشتة طبية</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 20px;
                            direction: rtl;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 20px;
                            border-bottom: 2px solid #000;
                            padding-bottom: 10px;
                        }
                        .clinic-name {
                            font-size: 24px;
                            font-weight: bold;
                        }
                        .doctor-name {
                            font-size: 18px;
                        }
                        .clinic-details {
                            font-size: 14px;
                            margin-top: 5px;
                        }
                        .patient-info {
                            margin-bottom: 20px;
                        }
                        .prescription {
                            min-height: 300px;
                            white-space: pre-wrap;
                        }
                        .footer {
                            margin-top: 20px;
                            border-top: 1px solid #000;
                            padding-top: 10px;
                            text-align: center;
                            font-size: 14px;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="clinic-name">${db.clinicSettings.name}</div>
                        <div class="doctor-name">${db.clinicSettings.doctorName}</div>
                        <div class="clinic-details">
                            ${db.clinicSettings.address} - هاتف: ${db.clinicSettings.phone}
                        </div>
                    </div>
                    
                    <div class="patient-info">
                        <p><strong>اسم المريض:</strong> ${patient.name}</p>
                        <p><strong>التاريخ:</strong> ${new Date().toLocaleDateString('ar-EG')}</p>
                    </div>
                    
                    <div class="prescription">
                        ${prescription.replace(/\n/g, '<br>')}
                    </div>
                    
                    <div class="footer">
                        مع تمنياتنا بالشفاء العاجل
                    </div>
                </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }
    
    // Load doctor statistics
    function loadDoctorStats(period = 'daily') {
        const stats = doctor.getStats(period);
        
        // Update statistics display
        document.getElementById('total-patients').textContent = stats.totalPatients;
        document.getElementById('pregnancy-cases').textContent = stats.pregnancyCases;
        document.getElementById('ovulation-cases').textContent = stats.ovulationCases;
        document.getElementById('delivery-cases').textContent = stats.deliveryCases;
        
        // Update distribution chart
        updateDoctorStatsChart(stats);
        
        // Update trend chart
        updateDoctorTrendChart(stats.monthlyTrend);
    }
    
    // Update doctor statistics chart
    function updateDoctorStatsChart(stats) {
        const ctx = document.getElementById('doctor-stats-chart').getContext('2d');
        
        // Destroy previous chart if exists
        if (window.doctorStatsChart) {
            window.doctorStatsChart.destroy();
        }
        
        // Create new chart
        window.doctorStatsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['متابعة حمل', 'متابعة تبويض', 'متابعة ولادة'],
                datasets: [{
                    data: [stats.pregnancyCases, stats.ovulationCases, stats.deliveryCases],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(75, 192, 192, 0.7)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 2,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: {
                                size: 14
                            },
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }
    
    // Update doctor trend chart
    function updateDoctorTrendChart(trendData) {
        const ctx = document.getElementById('doctor-trend-chart').getContext('2d');
        
        // Destroy previous chart if exists
        if (window.doctorTrendChart) {
            window.doctorTrendChart.destroy();
        }
        
        // Get months and data
        const months = trendData.map(item => item.month);
        const pregnancyData = trendData.map(item => item.pregnancy);
        const ovulationData = trendData.map(item => item.ovulation);
        const deliveryData = trendData.map(item => item.delivery);
        
        // Create new chart
        window.doctorTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'متابعة حمل',
                        data: pregnancyData,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'متابعة تبويض',
                        data: ovulationData,
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'متابعة ولادة',
                        data: deliveryData,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'start'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }
    
    // Export doctor statistics
    function exportDoctorStats() {
        const period = document.getElementById('doctor-stats-period').value;
        const stats = doctor.getStats(period);
        
        let periodText;
        const date = new Date();
        
        if (period === 'monthly') {
            periodText = `شهر ${date.toLocaleString('ar-EG', { month: 'long' })} ${date.getFullYear()}`;
        } else if (period === 'yearly') {
            periodText = `سنة ${date.getFullYear()}`;
        } else {
            periodText = `يوم ${date.toLocaleDateString('ar-EG')}`;
        }
        
        // Create PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add clinic info
        doc.setFont("courier", "normal");
        doc.setFontSize(18);
        doc.text("تقرير إحصائيات الحالات الطبية", 105, 20, { align: "center" });
        
        doc.setFontSize(14);
        doc.text(`الفترة: ${periodText}`, 105, 30, { align: "center" });
        
        // Add stats
        doc.setFontSize(12);
        doc.text(`إجمالي المرضى: ${stats.totalPatients}`, 200, 50, { align: "right" });
        doc.text(`حالات متابعة حمل: ${stats.pregnancyCases}`, 200, 60, { align: "right" });
        doc.text(`حالات متابعة تبويض: ${stats.ovulationCases}`, 200, 70, { align: "right" });
        doc.text(`حالات متابعة ولادة: ${stats.deliveryCases}`, 200, 80, { align: "right" });
        
        // Save PDF
        doc.save(`clinic_medical_stats_${period}_${new Date().getTime()}.pdf`);
    }
    
    // Load settings
    function loadSettings() {
        // Load clinic settings
        document.getElementById('clinic-name').value = db.clinicSettings.name;
        document.getElementById('doctor-name').value = db.clinicSettings.doctorName;
        document.getElementById('clinic-address').value = db.clinicSettings.address;
        document.getElementById('clinic-phone').value = db.clinicSettings.phone;
    }
    
    // Save clinic settings
    function saveClinicSettings() {
        const name = document.getElementById('clinic-name').value;
        const doctorName = document.getElementById('doctor-name').value;
        const address = document.getElementById('clinic-address').value;
        const phone = document.getElementById('clinic-phone').value;
        
        if (!name || !doctorName) {
            alert('الرجاء إدخال اسم العيادة واسم الطبيب');
            return;
        }
        
        doctor.initializeSystem({
            name,
            doctorName,
            address,
            phone
        });
        
        alert('تم حفظ إعدادات العيادة بنجاح');
    }
    
    // Initialize clinic system
    function initializeClinicSystem() {
        const name = document.getElementById('clinic-name').value;
        const doctorName = document.getElementById('doctor-name').value;
        const address = document.getElementById('clinic-address').value;
        const phone = document.getElementById('clinic-phone').value;
        
        if (!name || !doctorName) {
            alert('الرجاء إدخال اسم العيادة واسم الطبيب');
            return;
        }
        
        doctor.initializeSystem({
            name,
            doctorName,
            address,
            phone
        });
        
        alert('تم تهيئة النظام بنجاح');
    }
    
    // Save user settings
    function saveUserSettings() {
        const doctorPassword = document.getElementById('change-doctor-password').value;
        const secretaryPassword = document.getElementById('change-secretary-password').value;
        
        if (doctorPassword) {
            authManager.changePassword('doctor', doctorPassword);
        }
        
        if (secretaryPassword) {
            authManager.changePassword('secretary', secretaryPassword);
        }
        
        alert('تم تغيير كلمات المرور بنجاح');
        
        // Reset form
        document.getElementById('user-settings-form').reset();
    }
    
    // Determine if the image is a natural photograph of an animal
    async function checkImage(imageDataUrl) {
        const completion = await websim.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Determine if the image is a natural photograph of an animal.
Respond directly with JSON, following this JSON schema, and no other text.
{
  isPhotograph: boolean;
  isAnimal: boolean;
  isInNature: boolean;
}`
                        },
                        {
                            type: "image_url",
                            image_url: { url: imageDataUrl },
                        },
                    ],
                },
            ],
            json: true,
        });
        
        const result = JSON.parse(completion.content);
        return result;
    }
});