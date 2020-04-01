import { Component, HostListener, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { auditTime, debounceTime } from 'rxjs/operators';

import { DataStoreService } from 'app/core/core-services/data-store.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { SearchModel, SearchResult, SearchService, TranslatedCollection } from 'app/core/ui-services/search.service';
import { ViewportService } from 'app/core/ui-services/viewport.service';
import { BaseViewModel } from 'app/site/base/base-view-model';
import { Searchable } from 'app/site/base/searchable';
import { ViewMediafile } from 'app/site/mediafiles/models/view-mediafile';

@Component({
    selector: 'os-super-search',
    templateUrl: './super-search.component.html',
    styleUrls: ['./super-search.component.scss']
})
export class SuperSearchComponent implements OnInit {
    /**
     * The reference to the form-control used for the `rounded-input.component`.
     */
    public searchForm = new FormControl('');

    /**
     * The user's input as query: `string`.
     */
    public searchString = '';

    /**
     * Variable to hold the verbose name of a specific collection.
     */
    public searchCollection = '';

    /**
     * Holds the collection-string of the specific collection.
     *
     * Is set, if the user has entered a collection.
     */
    public specificCollectionString: string = null;

    /**
     * Holds the input text the user entered to search for a specific id.
     */
    public searchStringForId: string = null;

    /**
     * The specific id the user searches for.
     */
    private specificId: number = null;

    /**
     * The results for the given query.
     *
     * An array of `SearchResult`.
     */
    public searchResults: SearchResult[] = [];

    /**
     * Number of all found results.
     */
    public searchResultCount = 0;

    /**
     * The model, the user selected to see its preview.
     */
    public selectedModel: (BaseViewModel & Searchable) | null = null;

    /**
     * The current collection of the selected model.
     */
    public selectedCollection: string;

    /**
     * Boolean to indicate, if the preview should be shown.
     */
    public showPreview = false;

    /**
     * All registered model-collections.
     */
    public registeredModels: SearchModel[];

    /**
     * Stores all the collectionStrings registered by the `search.service`.
     */
    private collectionStrings: string[];

    /**
     * Stores all the collections with translated names.
     */
    private translatedCollectionStrings: TranslatedCollection[];

    /**
     * Key to store the query in the local-storage.
     */
    private storageKey = 'SuperSearchQuery';

    /**
     * Constructor
     *
     * @param vp The viewport-service.
     * @param overlayService Service to handle the overlaying background.
     * @param searchService Service required for searching events.
     * @param DS Reference to the `DataStore`.
     * @param router Reference to the `Router`.
     * @param store The reference to the storage-service.
     * @param dialogRef Reference for the material-dialog.
     */
    public constructor(
        public vp: ViewportService,
        private searchService: SearchService,
        private DS: DataStoreService,
        private router: Router,
        private store: StorageService,
        public dialogRef: MatDialogRef<SuperSearchComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {}

    /**
     * OnInit-function.
     *
     * Initializes the collections and the translated ones.
     */
    public ngOnInit(): void {
        this.DS.modifiedObservable.pipe(auditTime(100)).subscribe(() => this.search());

        this.registeredModels = this.searchService.getRegisteredModels();
        this.collectionStrings = this.registeredModels.map(rm => rm.collectionString);
        this.translatedCollectionStrings = this.searchService.getTranslatedCollectionStrings();

        this.searchForm.valueChanges.pipe(debounceTime(250)).subscribe((value: string) => {
            if (value.trim() === '') {
                this.clearResults();
            } else {
                this.prepareForSearch(value.trim());
            }
            this.search();
        });

        this.restoreQueryFromStorage();
    }

    /**
     * The main function to search through all collections.
     */
    private search(): void {
        if (this.searchString !== '' || this.specificCollectionString) {
            this.searchResults = this.searchService.search(
                this.searchString,
                this.specificCollectionString ? [this.specificCollectionString] : this.collectionStrings,
                this.specificId,
                !!this.searchStringForId
            );
            this.selectFirstResult();
        } else {
            this.searchResults = [];
        }
        this.searchResultCount = this.searchResults
            .map(result => result.models.length)
            .reduce((acc, current) => acc + current, 0);
    }

    /**
     * Function to check several things.
     *
     * First the query is splitted and the first part is tested
     * for a specific collection.
     *
     * Second the next part is tested for a specific id.
     * It's looking for the word `id` or any kind of `nr.`
     * and a number.
     *
     * @param query The user's input, he searches for.
     */
    private prepareForSearch(query: string): void {
        // The query is splitted by the first ':' - max. two hits.
        const splittedQuery = this.splitQuery(query);

        this.specificCollectionString = this.searchSpecificCollection(splittedQuery[0]);
        if (this.specificCollectionString) {
            this.searchCollection = splittedQuery.shift();
        }

        this.searchStringForId = this.searchSpecificId(splittedQuery[0]) ? splittedQuery.shift() : null;

        // This test, whether the query includes a number --> Then get this number.
        if (/\b\d+\b/g.test(splittedQuery[0])) {
            this.specificId = +query.match(/\d+/g);
        }

        // The rest will be joined to one string.
        this.searchString = splittedQuery.join(' ');
    }

    /**
     * Method to check, if the query contains a ':'.
     * If so, this is the separator - otherwise the query will be splitted by any whitespace.
     *
     * @param query The query as string.
     *
     * @returns An array of strings - the query splitted into single words.
     */
    private splitQuery(query: string): string[] {
        let splittedQuery: string[] = [];
        if (query.includes(':')) {
            splittedQuery = query.split(':', 2);
            splittedQuery.push(
                // Get the second part of the query and split it into single words.
                ...splittedQuery.pop().trim().split(/\s/g)
            );
        } else {
            splittedQuery = query.split(/\s/g);
        }
        return splittedQuery;
    }

    /**
     * This function test, if the query matches some of the `collectionStrings`.
     *
     * That indicates, that the user looks for items in a specific collection.
     *
     * @returns { string | null } Either an object containing the found collection and the query
     * or null, if there exists none.
     */
    private searchSpecificCollection(query: string): string | null {
        const nextCollection = this.translatedCollectionStrings.find(item =>
            // The value of the item should match the query plus any further
            // characters (useful for splitted words in the query).
            // This will look, if the user searches in a specific collection.
            // Flag 'i' tells, that cases are ignored.
            new RegExp(`\\b${query}\\b`, 'i').test(item.value)
        );
        return !!nextCollection ? nextCollection.collection : null;
    }

    /**
     * Function to see, whether a string matches the word `id` or any kind of `nr`.
     *
     * @param query The query, which is tested for the word `id` or `nr`.
     *
     * @returns {boolean} If the given string matches any kind of the test-string.
     */
    private searchSpecificId(query: string = ''): boolean {
        // Looks, if the query matches variations of 'nr.' or 'id'
        // If so, the user searches for a specific id in some collections.
        // Everything not case-sensitive.
        return !!(query.match(/\bn\w*r\.?\:?\b/gi) || query.match(/\bid\.?\:?\b/gi));
    }

    /**
     * Function to search through the result-list and select the first valid result to display.
     *
     * Otherwise the model is set to 'null'.
     */
    private selectFirstResult(): void {
        for (const result of this.searchResults) {
            if (result.models.length > 0) {
                this.changeModel(result.models[0]);
                return;
            }
        }
        // If this code is reached, there are no results for the query!
        this.selectedModel = null;
    }

    /**
     * Function to go through the whole list of results.
     *
     * @param up If the user presses the `ArrowUp`.
     */
    private selectNextResult(up: boolean): void {
        const tmp = this.searchResults.flatMap((result: SearchResult) => result.models);
        this.changeModel(tmp[(tmp.indexOf(this.selectedModel) + (up ? -1 : 1)).modulo(tmp.length)]);

        this.scrollToSelected();
    }

    /**
     * Function to scroll with the current selected model, if the user uses the keyboard to navigate.
     */
    private scrollToSelected(): void {
        const selectedElement = document.getElementsByClassName('selected')[0];
        selectedElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }

    /**
     * Function to set a specific collection and search through it.
     *
     * @param collectionName The `verboseName` of the selected collection.
     */
    public setCollection(collectionName: string): void {
        this.searchCollection =
            this.searchCollection.toLowerCase() === collectionName.toLowerCase() ? '' : collectionName;
        this.setSearch();
    }

    /**
     * This function sets the string for id or clears the variable, if already existing.
     */
    public setSearchStringForId(): void {
        this.searchStringForId = !!this.searchStringForId ? null : 'id';
        this.setSearch();
    }

    /**
     * This function puts the various strings together.
     */
    private setSearch(): void {
        this.searchForm.setValue(
            [this.searchCollection, this.searchStringForId].map(value => (value ? value + ': ' : '')).join('') +
                this.searchString
        );
    }

    /**
     * Function to change the selected model.
     *
     * Ensures, that the preview-window's size is reset to the default one.
     *
     * @param model The model, the user selected. Typeof `BaseViewModel & Searchable`.
     */
    public changeModel(model: BaseViewModel & Searchable): void {
        this.selectedModel = model;
        this.selectedCollection = model.collectionString;
    }

    /**
     * Function to go to the detailed view of the model.
     *
     * @param model The model, the user selected.
     */
    public viewResult(model: BaseViewModel & Searchable): void {
        if (model.collectionString === 'mediafiles/mediafile' && !(<ViewMediafile>model).is_directory) {
            window.open(model.getDetailStateURL(), '_blank');
        } else {
            this.router.navigateByUrl(model.getDetailStateURL());
        }
        this.hideOverlay();
        this.saveQueryToStorage(this.searchForm.value);
    }

    /**
     * Hides the overlay, so the search will disappear.
     */
    public hideOverlay(): void {
        this.clearResults();
        this.dialogRef.close();
    }

    /**
     * Clears the whole search with results and preview.
     */
    private clearResults(): void {
        this.searchResults = [];
        this.selectedModel = null;
        this.searchCollection = '';
        this.specificCollectionString = null;
        this.searchString = '';
        this.searchStringForId = null;
        this.specificId = null;
        this.saveQueryToStorage(null);
    }

    /**
     * Function to save an entered query.
     *
     * @param query The query to store.
     */
    private saveQueryToStorage(query: string | null): void {
        this.store.set(this.storageKey, query);
    }

    /**
     * Function to restore a previous entered query.
     * Once loaded, the result is passed as value to the form-control.
     */
    private restoreQueryFromStorage(): void {
        this.store.get<string>(this.storageKey).then(value => {
            if (value) {
                this.searchForm.setValue(value);
            }
        }, null);
    }

    /**
     * Function to open the global `super-search.component`.
     *
     * @param event KeyboardEvent to listen to keyboard-inputs.
     */
    @HostListener('document:keydown', ['$event']) public onKeyNavigation(event: KeyboardEvent): void {
        if (event.ctrlKey && event.key === 'f') {
            event.preventDefault();
            event.stopPropagation();
        }
        if (this.selectedModel) {
            if (event.key === 'Enter') {
                this.viewResult(this.selectedModel);
            }
            if (event.key === 'ArrowUp') {
                this.selectNextResult(true);
            }
            if (event.key === 'ArrowDown') {
                this.selectNextResult(false);
            }
        }
        if (event.altKey && event.shiftKey && event.key === 'V') {
            this.showPreview = !this.showPreview;
        }
    }
}
