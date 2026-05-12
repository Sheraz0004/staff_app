import API_CONFIG from "../../config";
import HTTP_CLIENT from "../utils/config";

const pad = (n: number) => String(n).padStart(2, '0');

function fmtDateTime(d: Date, time: '00:00:00' | '23:59:59'): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${time}`;
}

export function notifDefaultRange(daysBack: number = 90): { from: string; till: string } {
  const till = new Date();
  const from = new Date();
  from.setDate(from.getDate() - daysBack);
  return { from: fmtDateTime(from, '00:00:00'), till: fmtDateTime(till, '23:59:59') };
}

export function notifCurrentMonthRange(): { from: string; till: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const till = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: fmtDateTime(from, '00:00:00'), till: fmtDateTime(till, '23:59:59') };
}

export function notifDateTimeFrom(d: Date): string {
  return fmtDateTime(d, '00:00:00');
}

export function notifDateTimeTill(d: Date): string {
  return fmtDateTime(d, '23:59:59');
}

export const NOTIFICATION_SERVICES = {
  fetchPushInbox: (params: {
    page?: number;
    pageSize?: number;
    from: string;
    till: string;
  }) =>
    HTTP_CLIENT.get(API_CONFIG.NOTIFICATIONS.pushInbox(params)),

  markAsRead: (id: number) =>
    HTTP_CLIENT.patch(API_CONFIG.NOTIFICATIONS.markRead(id), {}),

  fetchUnreadCount: (from: string, till: string) =>
    HTTP_CLIENT.get(API_CONFIG.NOTIFICATIONS.unreadCount(from, till)),
};
