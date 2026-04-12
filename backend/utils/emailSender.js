const nodemailer = require('nodemailer');

const sendMail = async (to, subject, htmlContent) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // Didi ki ID
                pass: process.env.EMAIL_PASS  // App Password
            }
        });

        const mailOptions = {
            from: `"Didi's Mess" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: htmlContent 
        };

        await transporter.sendMail(mailOptions);
        console.log("✅ Email sent to:", to);
    } catch (error) {
        console.error("❌ Email error:", error);
    }
};

module.exports = sendMail;