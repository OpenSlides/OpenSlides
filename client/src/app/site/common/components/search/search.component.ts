import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material';

import { Subject } from 'rxjs';
import { auditTime, debounceTime } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

import { DataStoreService } from 'app/core/core-services/data-store.service';
import { SearchService, SearchModel, SearchResult } from 'app/core/ui-services/search.service';
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
     * the search term
     */
    public query: string;

    /**
     * Holds the typed search query.
     */
    public quickSearchform: FormGroup;

    /**
     * The amout of search results.
     */
    public searchResultCount: number;

    /**
     * The search results for the ui
     */
    public searchResults: SearchResult[];

    /**
     * A list of models, that are registered to be searched. Used for
     * enable and disable these models.
     */
    public registeredModels: (SearchModelEnabled)[];

    /**
     * This subject is used for the quicksearch input. It is used to debounce the input.
     */
    private quickSearchSubject = new Subject<string>();

    /**
     * Inits the quickSearchForm, gets the registered models from the search service
     * and watches the data store for any changes to initiate a new search if models changes.
     *
     * @param title
     * @param translate
     * @param matSnackBar
     * @param DS DataStorService
     * @param activatedRoute determine the search term from the URL
     * @param router To change the query in the url
     * @param searchService For searching in the models
     */
    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private DS: DataStoreService,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private searchService: SearchService
    ) {
        super(title, translate, matSnackBar);
        this.quickSearchform = new FormGroup({ query: new FormControl([]) });

        this.registeredModels = this.searchService.getRegisteredModels().map(rm => ({ ...rm, enabled: true }));

        this.DS.changedOrDeletedObservable.pipe(auditTime(100)).subscribe(() => this.search());
        this.quickSearchSubject.pipe(debounceTime(250)).subscribe(query => this.search(query));
    }

    /**
     * Take the search query from the URL and does the initial search.
     */
    public ngOnInit(): void {
        super.setTitle('Search');
        this.query = this.activatedRoute.snapshot.queryParams.query;
        this.quickSearchform.get('query').setValue(this.query);
        this.search();
    }

    /**
     * Searches for the query in `this.query` or the query given.
     *
     * @param query optional, if given, `this.query` will be set to this value
     */
    public search(query?: string): void {
        if (query) {
            this.query = query;
        }
        if (!this.query) {
            return;
        }

        // Just search for enabled models.
        const collectionStrings = this.registeredModels.filter(rm => rm.enabled).map(rm => rm.collectionString);

        // Get all results
        this.searchResults = this.searchService.search(this.query, collectionStrings);

        // Because the results are per model, we need to accumulate the total number of all search results.
        this.searchResultCount = this.searchResults
            .map(sr => sr.models.length)
            .reduce((acc, current) => acc + current, 0);

        // Update the URL.
        this.router.navigate([], {
            relativeTo: this.activatedRoute,
            queryParams: { query: this.query },
            replaceUrl: true
        });
    }

    /**
     * Handler for the quick search input. Emits the typed value to the `quickSearchSubject`.
     */
    public quickSearch(): void {
        this.quickSearchSubject.next(this.quickSearchform.get('query').value);
    }

    /**
     * Toggles a model, if it should be used during the search. Initiates a new search afterwards.
     *
     * @param registeredModel The model to toggle
     */
    public toggleModel(registeredModel: SearchModelEnabled): void {
        registeredModel.enabled = !registeredModel.enabled;
        this.search();
    }
}
