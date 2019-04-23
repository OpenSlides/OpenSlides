import { BaseViewModel } from 'app/site/base/base-view-model';
import { Speaker } from 'app/shared/models/agenda/speaker';
import { ViewUser } from 'app/site/users/models/view-user';
import { Updateable } from 'app/site/base/updateable';
import { Identifiable } from 'app/shared/models/base/identifiable';

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
export class ViewSpeaker implements Updateable, Identifiable {
    private _speaker: Speaker;
    private _user?: ViewUser;

    public get speaker(): Speaker {
        return this._speaker;
    }

    public get user(): ViewUser {
        return this._user;
    }

    public get id(): number {
        return this.speaker.id;
    }

    public get userId(): number {
        return this.speaker.user_id;
    }

    public get weight(): number {
        return this.speaker.weight;
    }

    public get marked(): boolean {
        return this.speaker.marked;
    }

    /**
     * @returns an ISO datetime string or null
     */
    public get begin_time(): string {
        return this.speaker.begin_time;
    }

    /**
     * @returns an ISO datetime string or null
     */
    public get end_time(): string {
        return this.speaker.end_time;
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

    public constructor(speaker: Speaker, user?: ViewUser) {
        this._speaker = speaker;
        this._user = user;
    }

    public getTitle = () => {
        return this.name;
    };

    public updateDependencies(update: BaseViewModel): boolean {
        if (update instanceof ViewUser && update.id === this.speaker.user_id) {
            this._user = update;
            return true;
        }
        return false;
    }
}
