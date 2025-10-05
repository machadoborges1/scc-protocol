import { EventEmitter } from 'events';

export interface VaultQueueItem {
  address: string;
  owner: string; // Adicionado para resolver o erro de compilação
  // Adicione quaisquer outros dados relevantes descobertos por vaultDiscovery
}

export class VaultQueue extends EventEmitter {
  private queue: VaultQueueItem[] = [];
  private readonly QUEUE_EVENT = 'new-item';

  enqueue(item: VaultQueueItem) {
    this.queue.push(item);
    this.emit(this.QUEUE_EVENT); // Sinaliza que um novo item está disponível
  }

  dequeue(): VaultQueueItem | undefined {
    return this.queue.shift();
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  onNewItem(listener: () => void) {
    this.on(this.QUEUE_EVENT, listener);
  }

  offNewItem(listener: () => void) {
    this.off(this.QUEUE_EVENT, listener);
  }
}

export const vaultQueue = new VaultQueue(); // Instância singleton
