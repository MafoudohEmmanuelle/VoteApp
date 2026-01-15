export function connectToPollSocket(pollId, onMessage) {
  const socket = new WebSocket(`ws://127.0.0.1:8000/ws/polls/${pollId}/`);

  socket.onopen = () => {
    console.log(`WebSocket connected for poll ${pollId}`);
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (err) {
      // Silent fail on message parsing errors
    }
  };

  socket.onerror = (error) => {
    // Suppress WebSocket errors - development server doesn't support WebSocket
    // Voting still works via REST API, WebSocket is only for live updates
  };

  socket.onclose = () => {
    // Socket closed - voting still works via REST API
  };

  // Return a mock socket-like object that won't error if close() is called
  return {
    close: () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    }
  };
}
