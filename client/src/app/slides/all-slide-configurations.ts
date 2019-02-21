import { TranslateService } from '@ngx-translate/core';

import { SlideDynamicConfiguration, Slide } from './slide-manifest';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { ProjectorElement } from 'app/shared/models/core/projector';

export const allSlidesDynamicConfiguration: (SlideDynamicConfiguration & Slide)[] = [
    {
        slide: 'topics/topic',
        scaleable: true,
        scrollable: true
    },
    {
        slide: 'motions/motion',
        scaleable: true,
        scrollable: true
    },
    {
        slide: 'motions/motion-block',
        scaleable: true,
        scrollable: true
    },
    {
        slide: 'users/user',
        scaleable: true,
        scrollable: true
    },
    {
        slide: 'core/clock',
        scaleable: false,
        scrollable: false
    },
    {
        slide: 'core/countdown',
        scaleable: false,
        scrollable: false
    },
    {
        slide: 'core/projector-message',
        scaleable: false,
        scrollable: false
    },
    {
        slide: 'agenda/list-of-speakers',
        scaleable: true,
        scrollable: true,
        getSlideTitle: (
            element: ProjectorElement,
            translate: TranslateService,
            viewModelStore: ViewModelStoreService
        ) => {
            const item = viewModelStore.get('agenda/item', element.id);
            if (item) {
                const title = translate.instant('List of speakers for');
                return title + ' ' + item.getTitle();
            }
            return translate.instant('List of speakers');
        }
    },
    {
        slide: 'agenda/current-list-of-speakers',
        scaleable: true,
        scrollable: true
    },
    {
        slide: 'agenda/current-list-of-speakers-overlay',
        scaleable: false,
        scrollable: false
    },
    {
        slide: 'assignments/assignment',
        scaleable: true,
        scrollable: true
    },
    {
        slide: 'mediafiles/mediafile',
        scaleable: true,
        scrollable: true
    }
];
