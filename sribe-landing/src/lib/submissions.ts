import fs from "fs";
import path from "path";

export interface DemoSubmission {
  id: string;
  name: string;
  email: string;
  specialty: string;
  practiceSize: string;
  challenge?: string;
  submittedAt: string;
}

const DATA_FILE = path.join(process.cwd(), "data", "submissions.json");

function readAll(): DemoSubmission[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function appendSubmission(submission: DemoSubmission): void {
  const all = readAll();
  all.push(submission);
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(all, null, 2), "utf-8");
}
