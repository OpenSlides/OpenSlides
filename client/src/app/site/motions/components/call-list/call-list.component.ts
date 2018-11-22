import { Component, ViewChild, EventEmitter } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material';

import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { BaseViewComponent } from '../../../base/base-view';
import { MotionRepositoryService } from '../../services/motion-repository.service';
import { ViewMotion } from '../../models/view-motion';
import { SortingListComponent } from '../../../../shared/components/sorting-list/sorting-list.component';
import { OSTreeSortEvent } from 'app/shared/components/sorting-tree/sorting-tree.component';

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
    public motionsObservable: Observable<ViewMotion[]>;

    /**
     * Emits true for expand and false for collaps. Informs the sorter component about this actions.
     */
    public readonly expandCollapse: EventEmitter<boolean> = new EventEmitter<boolean>();

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
        private motionRepo: MotionRepositoryService
    ) {
        super(title, translate, matSnackBar);

        this.motionsObservable = this.motionRepo.getViewModelListObservable();
    }

    /**
     * Handler for the sort event. The data to change is given to
     * the repo, sending it to the server.
     */
    public sort(data: OSTreeSortEvent): void {
        this.motionRepo.sortMotions(data).then(null, this.raiseError);
    }

    /**
     * Fires the expandCollapse event emitter.
     *
     * @param expand True, if the tree should be expanded. Otherwise collapsed
     */
    public expandCollapseAll(expand: boolean): void {
        this.expandCollapse.emit(expand);
    }
}
