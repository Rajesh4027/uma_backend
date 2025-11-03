import express from "express";
import multer from "multer";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const upload = multer();

const resend = new Resend(process.env.RESEND_API_KEY);

app.post("/send-email", upload.single("resume"), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, category } = req.body;

    const response = await resend.emails.send({
      from: "Uma Foods <onboarding@resend.dev>",
      to: process.env.RECEIVER_EMAIL,
      subject: `New Job Application - ${category}`,
      html: `
        <h2>New Application Received</h2>
        <p><b>Name:</b> ${firstName} ${lastName}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Category:</b> ${category}</p>
      `,
    });

    console.log("✅ Email sent:", response);
    res.json({ success: true, message: "Application sent successfully!" });
  } catch (error) {
    console.error("❌ Error sending email:", error);
    res.json({ success: false, message: "Failed to send email." });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
