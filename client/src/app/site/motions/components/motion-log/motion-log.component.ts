import { Component, Input } from '@angular/core';
import { ViewMotion } from '../../models/view-motion';

/**
 * Component showing the log messages of a motion
 */
@Component({
    selector: 'os-motion-log',
    templateUrl: './motion-log.component.html',
    styleUrls: ['motion-log.component.scss']
})
export class MotionLogComponent {
    public expanded = false;

    /**
     * The viewMotion to show the log messages for
     */
    @Input()
    public motion: ViewMotion;

    /**
     * empty constructor
     */
    public constructor() {}
}
