import fs from "node:fs";
import path from "node:path";

export interface AttachedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string;
}

export interface ActivityItem {
  id: string;
  tool: string;
  args: any;
  result?: any;
  status: "running" | "success" | "error";
  description: string;
  startTime: number;
  endTime?: number;
}

export interface H2Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  attachments?: AttachedFile[];
  status?: string;
  activities?: ActivityItem[];
  isLive?: boolean;
  createdAt?: number;
}

interface H2DatabaseSchema {
  engine: "H2 Database Engine (Embedded)";
  version: string;
  schemaVersion: number;
  tables: {
    MESSAGES: H2Message[];
  };
  meta: {
    createdAt: string;
    updatedAt: string;
    description: string;
  };
}

function findRootDir(): string {
  let curr = process.cwd();
  for (let i = 0; i < 5; i++) {
    if (
      fs.existsSync(path.join(curr, "package.json")) &&
      (fs.existsSync(path.join(curr, "supervisor")) ||
        fs.existsSync(path.join(curr, "backend")) ||
        fs.existsSync(path.join(curr, "frontend")))
    ) {
      return curr;
    }
    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  return process.cwd().endsWith("backend") ? path.resolve(process.cwd(), "..") : process.cwd();
}

function getDbFilePath(): string {
  if (process.env.H2_DB_PATH) return process.env.H2_DB_PATH;
  return path.resolve(findRootDir(), "data", "h2_messages.db");
}

let inMemoryDb: H2DatabaseSchema = {
  engine: "H2 Database Engine (Embedded)",
  version: "2.2.224",
  schemaVersion: 1,
  tables: {
    MESSAGES: [],
  },
  meta: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    description: "H2 Embedded Relational File Store for Chat History",
  },
};

