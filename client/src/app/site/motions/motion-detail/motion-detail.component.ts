import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OpenSlidesComponent } from '../../../openslides.component';
import { BaseComponent } from '../../../base.component';
import { Motion } from '../../../shared/models/motions/motion';

@Component({
    selector: 'app-motion-detail',
    templateUrl: './motion-detail.component.html',
    styleUrls: ['./motion-detail.component.scss']
})
export class MotionDetailComponent extends BaseComponent implements OnInit {
    motion: Motion;

    constructor(private route: ActivatedRoute) {
        super();
        this.route.params.subscribe(params => {
            console.log(params.id);

            // has the motion of the DataStore was initialized before.
            // Otherwise we need to observe DS
            this.motion = this.DS.get(Motion, params.id) as Motion;

            // Observe motion to get the motion in the parameter and also get the changes
            this.DS.getObservable().subscribe(newModel => {
                if (newModel instanceof Motion) {
                    if (newModel.id === +params.id) {
                        this.motion = newModel as Motion;
                        console.log('this.motion = ', this.motion);
                        // console.log('motion state name: ', this.motion.stateName);
                    }
                }
            });
        });
    }

    ngOnInit() {
        console.log('(init)the motion: ', this.motion);
        console.log('motion state name: ', this.motion.stateName);
    }

    downloadSingleMotionButton() {
        console.log('Download this motion');
    }
}
