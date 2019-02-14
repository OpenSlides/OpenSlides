import { SlideDynamicConfiguration, Slide } from './slide-manifest';

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
    }
];
