import nodemailer from "nodemailer";
import multer from "multer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// Temporary upload folder for Vercel
const upload = multer({ dest: "/tmp" });

// Helper to run multer in a Vercel handler
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export const config = {
  api: {
    bodyParser: false, // Important for handling multipart/form-data
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await runMiddleware(req, res, upload.single("resume"));

    const { firstName, lastName, email, phone, category } = req.body;
    const file = req.file;

    if (!firstName || !lastName || !email || !phone || !category) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    console.log("📥 Received Form Data:", req.body);

    // ✅ Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // ✅ Construct email
    const mailOptions = {
      from: `"Uma Foods Careers" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      subject: `New Job Application: ${firstName} ${lastName}`,
      html: `
        <h3>New Application Received</h3>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Position:</strong> ${category}</p>
      `,
      attachments: file
        ? [{ filename: file.originalname, path: file.path }]
        : [],
    };

    // ✅ Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.response);

    // Delete uploaded file (Vercel storage is temporary anyway)
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);

    return res.status(200).json({ success: true, message: "Application sent successfully!" });
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return res.status(500).json({ success: false, message: "Failed to send email." });
  }
}
