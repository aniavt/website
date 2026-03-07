import type { DomainEvent } from "@domain/entities/Event";


export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void> | void;
export type EventClass<T extends DomainEvent = DomainEvent> = new (...args: any[]) => T;

export interface EventBus {
    subscribe<E extends DomainEvent>(type: EventClass<E>, handler: EventHandler<E>): void;
    publish(events: DomainEvent[]): Promise<void>;
}
