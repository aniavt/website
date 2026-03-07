export interface FaqTextProps {
    readonly id: string;
    readonly value: string;
}

export class FaqText {
    readonly id: string;
    readonly value: string;

    constructor(props: FaqTextProps) {
        this.id = props.id;
        this.value = props.value;
    }

    static fromPersistence(props: FaqTextProps): FaqText {
        return new FaqText(props);
    }
}
