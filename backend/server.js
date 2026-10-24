require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req,res)=> res.send('Backend OK - LiveRoom AL-FS-05'));

app.post('/api/tickets', (req,res)=>{
  console.log('Ticket requested, mock mode');
  res.json({ ticket: 'mock_ticket_'+Math.random().toString(36).slice(2,9), requestId: 'req_'+Date.now() });
});

app.listen(3001, ()=> {
  console.log('Backend running on http://localhost:3001');
  console.log('API Key present:', !!process.env.AUDICLABS_API_KEY);
});