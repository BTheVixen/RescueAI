// ===== RescueAI Backend =====
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(bodyParser.json()); // parse JSON

//Twilio Config 
const twilioClient = twilio('TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'); // Replace with your Twilio keys
const fromNumber = '+27827644047'; // Your Twilio number

// Email Config
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: 'bongiwenxumalo54@gmail.com',
    pass: '0' // App Password
  }
});

//  In-memory database
let incidents = {}; // Stores incidents temporarily

//report-incident
app.post('/report-incident', async (req, res) => {
  try {
    const { incident_type, victim_count, location, severity, user_phone, user_email } = req.body;

    // Generate unique case number
    const case_id = uuidv4();

    // Save incident in memory
    incidents[case_id] = {
      incident_type,
      victim_count,
      location,
      severity,
      status: 'Received'
    };

    //  Send SMS 
    if (user_phone) {
      await twilioClient.messages.create({
        body: `RescueAI: Your case ${case_id} has been received.`,
        from: fromNumber,
        to: user_phone
      });
    }

    // ===== Send Email =====
    if (user_email) {
      await transporter.sendMail({
        from: 'bongiwenxumalo54@gmail.com',
        to: user_email,
        subject: `RescueAI Case ${case_id}`,
        text: `Your emergency report has been received.\n\nCase Number: ${case_id}\nType: ${incident_type}\nLocation: ${location}\nVictims: ${victim_count}\nSeverity: ${severity}`
      });
    }

    // Respond to Dialogflow
    res.json({ message: 'Incident received', case_id });
  } catch (error) {
    console.error('Error handling incident:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ===== GET /track-incident/:case_id =====
app.get('/track-incident/:case_id', (req, res) => {
  const case_id = req.params.case_id;
  if (incidents[case_id]) {
    res.json({ case_id, ...incidents[case_id] });
  } else {
    res.status(404).json({ error: 'Case not found' });
  }
});

// ===== Start Server =====
const PORT = 3000;
app.listen(PORT, () => console.log(`RescueAI backend running on port ${PORT}`));