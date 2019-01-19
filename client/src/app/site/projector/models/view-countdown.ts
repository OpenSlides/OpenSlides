import { Countdown } from 'app/shared/models/core/countdown';
import { BaseProjectableModel } from 'app/site/base/base-projectable-model';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';

export class ViewCountdown extends BaseProjectableModel {
    private _countdown: Countdown;

    public get countdown(): Countdown {
        return this._countdown ? this._countdown : null;
    }

    public get id(): number {
        return this.countdown ? this.countdown.id : null;
    }

    public get description(): string {
        return this.countdown ? this.countdown.description : null;
    }

    public constructor(countdown?: Countdown) {
        super();
        this._countdown = countdown;
    }

    public getTitle(): string {
        return this.description;
    }

    public updateValues(countdown: Countdown): void {
        console.log('Update countdown TODO with vals:', countdown);
    }

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
