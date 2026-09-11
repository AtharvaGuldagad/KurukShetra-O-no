// ─── WebSocket / Socket Layer ────────────────────────────────────────────────
// When USE_MOCK = false, swap to a real socket.io-client connection by:
//   1. npm install socket.io-client
//   2. Uncomment the `import io` block below
//   3. Change `USE_MOCK_SOCKET = false`
//
// The rest of the app uses this `socket` export and is agnostic to the impl.

const USE_MOCK_SOCKET = true;
// const BASE_WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:8080';
// import { io } from 'socket.io-client';

type EventCallback = (data: any) => void;

class MockSocket {
  private listeners: Record<string, EventCallback[]> = {};

  on(event: string, callback: EventCallback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: EventCallback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  // Internal method to trigger events from dev tools — not used in real mode
  emitFromServer(event: string, data: any) {
    if (!USE_MOCK_SOCKET) return; // no-op in real mode
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
}

// Real Socket.IO adapter — implements the same interface as MockSocket
// class RealSocket {
//   private _socket = io(BASE_WS_URL, { transports: ['websocket'] });
//   on(event: string, cb: EventCallback) { this._socket.on(event, cb); }
//   off(event: string, cb: EventCallback) { this._socket.off(event, cb); }
//   emitFromServer(_event: string, _data: any) { /* no-op — server pushes */ }
// }

export const socket = USE_MOCK_SOCKET
  ? new MockSocket()
  : (() => { throw new Error('Real socket: uncomment RealSocket class above'); })();
