import { SlideManifest } from './slide-manifest';

/**
 * Here, all slides has to be registered.
 */
export const allSlides: SlideManifest[] = [
    {
        slideName: 'motions/motion',
        path: 'motions/motion',
        loadChildren: './slides/motions/motion/motions-motion-slide.module#MotionsMotionSlideModule',
        scaleable: true,
        scrollable: true
    },
    {
        slideName: 'users/user',
        path: 'users/user',
        loadChildren: './slides/users/user/users-user-slide.module#UsersUserSlideModule',
        scaleable: false,
        scrollable: false
    }
];
