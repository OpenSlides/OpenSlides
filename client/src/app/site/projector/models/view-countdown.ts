import { Countdown } from 'app/shared/models/core/countdown';
import { BaseProjectableViewModel } from 'app/site/base/base-projectable-view-model';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';

export interface CountdownTitleInformation {
    title: string;
    description?: string;
}

export class ViewCountdown extends BaseProjectableViewModel<Countdown> implements CountdownTitleInformation {
    public static COLLECTIONSTRING = Countdown.COLLECTIONSTRING;
    protected _collectionString = Countdown.COLLECTIONSTRING;

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
                },
                {
                    key: 'displayType',
                    displayName: 'Displaytype',
                    choices: [
                        { value: 'onlyCountdown', displayName: 'Only countdown' },
                        { value: 'countdownAndTimeIndicator', displayName: 'Countdown and time-indicator' },
                        { value: 'onlyTimeIndicator', displayName: 'Only time indicator' }
                    ],
                    default: 'onlyCountdown'
                }
            ],
            projectionDefaultName: 'countdowns',
            getDialogTitle: () => this.getTitle()
        };
    }
}
