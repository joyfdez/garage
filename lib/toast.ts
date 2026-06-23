import { toast as _toast } from "sonner";

const SUCCESS = { style: { borderLeft: "3px solid #1A3A2E" } };
const ERROR   = { style: { borderLeft: "3px solid #ef4444" } };
const WARN    = { style: { borderLeft: "3px solid #D97706" } };

export const toast = {
  success: (msg: string) => _toast.success(msg, SUCCESS),
  error:   (msg: string) => _toast.error(msg,   ERROR),
  warning: (msg: string) => _toast.warning(msg, WARN),
  info:    (msg: string) => _toast(msg,          SUCCESS),
};
