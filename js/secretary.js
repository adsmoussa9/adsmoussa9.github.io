// Secretary module
class Secretary {
    constructor(database) {
        this.db = database;
    }
    
    // Appointment Management
    addAppointment(appointmentData) {
        // Check if patient exists or create new one
        let patientId;
        
        const existingPatient = this.db.findPatientByPhone(appointmentData.phone);
        if (existingPatient) {
            patientId = existingPatient.id;
        } else {
            patientId = this.db.addPatient({
                name: appointmentData.name,
                phone: appointmentData.phone,
                address: appointmentData.address
            });
        }
        
        // Create appointment
        const appointmentId = this.db.addAppointment({
            patientId,
            appointmentDate: appointmentData.appointmentDate,
            type: appointmentData.type,
            bookingType: appointmentData.bookingType,
            notes: appointmentData.notes,
            status: appointmentData.status || 'unconfirmed'
        });
        
        // If payment is provided, record it
        if (appointmentData.payment && appointmentData.payment > 0) {
            this.db.addPayment({
                patientId,
                appointmentId,
                amount: appointmentData.payment,
                description: appointmentData.type === 'new' ? 'كشف جديد' : 'كشف إعادة'
            });
            
            // Update appointment status to confirmed
            this.db.updateAppointment(appointmentId, { status: 'confirmed' });
        }
        
        return appointmentId;
    }
    
    confirmAppointment(appointmentId, payment) {
        const appointment = this.db.getAppointmentById(appointmentId);
        
        if (!appointment) {
            return false;
        }
        
        // Record payment
        if (payment && payment > 0) {
            this.db.addPayment({
                patientId: appointment.patientId,
                appointmentId,
                amount: payment,
                description: appointment.type === 'new' ? 'كشف جديد' : 'كشف إعادة'
            });
        }
        
        // Update appointment status
        return this.db.updateAppointment(appointmentId, { status: 'confirmed' });
    }
    
    cancelAppointment(appointmentId) {
        const appointment = this.db.getAppointmentById(appointmentId);
        
        if (!appointment) {
            return false;
        }
        
        // Update appointment status to cancelled
        return this.db.updateAppointment(appointmentId, { status: 'cancelled' });
    }

    rescheduleAppointment(appointmentId, newDate) {
        const appointment = this.db.getAppointmentById(appointmentId);
        
        if (!appointment) {
            return false;
        }
        
        // Update appointment date
        return this.db.updateAppointment(appointmentId, { appointmentDate: newDate });
    }

    getTodayAppointments() {
        const today = new Date();
        return this.db.getAppointmentsByDate(today);
    }
    
    getAppointmentsByDate(date) {
        return this.db.getAppointmentsByDate(date);
    }
    
    // Patient Management
    searchPatients(query) {
        return this.db.searchPatients(query);
    }
    
    getPatientAppointments(patientId) {
        return this.db.getAppointmentsByPatientId(patientId);
    }
    
    // Send appointment reminders
    sendAppointmentReminders() {
        const upcomingAppointments = this.db.getUpcomingAppointmentsForReminders();
        let remindersSent = 0;
        
        upcomingAppointments.forEach(appointment => {
            // Mark reminder as sent in the database but don't actually send WhatsApp messages
            this.db.updateAppointment(appointment.id, { reminderSent: true });
            remindersSent++;
        });
        
        return remindersSent;
    }
    
    // These WhatsApp related methods are no longer used but kept as stubs
    sendWhatsAppMessage(phone, message) {
        console.log(`WhatsApp messaging disabled: Would have sent to ${phone}: ${message}`);
        return true;
    }
    
    fallbackToDirectWhatsApp(whatsappUrl) {
        console.log('WhatsApp messaging disabled');
    }
    
    // Show notification for message status
    showNotification(message) {
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification('نظام العيادة', {
                body: message,
                icon: 'data:image/svg+xml;utf8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 24 24%22 width%3D%2224%22 height%3D%2224%22%3E%3Cpath fill%3D%22none%22 d%3D%22M0 0h24v24H0z%22%2F%3E%3Cpath d%3D%22M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z%22 fill%3D%22rgba(255%2C107%2C157%2C1)%22%2F%3E%3C%2Fsvg%3E'
            });
        } else if (document.getElementById('toast-container')) {
            const toastContainer = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = 'toast show';
            toast.innerHTML = `
                <div class="toast-header">
                    <strong class="me-auto">إشعار النظام</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">${message}</div>
            `;
            toastContainer.appendChild(toast);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 500);
            }, 5000);
        } else {
            alert(message);
        }
    }
    
    // Open WhatsApp with a message (old method, kept for compatibility)
    openWhatsAppWithMessage(phone, message) {
        this.sendWhatsAppMessage(phone, message);
    }
    
    // Statistics
    getDailyStats(date = new Date()) {
        return this.db.getDailyStats(date);
    }
    
    getMonthlyStats(year = new Date().getFullYear(), month = new Date().getMonth() + 1) {
        return this.db.getMonthlyStats(year, month);
    }
    
    getYearlyStats(year = new Date().getFullYear()) {
        return this.db.getYearlyStats(year);
    }
}

// Create an instance of Secretary
const secretary = new Secretary(db);
