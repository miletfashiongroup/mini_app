export type SupportTicketCreatePayload = {
  subject: string;
  message: string;
  order_id?: string | null;
  priority?: "low" | "normal" | "high" | "urgent";
  contact?: string | null;
  category?: string | null;
};

export type SupportTicketStatusUpdatePayload = {
  status: "open" | "closed";
};

export type SupportTicket = {
  id: string;
  user_id: string;
  order_id?: string | null;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  subject: string;
  message: string;
  manager_comment?: string | null;
  meta?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type SupportMessage = {
  id: string;
  ticket_id: string;
  sender: "user" | "admin";
  text: string;
  meta?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type SupportMessageCreatePayload = {
  text: string;
};
