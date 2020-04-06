import { marker as _ } from '@biesbjerg/ngx-translate-extract-marker';

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
                    displayName: _('Fullscreen'),
                    default: false
                },
                {
                    key: 'displayType',
                    displayName: _('Display type'),
                    choices: [
                        { value: 'onlyCountdown', displayName: _('Only countdown') },
                        { value: 'countdownAndTimeIndicator', displayName: _('Countdown and traffic light') },
                        { value: 'onlyTimeIndicator', displayName: _('Only traffic light') }
                    ],
                    default: 'onlyCountdown'
                }
            ],
            projectionDefaultName: 'countdowns',
            getDialogTitle: () => this.getTitle()
        };
    }
}
export interface ViewCountdown extends Countdown {}
