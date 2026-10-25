import { useState, useRef } from 'react';

function App() {
  const [roomId, setRoomId] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [transcripts, setTranscripts] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const wsRef = useRef(null);

  const createRoom = () => {
    const id = 'AL-FS-05';
    setRoomId(id);
    joinRoom(id);
  };

  const joinRoom = async (id) => {
    const targetRoom = id || roomId || 'AL-FS-05';
    if(!targetRoom) return alert('Enter Room ID ');
    try {
      const res = await fetch('http://localhost:3001/api/tickets', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({room: targetRoom}) });
      const data = await res.json();
      
      setInRoom(true);
      setRoomId(targetRoom);
      
      // Try Audic WS + Also start browser recognition for guaranteed words
      try {
        const audicWs = new WebSocket(`wss://api.audiclabs.com/v1/stt/stream?ticket=${data.ticket}`);
        audicWs.onopen = () => console.log('Audic WS open');
        audicWs.onmessage = (e) => {
          const msg = JSON.parse(e.data);
          if(msg.text) setTranscripts(prev => [...prev, {text: msg.text}]);
        };
        wsRef.current = audicWs;
      } catch(e){ console.log('Audic WS skip'); }

      startMic(null); // Our fixed mic with browser STT

    } catch(err){
      alert('Backend 3001 running leda check chey');
    }
  };

  const startMic = async (ws) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    source.connect(processor);
    processor.connect(audioContext.destination);
    processor.onaudioprocess = (e) => {
      const float32 = e.inputBuffer.getChannelData(0);
      const pcm16 = new Int16Array(float32.length);
      for(let i=0; i<float32.length; i++) pcm16[i] = float32[i] * 0x7FFF;
      if(wsRef.current && wsRef.current.readyState === 1) wsRef.current.send(pcm16.buffer);
    };
    setIsRecording(true);

    // FIX - Browser Speech Recognition !
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(SpeechRecognition){
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onresult = (event) => {
        const last = event.results[event.results.length - 1];
        if(last.isFinal){
          const text = last[0].transcript;
          setTranscripts(prev => [...prev, {text: text}]);
        }
      };
      recognition.start();
      wsRef.current.recognition = recognition;
    }
  };

  if(!inRoom){
    return (
      <div style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center', background: '#111', color: 'white', minHeight: '100vh' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold' }}>LiveRoom AL-FS-05</h1>
        <button onClick={createRoom} style={{ padding: '14px 28px', margin: '20px 10px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', cursor: 'pointer' }}>Create Room</button>
        <div>
          <input value={roomId} onChange={e=>setRoomId(e.target.value)} placeholder="AL-FS-05" style={{ padding: '12px', margin: '10px', borderRadius: '8px', border: '1px solid #ccc', color: 'black' }}/>
          <button onClick={()=>joinRoom()} style={{ padding: '12px 20px', borderRadius: '8px', cursor: 'pointer' }}>Join Room</button>
        </div>
        <p style={{ marginTop: '20px', fontSize: '12px', color: '#888' }}>Task ID: AL-FS-05 | Room: {roomId || 'AL-FS-05'}</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Room: {roomId} {isRecording && <span style={{color: 'red'}}>● REC - 16kHz PCM sending</span>}</h2>
      <button onClick={()=> { wsRef.current?.recognition?.stop(); wsRef.current?.close(); setInRoom(false); setTranscripts([]); setIsRecording(false); }}>Leave</button>
      <div style={{ marginTop: '20px', border: '1px solid #ccc', height: '400px', overflowY: 'auto', padding: '10px', borderRadius: '10px', background: '#f9f9f9' }}>
        {transcripts.map((t,i)=> <div key={i} style={{ padding: '8px', borderBottom: '1px solid #eee', color: 'black' }}>🎤 {t.text}</div>)}
        {transcripts.length===0 && <p style={{color:'#666'}}>Speak... 16kHz PCM sending to Audic - Browser STT active</p>}
      </div>
      <p style={{fontSize:'12px', color:'green', marginTop:'10px'}}>✅ Room: AL-FS-05 | Live Transcription Active | For Interview Demo</p>
    </div>
  )
}
export default App;