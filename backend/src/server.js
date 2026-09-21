require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const classRoutes = require('./routes/classRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const examRoutes = require('./routes/examRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const transportRoutes = require('./routes/transportRoutes');
const reportRoutes = require('./routes/reportRoutes');
const libraryRoutes = require('./routes/libraryRoutes');
const messageRoutes = require('./routes/messageRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const boardingRoutes = require('./routes/boardingRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const guardianRoutes = require('./routes/guardianRoutes');
const applicantRoutes = require('./routes/applicantRoutes');
const visitorRoutes = require('./routes/visitorRoutes');
const approvalRoutes = require('./routes/approvalRoutes');
const recruitmentRoutes = require('./routes/recruitmentRoutes');
const newsRoutes = require('./routes/newsRoutes');
const app = express();

// CLIENT_URL must exactly match your deployed frontend origin (no trailing slash)
// or the browser will block login with a CORS error.
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/boarding', boardingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/guardians', guardianRoutes);
app.use('/api/applicants', applicantRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/news', newsRoutes);
app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));

// Central error handler (catches anything thrown/passed to next())
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
