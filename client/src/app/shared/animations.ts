import { trigger, animate, transition, style, query, stagger, group } from '@angular/animations';

const fadeVanish = [
    style({ transform: 'translateY(0%)', opacity: 1 }),
    animate(
        '200ms ease-in-out',
        style({
            transform: 'translateY(0%)',
            opacity: 0
        })
    )
];

const fadeAppear = [
    style({ transform: 'translateY(0%)', opacity: 0 }),
    animate('200ms ease-in-out', style({ transform: 'translateY(0%)', opacity: 1 }))
];

const justEnterDom = [style({ opacity: 0 })];

const fadeMoveIn = [
    style({ transform: 'translateY(30px)' }),
    animate('250ms ease-in-out', style({ transform: 'translateY(0px)', opacity: 1 }))
];

export const pageTransition = trigger('pageTransition', [
    transition('* => *', [
        /** this will avoid the dom-copy-effect */
        query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),

        /** keep the dom clean - let all items "just" enter */
        query(':enter mat-card', justEnterDom, { optional: true }),
        query(':enter .on-transition-fade', justEnterDom, { optional: true }),
        query(':enter mat-row', justEnterDom, { optional: true }),
        query(':enter mat-expansion-panel', justEnterDom, { optional: true }),

        /** parallel vanishing */
        group([
            query(':leave .on-transition-fade', fadeVanish, { optional: true }),
            query(':leave mat-card', fadeVanish, { optional: true }),
            query(':leave mat-row', fadeVanish, { optional: true }),
            query(':leave mat-expansion-panel', fadeVanish, { optional: true })
        ]),

        /** parallel appearing */
        group([
            /** animate fade in for the selected components */
            query(':enter .on-transition-fade', fadeAppear, { optional: true }),

            /** Staggered appearing = "one after another" */
            query(':enter mat-card', stagger(50, fadeMoveIn), { optional: true }),
            query(':enter mat-row', stagger(30, fadeMoveIn), { optional: true })
            // disabled for now. They somehow appear expanded which looks strange
            // query(':enter mat-expansion-panel', stagger(30, fadeMoveIn), { optional: true })
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
