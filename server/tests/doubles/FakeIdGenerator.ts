import type { IdGenerator } from "@domain/services/IdGenerator";

export class FakeIdGenerator implements IdGenerator {
  private counter = 0;

  constructor(private readonly prefix = "id") {}

  generateUUID(): string {
    this.counter += 1;
    return `${this.prefix}-${this.counter}`;
  }
}
