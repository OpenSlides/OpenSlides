import { trigger, animate, transition, style, query, stagger, group } from '@angular/animations';

const fadeVanish = [
    style({ transform: 'translateY(0%)', opacity: 1 }),
    animate(
        '150ms ease-in-out',
        style({
            transform: 'translateY(0%)',
            opacity: 0
        })
    )
];

// Requires more generic way to trigger parallel animations
// const fadeAppear = [
//     style({ transform: 'translateY(0%)', opacity: 0 }),
//     animate('200ms ease-in-out', style({ transform: 'translateY(0%)', opacity: 1 }))
// ];

const justEnterDom = [style({ opacity: 0 })];

const fadeMoveIn = [
    style({ transform: 'translateY(30px)' }),
    animate('150ms ease-in-out', style({ transform: 'translateY(0px)', opacity: 1 }))
];

export const pageTransition = trigger('pageTransition', [
    transition('* => *', [
        /** this will avoid the dom-copy-effect */
        query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),

        /** keep the dom clean - let all items "just" enter */
        query(':enter mat-card', justEnterDom, { optional: true }),
        query(':enter mat-row', justEnterDom, { optional: true }),

        /** parallel vanishing */
        group([
            query(':leave mat-card', fadeVanish, { optional: true }),
            query(':leave mat-row', fadeVanish, { optional: true })
        ]),

        /** parallel appearing */
        group([
            /** Staggered appearing = "one after another" */
            query(':enter mat-card', stagger(50, fadeMoveIn), { optional: true }),
            query(':enter mat-row', fadeMoveIn, { optional: true })
        ])
    ])
]);

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

export const navItemAnim = trigger('navItemAnim', [transition(':enter', slideIn), transition(':leave', slideOut)]);
