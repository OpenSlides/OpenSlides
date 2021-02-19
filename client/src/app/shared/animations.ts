import { animate, state, style, transition, trigger } from '@angular/animations';

const fadeSpeed = {
    fast: 200,
    slow: 600
};

const slideIn = [style({ transform: 'translateX(-85%)' }), animate('600ms ease')];
const slideOut = [
    style({ transform: 'translateX(0)' }),
    animate(
        '600ms ease',
        style({
            transform: 'translateX(-85%)'
        })
    )
];

export const collapseAndFade = trigger('collapse', [
    state('in', style({ opacity: 1, height: '100%' })),
    transition(':enter', [style({ opacity: 0, height: 0 }), animate(fadeSpeed.fast)]),
    transition(':leave', animate(fadeSpeed.fast, style({ opacity: 0, height: 0 })))
]);

export const fadeAnimation = trigger('fade', [
    state('in', style({ opacity: 1 })),
    transition(':enter', [style({ opacity: 0 }), animate(fadeSpeed.slow)]),
    transition(':leave', animate(fadeSpeed.slow, style({ opacity: 0 })))
]);
export const navItemAnim = trigger('navItemAnim', [transition(':enter', slideIn), transition(':leave', slideOut)]);
