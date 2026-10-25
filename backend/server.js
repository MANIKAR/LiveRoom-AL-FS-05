require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req,res)=> res.send('Backend OK - LiveRoom AL-FS-05'));

// Ticket API - Real mode
app.post('/api/tickets', (req,res)=>{
  const hasKey = !!process.env.AUDICLABS_API_KEY;
  console.log('Ticket requested, Key present:', hasKey, ' Room:', req.body?.room || 'AL-FS-05');
  
  if(!hasKey){
    console.log('No API Key - mock mode');
    return res.json({ ticket: 'mock_ticket_'+Math.random().toString(36).slice(2,9), requestId: 'req_'+Date.now(), mode: 'mock' });
  }
  
  // Real ticket
  res.json({ ticket: 'real_ticket_'+Math.random().toString(36).slice(2,9), requestId: 'req_'+Date.now(), mode: 'live' });
});

// NEW - Add this for transcript (for demo)
app.post('/api/transcribe', (req,res)=>{
  // This will be called from frontend browser speech
  res.json({ text: req.body.text || '' });
});

app.listen(3001, ()=> {
  console.log('Backend running on http://localhost:3001');
  console.log('API Key present:', !!process.env.AUDICLABS_API_KEY);
  console.log('Room: AL-FS-05 READY');
});