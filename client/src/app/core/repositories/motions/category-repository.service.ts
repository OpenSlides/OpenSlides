import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { RelationManagerService } from 'app/core/core-services/relation-manager.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { RelationDefinition } from 'app/core/definitions/relations';
import { TreeIdNode } from 'app/core/ui-services/tree.service';
import { Category } from 'app/shared/models/motions/category';
import { CategoryTitleInformation, ViewCategory } from 'app/site/motions/models/view-category';
import { ViewMotion } from 'app/site/motions/models/view-motion';
import { BaseRepository } from '../base-repository';
import { CollectionStringMapperService } from '../../core-services/collection-string-mapper.service';
import { DataSendService } from '../../core-services/data-send.service';
import { DataStoreService } from '../../core-services/data-store.service';
import { HttpService } from '../../core-services/http.service';

const CategoryRelations: RelationDefinition[] = [
    {
        type: 'M2O',
        ownIdKey: 'parent_id',
        ownKey: 'parent',
        foreignViewModel: ViewCategory
    },
    {
        type: 'O2M',
        foreignIdKey: 'category_id',
        ownKey: 'motions',
        foreignViewModel: ViewMotion,
        order: 'category_weight'
    },
    {
        type: 'O2M',
        foreignIdKey: 'parent_id',
        ownKey: 'children',
        foreignViewModel: ViewCategory,
        order: 'weight'
    }
];

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
export class CategoryRepositoryService extends BaseRepository<ViewCategory, Category, CategoryTitleInformation> {
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
        relationManager: RelationManagerService,
        private httpService: HttpService
    ) {
        super(
            DS,
            dataSend,
            mapperService,
            viewModelStoreService,
            translate,
            relationManager,
            Category,
            CategoryRelations
        );

        this.setSortFunction((a, b) => a.weight - b.weight);
    }

    public getTitle = (titleInformation: CategoryTitleInformation) => {
        return titleInformation.prefix
            ? titleInformation.prefix + ' - ' + titleInformation.name
            : titleInformation.name;
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Categories' : 'Category');
    };

    /**
     * Updates a categories numbering.
     *
     * @param category the category it should be updated in
     */
    public async numberMotionsInCategory(category: ViewCategory): Promise<void> {
        await this.httpService.post(`/rest/motions/category/${category.id}/numbering/`);
    }

    /**
     * Updates the sorting of motions in a category.
     *
     * @param category the category it should be updated in
     * @param motionIds the list of motion ids on this category
     */
    public async sortMotionsInCategory(category: Category, motionIds: number[]): Promise<void> {
        await this.httpService.post(`/rest/motions/category/${category.id}/sort_motions/`, { motions: motionIds });
    }

    /**
     * Sends the changed nodes to the server.
     *
     * @param data The reordered data from the sorting
     */
    public async sortCategories(data: TreeIdNode[]): Promise<void> {
        await this.httpService.post('/rest/motions/category/sort_categories/', data);
    }
}
