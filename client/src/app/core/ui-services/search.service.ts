import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { BaseViewModel } from 'app/site/base/base-view-model';
import { BaseRepository } from '../repositories/base-repository';
import { Searchable } from '../../site/base/searchable';
import { ViewModelStoreService } from '../core-services/view-model-store.service';

/**
 * Defines, how the properties look like
 */
export interface SearchProperty {
    /**
     * A string, that contains the specific value.
     */
    key: string | null;

    /**
     * The value of the property as string.
     */
    value: string | null;

    /**
     * If some properties should be grouped into one card (for the preview),
     * they can be unified to `blockProperties`.
     */
    blockProperties?: SearchProperty[];

    /**
     * A flag to specify, if a value could be rendered `innerHTML`.
     */
    trusted?: boolean;
}

/**
 * SearchRepresentation the system looks by.
 */
export interface SearchRepresentation {
    /**
     * The representation every searchable model should use to represent their data.
     */
    searchValue: string[];

    /**
     * The properties the representation contains.
     */
    properties: SearchProperty[];

    /**
     * An optional type. This is useful for mediafiles to decide which type they have.
     */
    type?: string;
}

/**
 * Our representation of a searchable model for external use.
 */
export interface SearchModel {
    /**
     * The collection string.
     */
    collectionString: string;

    /**
     * The singular verbose name of the model.
     */
    verboseNameSingular: string;

    /**
     * The plural verbose name of the model.
     */
    verboseNamePlural: string;

    /**
     * Whether to open the detail page in a new tab.
     */
    openInNewTab: boolean;
}

/**
 * A search result has the model's collectionstring, a verbose name and the actual models.
 */
export interface SearchResult {
    /**
     * The collection string.
     */
    collectionString: string;

    /**
     * This verboseName must have the right cardianlity. If there is exactly one model in `models`,
     * it should have a singular value, else a plural name.
     */
    verboseName: string;

    /**
     * Whether to open the detail page in a new tab.
     */
    openInNewTab: boolean;

    /**
     * All matched models sorted by their title.
     */
    models: (BaseViewModel & Searchable)[];
}

/**
 * Interface, that describes a pair of a (translated) value and a relating collection.
 */
export interface TranslatedCollection {
    /**
     * The value
     */
    value: string;

    /**
     * The collectionString, the value relates to.
     */
    collection: string;
}

/**
 * This service cares about searching the DataStore and managing models, that are searchable.
 */
@Injectable({
    providedIn: 'root'
})
export class SearchService {
    /**
     * All searchable models in our own representation.
     */
    private searchModels: {
        collectionString: string;
        verboseNameSingular: string;
        verboseNamePlural: string;
        displayOrder: number;
        openInNewTab: boolean;
    }[] = [];

    /**
     * For sorting the results.
     */
    private languageCollator: Intl.Collator;

    /**
     * @param viewModelStore The store to search in.
     */
    public constructor(private viewModelStore: ViewModelStoreService, private translate: TranslateService) {
        this.languageCollator = new Intl.Collator(this.translate.currentLang);
        this.translate.onLangChange.subscribe(params => {
            this.languageCollator = new Intl.Collator(params.lang);
        });
    }

    /**
     * Registers a model by the given attributes.
     *
     * @param collectionString The colelction string of the model
     * @param ctor The model constructor
     * @param displayOrder The order in which the elements should be displayed.
     */
    public registerModel(
        collectionString: string,
        repo: BaseRepository<any, any, any>,
        displayOrder: number,
        openInNewTab: boolean = false
    ): void {
        this.searchModels.push({
            collectionString: collectionString,
            verboseNameSingular: repo.getVerboseName(),
            verboseNamePlural: repo.getVerboseName(true),
            displayOrder: displayOrder,
            openInNewTab: openInNewTab
        });
        this.searchModels.sort((a, b) => a.displayOrder - b.displayOrder);
    }

    /**
     * @returns all registered models for the UI.
     */
    public getRegisteredModels(): SearchModel[] {
        return this.searchModels.map(searchModel => ({
            collectionString: searchModel.collectionString,
            verboseNameSingular: searchModel.verboseNameSingular,
            verboseNamePlural: searchModel.verboseNamePlural,
            openInNewTab: searchModel.openInNewTab
        }));
    }

    /**
     * Does the actual searching.
     *
     * @param query The search query
     * @param inCollectionStrings All connection strings which should be used for searching.
     * @param dedicatedId Optional parameter. Useful to look for a specific id in the given collectionStrings.
     * @param searchOnlyById Optional parameter. Decides, whether all models should only be filtered by their id.
     *
     * @returns All search results sorted by the model's title (via `getTitle()`).
     */
    public search(
        query: string,
        inCollectionStrings: string[],
        dedicatedId?: number,
        searchOnlyById: boolean = false
    ): SearchResult[] {
        query = query.toLowerCase();
        return this.searchModels
            .filter(s => inCollectionStrings.indexOf(s.collectionString) !== -1)
            .map(searchModel => {
                const results = this.viewModelStore
                    .getAll(searchModel.collectionString)
                    .map(x => x as BaseViewModel & Searchable)
                    .filter(model =>
                        !searchOnlyById
                            ? model.id === dedicatedId ||
                              model
                                  .formatForSearch()
                                  .searchValue.some(text => text && text.toLowerCase().indexOf(query) !== -1)
                            : model.id === dedicatedId
                    )
                    .sort((a, b) => this.languageCollator.compare(a.getTitle(), b.getTitle()));

                return {
                    collectionString: searchModel.collectionString,
                    verboseName: results.length === 1 ? searchModel.verboseNameSingular : searchModel.verboseNamePlural,
                    openInNewTab: searchModel.openInNewTab,
                    models: results
                };
            });
    }

    /**
     * Splits the given collections and translates the single values.
     *
     * @param collections All the collections, that should be translated.
     *
     * @returns {Array} An array containing the single values of the collections and the translated ones.
     * These values point to the `collectionString` the user can search for.
     */
    public getTranslatedCollectionStrings(): TranslatedCollection[] {
        const nextCollections: TranslatedCollection[] = this.searchModels.flatMap((model: SearchModel) => [
            { value: model.verboseNamePlural, collection: model.collectionString },
            { value: model.verboseNameSingular, collection: model.collectionString }
        ]);
        const tmpCollections = [...nextCollections];
        for (const entry of tmpCollections) {
            const translatedValue = this.translate.instant(entry.value);
            if (!nextCollections.find(item => item.value === translatedValue)) {
                nextCollections.push({ value: translatedValue, collection: entry.collection });
            }
        }
        const sequentialNumber = 'Sequential number';
        nextCollections.push(
            { value: sequentialNumber, collection: 'motions/motion' },
            { value: this.translate.instant(sequentialNumber), collection: 'motions/motion' }
        );
        return nextCollections;
    }
}
