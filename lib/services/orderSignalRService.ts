import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";

const getHubUrl = () => {
  if (typeof window === "undefined") return "/hubs/orders";

  // In production: browser connects via subdomain (e.g. https://demo.restx.food/hubs/orders)
  // YARP reverse proxy routes to backend — supports WebSocket.
  // In development: NEXT_PUBLIC_SIGNALR_URL=https://localhost:5000 (direct to BE)
  const base = process.env.NEXT_PUBLIC_SIGNALR_URL || window.location.origin;
  return `${base}/hubs/orders`;
};

let connection: HubConnection | null = null;

const getConnection = () => {
  if (!connection) {
    connection = new HubConnectionBuilder()
      .withUrl(getHubUrl(), {
        skipNegotiation: true,
        transport: 1,
        accessTokenFactory: () =>
          typeof window !== "undefined"
            ? localStorage.getItem("accessToken") || ""
            : "",
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.None)
      .build();
  }

  return connection;
};

const start = async () => {
  if (typeof window === "undefined") return;
  try {
    const conn = getConnection();
    if (conn.state === HubConnectionState.Disconnected) {
      await conn.start();
    }
  } catch {
    // SignalR is optional — app works without real-time updates
  }
};

const stop = async () => {
  if (!connection) return;
  if (connection.state !== HubConnectionState.Disconnected) {
    await connection.stop();
  }
};

const invoke = async (methodName: string, ...args: unknown[]) => {
  const conn = getConnection();
  if (conn.state === HubConnectionState.Connected) {
    await conn.invoke(methodName, ...args);
  }
};

const on = <T>(eventName: string, handler: (payload: T) => void) => {
  const conn = getConnection();
  conn.on(eventName, handler);
};

const off = <T>(eventName: string, handler: (payload: T) => void) => {
  if (!connection) return;
  connection.off(eventName, handler);
};

const orderSignalRService = {
  start,
  stop,
  invoke,
  on,
  off,
  getConnection,
};

export default orderSignalRService;
