const User = require('../models/User');
const Task = require('../models/Task');
const Submission = require('../models/Submission');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

exports.exportExcelReport = async (req, res) => {
    try {
        const users = await User.find({ role: 'user' });
        const tasks = await Task.find();
        const submissions = await Submission.find().populate('user task');

        const workbook = new ExcelJS.Workbook();
        const summarySheet = workbook.addWorksheet('Summary');
        
        summarySheet.columns = [
            { header: 'Metric', key: 'metric', width: 30 },
            { header: 'Value', key: 'value', width: 15 }
        ];

        summarySheet.addRow({ metric: 'Total Students', value: users.length });
        summarySheet.addRow({ metric: 'Total Tasks', value: tasks.length });
        summarySheet.addRow({ metric: 'Total Submissions', value: submissions.length });
        summarySheet.addRow({ metric: 'Approved Submissions', value: submissions.filter(s => s.status === 'approved').length });

        const studentsSheet = workbook.addWorksheet('Students Progress');
        studentsSheet.columns = [
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Gmail', key: 'email', width: 35 },
            { header: 'Pass (Initial)', key: 'pass', width: 20 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Approved Tasks', key: 'approved', width: 15 },
            { header: 'Pending Tasks', key: 'pending', width: 15 }
        ];

        users.forEach(user => {
            const userSubs = submissions.filter(s => s.user && s.user._id.toString() === user._id.toString());
            studentsSheet.addRow({
                name: user.name,
                email: user.email,
                pass: user.initialPassword || 'Updated',
                status: user.isVerified ? 'Verified' : 'Pending',
                approved: userSubs.filter(s => s.status === 'approved').length,
                pending: userSubs.filter(s => s.status === 'pending').length
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=devtrack_report.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        if(!res.headersSent) {
            res.status(500).json({ success: false, message: 'Export failed' });
        }
    }
};

exports.exportStudentExcelReport = async (req, res) => {
    try {
        const studentId = req.user._id;
        const user = await User.findById(studentId);
        const submissions = await Submission.find({ user: studentId }).populate('task');

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('My Progress');
        
        sheet.columns = [
            { header: 'Task Name', key: 'taskName', width: 40 },
            { header: 'Type', key: 'type', width: 20 },
            { header: 'Status', key: 'status', width: 20 }
        ];

        submissions.forEach(sub => {
            sheet.addRow({
                taskName: sub.task ? sub.task.title : 'Unknown Task',
                type: sub.task ? sub.task.type : '-',
                status: sub.status
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=my_devtrack_report.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        if(!res.headersSent) res.status(500).json({ success: false, message: 'Export failed' });
    }
};

exports.exportStudentPdfReport = async (req, res) => {
    try {
        const studentId = req.user._id;
        const user = await User.findById(studentId);
        const submissions = await Submission.find({ user: studentId }).populate('task');

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=my_devtrack_report.pdf`);
        doc.pipe(res);

        doc.fontSize(20).text('My DevTrack Progress Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).text(`Student: ${user.name}`);
        doc.fontSize(12).text(`Email: ${user.email}`);
        doc.text(`Total Submissions: ${submissions.length}`);
        doc.text(`Approved: ${submissions.filter(s => s.status === 'approved').length}`);
        doc.text(`Pending: ${submissions.filter(s => s.status === 'pending').length}`);
        doc.moveDown();

        doc.fontSize(14).text('Task Breakdown:');
        doc.moveDown();

        submissions.forEach(sub => {
            const taskName = sub.task ? sub.task.title : 'Unknown';
            doc.fontSize(11).text(`- ${taskName} [${sub.status.toUpperCase()}]`);
        });

        doc.end();
    } catch (error) {
        console.error(error);
        if(!res.headersSent) res.status(500).json({ success: false, message: 'Export failed' });
    }
};
