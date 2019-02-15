import { SlideManifest } from './slide-manifest';

/**
 * Here, all slides has to be registered.
 *
 * Note: When adding or removing slides here, you may need to restart yarn/npm, because
 * the angular CLI scans this file just at it's start time and creates the modules then. There
 * is no such thing as "dynamic update" in this case..
 */
export const allSlides: SlideManifest[] = [
    {
        slide: 'topics/topic',
        path: 'topics/topic',
        loadChildren: './slides/agenda/topic/topics-topic-slide.module#TopicsTopicSlideModule',
        verboseName: 'Topic',
        elementIdentifiers: ['name', 'id'],
        canBeMappedToModel: true
    },
    {
        slide: 'motions/motion',
        path: 'motions/motion',
        loadChildren: './slides/motions/motion/motions-motion-slide.module#MotionsMotionSlideModule',
        verboseName: 'Motion',
        elementIdentifiers: ['name', 'id'],
        canBeMappedToModel: true
    },
    {
        slide: 'users/user',
        path: 'users/user',
        loadChildren: './slides/users/user/users-user-slide.module#UsersUserSlideModule',
        verboseName: 'Participant',
        elementIdentifiers: ['name', 'id'],
        canBeMappedToModel: true
    },
    {
        slide: 'core/clock',
        path: 'core/clock',
        loadChildren: './slides/core/clock/clock-slide.module#ClockSlideModule',
        verboseName: 'Clock',
        elementIdentifiers: ['name'],
        canBeMappedToModel: false
    },
    {
        slide: 'core/countdown',
        path: 'core/countdown',
        loadChildren: './slides/core/countdown/countdown-slide.module#CountdownSlideModule',
        verboseName: 'Countdown',
        elementIdentifiers: ['name', 'id'],
        canBeMappedToModel: true
    },
    {
        slide: 'core/projector-message',
        path: 'core/projector-message',
        loadChildren: './slides/core/projector-message/projector-message-slide.module#ProjectorMessageSlideModule',
        verboseName: 'Message',
        elementIdentifiers: ['name', 'id'],
        canBeMappedToModel: true
    },
    {
        slide: 'agenda/current-list-of-speakers',
        path: 'agenda/current-list-of-speakers',
        loadChildren:
            './slides/agenda/current-list-of-speakers/agenda-current-list-of-speakers-slide.module#AgendaCurrentListOfSpeakersSlideModule',
        verboseName: 'Current list of speakers',
        elementIdentifiers: ['name', 'id'],
        canBeMappedToModel: false
    },
    {
        slide: 'agenda/current-list-of-speakers-overlay',
        path: 'agenda/current-list-of-speakers-overlay',
        loadChildren:
            './slides/agenda/current-list-of-speakers-overlay/agenda-current-list-of-speakers-overlay-slide.module#AgendaCurrentListOfSpeakersOverlaySlideModule',
        verboseName: 'Current list of speakers overlay',
        elementIdentifiers: ['name', 'id'],
        canBeMappedToModel: false
    },
    {
        slide: 'assignments/assignment',
        path: 'assignments/assignment',
        loadChildren: './slides/assignments/assignment/assignment-slide.module#AssignmentSlideModule',
        verboseName: 'Election',
        elementIdentifiers: ['name', 'id'],
        canBeMappedToModel: true
    }
];
