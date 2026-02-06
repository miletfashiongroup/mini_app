export type BonusBalance = {
  balance: number;
};

export type BonusLedgerEntry = {
  id: string;
  created_at: string;
  amount: number;
  type: credit | debit | expire | string;
  reason?: string | null;
  expires_at?: string | null;
};
