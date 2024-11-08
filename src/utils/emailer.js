import nodemailer from "nodemailer";
import dotenv from "dotenv";

//envs were not getting fetched in this file so had to re configure it here 

dotenv.config(
    {
        path: "./.env"
    }
);

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL,
        pass: process.env.GMAIL_PASS,
    },
});

export const emailer = async (email, subject, htmlContent) => {
    try {
        const mailOptions = {
            from: process.env.GMAIL,
            to: email,
            subject: subject,
            html: htmlContent,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email Sent:", info.response);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};