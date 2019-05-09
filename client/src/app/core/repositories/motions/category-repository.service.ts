import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { BaseRepository } from '../base-repository';
import { Category } from 'app/shared/models/motions/category';
import { CollectionStringMapperService } from '../../core-services/collection-string-mapper.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { DataSendService } from '../../core-services/data-send.service';
import { DataStoreService } from '../../core-services/data-store.service';
import { HttpService } from '../../core-services/http.service';
import { ViewCategory } from 'app/site/motions/models/view-category';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';

type SortProperty = 'prefix' | 'name';

/**
 * Repository Services for Categories
 *
 * The repository is meant to process domain objects (those found under
 * shared/models), so components can display them and interact with them.
 *
 * Rather than manipulating models directly, the repository is meant to
 * inform the {@link DataSendService} about changes which will send
 * them to the Server.
 */
@Injectable({
    providedIn: 'root'
})
export class CategoryRepositoryService extends BaseRepository<ViewCategory, Category> {
    private sortProperty: SortProperty;

    /**
     * Creates a CategoryRepository
     * Converts existing and incoming category to ViewCategories
     * Handles CRUD using an observer to the DataStore
     *
     * @param DS The DataStore
     * @param mapperService Maps collection strings to classes
     * @param dataSend sending changed objects
     * @param httpService OpenSlides own HTTP service
     * @param configService to get the default sorting
     * @param translate translationService to get the currently selected locale
     */
    public constructor(
        DS: DataStoreService,
        dataSend: DataSendService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        translate: TranslateService,
        private httpService: HttpService,
        private configService: ConfigService
    ) {
        super(DS, dataSend, mapperService, viewModelStoreService, translate, Category);

        this.sortProperty = this.configService.instant('motions_category_sorting');
        this.configService.get<SortProperty>('motions_category_sorting').subscribe(conf => {
            this.sortProperty = conf;
            this.setConfigSortFn();
        });
    }

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Categories' : 'Category');
    };

    protected createViewModel(category: Category): ViewCategory {
        const viewCategory = new ViewCategory(category);
        viewCategory.getVerboseName = this.getVerboseName;
        return viewCategory;
    }

    /**
     * Updates a categories numbering.
     *
     * @param category the category it should be updated in
     * @param motionIds the list of motion ids on this category
     */
    public async numberMotionsInCategory(category: Category, motionIds: number[]): Promise<void> {
        await this.httpService.post(`/rest/motions/category/${category.id}/numbering/`, { motions: motionIds });
    }

    /**
     * Updates the sorting of motions in a category.
     *
     * @param category the category it should be updated in
     * @param motionIds the list of motion ids on this category
     */
    public async sortMotionsInCategory(category: Category, motionIds: number[]): Promise<void> {
        await this.httpService.post(`/rest/motions/category/${category.id}/sort/`, { motions: motionIds });
    }

    /**
     * Triggers an update for the sort function responsible for the default sorting of data items
     */
    public setConfigSortFn(): void {
        this.setSortFunction((a: ViewCategory, b: ViewCategory) => {
            if (a[this.sortProperty] && b[this.sortProperty]) {
                return this.languageCollator.compare(a[this.sortProperty], b[this.sortProperty]);
            } else if (this.sortProperty === 'prefix') {
                if (a.prefix) {
                    return 1;
                } else if (b.prefix) {
                    return -1;
                } else {
                    return this.languageCollator.compare(a.name, b.name);
                }
            }
        });
    }
}
