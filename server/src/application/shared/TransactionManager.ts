export interface TransactionManager {
    runInTransaction<T>(fn: () => Promise<T>): Promise<T>;
}
