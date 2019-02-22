import { Component, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material';

import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { ItemRepositoryService } from 'app/core/repositories/agenda/item-repository.service';
import { BaseViewComponent } from '../../../base/base-view';
import { SortingTreeComponent } from 'app/shared/components/sorting-tree/sorting-tree.component';
import { ViewItem } from '../../models/view-item';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { CanComponentDeactivate } from 'app/shared/utils/watch-sorting-tree.guard';

/**
 * Sort view for the agenda.
 */
@Component({
    selector: 'os-agenda-sort',
    templateUrl: './agenda-sort.component.html'
})
export class AgendaSortComponent extends BaseViewComponent implements CanComponentDeactivate {
    /**
     * Reference to the view child
     */
    @ViewChild('osSortedTree')
    public osSortTree: SortingTreeComponent<ViewItem>;

    /**
     * Boolean to check if changes has been made.
     */
    public hasChanged = false;

    /**
     * All agendaItems sorted by their virtual weight {@link ViewItem.agendaListWeight}
     */
    public itemsObservable: Observable<ViewItem[]>;

    /**
     * Updates the incoming/changing agenda items.
     * @param title
     * @param translate
     * @param matSnackBar
     * @param agendaRepo
     * @param promptService
     */
    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private agendaRepo: ItemRepositoryService,
        private promptService: PromptService
    ) {
        super(title, translate, matSnackBar);
        this.itemsObservable = this.agendaRepo.getViewModelListObservable();
    }

    /**
     * Function to save the tree by click.
     */
    public async onSave(): Promise<void> {
        await this.agendaRepo
            .sortItems(this.osSortTree.getTreeData())
            .then(() => this.osSortTree.setSubscription(), this.raiseError);
    }

    /**
     * Function to restore the old state.
     */
    public async onCancel(): Promise<void> {
        if (await this.canDeactivate()) {
            this.osSortTree.setSubscription();
        }
    }

    /**
     * Function to get an info if changes has been made.
     *
     * @param hasChanged Boolean received from the tree to see that changes has been made.
     */
    public receiveChanges(hasChanged: boolean): void {
        this.hasChanged = hasChanged;
    }

    /**
     * Function to open a prompt dialog,
     * so the user will be warned if he has made changes and not saved them.
     *
     * @returns The result from the prompt dialog.
     */
    public async canDeactivate(): Promise<boolean> {
        if (this.hasChanged) {
            const title = this.translate.instant('You made changes.');
            const content = this.translate.instant('Do you really want to exit?');
            return await this.promptService.open(title, content);
        }
        return true;
    }
}
