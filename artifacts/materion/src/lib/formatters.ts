// ─── Currency ────────────────────────────────────────────────────────────────
export function formatBRL(value: number | string | null | undefined): string {
  if (value == null) return "-";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "-";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
}

// ─── Date ────────────────────────────────────────────────────────────────────
export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("pt-BR");
}

export function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return "-";
  return new Date(d).toLocaleString("pt-BR");
}

// ─── CNPJ Mask ───────────────────────────────────────────────────────────────
export function formatCNPJ(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

export function maskCNPJ(value: string): string {
  return formatCNPJ(value.replace(/\D/g, "").slice(0, 14));
}

// ─── CEP Mask ────────────────────────────────────────────────────────────────
export function maskCEP(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

// ─── Phone Mask ──────────────────────────────────────────────────────────────
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// ─── Number formatting ──────────────────────────────────────────────────────
export function formatDecimal(value: number | string | null | undefined, decimals: number = 4): string {
  if (value == null) return "-";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "-";
  return num.toLocaleString("pt-BR", { minimumFractionDigits: decimals > 2 ? 2 : decimals, maximumFractionDigits: decimals });
}

// ─── Variation formatting ────────────────────────────────────────────────────
export function formatVariacao(value: number | null | undefined): { text: string; color: string } {
  if (value == null) return { text: "-", color: "text-muted-foreground" };
  const sign = value > 0 ? "+" : "";
  const text = `${sign}${value.toFixed(2)}%`;
  if (value > 0) return { text, color: "text-red-500" };
  if (value < 0) return { text, color: "text-green-500" };
  return { text: "0.00%", color: "text-muted-foreground" };
}
