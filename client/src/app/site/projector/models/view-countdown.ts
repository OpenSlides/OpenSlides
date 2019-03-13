import { Countdown } from 'app/shared/models/core/countdown';
import { BaseProjectableViewModel } from 'app/site/base/base-projectable-view-model';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { BaseViewModel } from 'app/site/base/base-view-model';

export class ViewCountdown extends BaseProjectableViewModel {
    public static COLLECTIONSTRING = Countdown.COLLECTIONSTRING;

    private _countdown: Countdown;

    public get countdown(): Countdown {
        return this._countdown;
    }

    public get id(): number {
        return this.countdown.id;
    }

    public get running(): boolean {
        return this.countdown.running;
    }

    public get default_time(): number {
        return this.countdown.default_time;
    }

    public get countdown_time(): number {
        return this.countdown.countdown_time;
    }

    public get description(): string {
        return this.countdown.description || '';
    }

    public get title(): string {
        return this.countdown.title;
    }

    /**
     * This is set by the repository
     */
    public getVerboseName;

    public constructor(countdown: Countdown) {
        super(Countdown.COLLECTIONSTRING);
        this._countdown = countdown;
    }

    /**
     * @returns a title for the countdown, consisting of the title and additional
     * text info that may be displayed on the projector
     */
    public getTitle = () => {
        return this.description ? `${this.title} (${this.description})` : this.title;
    };

    public getModel(): Countdown {
        return this.countdown;
    }

    public updateDependencies(update: BaseViewModel): void {}

    public getSlide(): ProjectorElementBuildDeskriptor {
        return {
            getBasicProjectorElement: options => ({
                stable: true,
                name: Countdown.COLLECTIONSTRING,
                id: this.id,
                getIdentifiers: () => ['name', 'id']
            }),
            slideOptions: [
                {
                    key: 'fullscreen',
                    displayName: 'Fullscreen',
                    default: false
                }
            ],
            projectionDefaultName: 'countdowns',
            getDialogTitle: () => this.getTitle()
        };
    }
}
