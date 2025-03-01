// Import Firebase libraries
import firebase from 'firebase/app';
import 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

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
        
        // Load data from Firestore
        this.loadData();
    }
    
    // Save all data to Firestore
    async saveData() {
        await db.collection('clinic').doc('data').set({
            patients: this.patients,
            appointments: this.appointments,
            followUps: this.followUps,
            payments: this.payments,
            users: this.users,
            clinicSettings: this.clinicSettings
        });
    }
    
    // Load all data from Firestore
    async loadData() {
        const doc = await db.collection('clinic').doc('data').get();
        if (doc.exists) {
            const data = doc.data();
            this.patients = data.patients || [];
            this.appointments = data.appointments || [];
            this.followUps = data.followUps || [];
            this.payments = data.payments || [];
            this.users = data.users || {
                doctor: { username: 'admin', password: '123' },
                secretary: { username: 'admin', password: '123' }
            };
            this.clinicSettings = data.clinicSettings || {
                name: 'عيادة النساء والتوليد',
                doctorName: 'د. محمد أحمد',
                address: 'شارع المستشفى، القاهرة',
                phone: '01234567890'
            };
        }
    }
    
    // Reset the database to factory settings
    async factoryReset() {
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
        
        await this.saveData();
    }
    
    // Initialize the system with settings
    async initializeSystem(settings) {
        this.clinicSettings = { ...settings };
        await this.saveData();
    }
    
    // Patient Methods
    async addPatient(patient) {
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
        await this.saveData();
        return newPatient.id;
    }
    
    async updatePatient(patientId, updates) {
        const patientIndex = this.patients.findIndex(p => p.id === patientId);
        
        if (patientIndex !== -1) {
            this.patients[patientIndex] = {
                ...this.patients[patientIndex],
                ...updates
            };
            
            await this.saveData();
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
    async addAppointment(appointment) {
        const newAppointment = {
            id: Date.now().toString(),
            ...appointment,
            createdAt: new Date().toISOString()
        };
        
        this.appointments.push(newAppointment);
        await this.saveData();
        return newAppointment.id;
    }
    
    async updateAppointment(appointmentId, updates) {
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
                await this.updatePatient(patientId, { lastVisit: appointmentDate });
            }
            
            await this.saveData();
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
    async addFollowUp(followUp) {
        const newFollowUp = {
            id: Date.now().toString(),
            ...followUp,
            createdAt: new Date().toISOString()
        };
        
        this.followUps.push(newFollowUp);
        await this.saveData();
        return newFollowUp.id;
    }
    
    getFollowUpsByPatientId(patientId) {
        return this.followUps.filter(f => f.patientId === patientId);
    }
    
    // Payment Methods
    async addPayment(payment) {
        const newPayment = {
            id: Date.now().toString(),
            ...payment,
            date: new Date().toISOString()
        };
        
        this.payments.push(newPayment);
        await this.saveData();
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
    async updateUserPassword(userType, newPassword) {
        if (this.users[userType]) {
            this.users[userType].password = newPassword;
            await this.saveData();
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

    getAppointmentById(appointmentId) {
        return this.appointments.find(a => a.id === appointmentId);
    }

    updateAppointment(appointmentId, updateData) {
        const appointmentIndex = this.appointments.findIndex(a => a.id === appointmentId);
        
        if (appointmentIndex !== -1) {
            this.appointments[appointmentIndex] = {
                ...this.appointments[appointmentIndex],
                ...updateData
            };
            
            this.saveData();
            return true;
        }
        
        return false;
    }
}

// Create and export a single instance of the database
const dbInstance = new Database();
export default dbInstance;
