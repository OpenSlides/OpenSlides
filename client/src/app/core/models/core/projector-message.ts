import { BaseModel } from 'app/core/models/baseModel';

export class ProjectorMessage extends BaseModel {
    static collectionString = 'core/projector-message';
    id: number;
    message: string;

    constructor(id: number, message?: string) {
        super(id);
        this.message = message;
    }

    public getCollectionString(): string {
        return ProjectorMessage.collectionString;
    }
}
