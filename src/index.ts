/**
 * The package as one surface: read a CSV file, write one back.
 *
 * `detectDelimiter` and `csvCell` are exported next to the two obvious entry
 * points because a caller often wants one without the other — a file whose
 * delimiter is already known, or a single value quoted into a line that is
 * being assembled by hand.
 */

export * from "./csv";
