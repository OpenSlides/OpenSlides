import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { History } from 'app/shared/models/core/history';
import { HistoryRepositoryService } from 'app/core/repositories/history/history-repository.service';
import { isDetailNavigable } from 'app/shared/models/base/detail-navigable';
import { ListViewBaseComponent } from 'app/site/base/list-view-base';
import { OperatorService } from 'app/core/core-services/operator.service';
import { ViewHistory } from '../../models/view-history';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';

/**
 * A list view for the history.
 *
 * Should display all changes that have been made in OpenSlides.
 */
@Component({
    selector: 'os-history-list',
    templateUrl: './history-list.component.html',
    styleUrls: ['./history-list.component.scss']
})
export class HistoryListComponent extends ListViewBaseComponent<ViewHistory, History> implements OnInit {
    /**
     * Subject determine when the custom timestamp subject changes
     */
    public customTimestampChanged: Subject<number> = new Subject<number>();

    /**
     * Constructor for the history list component
     *
     * @param titleService Setting the title
     * @param translate Handle translations
     * @param matSnackBar Showing errors and messages
     * @param repo The history repository
     * @param viewModelStore Access view models
     * @param router route to pages
     * @param operator checks if the user is a super admin
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private repo: HistoryRepositoryService,
        private viewModelStore: ViewModelStoreService,
        private router: Router,
        private operator: OperatorService
    ) {
        super(titleService, translate, matSnackBar);
    }

    /**
     * Init function for the history list.
     */
    public ngOnInit(): void {
        super.setTitle('History');
        this.initTable();
        this.setFilters();

        this.repo.getViewModelListObservable().subscribe(history => {
            this.sortAndPublish(history);
        });
    }

    /**
     * Sorts the given ViewHistory array and sets it in the table data source
     *
     * @param unsortedHistoryList
     */
    private sortAndPublish(unsortedHistoryList: ViewHistory[]): void {
        const sortedList = unsortedHistoryList.map(history => history).filter(item => item.information.length > 0);
        sortedList.sort((a, b) => b.history.unixtime - a.history.unixtime);
        this.dataSource.data = sortedList;
    }

    /**
     * Returns the row definition for the table
     *
     * @returns an array of strings that contains the required row definition
     */
    public getRowDef(): string[] {
        return ['time', 'element', 'info', 'user'];
    }

    /**
     * Tries get the title of the BaseModel element corresponding to
     * a history object.
     *
     * @param history the history
     * @returns the title of an old element or null if it could not be found
     */
    public getElementInfo(history: ViewHistory): string {
        const oldElementTitle = this.repo.getOldModelInfo(history.getCollectionString(), history.getModelId());

        if (oldElementTitle) {
            return oldElementTitle;
        } else {
            return null;
        }
    }

    /**
     * Click handler for rows in the history table.
     * Serves as an entry point for the time travel routine
     *
     * @param history Represents the selected element
     */
    public async onClickRow(history: ViewHistory): Promise<void> {
        if (this.operator.isInGroupIds(2)) {
            await this.repo.browseHistory(history);
            const element = this.viewModelStore.get(history.getCollectionString(), history.getModelId());
            let message = this.translate.instant('OpenSlides is temporarily reset to following timestamp:');
            message += ' ' + history.getLocaleString('DE-de');
            if (isDetailNavigable(element)) {
                this.raiseError(message);
                this.router.navigate([element.getDetailStateURL()]);
            } else {
                this.raiseError(message);
            }
        }
    }

    /**
     * Handler for the delete all button
     */
    public onDeleteAllButton(): void {
        if (this.operator.isInGroupIds(2)) {
            this.repo.delete();
        }
    }

    /**
     * Returns a translated history information string which contains optional (translated) arguments.
     *
     * @param information history information string
     */
    public parseInformation(information: string): string {
        if (information.length) {
            const base_string = this.translate.instant(information[0]);
            let argument_string;
            if (information.length > 1) {
                argument_string = this.translate.instant(information[1]);
            }
            return base_string.replace(/{arg1}/g, argument_string);
        }
    }

    /**
     * Handles the search fields' inputs
     *
     * @param value: a filter string. Matching is case-insensitive
     */
    public applySearch(value: string): void {
        this.dataSource.filter = value;
    }

    /**
     * Overwrites the dataSource's string filter with a more advanced option
     * using the display methods of this class.
     */
    private setFilters(): void {
        this.dataSource.filterPredicate = (data, filter) => {
            if (!data || !data.information) {
                return false;
            }
            filter = filter ? filter.toLowerCase() : '';
            if (
                this.getElementInfo(data)
                    .toLowerCase()
                    .indexOf(filter) >= 0
            ) {
                return true;
            }
            if (data.user && data.user.full_name.toLowerCase().indexOf(filter) >= 0) {
                return true;
            }
            return (
                this.parseInformation(data.information)
                    .toLowerCase()
                    .indexOf(filter) >= 0
            );
        };
    }
}
