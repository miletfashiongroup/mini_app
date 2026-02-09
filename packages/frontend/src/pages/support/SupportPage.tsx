import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import chatIcon from "@/assets/images/icon-support.svg";
import { AppBottomNav, PageTopBar } from "@/components/brace";
import { createSupportTicket, sendSupportMessage } from "@/entities/support/api/supportApi";
import type { SupportTicketCreatePayload } from "@/entities/support/model/types";
import { useOrdersQuery, useSupportMessagesQuery, useSupportTicketsQuery } from "@/shared/api/queries";
import { PageBlock } from "@/shared/ui";

const SLA_TEXT = "Ответим в течение 4 часов. Быстрее — если вопрос срочный.";

const CATEGORY_OPTIONS = [
  { value: "delivery", label: "Доставка" },
  { value: "payment", label: "Оплата" },
  { value: "size", label: "Размер/примерка" },
  { value: "quality", label: "Качество" },
  { value: "other", label: "Другое" },
];

const formatDate = (value?: string) => {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(value),
    );
  } catch {
    return value;
  }
};

const STATUS_LABELS: Record<string, string> = {
  open: "Открыт",
  in_progress: "В работе",
  resolved: "Решён",
  closed: "Закрыт",
};

const compactId = (id: string) => `${id.slice(0, 4)}…${id.slice(-4)}`;

