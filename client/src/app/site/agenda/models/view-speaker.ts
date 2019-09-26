import { Speaker } from 'app/shared/models/agenda/speaker';
import { BaseViewModel } from 'app/site/base/base-view-model';
import { ViewUser } from 'app/site/users/models/view-user';

/**
 * Determine the state of the speaker
 */
export enum SpeakerState {
    WAITING,
    CURRENT,
    FINISHED
}

/**
 * Provides "safe" access to a speaker with all it's components
 */
export class ViewSpeaker extends BaseViewModel<Speaker> {
    public static COLLECTIONSTRING = Speaker.COLLECTIONSTRING;
    protected _collectionString = Speaker.COLLECTIONSTRING;

    public get speaker(): Speaker {
        return this._model;
    }

    /**
     * @returns
     *  - waiting if there is no begin nor end time
     *  - current if there is a begin time and not end time
     *  - finished if there are both begin and end time
     */
    public get state(): SpeakerState {
        if (!this.begin_time && !this.end_time) {
            return SpeakerState.WAITING;
        } else if (this.begin_time && !this.end_time) {
            return SpeakerState.CURRENT;
        } else {
            return SpeakerState.FINISHED;
        }
    }

    public get name(): string {
        return this.user ? this.user.full_name : '';
    }

    public get gender(): string {
        return this.user ? this.user.gender : '';
    }

    public getListTitle = () => {
        return this.getTitle();
    };
}
export interface ViewSpeaker extends Speaker {
    user?: ViewUser;
}
