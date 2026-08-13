"use client";

import { create } from "zustand";
import { useEffect } from "react";
import { CheckCircle2, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastState {
  items: ToastItem[];
  push: (message: string, tone?: ToastTone) => void;
  remove: (id: number) => void;
}

export const useToastStore = create<ToastState>()((set) => ({
  items: [],
  push: (message, tone = "info") =>
    set((s) => ({ items: [...s.items, { id: Date.now() + Math.random(), message, tone }] })),
  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}));

export function toast(message: string, tone: ToastTone = "info") {
  useToastStore.getState().push(message, tone);
}

const toneStyles: Record<ToastTone, { icon: typeof CheckCircle2; className: string }> = {
  success: { icon: CheckCircle2, className: "border-success/30 text-success" },
  error: { icon: XCircle, className: "border-error/30 text-error" },
  info: { icon: Info, className: "border-info/30 text-info" },
};

export function ToastViewport() {
  const items = useToastStore((s) => s.items);
  const remove = useToastStore((s) => s.remove);

  useEffect(() => {
    const timers = items.map((item) => setTimeout(() => remove(item.id), 4000));
    return () => timers.forEach(clearTimeout);
  }, [items, remove]);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 sm:px-0">
      {items.map((item) => {
        const { icon: Icon, className } = toneStyles[item.tone];
        return (
          <div
            key={item.id}
            className={cn(
              "flex items-start gap-2 rounded-lg border bg-surface px-4 py-3 text-sm shadow-lg text-text-primary",
              className
            )}
          >
            <Icon className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{item.message}</span>
          </div>
        );
      })}
    </div>
  );
}
