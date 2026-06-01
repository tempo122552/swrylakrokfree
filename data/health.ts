export type HealthCheckStatus = "ok" | "error";

export type HealthCheckPayload = {
  ok: boolean;
  service: "swrylakrok";
  database: HealthCheckStatus;
  timestamp: string;
};

export type HealthCheckResult = {
  status: 200 | 503;
  body: HealthCheckPayload;
};

type HealthCheckOptions = {
  pingDatabase: () => Promise<unknown>;
  now?: () => Date;
};

export async function checkApplicationHealth({
  pingDatabase,
  now = () => new Date(),
}: HealthCheckOptions): Promise<HealthCheckResult> {
  const timestamp = now().toISOString();

  try {
    await pingDatabase();

    return {
      status: 200,
      body: {
        ok: true,
        service: "swrylakrok",
        database: "ok",
        timestamp,
      },
    };
  } catch {
    return {
      status: 503,
      body: {
        ok: false,
        service: "swrylakrok",
        database: "error",
        timestamp,
      },
    };
  }
}
