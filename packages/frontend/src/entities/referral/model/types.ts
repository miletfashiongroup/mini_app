export type ReferralBinding = {
  id: string;
  referrer_user_id: string;
  referee_user_id: string;
  status: pending | approved | rejected | string;
  code: string;
  created_at: string;
};

export type ReferralInvite = {
  referrer_user_id: string;
  referee_user_id: string;
  status: pending | approved | rejected | string;
  created_at: string;
};

export type ReferralStats = {
  code: string;
  is_active: boolean;
  invited: ReferralInvite[];
};
