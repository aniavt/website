import type { DomainEvent } from "@domain/entities/Event";


export abstract class AggregateRoot<EventId extends string = string> {
    private events: DomainEvent<EventId>[] = [];
  
    protected addEvent(event: DomainEvent<EventId>) {
      this.events.push(event);
    }
  
    pullEvents() {
      const events = this.events;
      this.events = [];
      return events;
    }
}
