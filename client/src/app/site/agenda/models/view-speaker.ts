import { BaseViewModel } from 'app/site/base/base-view-model';
import { Speaker, SpeakerState } from 'app/shared/models/agenda/speaker';
import { ViewUser } from 'app/site/users/models/view-user';
import { User } from 'app/shared/models/users/user';

/**
 * Provides "safe" access to a speaker with all it's components
 */
export class ViewSpeaker extends BaseViewModel {
    private _speaker: Speaker;
    private _user: ViewUser | null;

    public get speaker(): Speaker {
        return this._speaker;
    }

    public get user(): ViewUser {
        return this._user;
    }

    public get id(): number {
        return this.speaker.id;
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

    public get state(): SpeakerState {
        return this.speaker.state;
    }

    public get name(): string {
        return this.user ? this.user.full_name : '';
    }

    public get gender(): string {
        return this.user ? this.user.gender : '';
    }

    /**
     * This is set by the repository
     */
    public getVerboseName;

    public constructor(speaker: Speaker, user?: ViewUser) {
        super('TODO');
        this._speaker = speaker;
        this._user = user;
    }

    public getTitle = () => {
        return this.name;
    };

    public getModel(): User {
        return this.user.user;
    }

    /**
     * Speaker is not a base model,
     * @param update the incoming update
     */
    public updateDependencies(update: BaseViewModel): void {}
}
