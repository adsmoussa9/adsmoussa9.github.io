// Doctor module
class Doctor {
    constructor(database) {
        this.db = database;
    }
    
    // Patient File Management
    getPatientFile(patientId) {
        const patient = this.db.findPatientById(patientId);
        
        if (!patient) {
            return null;
        }
        
        const appointments = this.db.getAppointmentsByPatientId(patientId);
        const followUps = this.db.getFollowUpsByPatientId(patientId);
        
        return {
            patient,
            appointments,
            followUps
        };
    }
    
    searchPatients(query) {
        return this.db.searchPatients(query);
    }
    
    // Follow-up Management
    addFollowUp(followUpData) {
        return this.db.addFollowUp(followUpData);
    }
    
    // Statistics
    getStats(period = 'daily') {
        return this.db.getDoctorStats(period);
    }
    
    // System Management
    resetToFactory() {
        return this.db.factoryReset();
    }
    
    initializeSystem(settings) {
        return this.db.initializeSystem(settings);
    }
    
    // Today's Patients
    getTodayPatients() {
        const today = new Date();
        const appointments = this.db.getAppointmentsByDate(today);
        
        // Only get confirmed appointments
        const confirmedAppointments = appointments.filter(a => a.status === 'confirmed');
        
        // Get patient details for each appointment
        return confirmedAppointments.map(appointment => {
            const patient = this.db.findPatientById(appointment.patientId);
            return {
                appointment,
                patient
            };
        });
    }
}

// Create an instance of Doctor
const doctor = new Doctor(db);

