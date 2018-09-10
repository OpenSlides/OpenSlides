import { Component, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { MatSort, MatTable, MatTableDataSource } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

import { BaseComponent } from '../../../base.component';
import { Category } from '../../../shared/models/motions/category';

/**
 * List view for the categories.
 *
 * TODO: Creation of new Categories
 */
@Component({
    selector: 'os-category-list',
    templateUrl: './category-list.component.html',
    styleUrls: ['./category-list.component.scss']
})
export class CategoryListComponent extends BaseComponent implements OnInit {
    /**
     * Store the categories
     */
    public categoryArray: Array<Category>;

    /**
     * Will be processed by the mat-table
     */
    public dataSource: MatTableDataSource<Category>;

    /**
     * The table itself.
     */
    @ViewChild(MatTable) public table: MatTable<Category>;

    /**
     * Sort the Table
     */
    @ViewChild(MatSort) public sort: MatSort;

    /**
     * The usual component constructor
     * @param titleService
     * @param translate
     */
    public constructor(protected titleService: Title, protected translate: TranslateService) {
        super(titleService, translate);
    }

    /**
     * Init function.
     *
     * Sets the title and gets/observes categories from DataStore
     */
    public ngOnInit(): void {
        super.setTitle('Category');
        this.categoryArray = this.DS.getAll(Category);
        this.dataSource = new MatTableDataSource(this.categoryArray);
        this.dataSource.sort = this.sort;

        // Observe DataStore for motions. Initially, executes once for every motion.
        // The alternative approach is to put the observable as DataSource to the table
        this.DS.changeObservable.subscribe(newModel => {
            if (newModel instanceof Category) {
                this.categoryArray = this.DS.getAll(Category);
                this.dataSource.data = this.categoryArray;
            }
        });
    }

    /**
     * Add a new Category.
     *
     * TODO: Not yet implemented
     */
    public onPlusButton(): void {
        console.log('Add New Category');
    }
}
