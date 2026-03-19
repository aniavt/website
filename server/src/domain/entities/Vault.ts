export interface VaultNodeProps {
    readonly id: string;
    readonly parentId: string | null;
    readonly name: string;
    readonly type: "folder" | "file";
    readonly createdAt: Date | null;
    readonly thumbnailId: string | null; // File id
    readonly isPublic: boolean;
}

export interface VaultNodeSourceProps {
    readonly id: string;
    readonly nodeId: string;
    readonly type: "external" | "internal"; // external: from external server, internal: from internal server
    readonly server: string | null;
    readonly url: string; // internal == file id, external == url
    readonly createdAt: Date;
}

export interface VaultNodeTagInfoProps {
    readonly id: string;
    readonly name: string;
}

export interface VaultNodeTagProps {
    readonly nodeId: string;
    readonly tagId: string;
}


export class VaultNodeEntity {
    readonly id: string;
    readonly parentId: string | null;
    readonly name: string;
    readonly type: "folder" | "file";
    readonly createdAt: Date | null;
    readonly thumbnailId: string | null;
     readonly isPublic: boolean;

    constructor(props: VaultNodeProps) {
        this.id = props.id;
        this.parentId = props.parentId;
        this.name = props.name;
        this.type = props.type;
        this.createdAt = props.createdAt;
        this.thumbnailId = props.thumbnailId;
        this.isPublic = props.isPublic;
    }

    static fromPersistence(props: VaultNodeProps): VaultNodeEntity {
        return new VaultNodeEntity(props);
    }
}


export class VaultNodeSourceEntity {
    readonly id: string;
    readonly nodeId: string;
    readonly type: "external" | "internal";
    readonly server: string | null;
    readonly url: string;
    readonly createdAt: Date;

    constructor(props: VaultNodeSourceProps) {
        this.id = props.id;
        this.nodeId = props.nodeId;
        this.type = props.type;
        this.server = props.server;
        this.url = props.url;
        this.createdAt = props.createdAt;
    }

    static fromPersistence(props: VaultNodeSourceProps): VaultNodeSourceEntity {
        return new VaultNodeSourceEntity(props);
    }
}


export class VaultNodeTagInfoEntity {
    readonly id: string;
    readonly name: string;

    constructor(props: VaultNodeTagInfoProps) {
        this.id = props.id;
        this.name = props.name;
    }

    static fromPersistence(props: VaultNodeTagInfoProps): VaultNodeTagInfoEntity {
        return new VaultNodeTagInfoEntity(props);
    }
}


export class VaultNodeTagEntity {
    readonly nodeId: string;
    readonly tagId: string;

    constructor(props: VaultNodeTagProps) {
        this.nodeId = props.nodeId;
        this.tagId = props.tagId;
    }

    static fromPersistence(props: VaultNodeTagProps): VaultNodeTagEntity {
        return new VaultNodeTagEntity(props);
    }
}