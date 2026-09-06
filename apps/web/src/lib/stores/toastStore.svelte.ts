export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

class ToastStore {
  items = $state<ToastItem[]>([]);

  add(type: ToastType, title: string, description?: string, duration: number = 4000) {
    const id = crypto.randomUUID();
    const item: ToastItem = { id, type, title, description, duration };
    this.items.push(item);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
    return id;
  }

  success(title: string, description?: string, duration?: number) {
    return this.add("success", title, description, duration);
  }

  error(title: string, description?: string, duration?: number) {
    return this.add("error", title, description, duration);
  }

  info(title: string, description?: string, duration?: number) {
    return this.add("info", title, description, duration);
  }

  warning(title: string, description?: string, duration?: number) {
    return this.add("warning", title, description, duration);
  }

  remove(id: string) {
    this.items = this.items.filter((t) => t.id !== id);
  }

  clear() {
    this.items = [];
  }
}

export const toast = new ToastStore();