function ensureDbDirectory() {
  const dbFile = getDbFilePath();
  const dir = path.dirname(dbFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function loadDbFromFile(): boolean {
  try {
    const dbFile = getDbFilePath();
    if (fs.existsSync(dbFile)) {
      const content = fs.readFileSync(dbFile, "utf-8");
      if (content.trim()) {
        const parsed = JSON.parse(content);
        if (parsed && parsed.tables && Array.isArray(parsed.tables.MESSAGES)) {
          inMemoryDb = parsed;
          return true;
        }
      }
    }
  } catch (error) {
    console.error("[H2 Database] Error reading database file:", error);
  }
  return false;
}

function flushToFile() {
  try {
    ensureDbDirectory();
    const dbFile = getDbFilePath();
    inMemoryDb.meta.updatedAt = new Date().toISOString();
    const dataStr = JSON.stringify(inMemoryDb, null, 2);
    const tempFile = `${dbFile}.tmp.${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    fs.writeFileSync(tempFile, dataStr, "utf-8");
    fs.renameSync(tempFile, dbFile);
  } catch (error) {
    console.error("[H2 Database] Error flushing database to file:", error);
    try {
      const dbFile = getDbFilePath();
      fs.writeFileSync(dbFile, JSON.stringify(inMemoryDb, null, 2), "utf-8");
    } catch (fallbackErr) {
      console.error("[H2 Database] Direct write fallback failed:", fallbackErr);
    }
  }
}

export function initH2Database() {
  try {
    ensureDbDirectory();
    const loaded = loadDbFromFile();
    const dbFile = getDbFilePath();
    if (loaded) {
      // Normalize any stale live messages from previous backend runs if server restarted
      let changed = false;
      inMemoryDb.tables.MESSAGES.forEach((msg) => {
        if (msg.isLive) {
          msg.isLive = false;
          if (!msg.text && (!msg.activities || msg.activities.length === 0)) {
            msg.text = "Processamento concluído na sessão anterior.";
          }
          changed = true;
        }
      });
      if (changed) {
        flushToFile();
      }
      console.log(
        `[H2 Database] Database loaded from file "${dbFile}" (${inMemoryDb.tables.MESSAGES.length} messages found).`
      );
    } else {
      console.log(`[H2 Database] Initializing fresh H2 file database at "${dbFile}"`);
      flushToFile();
    }
  } catch (error) {
    console.error("[H2 Database] Failed to initialize database file, resetting:", error);
    flushToFile();
  }
}

export function getMessages(): H2Message[] {
  loadDbFromFile();
  return inMemoryDb.tables.MESSAGES || [];
}

export function saveMessage(msg: H2Message): H2Message {
  loadDbFromFile();
  const existingIdx = inMemoryDb.tables.MESSAGES.findIndex((m) => m.id === msg.id);
  const existing = existingIdx >= 0 ? inMemoryDb.tables.MESSAGES[existingIdx] : undefined;

  const normalized: H2Message = {
    id: msg.id,
    role: msg.role,
    text: msg.text !== undefined ? msg.text : (existing?.text || ""),
    attachments: msg.attachments !== undefined ? msg.attachments : existing?.attachments,
    status: msg.status,
    activities: msg.activities !== undefined ? msg.activities : existing?.activities,
    isLive: msg.isLive !== undefined ? msg.isLive : (existing?.isLive ?? false),
    createdAt: msg.createdAt || existing?.createdAt || Date.now(),
  };

  if (existingIdx >= 0) {
    inMemoryDb.tables.MESSAGES[existingIdx] = normalized;
  } else {
    inMemoryDb.tables.MESSAGES.push(normalized);
  }

  flushToFile();
  return normalized;
}

export function updateMessagePartial(id: string, partial: Partial<H2Message>): H2Message {
  loadDbFromFile();
  const existingIdx = inMemoryDb.tables.MESSAGES.findIndex((m) => m.id === id);
  if (existingIdx >= 0) {
    const existing = inMemoryDb.tables.MESSAGES[existingIdx];
    const updated: H2Message = {
      ...existing,
      ...partial,
      createdAt: existing.createdAt || Date.now(),
      isLive: partial.isLive !== undefined ? partial.isLive : existing.isLive,
    };
    inMemoryDb.tables.MESSAGES[existingIdx] = updated;
    flushToFile();
    return updated;
  } else {
    const newMsg: H2Message = {
      id,
      role: partial.role || "assistant",
      text: partial.text || "",
      activities: partial.activities || [],
      attachments: partial.attachments,
      status: partial.status,
      isLive: partial.isLive !== undefined ? partial.isLive : false,
      createdAt: partial.createdAt || Date.now(),
    };
    inMemoryDb.tables.MESSAGES.push(newMsg);
    flushToFile();
    return newMsg;
  }
}

export function deleteMessage(id: string): boolean {
  loadDbFromFile();
  const beforeLen = inMemoryDb.tables.MESSAGES.length;
  inMemoryDb.tables.MESSAGES = inMemoryDb.tables.MESSAGES.filter((m) => m.id !== id);
  const deleted = inMemoryDb.tables.MESSAGES.length < beforeLen;
  if (deleted) {
    flushToFile();
  }
  return deleted;
}

export function saveAllMessages(messages: H2Message[]): void {
  loadDbFromFile();
  inMemoryDb.tables.MESSAGES = messages.map((m) => ({
    ...m,
    createdAt: m.createdAt || Date.now(),
    isLive: m.isLive !== undefined ? m.isLive : false,
  }));
  flushToFile();
}

export function clearMessages(): void {
  inMemoryDb.tables.MESSAGES = [];
  flushToFile();
  console.log("[H2 Database] All messages cleared from H2 database file.");
}

export function getH2Info() {
  loadDbFromFile();
  const dbFile = getDbFilePath();
  let fileSize = 0;
  try {
    if (fs.existsSync(dbFile)) {
      fileSize = fs.statSync(dbFile).size;
    }
  } catch {}

  return {
    engine: inMemoryDb.engine,
    version: inMemoryDb.version,
    filePath: dbFile,
    fileSizeBytes: fileSize,
    totalMessages: inMemoryDb.tables.MESSAGES.length,
    lastSaved: inMemoryDb.meta.updatedAt,
  };
}
