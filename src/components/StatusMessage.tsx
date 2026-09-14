import { CheckCircle2, Info, AlertTriangle, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type StatusVariant = "success" | "info" | "warning" | "error";

const variants: Record<
  StatusVariant,
  { icon: LucideIcon; classes: string; iconClass: string }
> = {
  success: {
    icon: CheckCircle2,
    classes: "bg-green-500/10 border-green-500/40 text-green-300",
    iconClass: "text-green-400",
  },
  info: {
    icon: Info,
    classes: "bg-blue-500/10 border-blue-500/40 text-blue-300",
    iconClass: "text-blue-400",
  },
  warning: {
    icon: AlertTriangle,
    classes: "bg-yellow-500/10 border-yellow-500/40 text-yellow-300",
    iconClass: "text-yellow-400",
  },
  error: {
    icon: XCircle,
    classes: "bg-red-500/10 border-red-500/40 text-red-300",
    iconClass: "text-red-400",
  },
};

export function StatusMessage({
  variant,
  title,
  message,
}: {
  variant: StatusVariant;
  title: string;
  message?: string;
}) {
  const { icon: Icon, classes, iconClass } = variants[variant];

  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 rounded-lg border-l-4 px-3 py-2.5 transition-transform duration-200 ${classes}`}
    >
      <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${iconClass}`} strokeWidth={2} />
      <p className="text-xs leading-relaxed">
        <span className="font-semibold">{title}</span>
        {message ? <span className="opacity-80">: {message}</span> : null}
      </p>
    </div>
  );
}
