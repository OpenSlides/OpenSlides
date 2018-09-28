import { ProjectableBaseModel } from '../base/projectable-base-model';

/**
 * Representation of a countdown
 * @ignore
 */
export class Countdown extends ProjectableBaseModel {
    public id: number;
    public description: string;
    public default_time: number;
    public countdown_time: number;
    public running: boolean;

    public constructor(input?: any) {
        super('core/countdown');
    }

    public getTitle(): string {
        return this.description;
    }
}
