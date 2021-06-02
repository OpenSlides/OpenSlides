import { Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'os-progress',
    templateUrl: './progress.component.html',
    styleUrls: ['./progress.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ProgressComponent {
    @Input()
    public value = 0;

    @Input()
    public endIcon: string;
}
