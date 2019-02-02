import { Injectable } from '@angular/core';

import { Category } from 'app/shared/models/motions/category';
import { ViewCategory } from 'app/site/motions/models/view-category';
import { DataSendService } from '../../core-services/data-send.service';
import { DataStoreService } from '../../core-services/data-store.service';
import { BaseRepository } from '../base-repository';
import { Motion } from 'app/shared/models/motions/motion';
import { HttpService } from '../../core-services/http.service';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { CollectionStringMapperService } from '../../core-services/collectionStringMapper.service';

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
     */
    public constructor(
        protected DS: DataStoreService,
        mapperService: CollectionStringMapperService,
        private dataSend: DataSendService,
        private httpService: HttpService
    ) {
        super(DS, mapperService, Category);
    }

    protected createViewModel(category: Category): ViewCategory {
        return new ViewCategory(category);
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
     * Returns all motions belonging to a category
     * @param category category
     */
    public getMotionsOfCategory(category: Category): Motion[] {
        const motList = this.DS.getAll(Motion);
        const retList: Array<Motion> = [];
        motList.forEach(motion => {
            if (motion.category_id && motion.category_id === category.id) {
                retList.push(motion);
            }
        });
        // TODO: Sorting the return List?!
        return retList;
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
}
