// ─── WebSocket / Socket Layer ────────────────────────────────────────────────
// Connects to the FastAPI WebSocket at /live for real-time event broadcasting.
// Falls back to MockSocket if connection fails.

const BASE_WS_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
const WS_URL = BASE_WS_URL.replace(/^http/, 'ws') + '/live';

type EventCallback = (data: any) => void;



// Channel-to-event mapping (backend publishes Redis channel names)
const CHANNEL_EVENT_MAP: Record<string, string> = {
  'zone.updated': 'ZoneUpdated',
  'allocation.recalculated': 'AllocationRecalculated',
  'agency.status_changed': 'AgencyStatusChanged',
  'inventory.changed': 'InventoryChanged',
};

class RealSocket {
  private ws: WebSocket | null = null;
  private listeners: Record<string, EventCallback[]> = {};
  private reconnectTimer: number | null = null;
  private reconnectDelay = 2000;
  private maxReconnectDelay = 30000;

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log('🔌 WebSocket connected to', WS_URL);
        this.reconnectDelay = 2000; // Reset on successful connection
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'ack') return; // Ignore ack messages

          // Backend sends { channel: "zone.updated", data: {...} }
          const channel = msg.channel;
          const data = msg.data;
          const eventName = CHANNEL_EVENT_MAP[channel] || channel;

          if (this.listeners[eventName]) {
            this.listeners[eventName].forEach(cb => cb(data));
          }
        } catch (e) {
          console.warn('WebSocket message parse error:', e);
        }
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected. Reconnecting...');
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket error:', err);
        this.ws?.close();
      };
    } catch (e) {
      console.warn('WebSocket connection failed:', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxReconnectDelay);
      this.connect();
    }, this.reconnectDelay);
  }

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

  // No-op for real socket — server pushes events
  emitFromServer(_event: string, _data: any) {
    // In real mode, the dev trigger buttons still work because they
    // call the API which triggers Redis → WebSocket broadcast.
    // This is a no-op fallback for direct mock calls.
  }
}

export const socket = new RealSocket();
