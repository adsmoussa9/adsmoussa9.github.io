const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

// إنشاء اتصال بقاعدة البيانات
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'clinic_management'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database');
});

// API لاسترجاع المرضى
app.get('/api/patients', (req, res) => {
    const query = 'SELECT * FROM patients';
    db.query(query, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// API لإضافة مريض جديد
app.post('/api/patients', (req, res) => {
    const { name, phone, address, age, bloodType, firstVisit, allergies, chronicDiseases, previousSurgeries, familyHistory, notes } = req.body;
    const query = `
        INSERT INTO patients (name, phone, address, age, blood_type, first_visit, allergies, chronic_diseases, previous_surgeries, family_history, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(query, [name, phone, address, age, bloodType, firstVisit, allergies, chronicDiseases, previousSurgeries, familyHistory, notes], (err, result) => {
        if (err) throw err;
        res.json({ id: result.insertId });
    });
});

// تشغيل الخادم
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
