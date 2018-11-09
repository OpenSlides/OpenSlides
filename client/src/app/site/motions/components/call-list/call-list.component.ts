import { Component, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { BaseViewComponent } from '../../../base/base-view';
import { MatSnackBar } from '@angular/material';
import { MotionRepositoryService } from '../../services/motion-repository.service';
import { ViewMotion } from '../../models/view-motion';
import { SortingListComponent } from '../../../../shared/components/sorting-list/sorting-list.component';
import { Router, ActivatedRoute } from '@angular/router';

/**
 * Sort view for the call list.
 */
@Component({
    selector: 'os-call-list',
    templateUrl: './call-list.component.html'
})
export class CallListComponent extends BaseViewComponent {
    /**
     * All motions sorted first by weight, then by id.
     */
    public motions: ViewMotion[];

    /**
     * The sort component
     */
    @ViewChild('sorter')
    public sorter: SortingListComponent;

    /**
     * Updates the motions member, and sorts it.
     * @param title
     * @param translate
     * @param matSnackBar
     * @param motionRepo
     */
    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private motionRepo: MotionRepositoryService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        super(title, translate, matSnackBar);

        this.motionRepo.getViewModelListObservable().subscribe(motions => {
            this.motions = motions.sort((a, b) => {
                if (a.weight !== b.weight) {
                    return a.weight - b.weight;
                } else {
                    return a.id - b.id;
                }
            });
        });
    }

    /**
     * Saves the new motion order to the server.
     */
    public save(): void {
        this.motionRepo.sortMotions(this.sorter.array.map(s => ({ id: s.id }))).then(() => {
            this.router.navigate(['../'], { relativeTo: this.route });
        }, this.raiseError);
    }
}
