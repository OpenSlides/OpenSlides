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
        loadChildren: () => import('./agenda/item-list/item-list-slide.module').then(m => m.ItemListSlideModule),
        verboseName: 'Agenda',
        elementIdentifiers: ['name'],
        canBeMappedToModel: false
    },
    {
        slide: 'topics/topic',
        path: 'topics/topic',
        loadChildren: () => import('./topics/topic/topic-slide.module').then(m => m.TopicSlideModule),
        verboseName: 'Topic',
        elementIdentifiers: ['name', 'id'],
        canBeMappedToModel: true
    },
    {
        slide: 'motions/motion',
        path: 'motions/motion',
        loadChildren: () => import('./motions/motion/motion-slide.module').then(m => m.MotionSlideModule),
        verboseName: 'Motion',
        elementIdentifiers: ['name', 'id'],
        canBeMappedToModel: true
    },
    {
        slide: 'motions/motion-block',
        path: 'motions/motion-block',
        loadChildren: () =>
            import('./motions/motion-block/motion-block-slide.module').then(m => m.MotionBlockSlideModule),
        verboseName: 'Motion block',
        elementIdentifiers: ['name', 'id'],
        canBeMappedToModel: true
    },
    {
        slide: 'motions/motion-poll',
        path: 'motions/motion-poll',
        loadChildren: () => import('./motions/motion-poll/motion-poll-slide.module').then(m => m.MotionPollSlideModule),
        verboseName: 'Vote',
        elementIdentifiers: ['name', 'id'],
        canBeMappedToModel: true
    },
    {
        slide: 'users/user',
        path: 'users/user',
        loadChildren: () => import('./users/user/user-slide.module').then(m => m.UserSlideModule),
        verboseName: 'Participant',
        elementIdentifiers: ['name', 'id'],
        canBeMappedToModel: true
    },
    {
        slide: 'core/clock',
        path: 'core/clock',
        loadChildren: () => import('./core/clock/clock-slide.module').then(m => m.ClockSlideModule),
        verboseName: 'Clock',
        elementIdentifiers: ['name'],
        canBeMappedToModel: false
    },
    {
        slide: 'core/countdown',
        path: 'core/countdown',
        loadChildren: () => import('./core/countdown/countdown-slide.module').then(m => m.CountdownSlideModule),
        verboseName: 'Countdown',
        elementIdentifiers: ['name', 'id'],
        canBeMappedToModel: true
    },
    {
        slide: 'core/projector-message',
        path: 'core/projector-message',
        loadChildren: () =>
            import('./core/projector-message/projector-message-slide.module').then(m => m.ProjectorMessageSlideModule),
        verboseName: 'Message',
        elementIdentifiers: ['name', 'id'],
        canBeMappedToModel: true
    },
    {
        slide: 'agenda/current-list-of-speakers',
        path: 'agenda/current-list-of-speakers',
        loadChildren: () =>
            import('./agenda/current-list-of-speakers/current-list-of-speakers-slide.module').then(
                m => m.CurrentListOfSpeakersSlideModule
            ),
        verboseName: 'Current list of speakers',
        elementIdentifiers: ['name'],
        canBeMappedToModel: false
    },
    {
        slide: 'agenda/current-list-of-speakers-overlay',
        path: 'agenda/current-list-of-speakers-overlay',
        loadChildren: () =>
            import('./agenda/current-list-of-speakers-overlay/current-list-of-speakers-overlay-slide.module').then(
                m => m.CurrentListOfSpeakersOverlaySlideModule
            ),
        verboseName: 'Current list of speakers overlay',
        elementIdentifiers: ['name'],
        canBeMappedToModel: false
    },
    {
        slide: 'agenda/current-speaker-chyron',
        path: 'agenda/current-speaker-chyron',
        loadChildren: () =>
            import('./agenda/current-speaker-chyron/current-speaker-chyron-slide.module').then(
                m => m.CurrentSpeakerChyronSlideModule
            ),
        verboseName: 'Current speaker chyron',
        elementIdentifiers: ['name'],
        canBeMappedToModel: false
    },
    {
        slide: 'agenda/list-of-speakers',
        path: 'agenda/list-of-speakers',
        loadChildren: () =>
            import('./agenda/list-of-speakers/list-of-speakers-slide.module').then(m => m.ListOfSpeakersSlideModule),
        verboseName: 'List of speakers',
        elementIdentifiers: ['name', 'id'],
        canBeMappedToModel: false
    },
    {
        slide: 'assignments/assignment',
        path: 'assignments/assignment',
        loadChildren: () =>
            import('./assignments/assignment/assignment-slide.module').then(m => m.AssignmentSlideModule),
        verboseName: 'Election',
        elementIdentifiers: ['name', 'id'],
        canBeMappedToModel: true
    },
    {
        slide: 'assignments/assignment-poll',
        path: 'assignments/assignment-poll',
        loadChildren: () =>
            import('./assignments/assignment-poll/assignment-poll-slide.module').then(m => m.AssignmentPollSlideModule),
        verboseName: 'Ballot',
        elementIdentifiers: ['name', 'id'],
        canBeMappedToModel: true
    },
    {
        slide: 'mediafiles/mediafile',
        path: 'mediafiles/mediafile',
        loadChildren: () => import('./mediafiles/mediafile/mediafile-slide.module').then(m => m.MediafileSlideModule),
        verboseName: 'File',
        elementIdentifiers: ['name', 'id'],
        canBeMappedToModel: true
    }
];
