export class BiMap<K, V> {
    private forward = new Map<K, V>();
    private reverse = new Map<V, K>();


    constructor(entries: [K, V][]) {
        for (const [key, value] of entries) {
            this.set(key, value);
        }
    }
  
    set(key: K, value: V): void {
        // eliminar posibles relaciones previas
        if (this.forward.has(key)) {
            const oldValue = this.forward.get(key)!;
            this.reverse.delete(oldValue);
        }
    
        if (this.reverse.has(value)) {
            const oldKey = this.reverse.get(value)!;
            this.forward.delete(oldKey);
        }
    
        this.forward.set(key, value);
        this.reverse.set(value, key);
    }
  
    get(key: K): V | undefined {
        return this.forward.get(key);
    }
  
    getKey(value: V): K | undefined {
        return this.reverse.get(value);
    }
  
    deleteByKey(key: K): boolean {
        const value = this.forward.get(key);
        if (value === undefined) return false;
    
        this.forward.delete(key);
        this.reverse.delete(value);
        return true;
    }
  
    deleteByValue(value: V): boolean {
        const key = this.reverse.get(value);
        if (key === undefined) return false;
    
        this.reverse.delete(value);
        this.forward.delete(key);
        return true;
    }
  
    hasKey(key: K): boolean {
        return this.forward.has(key);
    }
  
    hasValue(value: V): boolean {
        return this.reverse.has(value);
    }
  
    clear(): void {
        this.forward.clear();
        this.reverse.clear();
    }

    entries(): IterableIterator<[K, V]> {
        return this.forward.entries();
    }
}