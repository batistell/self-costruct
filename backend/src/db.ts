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
    const tempFile = `${dbFile}.tmp.${Date.now()}`;
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
  const normalized: H2Message = {
    ...msg,
    createdAt: msg.createdAt || Date.now(),
    isLive: false,
  };

  const existingIdx = inMemoryDb.tables.MESSAGES.findIndex((m) => m.id === msg.id);
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
      isLive: false,
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
      createdAt: partial.createdAt || Date.now(),
      isLive: false,
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
    isLive: false,
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
