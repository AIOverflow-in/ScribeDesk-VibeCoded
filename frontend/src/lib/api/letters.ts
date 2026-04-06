import { apiFetch } from "./client";
import { Letter } from "../types";

export async function generateLetter(
  encounter_id: string,
  letter_type: "referral" | "sick_note" | "patient_instructions"
): Promise<Letter> {
  return apiFetch<Letter>("/letters", {
    method: "POST",
    body: JSON.stringify({ encounter_id, letter_type }),
  });
}

export async function listLetters(encounter_id: string): Promise<Letter[]> {
  return apiFetch<Letter[]>(`/letters/${encounter_id}`);
}
