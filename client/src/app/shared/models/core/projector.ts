import { BaseModel } from '../base/base-model';

/**
 * Representation of a projector. Has the nested property "projectiondefaults"
 * @ignore
 */
export class Projector extends BaseModel<Projector> {
    public id: number;
    public elements: Object;
    public scale: number;
    public scroll: number;
    public name: string;
    public blank: boolean;
    public width: number;
    public height: number;
    public projectiondefaults: Object[];

    public constructor(input?: any) {
        super('core/projector', 'Projector', input);
    }

    public getTitle(): string {
        return this.name;
    }
}
