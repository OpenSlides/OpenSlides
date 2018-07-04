import { BaseModel } from 'app/core/models/baseModel';

export class MotionChangeReco extends BaseModel {
    static collectionString = 'motions/motion-change-recommendation';
    id: number;
    creation_time: string;
    line_from: number;
    line_to: number;
    motion_version_id: number;
    other_description: string;
    rejected: boolean;
    text: string;
    type: number;

    constructor(
        id: number,
        creation_time?: string,
        line_from?: number,
        line_to?: number,
        motion_version_id?: number,
        other_description?: string,
        rejected?: boolean,
        text?: string,
        type?: number
    ) {
        super(id);
        this.creation_time = creation_time;
        this.line_from = line_from;
        this.line_to = line_to;
        this.motion_version_id = motion_version_id;
        this.other_description = other_description;
        this.rejected = rejected;
        this.text = text;
        this.type = type;
    }

    public getCollectionString(): string {
        return MotionChangeReco.collectionString;
    }
}
