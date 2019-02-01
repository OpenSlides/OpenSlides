import { Countdown } from 'app/shared/models/core/countdown';
import { BaseProjectableViewModel } from 'app/site/base/base-projectable-view-model';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { BaseViewModel } from 'app/site/base/base-view-model';

export class ViewCountdown extends BaseProjectableViewModel {
    private _countdown: Countdown;

    public get countdown(): Countdown {
        return this._countdown;
    }

    public get id(): number {
        return this.countdown.id;
    }

    public get description(): string {
        return this.countdown.description;
    }

    public constructor(countdown: Countdown) {
        super('Countdown');
        this._countdown = countdown;
    }

    public getTitle(): string {
        return this.description;
    }

    public updateDependencies(update: BaseViewModel): void {}

    public getSlide(): ProjectorElementBuildDeskriptor {
        return {
            getBasicProjectorElement: () => ({
                stable: true,
                name: Countdown.COLLECTIONSTRING,
                id: this.id,
                getIdentifiers: () => ['name', 'id']
            }),
            slideOptions: [],
            projectionDefaultName: 'countdowns',
            getTitle: () => this.getTitle()
        };
    }
}
