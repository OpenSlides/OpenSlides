import { ViewChild } from '@angular/core';
import { BaseComponent } from '../../base.component';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { MatTableDataSource, MatTable, MatSort, MatPaginator } from '@angular/material';
import { BaseViewModel } from './base-view-model';
import { EllipsisMenuItem } from '../../shared/components/head-bar/head-bar.component';

export abstract class ListViewBaseComponent<V extends BaseViewModel> extends BaseComponent {
    /**
     * The data source for a table. Requires to be initialised with a BaseViewModel
     */
    public dataSource: MatTableDataSource<V>;

    /**
     * The table itself
     */
    @ViewChild(MatTable)
    protected table: MatTable<V>;

    /**
     * Table paginator
     */
    @ViewChild(MatPaginator)
    protected paginator: MatPaginator;

    /**
     * Sorter for a table
     */
    @ViewChild(MatSort)
    protected sort: MatSort;

    /**
     * Constructor for list view bases
     * @param titleService the title serivce
     * @param translate the translate service
     */
    public constructor(titleService: Title, translate: TranslateService) {
        super(titleService, translate);
    }

    /**
     * Children need to call this in their init-function.
     * Calling these three functions in the constructor of this class
     * would be too early, resulting in non-paginated tables
     */
    public initTable(): void {
        this.dataSource = new MatTableDataSource();
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    /**
     * handler function for clicking on items in the ellipsis menu.
     * Ellipsis menu comes from the HeadBarComponent is is implemented by most ListViews
     *
     * @param event clicked entry from ellipsis menu
     */
    public onEllipsisItem(item: EllipsisMenuItem): void {
        if (typeof this[item.action] === 'function') {
            this[item.action]();
        }
    }
}
