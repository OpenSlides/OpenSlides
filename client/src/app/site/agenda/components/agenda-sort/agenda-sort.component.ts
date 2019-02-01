import { Component, EventEmitter } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material';

import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { AgendaRepositoryService } from 'app/core/repositories/agenda/agenda-repository.service';
import { BaseViewComponent } from '../../../base/base-view';
import { OSTreeSortEvent } from 'app/shared/components/sorting-tree/sorting-tree.component';
import { ViewItem } from '../../models/view-item';

/**
 * Sort view for the agenda.
 */
@Component({
    selector: 'os-agenda-sort',
    templateUrl: './agenda-sort.component.html'
})
export class AgendaSortComponent extends BaseViewComponent {
    /**
     * All agendaItems sorted by their virtual weight {@link ViewItem.agendaListWeight}
     */
    public itemsObservable: Observable<ViewItem[]>;

    /**
     * Emits true for expand and false for collapse. Informs the sorter component about this actions.
     */
    public readonly expandCollapse: EventEmitter<boolean> = new EventEmitter<boolean>();

    /**
     * Updates the incoming/changing agenda items.
     * @param title
     * @param translate
     * @param matSnackBar
     * @param agendaRepo
     */
    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private agendaRepo: AgendaRepositoryService
    ) {
        super(title, translate, matSnackBar);
        this.itemsObservable = this.agendaRepo.getViewModelListObservable();
    }

    /**
     * Handler for the sort event. The data to change is given to the repo, sending it to the server.
     *
     * @param data The event data. The representation fits the servers requirements, so it can directly
     * be send to the server via the repository.
     */
    public sort(data: OSTreeSortEvent<ViewItem>): void {
        this.agendaRepo.sortItems(data).then(null, this.raiseError);
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
