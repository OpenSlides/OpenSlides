import { ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { MatTableDataSource, MatTable, MatSort, MatPaginator, MatSnackBar } from '@angular/material';
import { BaseViewModel } from './base-view-model';
import { BaseViewComponent } from './base-view';

export abstract class ListViewBaseComponent<V extends BaseViewModel> extends BaseViewComponent {
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
     * @param matSnackBar
     */
    public constructor(titleService: Title, translate: TranslateService, matSnackBar: MatSnackBar) {
        super(titleService, translate, matSnackBar);
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
}
