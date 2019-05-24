import { Countdown } from 'app/shared/models/core/countdown';
import { BaseProjectableViewModel } from 'app/site/base/base-projectable-view-model';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { BaseViewModel } from 'app/site/base/base-view-model';

export interface CountdownTitleInformation {
    title: string;
    description?: string;
}

export class ViewCountdown extends BaseProjectableViewModel<Countdown> implements CountdownTitleInformation {
    public static COLLECTIONSTRING = Countdown.COLLECTIONSTRING;

    public get countdown(): Countdown {
        return this._model;
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

    public constructor(countdown: Countdown) {
        super(Countdown.COLLECTIONSTRING, countdown);
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
