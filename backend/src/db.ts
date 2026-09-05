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

const DB_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = process.env.H2_DB_PATH || path.resolve(DB_DIR, "h2_messages.db");

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
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function flushToFile() {
  try {
    ensureDbDirectory();
    inMemoryDb.meta.updatedAt = new Date().toISOString();
    const dataStr = JSON.stringify(inMemoryDb, null, 2);
    // Write atomically using temporary file to avoid corruption
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, dataStr, "utf-8");
    fs.renameSync(tempFile, DB_FILE);
  } catch (error) {
    console.error("[H2 Database] Error flushing database to file:", error);
  }
}

export function initH2Database() {
  try {
    ensureDbDirectory();
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      if (content.trim()) {
        const parsed = JSON.parse(content);
        if (parsed && parsed.tables && Array.isArray(parsed.tables.MESSAGES)) {
          inMemoryDb = parsed;
          console.log(
            `[H2 Database] Database loaded from file "${DB_FILE}" (${inMemoryDb.tables.MESSAGES.length} messages found).`
          );
          return;
        }
      }
    }
    console.log(`[H2 Database] Initializing fresh H2 file database at "${DB_FILE}"`);
    flushToFile();
  } catch (error) {
    console.error("[H2 Database] Failed to initialize database file, resetting:", error);
    flushToFile();
  }
}

export function getMessages(): H2Message[] {
  return inMemoryDb.tables.MESSAGES || [];
}

export function saveMessage(msg: H2Message): H2Message {
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

export function saveAllMessages(messages: H2Message[]): void {
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
  let fileSize = 0;
  try {
    if (fs.existsSync(DB_FILE)) {
      fileSize = fs.statSync(DB_FILE).size;
    }
  } catch {}

  return {
    engine: inMemoryDb.engine,
    version: inMemoryDb.version,
    filePath: DB_FILE,
    fileSizeBytes: fileSize,
    totalMessages: inMemoryDb.tables.MESSAGES.length,
    lastSaved: inMemoryDb.meta.updatedAt,
  };
}
