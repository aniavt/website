

export interface FileProps {
    readonly id: string;
    name: string;
    contentType: string;
    size: number;
    url: string;
    isPrivate: boolean;
}

export class FileEntity {
    readonly id: string;
    name: string;
    contentType: string;
    size: number;
    url: string;
    isPrivate: boolean;
    
    constructor(props: FileProps) {
        this.id = props.id;
        this.name = props.name;
        this.contentType = props.contentType;
        this.size = props.size;
        this.url = props.url;
        this.isPrivate = props.isPrivate;
    }
}