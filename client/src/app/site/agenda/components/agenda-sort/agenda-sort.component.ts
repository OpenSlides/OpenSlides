import { Component, ViewChild, EventEmitter, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material';

import { TranslateService } from '@ngx-translate/core';
import { Observable, BehaviorSubject } from 'rxjs';

import { ItemRepositoryService } from 'app/core/repositories/agenda/item-repository.service';
import { BaseViewComponent } from '../../../base/base-view';
import { SortingTreeComponent } from 'app/shared/components/sorting-tree/sorting-tree.component';
import { ViewItem } from '../../models/view-item';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { CanComponentDeactivate } from 'app/shared/utils/watch-sorting-tree.guard';
import { itemVisibilityChoices } from 'app/shared/models/agenda/item';

/**
 * Sort view for the agenda.
 */
@Component({
    selector: 'os-agenda-sort',
    templateUrl: './agenda-sort.component.html',
    styleUrls: ['./agenda-sort.component.scss']
})
export class AgendaSortComponent extends BaseViewComponent implements CanComponentDeactivate, OnInit {
    /**
     * Reference to the view child
     */
    @ViewChild('osSortedTree')
    public osSortTree: SortingTreeComponent<ViewItem>;

    /**
     * Emitter to emit if the nodes should expand or collapse.
     */
    public readonly changeState: EventEmitter<Boolean> = new EventEmitter<Boolean>();

    /**
     * Emitter who emits the filters to the sorting tree.
     */
    public readonly changeFilter: EventEmitter<(item: ViewItem) => boolean> = new EventEmitter<
        (item: ViewItem) => boolean
    >();

    /**
     * These are the available options for filtering the nodes.
     * Adds the property `state` to identify if the option is marked as active.
     * When reset the filters, the option `state` will be set to `false`.
     */
    public filterOptions = itemVisibilityChoices.map(item => {
        return { ...item, state: false };
    });

    /**
     * BehaviourSubject to get informed every time the filters change.
     */
    private activeFilters: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

    /**
     * Boolean to check if changes has been made.
     */
    public hasChanged = false;

    /**
     * Boolean to check if filters are active, so they could be removed.
     */
    public hasActiveFilter = false;

    /**
     * Array, that holds the number of visible nodes and amount of available nodes.
     */
    public seenNodes: [number, number] = [0, 0];

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
     * OnInit method
     */
    public ngOnInit(): void {
        /**
         * Passes the active filters as an array to the subject.
         */
        const filter = this.activeFilters.subscribe((value: string[]) => {
            this.hasActiveFilter = value.length === 0 ? false : true;
            this.changeFilter.emit(
                (item: ViewItem): boolean => {
                    return !(value.includes(item.verboseType) || value.length === 0);
                }
            );
        });
        this.subscriptions.push(filter);
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
     * Function to receive the new number of visible nodes when the filter has changed.
     *
     * @param nextNumberOfSeenNodes is an array with two indices:
     * The first gives the number of currently shown nodes.
     * The second tells how many nodes available.
     */
    public onChangeAmountOfItems(nextNumberOfSeenNodes: [number, number]): void {
        this.seenNodes = nextNumberOfSeenNodes;
    }

    /**
     * Function to emit if the nodes should be expanded or collapsed.
     *
     * @param nextState Is the next state, expanded or collapsed, the nodes should be.
     */
    public onStateChange(nextState: boolean): void {
        this.changeState.emit(nextState);
    }

    /**
     * Function to set the active filters to null.
     */
    public resetFilters(): void {
        for (const option of this.filterOptions) {
            option.state = false;
        }
        this.activeFilters.next([]);
    }

    /**
     * Function to emit the active filters.
     * Filters will be stored in an array to prevent duplicated options.
     * Furthermore if the option is already included in this array, then it will be deleted.
     * This array will be emitted.
     *
     * @param filter Is the filter that was activated by the user.
     */
    public onFilterChange(filter: string): void {
        const value = this.activeFilters.value;
        if (!value.includes(filter)) {
            value.push(filter);
        } else {
            value.splice(value.indexOf(filter), 1);
        }
        this.activeFilters.next(value);
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

    /**
     * Function, that returns an icon depending on the given tag.
     *
     * @param tag of which the icon will be assigned to.
     *
     * @returns The icon it should be.
     */
    public getIcon(type: string): string {
        switch (type.toLowerCase()) {
            case 'public item':
                return 'public';
            case 'internal item':
                return 'visibility';
            case 'hidden item':
                return 'visibility_off';
        }
    }
}
