import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material';
import { Subject } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';

import { ListViewBaseComponent } from 'app/site/base/list-view-base';
import { HistoryRepositoryService } from '../../services/history-repository.service';
import { ViewHistory } from '../../models/view-history';

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
export class HistoryListComponent extends ListViewBaseComponent<ViewHistory> implements OnInit {
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
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private repo: HistoryRepositoryService
    ) {
        super(titleService, translate, matSnackBar);
    }

    /**
     * Init function for the history list.
     */
    public ngOnInit(): void {
        super.setTitle('History');
        this.initTable();

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
        const oldElementTitle = this.repo.getOldModelInfo(history.getCollectionString(), history.getModelID());

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
    public onClickRow(history: ViewHistory): void {
        this.repo.browseHistory(history).then(() => {
            this.raiseError(`Temporarily reset OpenSlides to the state from ${history.getLocaleString('DE-de')}`);
        });
    }

    /**
     * Handler for the delete all button
     */
    public onDeleteAllButton(): void {
        this.repo.delete();
    }

    /**
     * Returns a translated history information string which contains optional (translated) arguments.
     *
     * @param information history information string
     */
    public parseInformation(information: string): void {
        if (information.length) {
            const base_string = this.translate.instant(information[0]);
            let argument_string;
            if (information.length > 1) {
                argument_string = this.translate.instant(information[1]);
            }
            return base_string.replace(/\\{arg1\\}/g, argument_string);
        }
    }
}
