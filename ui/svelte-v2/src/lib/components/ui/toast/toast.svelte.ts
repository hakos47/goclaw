type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

class ToastStore {
  items = $state<Toast[]>([]);

  add(message: string, type: ToastType = "info", duration = 4000) {
    const id = crypto.randomUUID();
    const item = { id, message, type, duration };
    this.items = [...this.items, item];

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
    
    // Also log to console for visibility
    if (type === "error") console.error(`[Toast] ${message}`);
    else console.log(`[Toast] ${message}`);
  }

  success(msg: string) { this.add(msg, "success"); }
  error(msg: string) { this.add(msg, "error"); }
  warning(msg: string) { this.add(msg, "warning"); }
  info(msg: string) { this.add(msg, "info"); }

  remove(id: string) {
    this.items = this.items.filter(i => i.id !== id);
  }
}

export const toast = new ToastStore();
