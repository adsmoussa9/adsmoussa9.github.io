// Simulated database for the application
class Database {
    constructor() {
        this.patients = [];
        this.appointments = [];
        this.followUps = [];
        this.payments = [];
        this.users = {
            doctor: { username: 'admin', password: '123' },
            secretary: { username: 'admin', password: '123' }
        };
        this.clinicSettings = {
            name: 'عيادة النساء والتوليد',
            doctorName: 'د. محمد أحمد',
            address: 'شارع المستشفى، القاهرة',
            phone: '01234567890'
        };
        
        // Load data from localStorage
        this.loadData();
    }
    
    // Save all data to localStorage
    saveData() {
        localStorage.setItem('clinic_patients', JSON.stringify(this.patients));
        localStorage.setItem('clinic_appointments', JSON.stringify(this.appointments));
        localStorage.setItem('clinic_followUps', JSON.stringify(this.followUps));
        localStorage.setItem('clinic_payments', JSON.stringify(this.payments));
        localStorage.setItem('clinic_users', JSON.stringify(this.users));
        localStorage.setItem('clinic_settings', JSON.stringify(this.clinicSettings));
    }
    
    // Load all data from localStorage
    loadData() {
        if (localStorage.getItem('clinic_patients')) {
            this.patients = JSON.parse(localStorage.getItem('clinic_patients'));
        }
        
        if (localStorage.getItem('clinic_appointments')) {
            this.appointments = JSON.parse(localStorage.getItem('clinic_appointments'));
        }
        
        if (localStorage.getItem('clinic_followUps')) {
            this.followUps = JSON.parse(localStorage.getItem('clinic_followUps'));
        }
        
        if (localStorage.getItem('clinic_payments')) {
            this.payments = JSON.parse(localStorage.getItem('clinic_payments'));
        }
        
        if (localStorage.getItem('clinic_users')) {
            this.users = JSON.parse(localStorage.getItem('clinic_users'));
        }
        
        if (localStorage.getItem('clinic_settings')) {
            this.clinicSettings = JSON.parse(localStorage.getItem('clinic_settings'));
        }
    }
    
    // Reset the database to factory settings
    factoryReset() {
        this.patients = [];
        this.appointments = [];
        this.followUps = [];
        this.payments = [];
        this.users = {
            doctor: { username: 'admin', password: '123' },
            secretary: { username: 'admin', password: '123' }
        };
        this.clinicSettings = {
            name: 'عيادة النساء والتوليد',
            doctorName: 'د. محمد أحمد',
            address: 'شارع المستشفى، القاهرة',
            phone: '01234567890'
        };
        
        this.saveData();
    }
    
    // Initialize the system with settings
    initializeSystem(settings) {
        this.clinicSettings = { ...settings };
        this.saveData();
    }
    
    // Patient Methods
    addPatient(patient) {
        const existingPatient = this.findPatientByPhone(patient.phone);
        
        if (existingPatient) {
            return existingPatient.id;
        }
        
        const newPatient = {
            id: Date.now().toString(),
            ...patient,
            registrationDate: new Date().toISOString(),
            lastVisit: null
        };
        
        this.patients.push(newPatient);
        this.saveData();
        return newPatient.id;
    }
    
    updatePatient(patientId, updates) {
        const patientIndex = this.patients.findIndex(p => p.id === patientId);
        
        if (patientIndex !== -1) {
            this.patients[patientIndex] = {
                ...this.patients[patientIndex],
                ...updates
            };
            
            this.saveData();
            return true;
        }
        
        return false;
    }
    
    findPatientByPhone(phone) {
        return this.patients.find(p => p.phone === phone);
    }
    
    findPatientById(id) {
        return this.patients.find(p => p.id === id);
    }
    
    searchPatients(query) {
        query = query.toLowerCase();
        return this.patients.filter(p => 
            p.name.toLowerCase().includes(query) || 
            p.phone.includes(query)
        );
    }
    
    // Appointment Methods
    addAppointment(appointment) {
        const newAppointment = {
            id: Date.now().toString(),
            ...appointment,
            createdAt: new Date().toISOString()
        };
        
        this.appointments.push(newAppointment);
        this.saveData();
        return newAppointment.id;
    }
    
    updateAppointment(appointmentId, updates) {
        const appointmentIndex = this.appointments.findIndex(a => a.id === appointmentId);
        
        if (appointmentIndex !== -1) {
            this.appointments[appointmentIndex] = {
                ...this.appointments[appointmentIndex],
                ...updates
            };
            
            // If appointment is confirmed, update patient's last visit
            if (updates.status === 'confirmed') {
                const patientId = this.appointments[appointmentIndex].patientId;
                const appointmentDate = this.appointments[appointmentIndex].appointmentDate;
                this.updatePatient(patientId, { lastVisit: appointmentDate });
            }
            
            this.saveData();
            return true;
        }
        
        return false;
    }
    
    getAppointmentsByDate(date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        return this.appointments.filter(a => {
            const appointmentDate = new Date(a.appointmentDate);
            return appointmentDate >= startOfDay && appointmentDate <= endOfDay;
        });
    }
    
    getAppointmentById(id) {
        return this.appointments.find(a => a.id === id);
    }
    
    getAppointmentsByPatientId(patientId) {
        return this.appointments.filter(a => a.patientId === patientId);
    }
    
    getUpcomingAppointmentsForReminders() {
        const now = new Date();
        const reminderTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now
        
        return this.appointments.filter(a => {
            const appointmentDate = new Date(a.appointmentDate);
            // Only get phone appointments that are unconfirmed and happening in ~15 minutes
            return a.bookingType === 'phone' && a.status === 'unconfirmed' && 
                   appointmentDate > now && appointmentDate <= reminderTime;
        });
    }
    
