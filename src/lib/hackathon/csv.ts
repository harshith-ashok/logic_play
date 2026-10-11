// CSV export helpers: RFC 4180 quoting, UTF-8 BOM (so Excel reads names
// correctly) and formula-injection protection.
import type { Hackathon, Team } from "./types";

function cell(value: unknown): string {
  let s = value == null ? "" : String(value);
  // Spreadsheet apps execute cells starting with these as formulas.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: unknown[][]): string {
  return "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");
}

export function participantsCsv(teams: Team[], layers: string[]): string {
  const rows: unknown[][] = [
    ["Team code", "Team name", "Role", "Full name", "Registration number", "Year", "Phone", "Department", "College",
      ...layers, "Problem statement", "Registered at"],
  ];
  for (const t of teams) {
    for (const p of t.people) {
      rows.push([
        t.code, t.name, p.role, p.full_name, p.registration_number, p.year_of_study, p.phone, p.department, p.college,
        ...layers.map((l) => t.stack[l] ?? ""), t.problem ?? "", t.registeredAt,
      ]);
    }
  }
  return toCsv(rows);
}

/** One row per team; every person slot gets their own columns. */
export function teamsCsv(teams: Team[], layers: string[], maxTeamSize: number): string {
  const slotNames = Array.from({ length: maxTeamSize }, (_, i) => (i === 0 ? "Leader" : `Member ${i + 1}`));
  const header = [
    "Team code", "Team name",
    ...slotNames.flatMap((s) => [`${s} name`, `${s} reg no`, `${s} year`, `${s} phone`, `${s} department`, `${s} college`]),
    ...layers, "Problem statement", "Registered at",
  ];
  const rows: unknown[][] = [header];
  for (const t of teams) {
    const slots = Array.from({ length: maxTeamSize }, (_, i) => t.people[i]);
    rows.push([
      t.code, t.name,
      ...slots.flatMap((p) =>
        p ? [p.full_name, p.registration_number, p.year_of_study, p.phone, p.department, p.college] : Array(6).fill(""),
      ),
      ...layers.map((l) => t.stack[l] ?? ""), t.problem ?? "", t.registeredAt,
    ]);
  }
  return toCsv(rows);
}

export function downloadCsv(csv: string, kind: "participants" | "teams", hackathon: Pick<Hackathon, "slug">) {
  const date = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${hackathon.slug}-${kind}-${date}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
