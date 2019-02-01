import { Displayable } from './displayable';
import { Identifiable } from '../../shared/models/base/identifiable';

export type ViewModelConstructor<T extends BaseViewModel> = new (...args: any[]) => T;

/**
 * Base class for view models. alls view models should have titles.
 */
export abstract class BaseViewModel implements Displayable, Identifiable {
    /**
     * Force children to have an id.
     */
    public abstract id: number;

    /**
     * Children should also have a verbose name for generic display purposes
     */
    protected _verboseName: string;

    public constructor(verboseName: string) {
        this._verboseName = verboseName;
    }

    /**
     * Returns the verbose name. Makes it plural by adding a 's'.
     *
     * @param plural If the name should be plural
     * @returns the verbose name of the model
     */
    public getVerboseName(plural: boolean = false): string {
        if (plural) {
            return this._verboseName + 's'; // I love english. This works for all our models (participantS, electionS,
            // topicS, motionS, (media)fileS, motion blockS, commentS, personal noteS, projectorS, messageS, countdownS, ...)
            // Just categorIES need to overwrite this...
        } else {
            return this._verboseName;
        }
    }

    public abstract updateDependencies(update: BaseViewModel): void;

    public abstract getTitle(): string;

    public getListTitle(): string {
        return this.getTitle();
    }

    public toString(): string {
        return this.getTitle();
    }
}
