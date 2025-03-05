// ...existing code...

// استبدال localStorage بطلبات API
async function loadPatients() {
    const response = await fetch('/api/patients');
    const patients = await response.json();
    // عرض المرضى في الجدول
    displayPatients(patients);
}

async function addPatient(patientData) {
    const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData)
    });
    const newPatient = await response.json();
    // إضافة المريض الجديد إلى القائمة
    addPatientToTable(newPatient);
}

// ...existing code...
