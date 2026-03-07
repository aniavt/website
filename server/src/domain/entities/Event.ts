export class DomainEvent<ID extends string = string> {
    readonly id: ID;
    readonly timestamp: Date;

    constructor(id: ID) {
        this.id = id;
        this.timestamp = new Date();
    }
}
