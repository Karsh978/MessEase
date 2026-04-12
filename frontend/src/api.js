import axios from 'axios';

// api.js mein sirf ye line badal do
export const API = axios.create({ baseURL: 'http://localhost:5000/api' });
//security /
API.interceptors.request.use((config) => {
    const pin = localStorage.getItem('adminPIN'); 
    if (pin) {
        config.headers['admin-pin'] = pin;
    }
    return config;
});

export const fetchStudents = () => API.get('/students/all');
export const fetchExpenses = () => API.get('/expenses/all');
export const fetchMenu = () => API.get('/menu');
export const addStudent = (data) => API.post('/students/add', data);
export const addExpense = (data) => API.post('/expenses/add', data);
export const markAttendance = (data) => API.post('/attendance/mark', data);
export const updateMenu = (data) => API.post('/menu/update', data);
export const fetchAlerts = () => API.get('/students/alerts');
// api.js check karein:
export const fetchBillSummary = (id) => API.get(`/students/bill-summary/${id}`);

export const fetchAttendanceStatus = (date) => API.get(`/attendance/status/${date}`);
export const loginStudent = (data) => API.post('/students/portal-login', data);

// api.js mein check karo:
export const deleteStudent = (id) => API.delete(`/students/${id}`); // Backticks (`) zaroori hain!
export const toggleMealAttendance = (data) => API.post('/attendance/toggle-meal', data);
export const updateStudentProfile = (id, data) => API.put(`/students/update-profile/${id}`, data);

export const payFees = (id) => API.post(`/students/pay/${id}`);