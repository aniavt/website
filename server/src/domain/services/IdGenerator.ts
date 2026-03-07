export interface IdGenerator {
    generateUserId(): string;
    generateFaqTextId(): string;
    generateFaqItemId(): string;
    generateFaqHistoryId(): string;
}