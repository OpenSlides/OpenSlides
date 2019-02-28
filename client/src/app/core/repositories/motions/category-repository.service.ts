import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { BaseRepository } from '../base-repository';
import { Category } from 'app/shared/models/motions/category';
import { CollectionStringMapperService } from '../../core-services/collectionStringMapper.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { DataSendService } from '../../core-services/data-send.service';
import { DataStoreService } from '../../core-services/data-store.service';
import { HttpService } from '../../core-services/http.service';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { ViewCategory } from 'app/site/motions/models/view-category';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';

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
        protected DS: DataStoreService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        private dataSend: DataSendService,
        private httpService: HttpService,
        private configService: ConfigService,
        private translate: TranslateService
    ) {
        super(DS, mapperService, viewModelStoreService, Category);
    }

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Categories' : 'Category');
    };

    protected createViewModel(category: Category): ViewCategory {
        const viewCategory = new ViewCategory(category);
        viewCategory.getVerboseName = this.getVerboseName;
        return viewCategory;
    }

    public async create(newCategory: Category): Promise<Identifiable> {
        return await this.dataSend.createModel(newCategory);
    }

    public async update(category: Partial<Category>, viewCategory: ViewCategory): Promise<void> {
        let updateCategory: Category;
        if (viewCategory) {
            updateCategory = viewCategory.category;
        } else {
            updateCategory = new Category();
        }
        updateCategory.patchValues(category);
        await this.dataSend.updateModel(updateCategory);
    }

    public async delete(viewCategory: ViewCategory): Promise<void> {
        const category = viewCategory.category;
        await this.dataSend.deleteModel(category);
    }

    /**
     * Returns the category for the ID
     * @param category_id category ID
     */
    public getCategoryByID(category_id: number): Category {
        const catList = this.DS.getAll(Category);
        return catList.find(category => category.id === category_id);
    }

    /**
     * Updates a categories numbering.
     * @param category the category it should be updated in
     * @param motionList the list of motions on this category
     */
    public async numberMotionsInCategory(category: Category, motionIds: number[]): Promise<void> {
        const collectionString = 'rest/motions/category/' + category.id + '/numbering/';
        await this.httpService.post(collectionString, { motions: motionIds });
    }

    /**
     * @ returns the observable for categories sorted according to configuration
     */
    public getSortedViewModelListObservable(): Observable<ViewCategory[]> {
        const subject = new BehaviorSubject<ViewCategory[]>([]);
        this.getViewModelListObservable().subscribe(categories => {
            subject.next(this.sortViewCategoriesByConfig(categories));
        });
        return subject.asObservable();
    }

    /**
     * Sort viewCategories by the configured settings
     *
     * @param categories
     * @returns the categories sorted by prefix or name, according to the config setting
     *
     * TODO: That operation is HEAVY
     */
    public sortViewCategoriesByConfig(categories: ViewCategory[]): ViewCategory[] {
        const sort = this.configService.instant<'prefix' | 'name'>('motions_category_sorting') || 'prefix';
        return categories.sort((a, b) => {
            if (a[sort] && b[sort]) {
                return a[sort].localeCompare(b[sort], this.translate.currentLang);
            } else if (sort === 'prefix') {
                if (a.prefix) {
                    return 1;
                } else if (b.prefix) {
                    return -1;
                } else {
                    return a.name.localeCompare(b.name);
                }
            }
        });
    }
}
