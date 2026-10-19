const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
dotenv.config();

async function test() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.5-flash',
    systemInstruction: `=== SYSTEM ROLE ===
You are Aria, the AI receptionist for Apex Dental.
PURPOSE: Help patients with clinic info and appointments.
=== AVAILABLE TOOLS ===
You have access to tools to check availability and manage appointments.
- check_availability(date, serviceName)
- create_appointment(patientName, patientPhone, serviceName, startTime)

=== OUTPUT FORMAT ===
Always respond in valid JSON with this structure:
{
  "user_message": "Your response to the patient",
  "intent": "greeting|faq|availability_check|booking|cancellation|reschedule|handoff|out_of_scope|emergency",
  "required_follow_up": true,
  "proposed_action": null,
  "tool_calls": [],
  "handoff_required": false,
  "safety_flags": [],
  "response_status": "ok"
}`,
    generationConfig: {
      temperature: 0.3,
      responseMimeType: 'application/json'
    }
  });

  const chat = model.startChat({ history: [] });
  const res = await chat.sendMessage('yes, i want to book it for root canal tomorrow');
  console.log('Result:\n', res.response.text());
}
test().catch(console.error);
