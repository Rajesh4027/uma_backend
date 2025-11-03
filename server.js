import express from "express";
import cors from "cors";
import multer from "multer";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Multer setup for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// ✅ Route to handle email sending
app.post("/send-email", upload.single("resume"), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, category } = req.body;
    const file = req.file;

    // Basic validation
    if (!firstName || !lastName || !email || !phone || !category) {
      return res.json({ success: false, message: "All fields are required." });
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

    // ✅ Send email asynchronously
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.response);

    // Delete uploaded file after sending
    if (file) fs.unlinkSync(file.path);

    return res.json({ success: true, message: "Application sent successfully!" });
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return res.json({ success: false, message: "Failed to send email." });
  }
});

// Test route
app.get("/", (req, res) => res.send("✅ Uma Foods Backend Running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
