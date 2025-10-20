const BACKOFF_STEPS = [1000, 2000, 5000, 10000];

export class RealtimeClient {
  constructor({ url, onSnapshot, onStatusChange }) {
    this.url = url;
    this.onSnapshot = onSnapshot;
    this.onStatusChange = onStatusChange;
    this.attempt = 0;
    this.socket = null;
    this.connect();
  }

  connect() {
    if (this.onStatusChange) {
      this.onStatusChange('connecting');
    }

    this.socket = new WebSocket(this.url);
    this.socket.addEventListener('open', () => {
      this.attempt = 0;
      if (this.onStatusChange) {
        this.onStatusChange('connected');
      }
    });

    this.socket.addEventListener('message', (event) => {
      try {
        const { type, payload } = JSON.parse(event.data);
        if (type === 'snapshot' && this.onSnapshot) {
          this.onSnapshot(payload);
        }
      } catch (error) {
        console.error('Failed to parse realtime payload', error);
      }
    });

    this.socket.addEventListener('close', () => {
      if (this.onStatusChange) {
        this.onStatusChange('disconnected');
      }
      this.scheduleReconnect();
    });

    this.socket.addEventListener('error', (error) => {
      console.error('Realtime socket error', error);
      this.socket?.close();
    });
  }

  scheduleReconnect() {
    const delay = BACKOFF_STEPS[Math.min(this.attempt, BACKOFF_STEPS.length - 1)];
    this.attempt += 1;
    setTimeout(() => this.connect(), delay);
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
