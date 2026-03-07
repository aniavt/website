import type { DomainEvent } from "@domain/entities/Event";
import type { EventBus, EventClass, EventHandler } from "@domain/services/EventBus";


function ignoreErrors(h: EventHandler<DomainEvent>): EventHandler<DomainEvent> {
    return async (e) => { try { await h(e); } catch {}};
}

export class Bus implements EventBus {
    private readonly subscribers: Map<EventClass<DomainEvent>, EventHandler<DomainEvent>[]> = new Map();


    subscribe<E extends DomainEvent>(type: EventClass<E>, handler: EventHandler<E>): void {
        const listeners = this.subscribers.get(type) || [];
        listeners.push(ignoreErrors(handler as EventHandler<DomainEvent>));
        this.subscribers.set(type, listeners);
    }

    async publish(events: DomainEvent[]): Promise<void> {
        const promises = events.map(async (e) => {
            const listeners = this.subscribers.get(e.constructor as EventClass<DomainEvent>);
            if (listeners) {
                return Promise.all(listeners.map(handler => handler(e)));
            }
        })
        await Promise.all(promises);
        return void 0;
    }
}
