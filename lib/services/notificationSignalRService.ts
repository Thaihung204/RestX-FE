import {
  HttpTransportType,
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";

const getHubUrl = () => {
  if (typeof window === "undefined") return "/hubs/orders";
  const base = process.env.NEXT_PUBLIC_SIGNALR_URL;
  return base ? `${base}/hubs/orders` : "/hubs/orders";
};

let connection: HubConnection | null = null;
let lifecycleEventsBound = false;

const tenantGroupRefCounts = new Map<string, number>();
const tenantUserGroupRefCounts = new Map<
  string,
  {
    tenantId: string;
    userId: string;
    refCount: number;
  }
>();

const normalizeTenantId = (tenantId: string) => tenantId.trim().toLowerCase();
const normalizeUserId = (userId: string) => userId.trim();
const tenantUserGroupKey = (tenantId: string, userId: string) =>
  `${tenantId}:${userId}`;

const invokeWhenConnected = async (methodName: string, ...args: any[]) => {
  const conn = getConnection();
  if (conn.state === HubConnectionState.Connected) {
    return await conn.invoke(methodName, ...args);
  }
};

const syncTenantGroups = async (conn: HubConnection) => {
  await Promise.all(
    Array.from(tenantGroupRefCounts.keys()).map(async (tenantId) => {
      try {
        await conn.invoke("JoinTenantGroup", tenantId);
      } catch {
        // silent
      }
    }),
  );
};

const syncTenantUserGroups = async (conn: HubConnection) => {
  await Promise.all(
    Array.from(tenantUserGroupRefCounts.values()).map(
      async ({ tenantId, userId }) => {
        try {
          await conn.invoke("JoinTenantUserGroup", tenantId, userId);
        } catch {
          // silent
        }
      },
    ),
  );
};

const syncAllGroups = async (conn: HubConnection) => {
  await Promise.all([syncTenantGroups(conn), syncTenantUserGroups(conn)]);
};

const bindLifecycleEvents = (conn: HubConnection) => {
  if (lifecycleEventsBound) return;
  lifecycleEventsBound = true;

  conn.onreconnected(async () => {
    await syncAllGroups(conn);
  });
};

const getConnection = (): HubConnection => {
  if (!connection) {
    connection = new HubConnectionBuilder()
      .withUrl(getHubUrl(), {
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets,
        accessTokenFactory: () => {
          if (typeof window === "undefined") return "";
          return (
            localStorage.getItem("accessToken") ||
            sessionStorage.getItem("accessToken") ||
            ""
          );
        },
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.serverTimeoutInMilliseconds = 60000;
    connection.keepAliveIntervalInMilliseconds = 20000;
    bindLifecycleEvents(connection);
  }
  return connection;
};

const start = async () => {
  if (typeof window === "undefined") return;
  const conn = getConnection();
  if (conn.state === HubConnectionState.Disconnected) {
    await conn.start();
    await syncAllGroups(conn);
  }
};

const stop = async () => {
  if (!connection) return;
  if (connection.state !== HubConnectionState.Disconnected) {
    await connection.stop();
  }
};

const joinTenantGroup = async (tenantId: string) => {
  const normalizedTenantId = normalizeTenantId(tenantId || "");
  if (!normalizedTenantId) return;

  const count = tenantGroupRefCounts.get(normalizedTenantId) || 0;
  tenantGroupRefCounts.set(normalizedTenantId, count + 1);

  if (count === 0) {
    await invokeWhenConnected("JoinTenantGroup", normalizedTenantId);
  }
};

const leaveTenantGroup = async (tenantId: string) => {
  const normalizedTenantId = normalizeTenantId(tenantId || "");
  if (!normalizedTenantId) return;

  const count = tenantGroupRefCounts.get(normalizedTenantId) || 0;
  if (count <= 0) return;

  if (count === 1) {
    tenantGroupRefCounts.delete(normalizedTenantId);
    await invokeWhenConnected("LeaveTenantGroup", normalizedTenantId);
    return;
  }

  tenantGroupRefCounts.set(normalizedTenantId, count - 1);
};

const joinTenantUserGroup = async (tenantId: string, userId: string) => {
  const normalizedTenantId = normalizeTenantId(tenantId || "");
  const normalizedUserId = normalizeUserId(userId || "");
  if (!normalizedTenantId || !normalizedUserId) return;

  const key = tenantUserGroupKey(normalizedTenantId, normalizedUserId);
  const group = tenantUserGroupRefCounts.get(key);

  if (group) {
    tenantUserGroupRefCounts.set(key, {
      ...group,
      refCount: group.refCount + 1,
    });
    return;
  }

  tenantUserGroupRefCounts.set(key, {
    tenantId: normalizedTenantId,
    userId: normalizedUserId,
    refCount: 1,
  });

  await invokeWhenConnected(
    "JoinTenantUserGroup",
    normalizedTenantId,
    normalizedUserId,
  );
};

const leaveTenantUserGroup = async (tenantId: string, userId: string) => {
  const normalizedTenantId = normalizeTenantId(tenantId || "");
  const normalizedUserId = normalizeUserId(userId || "");
  if (!normalizedTenantId || !normalizedUserId) return;

  const key = tenantUserGroupKey(normalizedTenantId, normalizedUserId);
  const group = tenantUserGroupRefCounts.get(key);
  if (!group) return;

  if (group.refCount === 1) {
    tenantUserGroupRefCounts.delete(key);
    await invokeWhenConnected(
      "LeaveTenantUserGroup",
      normalizedTenantId,
      normalizedUserId,
    );
    return;
  }

  tenantUserGroupRefCounts.set(key, {
    ...group,
    refCount: group.refCount - 1,
  });
};

const on = <T>(eventName: string, handler: (payload: T) => void) => {
  getConnection().on(eventName, handler);
};

const off = <T>(eventName: string, handler: (payload: T) => void) => {
  connection?.off(eventName, handler);
};

const notificationSignalRService = {
  start,
  stop,
  joinTenantGroup,
  leaveTenantGroup,
  joinTenantUserGroup,
  leaveTenantUserGroup,
  on,
  off,
  getConnection,
};

export default notificationSignalRService;