    // Follow-up Methods
    addFollowUp(followUp) {
        const newFollowUp = {
            id: Date.now().toString(),
            ...followUp,
            createdAt: new Date().toISOString()
        };
        
        this.followUps.push(newFollowUp);
        this.saveData();
        return newFollowUp.id;
    }
    
    getFollowUpsByPatientId(patientId) {
        return this.followUps.filter(f => f.patientId === patientId);
    }
    
    // Payment Methods
    addPayment(payment) {
        const newPayment = {
            id: Date.now().toString(),
            ...payment,
            date: new Date().toISOString()
        };
        
        this.payments.push(newPayment);
        this.saveData();
        return newPayment.id;
    }
    
    getPaymentsByDateRange(startDate, endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        return this.payments.filter(p => {
            const paymentDate = new Date(p.date);
            return paymentDate >= start && paymentDate <= end;
        });
    }
    
    // User Methods
    updateUserPassword(userType, newPassword) {
        if (this.users[userType]) {
            this.users[userType].password = newPassword;
            this.saveData();
            return true;
        }
        
        return false;
    }
    
    // Statistics Methods
    getDailyStats(date) {
        const appointmentsForDay = this.getAppointmentsByDate(date);
        const confirmedAppointments = appointmentsForDay.filter(a => a.status === 'confirmed');
        const unconfirmedAppointments = appointmentsForDay.filter(a => a.status === 'unconfirmed');
        
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        const paymentsForDay = this.getPaymentsByDateRange(startOfDay, endOfDay);
        const totalPayments = paymentsForDay.reduce((sum, payment) => sum + payment.amount, 0);
        
        return {
            totalVisits: confirmedAppointments.length,
            confirmedAppointments: confirmedAppointments.length,
            unconfirmedAppointments: unconfirmedAppointments.length,
            totalPayments: totalPayments
        };
    }
    
    getMonthlyStats(year, month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        const appointmentsInMonth = this.appointments.filter(a => {
            const appointmentDate = new Date(a.appointmentDate);
            return appointmentDate >= startDate && appointmentDate <= endDate;
        });
        
        const confirmedAppointments = appointmentsInMonth.filter(a => a.status === 'confirmed');
        const unconfirmedAppointments = appointmentsInMonth.filter(a => a.status === 'unconfirmed');
        
        const paymentsInMonth = this.getPaymentsByDateRange(startDate, endDate);
        const totalPayments = paymentsInMonth.reduce((sum, payment) => sum + payment.amount, 0);
        
        return {
            totalVisits: confirmedAppointments.length,
            confirmedAppointments: confirmedAppointments.length,
            unconfirmedAppointments: unconfirmedAppointments.length,
            totalPayments: totalPayments
        };
    }
    
    getYearlyStats(year) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        
        const appointmentsInYear = this.appointments.filter(a => {
            const appointmentDate = new Date(a.appointmentDate);
            return appointmentDate >= startDate && appointmentDate <= endDate;
        });
        
        const confirmedAppointments = appointmentsInYear.filter(a => a.status === 'confirmed');
        const unconfirmedAppointments = appointmentsInYear.filter(a => a.status === 'unconfirmed');
        
        const paymentsInYear = this.getPaymentsByDateRange(startDate, endDate);
        const totalPayments = paymentsInYear.reduce((sum, payment) => sum + payment.amount, 0);
        
        return {
            totalVisits: confirmedAppointments.length,
            confirmedAppointments: confirmedAppointments.length,
            unconfirmedAppointments: unconfirmedAppointments.length,
            totalPayments: totalPayments
        };
    }
    
    getDoctorStats(period) {
        let startDate, endDate;
        const today = new Date();
        
        if (period === 'daily') {
            startDate = new Date(today);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(today);
            endDate.setHours(23, 59, 59, 999);
        } else if (period === 'monthly') {
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        } else if (period === 'yearly') {
            startDate = new Date(today.getFullYear(), 0, 1);
            endDate = new Date(today.getFullYear(), 11, 31);
        }
        
        const followUpsInPeriod = this.followUps.filter(f => {
            const followUpDate = new Date(f.createdAt);
            return followUpDate >= startDate && followUpDate <= endDate;
        });
        
        const pregnancyCases = followUpsInPeriod.filter(f => f.type === 'pregnancy').length;
        const ovulationCases = followUpsInPeriod.filter(f => f.type === 'ovulation').length;
        const deliveryCases = followUpsInPeriod.filter(f => f.type === 'delivery').length;
        
        // Calculate monthly trend data (for the last 6 months)
        const monthlyTrend = [];
        for (let i = 5; i >= 0; i--) {
            const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthName = month.toLocaleString('ar-EG', { month: 'short' });
            const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
            const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
            
            const monthFollowUps = this.followUps.filter(f => {
                const date = new Date(f.createdAt);
                return date >= monthStart && date <= monthEnd;
            });
            
            monthlyTrend.push({
                month: monthName,
                total: monthFollowUps.length,
                pregnancy: monthFollowUps.filter(f => f.type === 'pregnancy').length,
                ovulation: monthFollowUps.filter(f => f.type === 'ovulation').length,
                delivery: monthFollowUps.filter(f => f.type === 'delivery').length
            });
        }
        
        return {
            totalPatients: followUpsInPeriod.length,
            pregnancyCases,
            ovulationCases,
            deliveryCases,
            monthlyTrend
        };
    }
}

// Create and export a single instance of the database
const db = new Database();