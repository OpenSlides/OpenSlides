import { animate, style, transition, trigger } from '@angular/animations';

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
