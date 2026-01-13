export function connectToPollSocket(pollId, onMessage) {
  const socket = new WebSocket(`ws://127.0.0.1:8000/ws/polls/${pollId}/`);

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  return socket;
}
