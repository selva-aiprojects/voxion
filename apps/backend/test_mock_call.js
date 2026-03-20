const { io } = require('socket.io-client');

async function runTest() {
  console.log('--- STARTING AI CALL TEST ---');
  const socket = io('http://localhost:3001/call', { transports: ['websocket'] });

  socket.on('connect', () => {
    console.log('✅ Connected to backend');
    socket.emit('start-call', { voice: 'nova' });
  });

  socket.on('call-ready', (data) => {
    console.log('✅ Call Ready:', data);
    socket.emit('audio-data', 'Hello, I am Rahul. I would like to book an Indian AI Demo for next Tuesday morning.');
  });

  socket.on('transcription-result', (data) => {
    console.log(`🎙️ [${data.role || 'user'}] Transcript: ${data.text}`);
  });

  socket.on('audio-response', (buffer) => {
    console.log(`🔊 Received Audio Response (${buffer.length} bytes)`);
    // Wait for response and then end
    setTimeout(() => {
        socket.emit('end-call');
    }, 2000);
  });

  socket.on('call-summary', (summary) => {
    console.log('📊 CALL SUMMARY RESULT:');
    console.log(JSON.stringify(summary, null, 2));
    
    if (summary.caller_name === 'Rahul') {
      console.log('🎊 SUCCESS: Name extracted correctly');
    } else {
      console.warn('⚠️ WARNING: Name not extracted');
    }
    
    process.exit(0);
  });

  socket.on('connect_error', (err) => {
    console.error('❌ Connection Error:', err.message);
    process.exit(1);
  });
}

runTest();