export const SupportPage = () => {
  const queryClient = useQueryClient();
  const { data: ticketsData, isLoading, isError } = useSupportTicketsQuery({ refetchInterval: 5000 });
  const tickets = useMemo(() => ticketsData ?? [], [ticketsData]);

  const [openTicketId, setOpenTicketId] = useState<string | null>(null);
  const [sendingTicketId, setSendingTicketId] = useState<string | null>(null);

  const { data: ordersData } = useOrdersQuery();
  const orderOptions = useMemo(() => {
    return (ordersData ?? []).map((order) => {
      const summary = order.items
        ?.map((item) => `${item.product?.product_code ?? ""} x${item.quantity}`.trim())
        .filter(Boolean)
        .join(", ");
      return {
        value: order.id,
        label: `Заказ ${compactId(order.id)}${summary ? " — " + summary : ""}`,
      };
    });
  }, [ordersData]);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");
  const [category, setCategory] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: SupportTicketCreatePayload) => createSupportTicket(payload),
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ["support", "tickets"] });
      setSubject("");
      setMessage("");
      setOrderId("");
      setCategory("");
      setContact("");
      setError(null);
      setOpenTicketId(ticket.id);
    },
    onError: (err: any) => {
      setError(err?.message || "Не удалось создать тикет.");
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (payload: { ticketId: string; text: string }) =>
      sendSupportMessage(payload.ticketId, { text: payload.text }),
    onMutate: (vars) => setSendingTicketId(vars.ticketId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["support", "tickets", variables.ticketId, "messages"] });
    },
    onSettled: () => setSendingTicketId(null),
  });

  const handleSubmit = () => {
    setError(null);
    if (!subject.trim() || !message.trim()) {
      setError("Заполните тему и сообщение.");
      return;
    }
    createMutation.mutate({
      subject: subject.trim(),
      message: message.trim(),
      order_id: orderId || undefined,
      category: category.trim() || undefined,
      contact: contact.trim() || undefined,
    });
  };

  const toggleTicket = (id: string) => {
    setOpenTicketId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[1000px] flex-col bg-white pb-28 font-montserrat text-text-primary">
      <PageTopBar showBack backFallback="/profile" />
      <div className="px-4 pb-4 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#000043] text-white">
            <img src={chatIcon} alt="" className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-[27px] font-bold leading-[1.1] text-[#29292B]">Поддержка</h1>
            <p className="text-[13px] text-[#5A5A5C]">Задайте вопрос — мы увидим его мгновенно</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 px-4 pb-6">
        <PageBlock title="Новый тикет">
          <div className="grid gap-3 text-[14px]">
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-[#5A5A5C]">Тема *</span>
              <input
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="h-11 rounded-xl border border-[#E2E2E2] px-3 text-[14px]"
                placeholder="Например, уточнить доставку"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-[#5A5A5C]">Сообщение *</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="min-h-[110px] rounded-xl border border-[#E2E2E2] px-3 py-2 text-[14px]"
                placeholder="Опишите вопрос"
              />
            </label>
            {orderOptions.length > 0 && (
              <label className="flex flex-col gap-1">
                <span className="text-[12px] font-semibold text-[#5A5A5C]">Связанный заказ</span>
                <select
                  value={orderId}
                  onChange={(event) => setOrderId(event.target.value)}
                  className="h-11 rounded-xl border border-[#E2E2E2] px-3 text-[14px] bg-white"
                >
                  <option value="">Не выбрано</option>
                  {orderOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-[#5A5A5C]">Как с вами связаться (опционально)</span>
              <input
                type="text"
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                className="h-11 rounded-xl border border-[#E2E2E2] px-3 text-[14px]"
                placeholder="Телефон или @username"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-[#5A5A5C]">Тип вопроса</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-11 rounded-xl border border-[#E2E2E2] px-3 text-[14px] bg-white"
              >
                <option value="">Не выбрано</option>
                {CATEGORY_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            {error ? <div className="text-[12px] font-semibold text-red-500">{error}</div> : null}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="h-12 w-full rounded-2xl bg-[#000043] text-[15px] font-semibold text-white transition hover:bg-[#00005A] disabled:opacity-60"
            >
              {createMutation.isPending ? "Отправляем..." : "Отправить"}
            </button>
            <div className="text-[12px] text-[#5A5A5C]">{SLA_TEXT}</div>
          </div>
        </PageBlock>
        <PageBlock title="Мои обращения">
          {isLoading ? (
            <div className="text-[14px]">Загружаем тикеты...</div>
          ) : isError ? (
            <div className="text-[14px]">Не удалось загрузить тикеты.</div>
          ) : tickets.length ? (
            <div className="flex flex-col gap-3">
              {tickets.map((ticket) => (
                <SupportTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  isOpen={openTicketId === ticket.id}
                  onToggle={() => toggleTicket(ticket.id)}
                  onSend={(text) => sendMessageMutation.mutate({ ticketId: ticket.id, text })}
                  isSending={sendingTicketId === ticket.id && sendMessageMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <div className="text-[14px] text-[#5A5A5C]">У вас пока нет обращений.</div>
          )}
        </PageBlock>
      </div>
      <AppBottomNav activeId="profile" />
    </div>
  );
};

const SupportTicketCard = ({
  ticket,
  isOpen,
  onToggle,
  onSend,
  isSending,
}: {
  ticket: any;
  isOpen: boolean;
  onToggle: () => void;
  onSend: (text: string) => void;
  isSending: boolean;
}) => {
  const { data: messagesData, isLoading } = useSupportMessagesQuery(ticket.id, { enabled: isOpen, refetchInterval: isOpen ? 5000 : false, staleTime: 0 });
  const isClosed = ticket.status === "closed";
  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-left transition ${
        isOpen ? "border-[#000043] bg-[#000043]/5" : "border-[#E6E6E9] bg-white"
      }`}
    >
      <button type="button" onClick={onToggle} className="w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[14px] font-semibold text-[#29292B]">{ticket.subject}</div>
            <div className="mt-1 text-[12px] text-[#5A5A5C]">{formatDate(ticket.created_at)}</div>
          </div>
          <span className="rounded-full bg-[#F2F2F6] px-3 py-1 text-[12px] font-semibold text-[#29292B]">
            {STATUS_LABELS[ticket.status] || ticket.status}
          </span>
        </div>
        {ticket.order_id ? (
          <div className="mt-1 text-[12px] text-[#5A5A5C]">Заказ {compactId(ticket.order_id)}</div>
        ) : null}
        {ticket.meta?.category || ticket.meta?.contact ? (
          <div className="mt-1 text-[12px] text-[#5A5A5C]">
            {ticket.meta?.category ? `Тип: ${ticket.meta.category}. ` : ""}
            {ticket.meta?.contact ? `Контакт: ${ticket.meta.contact}` : ""}
          </div>
        ) : null}
      </button>

      {isOpen ? (
        <div className="mt-3 space-y-2">
          {isLoading ? (
            <div className="text-[14px]">Загружаем историю...</div>
          ) : messagesData && messagesData.length ? (
            <div className="flex flex-col gap-2 rounded-2xl bg-white px-3 py-3 max-h-[420px] overflow-y-auto border border-[#E6E6E9]">
              {messagesData.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-[90%] rounded-2xl px-3 py-2 text-[14px] leading-snug ${
                    msg.sender === "user"
                      ? "self-end bg-[#000043] text-white"
                      : "self-start bg-[#F7F7F7] text-[#29292B]"
                  }`}
                >
                  <div className="text-[11px] opacity-70">{formatDate(msg.created_at)}</div>
                  <div>{msg.text}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white px-3 py-3 text-[13px] text-[#5A5A5C] border border-[#E6E6E9]">
              Пока нет сообщений в этом обращении.
            </div>
          )}

          <MessageInput onSend={onSend} isSending={isSending} disabled={isClosed} />
          {isClosed ? (
            <div className="text-[12px] text-[#7A7A7A]">
              Обращение закрыто. Для нового вопроса создайте новый тикет.
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

const MessageInput = ({
  onSend,
  isSending,
  disabled,
}: {
  onSend: (text: string) => void;
  isSending: boolean;
  disabled?: boolean;
}) => {
  const [text, setText] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        className="min-h-[90px] rounded-2xl border border-[#E2E2E2] px-3 py-2 text-[14px] bg-white disabled:bg-[#F7F7F7] disabled:text-[#8A8A90]"
        placeholder={disabled ? "Обращение закрыто" : "Напишите сообщение в поддержку"}
      />
      <button
        type="button"
        onClick={() => {
          if (!disabled && text.trim()) {
            onSend(text);
            setText("");
          }
        }}
        disabled={isSending || disabled}
        className="h-11 rounded-2xl bg-[#000043] text-[14px] font-semibold text-white transition hover:bg-[#00005A] disabled:opacity-60"
      >
        {isSending ? "Отправляем..." : "Отправить в чат"}
      </button>
    </div>
  );
};
