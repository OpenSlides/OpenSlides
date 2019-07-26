import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { auditTime, debounceTime } from 'rxjs/operators';

import { DataStoreService } from 'app/core/core-services/data-store.service';
import { SearchModel, SearchResult, SearchService } from 'app/core/ui-services/search.service';
import { BaseViewComponent } from '../../../base/base-view';

type SearchModelEnabled = SearchModel & { enabled: boolean };

/**
 * Component for the full search text.
 */
@Component({
    selector: 'os-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.scss']
})
export class SearchComponent extends BaseViewComponent implements OnInit {
    /**
     * List with all options for sorting by.
     */
    public sortingOptionsList = [{ option: 'title', label: 'Title' }, { option: 'id', label: 'ID' }];

    /**
     * the search term
     */
    public query = '';

    /**
     * The amout of search results.
     */
    public searchResultCount: number;

    /**
     * The search results for the ui
     */
    public searchResults: SearchResult[] = [];

    /**
     * A list of models, that are registered to be searched. Used for
     * enable and disable these models.
     */
    public registeredModels: (SearchModelEnabled)[];

    /**
     * Property to decide what to sort by.
     */
    public sortingProperty: 'id' | 'title' = 'title';

    /**
     * Form-control for the input-field.
     */
    public searchForm = new FormControl('');

    /**
     * Inits the quickSearchForm, gets the registered models from the search service
     * and watches the data store for any changes to initiate a new search if models changes.
     *
     * @param title
     * @param translate
     * @param matSnackBar
     * @param DS DataStorService
     * @param searchService For searching in the models
     */
    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private DS: DataStoreService,
        private searchService: SearchService
    ) {
        super(title, translate, matSnackBar);

        this.registeredModels = this.searchService.getRegisteredModels().map(rm => ({ ...rm, enabled: true }));

        this.DS.modifiedObservable.pipe(auditTime(100)).subscribe(() => this.search());
        this.searchForm.valueChanges.pipe(debounceTime(250)).subscribe(query => {
            this.query = query;
            this.search();
        });
    }

    /**
     * Take the search query from the URL and does the initial search.
     */
    public ngOnInit(): void {
        super.setTitle('Search');
    }

    /**
     * Searches for the query in `this.query` or the query given.
     */
    public search(): void {
        if (!this.query || this.query === '') {
            this.searchResults = [];
        } else {
            // Just search for enabled models.
            const collectionStrings = this.registeredModels.filter(rm => rm.enabled).map(rm => rm.collectionString);

            // Get all results
            this.searchResults = this.searchService.search(this.query, collectionStrings, this.sortingProperty);

            // Because the results are per model, we need to accumulate the total number of all search results.
            this.searchResultCount = this.searchResults
                .map(sr => sr.models.length)
                .reduce((acc, current) => acc + current, 0);
        }
    }

    /**
     * Toggles a model, if it should be used during the search. Initiates a new search afterwards.
     *
     * @param registeredModel The model to toggle
     */
    public toggleModel(event: MouseEvent, registeredModel: SearchModelEnabled): void {
        event.stopPropagation();
        registeredModel.enabled = !registeredModel.enabled;
        this.search();
    }

    /**
     * Function to switch between sorting-options.
     *
     * @param event The `MouseEvent`
     * @param option The sorting-option
     */
    public toggleSorting(event: MouseEvent, option: 'id' | 'title'): void {
        event.stopPropagation();
        this.sortingProperty = option;
        this.search();
    }
}
