import { Component, OnInit } from '@angular/core';
import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { MotionsMotionSlideData } from './motions-motion-slide-model';

@Component({
    selector: 'os-motions-motion-slide',
    templateUrl: './motions-motion-slide.component.html',
    styleUrls: ['./motions-motion-slide.component.scss']
})
export class MotionsMotionSlideComponent extends BaseSlideComponent<MotionsMotionSlideData> implements OnInit {
    public constructor() {
        super();
    }

    public ngOnInit(): void {
        console.log('Hello from motion slide');
    }
}
