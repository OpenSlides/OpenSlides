import { BaseViewModel } from 'app/site/base/base-view-model';
import { Speaker, SpeakerState } from 'app/shared/models/agenda/speaker';
import { User } from 'app/shared/models/users/user';
import { Selectable } from 'app/shared/components/selectable';

/**
 * Provides "safe" access to a speaker with all it's components
 */
export class ViewSpeaker extends BaseViewModel implements Selectable {
    private _speaker: Speaker;
    private _user: User;

    public get speaker(): Speaker {
        return this._speaker;
    }

    public get user(): User {
        return this._user;
    }

    public get id(): number {
        return this.speaker ? this.speaker.id : null;
    }

    public get weight(): number {
        return this.speaker ? this.speaker.weight : null;
    }

    public get marked(): boolean {
        return this.speaker ? this.speaker.marked : null;
    }

    public get begin_time(): string {
        return this.speaker ? this.speaker.begin_time : null;
    }

    public get end_time(): string {
        return this.speaker ? this.speaker.end_time : null;
    }

    public get state(): SpeakerState {
        return this.speaker ? this.speaker.state : null;
    }

    public get name(): string {
        return this.user.full_name;
    }

    public constructor(speaker?: Speaker, user?: User) {
        super();
        this._speaker = speaker;
        this._user = user;
    }

    public getTitle(): string {
        return this.name;
    }

    /**
     * Speaker is not a base model,
     * @param update the incoming update
     */
    public updateValues(update: Speaker): void {
        if (this.id === update.id) {
            this._speaker = update;
        }
    }
}
