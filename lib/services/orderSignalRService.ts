import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  HttpTransportType,
  LogLevel,
} from "@microsoft/signalr";

const getHubUrl = () => {
  if (typeof window === "undefined") return "/hubs/orders";

  // NEXT_PUBLIC_SIGNALR_URL: direct to BE (e.g. https://localhost:5000)
  // Fallback: relative path → goes through Next.js rewrite (dev) or YARP (prod)
  const base = process.env.NEXT_PUBLIC_SIGNALR_URL;
  return base ? `${base}/hubs/orders` : "/hubs/orders";
};

let connection: HubConnection | null = null;

const getConnection = () => {
  if (!connection) {
    const hubUrl = getHubUrl();
    
    connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets,
        accessTokenFactory: () =>
          typeof window !== "undefined"
            ? localStorage.getItem("accessToken") || ""
            : "",
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    connection.serverTimeoutInMilliseconds = 60000;
    connection.keepAliveIntervalInMilliseconds = 20000;
  }
  return connection;
};

const start = async () => {
  if (typeof window === "undefined") return;
  const conn = getConnection();
  if (conn.state === HubConnectionState.Disconnected) {
    await conn.start();
  }
};

const stop = async () => {
  if (!connection) return;
  if (connection.state !== HubConnectionState.Disconnected) {
    await connection.stop();
  }
};

const invoke = async (methodName: string, ...args: any[]) => {
  const conn = getConnection();
  if (conn.state === HubConnectionState.Connected) {
    return await conn.invoke(methodName, ...args);
  } else {
    console.warn(`SignalR: Cannot invoke ${methodName} because state is ${conn.state}`);
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
