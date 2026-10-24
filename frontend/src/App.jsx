import { useState, useRef } from 'react';

function App() {
  const [roomId, setRoomId] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [transcripts, setTranscripts] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const wsRef = useRef(null);

  const createRoom = () => {
    const id = 'room_' + Math.random().toString(36).substring(2, 8);
    setRoomId(id);
    joinRoom(id);
  };

  const joinRoom = async (id) => {
    const targetRoom = id || roomId;
    if(!targetRoom) return alert('Room ID pettu');
    try {
      const res = await fetch('http://localhost:3001/api/tickets', { method: 'POST' });
      const data = await res.json();
      if(data.error) return alert(data.error);
      
      const audicWs = new WebSocket(`wss://api.audiclabs.com/v1/stt/stream?ticket=${data.ticket}`);
      audicWs.onopen = () => {
        setInRoom(true);
        startMic(audicWs);
      };
      audicWs.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if(msg.text) setTranscripts(prev => [...prev, msg]);
      };
      wsRef.current = audicWs;
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
      if(ws.readyState === 1) ws.send(pcm16.buffer);
    };
    setIsRecording(true);
  };

  if(!inRoom){
    return (
      <div style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <h1>LiveRoom AL-FS-05</h1>
        <p style={{ color: 'green', fontWeight: 'bold' }}>Backend OK - Ready</p>
        <button onClick={createRoom} style={{ padding: '14px 28px', margin: '10px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', cursor: 'pointer' }}>Create Room</button>
        <div>
          <input value={roomId} onChange={e=>setRoomId(e.target.value)} placeholder="Room ID" style={{ padding: '12px', margin: '10px', borderRadius: '8px', border: '1px solid #ccc' }}/>
          <button onClick={()=>joinRoom()} style={{ padding: '12px 20px', borderRadius: '8px' }}>Join Room</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Room: {roomId} {isRecording && <span style={{color: 'red'}}>● REC</span>}</h2>
      <button onClick={()=> { wsRef.current?.close(); setInRoom(false); setTranscripts([]); }}>Leave</button>
      <div style={{ marginTop: '20px', border: '1px solid #ccc', height: '400px', overflowY: 'auto', padding: '10px', borderRadius: '10px' }}>
        {transcripts.map((t,i)=> <div key={i} style={{ padding: '6px', borderBottom: '1px solid #eee' }}>{t.text}</div>)}
        {transcripts.length===0 && <p>Speak... 16kHz PCM sending to Audic</p>}
      </div>
    </div>
  )
}
export default App;