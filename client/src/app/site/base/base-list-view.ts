import { OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { PblColumnDefinition, PblDataSource } from '@pebula/ngrid';

import { StorageService } from 'app/core/core-services/storage.service';
import { BaseViewComponentDirective } from './base-view';
import { BaseViewModel } from './base-view-model';

export abstract class BaseListViewComponent<V extends BaseViewModel>
    extends BaseViewComponentDirective
    implements OnDestroy {
    /**
     * The source of the table data, will be filled by an event emitter
     */
    public dataSource: PblDataSource<V>;

    /**
     * Toggle for enabling the multiSelect mode. Defaults to false (inactive)
     */
    protected canMultiSelect = false;

    /**
     * Current state of the multi select mode. TODO Could be merged with edit mode?
     */
    private _multiSelectMode = false;

    /**
     * An array of currently selected items, upon which multi select actions can be performed
     * see {@link selectItem}.
     * Filled using double binding from list-view-tables
     */
    public selectedRows: V[];

    /**
     * Force children to have a tableColumnDefinition
     */
    public abstract tableColumnDefinition: PblColumnDefinition[];

    /**
     * NGrid column width for single buttons
     */
    public singleButtonWidth = '40px';

    /**
     * NGrid column width for single buttons with badge
     */
    public badgeButtonWidth = '45px';

    /**
     * @param titleService the title service
     * @param translate the translate service
     * @param matSnackBar showing errors
     * @param storage Access the store
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        protected storage: StorageService
    ) {
        super(titleService, translate, matSnackBar);
        this.selectedRows = [];
    }

    /**
     * Detect changes to data source
     *
     * @param newDataSource
     */
    public onDataSourceChange(newDataSource: PblDataSource<V>): void {
        this.dataSource = newDataSource;
    }

    /**
     * enables/disables the multiSelect Mode
     */
    public toggleMultiSelect(): void {
        if (!this.canMultiSelect || this.isMultiSelect) {
            this._multiSelectMode = false;
            this.deselectAll();
        } else {
            this._multiSelectMode = true;
        }
    }

    /**
     * Select all files in the current data source
     */
    public selectAll(): void {
        this.dataSource.selection.select(...this.dataSource.filteredData);
    }

    /**
     * Handler to quickly unselect all items.
     */
    public deselectAll(): void {
        if (this.dataSource) {
            this.dataSource.selection.clear();
        }
    }

    /**
     * Returns the current state of the multiSelect modus
     */
    public get isMultiSelect(): boolean {
        return this._multiSelectMode;
    }
}
