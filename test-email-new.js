
const nodemailer = require('nodemailer');

// New credentials
const user = "kuljeethsingh1224@gmail.com";
const pass = "swyy tlel csoz bvhk";

async function main() {
    console.log('Testing email sending with NEW credentials...');
    console.log('User:', user);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: user,
            pass: pass,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: user,
            to: user, // Send to self
            subject: "Test Email from Script (New Creds)",
            text: "If you see this, the new App Password works!",
        });
        console.log("Message sent: %s", info.messageId);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

main();
