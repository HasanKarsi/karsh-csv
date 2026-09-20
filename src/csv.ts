/**
 * A small RFC 4180 CSV reader for the Lab's bulk modes.
 *
 * Written rather than installed because the cases that matter here are few
 * and specific: Excel in a Turkish locale saves with `;` (the comma is the
 * decimal separator), files arrive with a UTF-8 BOM, and a quoted field may
 * hold the delimiter, a doubled quote or a line break. Anything beyond that —
 * type inference, streaming, comments — is not something a list of links or
 * barcodes needs.
 */

export type CsvDelimiter = "," | ";" | "\t";

export interface CsvTable {
  delimiter: CsvDelimiter;
  /** Every row, header included, with trailing blank lines removed. */
  rows: string[][];
}

/**
 * Picks the delimiter that splits the first few lines most consistently. A tie
 * goes to `;` over `,` because a Turkish Excel export is the likelier file,
 * and a URL column full of commas is not.
 */
export function detectDelimiter(text: string): CsvDelimiter {
  const sample = text.split(/\r\n|\n|\r/).filter((line) => line.trim() !== "").slice(0, 10);
  if (sample.length === 0) return ",";

  let best: CsvDelimiter = ",";
  let bestScore = -1;
  for (const delimiter of [";", "\t", ","] as const) {
    const counts = sample.map((line) => countOutsideQuotes(line, delimiter));
    const first = counts[0]!;
    if (first === 0) continue;
    const consistent = counts.filter((count) => count === first).length;
    const score = consistent * 100 + first;
    if (score > bestScore) {
      bestScore = score;
      best = delimiter;
    }
  }
  return best;
}

function countOutsideQuotes(line: string, delimiter: string): number {
  let count = 0;
  let quoted = false;
  for (const char of line) {
    if (char === '"') quoted = !quoted;
    else if (char === delimiter && !quoted) count += 1;
  }
  return count;
}

export function parseCsv(input: string, delimiter?: CsvDelimiter): CsvTable {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const sep = delimiter ?? detectDelimiter(text);

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i]!;

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"' && field === "") {
      quoted = true;
      i += 1;
    } else if (char === sep) {
      row.push(field);
      field = "";
      i += 1;
    } else if (char === "\n" || char === "\r") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += char === "\r" && text[i + 1] === "\n" ? 2 : 1;
    } else {
      field += char;
      i += 1;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  while (rows.length > 0 && rows[rows.length - 1]!.every((cell) => cell.trim() === "")) rows.pop();

  return { delimiter: sep, rows };
}

/** Quotes a value only when it has to be quoted. */
export function csvCell(value: string, delimiter: CsvDelimiter = ","): string {
  return /["\r\n]/.test(value) || value.includes(delimiter) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(rows: string[][], delimiter: CsvDelimiter = ","): string {
  return rows.map((row) => row.map((cell) => csvCell(cell, delimiter)).join(delimiter)).join("\r\n");
}
