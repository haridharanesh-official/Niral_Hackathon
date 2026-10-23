export type DeviceSession = {
  id: string;
  label: string;
  browser: string;
  os: string;
  location: string;
  loginAt: string;
  lastActiveAt: string;
  current: boolean;
};

const SESSIONS_KEY = "hackos.auth.sessions";
const NOTICES_KEY = "hackos.security.notices";

function parseUa(ua: string) {
  let browser = "Unknown browser";
  let os = "Unknown OS";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = "Safari";

  if (/Windows/.test(ua)) os = "Windows";
  else if (/Mac OS X/.test(ua)) os = "macOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad/.test(ua)) os = "iOS";
  else if (/Linux/.test(ua)) os = "Linux";

  return { browser, os };
}

export function recordLoginSession() {
  if (typeof window === "undefined") return;
  const ua = navigator.userAgent;
  const { browser, os } = parseUa(ua);
  const now = new Date().toISOString();
  const currentId =
    sessionStorage.getItem("hackos.session.id") ??
    `sess_${Math.random().toString(36).slice(2, 10)}`;
  sessionStorage.setItem("hackos.session.id", currentId);

  let sessions: DeviceSession[] = [];
  try {
    sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? "[]") as DeviceSession[];
  } catch {
    sessions = [];
  }

  sessions = sessions.map((s) => ({ ...s, current: false }));
  const existing = sessions.find((s) => s.id === currentId);
  if (existing) {
    existing.lastActiveAt = now;
    existing.current = true;
  } else {
    sessions.unshift({
      id: currentId,
      label: "This device",
      browser,
      os,
      location: "Approximate · based on network",
      loginAt: now,
      lastActiveAt: now,
      current: true,
    });
    pushSecurityNotice({
      type: "NEW_DEVICE",
      title: "New device signed in",
      detail: `${browser} on ${os}`,
      at: now,
    });
  }

  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(0, 12)));
}

export function touchCurrentSession() {
  if (typeof window === "undefined") return;
  const id = sessionStorage.getItem("hackos.session.id");
  if (!id) return;
  try {
    const sessions = JSON.parse(
      localStorage.getItem(SESSIONS_KEY) ?? "[]",
    ) as DeviceSession[];
    const next = sessions.map((s) =>
      s.id === id
        ? { ...s, lastActiveAt: new Date().toISOString(), current: true }
        : { ...s, current: false },
    );
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function listSessions(): DeviceSession[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? "[]") as DeviceSession[];
  } catch {
    return [];
  }
}

export function revokeSession(id: string) {
  const sessions = listSessions().filter((s) => s.id !== id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  pushSecurityNotice({
    type: "SESSION_REVOKED",
    title: "Session signed out",
    detail: `Session ${id} was revoked`,
    at: new Date().toISOString(),
  });
}

export function revokeOtherSessions() {
  const id = sessionStorage.getItem("hackos.session.id");
  const sessions = listSessions().filter((s) => s.id === id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  pushSecurityNotice({
    type: "SESSION_REVOKED",
    title: "Other sessions signed out",
    detail: "All devices except this one were revoked",
    at: new Date().toISOString(),
  });
}

export type SecurityNotice = {
  type: string;
  title: string;
  detail: string;
  at: string;
};

export function pushSecurityNotice(notice: SecurityNotice) {
  try {
    const prev = JSON.parse(
      localStorage.getItem(NOTICES_KEY) ?? "[]",
    ) as SecurityNotice[];
    localStorage.setItem(
      NOTICES_KEY,
      JSON.stringify([notice, ...prev].slice(0, 30)),
    );
  } catch {
    /* ignore */
  }
}

export function listSecurityNotices(): SecurityNotice[] {
  try {
    return JSON.parse(localStorage.getItem(NOTICES_KEY) ?? "[]") as SecurityNotice[];
  } catch {
    return [];
  }
}
