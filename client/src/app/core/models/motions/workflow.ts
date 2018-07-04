import { BaseModel } from 'app/core/models/baseModel';

export class Workflow extends BaseModel {
    static collectionString = 'motions/workflow';
    id: number;
    first_state: number;
    name: string;
    states: Object[];

    constructor(id: number, first_state?, name?, states?) {
        super(id);
        this.first_state = first_state;
        this.name = name;
        this.states = states;
    }

    public getCollectionString(): string {
        return Workflow.collectionString;
    }
}
