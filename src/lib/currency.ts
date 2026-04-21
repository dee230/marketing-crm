// Kenya Shillings currency formatting

export function formatKES(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function parseKES(amount: number): number {
  return amount;
}