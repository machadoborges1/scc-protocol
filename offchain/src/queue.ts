import { Address } from "viem";

/**
 * Uma fila simples em memória para gerenciar endereços de Vaults a serem processados.
 * A fila garante que não haverá endereços duplicados.
 */
export class VaultQueue {
  private queue: Address[] = [];
  private set: Set<Address> = new Set();

  /**
   * Adiciona um endereço de Vault à fila se ele ainda não estiver presente.
   * @param vaultAddress O endereço do Vault a ser adicionado.
   */
  public add(vaultAddress: Address): void {
    if (!this.set.has(vaultAddress)) {
      this.set.add(vaultAddress);
      this.queue.push(vaultAddress);
    }
  }

  /**
   * Adiciona vários endereços de Vault à fila.
   * @param vaultAddresses Um array de endereços de Vault a serem adicionados.
   */
  public addMany(vaultAddresses: Address[]): void {
    for (const address of vaultAddresses) {
      this.add(address);
    }
  }

  /**
   * Remove e retorna o próximo endereço de Vault da fila.
   * @returns O próximo endereço de Vault, ou undefined se a fila estiver vazia.
   */
  public getNext(): Address | undefined {
    const vaultAddress = this.queue.shift();
    if (vaultAddress) {
      this.set.delete(vaultAddress);
    }
    return vaultAddress;
  }

  /**
   * Verifica se a fila está vazia.
   * @returns True se a fila estiver vazia, caso contrário, false.
   */
  public isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Retorna o número de itens na fila.
   * @returns O tamanho da fila.
   */
  public size(): number {
    return this.queue.length;
  }
}