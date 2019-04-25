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
        slide: 'agenda/item-list',
        path: 'agenda/item-list',
        loadChildren: './slides/agenda/item-list/item-list-slide.module#ItemListSlideModule',
        verboseName: 'Agenda',
        elementIdentifiers: ['name'],
        canBeMappedToModel: false
    },
    {
        slide: 'topics/topic',
        path: 'topics/topic',
        loadChildren: './slides/topics/topic/topic-slide.module#TopicSlideModule',
        verboseName: 'Topic',
        elementIdentifiers: ['name', 'id'],
        canBeMappedToModel: true
    },
    {
        slide: 'motions/motion',
        path: 'motions/motion',
        loadChildren: './slides/motions/motion/motion-slide.module#MotionSlideModule',
        verboseName: 'Motion',
        elementIdentifiers: ['name', 'id'],
        canBeMappedToModel: true
    },
    {
        slide: 'motions/motion-block',
        path: 'motions/motion-block',
        loadChildren: './slides/motions/motion-block/motion-block-slide.module#MotionBlockSlideModule',
        verboseName: 'Motion block',
        elementIdentifiers: ['name', 'id'],
        canBeMappedToModel: true
    },
    {
        slide: 'users/user',
        path: 'users/user',
        loadChildren: './slides/users/user/user-slide.module#UserSlideModule',
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
            './slides/agenda/current-list-of-speakers/current-list-of-speakers-slide.module#CurrentListOfSpeakersSlideModule',
        verboseName: 'Current list of speakers',
        elementIdentifiers: ['name'],
        canBeMappedToModel: false
    },
    {
        slide: 'agenda/current-list-of-speakers-overlay',
        path: 'agenda/current-list-of-speakers-overlay',
        loadChildren:
            './slides/agenda/current-list-of-speakers-overlay/current-list-of-speakers-overlay-slide.module#CurrentListOfSpeakersOverlaySlideModule',
        verboseName: 'Current list of speakers overlay',
        elementIdentifiers: ['name'],
        canBeMappedToModel: false
    },
    {
        slide: 'agenda/current-speaker-chyron',
        path: 'agenda/current-speaker-chyron',
        loadChildren:
            './slides/agenda/current-speaker-chyron/current-speaker-chyron-slide.module#CurrentSpeakerChyronSlideModule',
        verboseName: 'Current speaker chyron',
        elementIdentifiers: ['name'],
        canBeMappedToModel: false
    },
    {
        slide: 'agenda/list-of-speakers',
        path: 'agenda/list-of-speakers',
        loadChildren: './slides/agenda/list-of-speakers/list-of-speakers-slide.module#ListOfSpeakersSlideModule',
        verboseName: 'List of speakers',
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
    },
    {
        slide: 'assignments/poll',
        path: 'assignments/poll',
        loadChildren: './slides/assignments/poll/poll-slide.module#PollSlideModule',
        verboseName: 'Poll',
        elementIdentifiers: ['name', 'assignment_id', 'poll_id'],
        canBeMappedToModel: false
    },
    {
        slide: 'mediafiles/mediafile',
        path: 'mediafiles/mediafile',
        loadChildren: './slides/mediafiles/mediafile/mediafile-slide.module#MediafileSlideModule',
        verboseName: 'File',
        elementIdentifiers: ['name', 'id'],
        canBeMappedToModel: true
    }
];
