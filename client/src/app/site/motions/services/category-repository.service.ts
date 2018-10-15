import { Injectable } from '@angular/core';
import { Category } from '../../../shared/models/motions/category';
import { ViewCategory } from '../models/view-category';
import { DataSendService } from '../../../core/services/data-send.service';
import { Observable } from 'rxjs';
import { DataStoreService } from '../../../core/services/data-store.service';
import { BaseRepository } from '../../base/base-repository';
import { Motion } from '../../../shared/models/motions/motion';
import { CategoryNumbering } from '../models/category-numbering';
import { HttpService, HTTPMethod } from '../../../core/services/http.service';
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
     * @param DataSend
     */
    public constructor(
        protected DS: DataStoreService,
        private dataSend: DataSendService,
        private httpService: HttpService
    ) {
        super(DS, Category);
    }

    protected createViewModel(category: Category): ViewCategory {
        return new ViewCategory(category);
    }

    public create(update: Category, viewCategory?: ViewCategory): Observable<any> {
        console.log('update: ', update);
        console.log('viewCategory: ', viewCategory);
        if (this.osInDataStore(viewCategory)) {
            return this.update(update, viewCategory);
        } else {
            return this.dataSend.createModel(viewCategory.category);
        }
    }

    public update(update: Category, viewCategory?: ViewCategory): Observable<any> {
        let updateCategory: Category;
        if (viewCategory) {
            updateCategory = viewCategory.category;
        } else {
            updateCategory = new Category();
        }
        updateCategory.patchValues(update);
        return this.dataSend.updateModel(updateCategory, HTTPMethod.PUT);
    }

    public delete(viewCategory: ViewCategory): Observable<any> {
        const category = viewCategory.category;
        return this.dataSend.deleteModel(category);
    }

    /**
     * Returns all Motions belonging to a category
     * @param category category
     */
    public getMotionsOfCategory(category: Category): Array<Motion> {
        const motList = this.DS.getAll(Motion);
        const retList: Array<Motion> = [];
        motList.forEach(motion => {
            if (motion.category_id === category.id) {
                retList.push(motion);
            }
        });
        // TODO: Sorting the return List?!
        return retList;
    }

    /**
     * Checks if a Catagory is on the server already
     * @param viewCategory the category to check if it is already on the server
     */
    public osInDataStore(viewCategory: ViewCategory): boolean {
        const serverCategoryArray = this.DS.getAll(Category);
        if (serverCategoryArray.find(cat => cat.id === viewCategory.id)) {
            return true;
        }
        return false;
    }

    /**
     * Returns the category for the ID
     * @param category_id category ID
     */
    public getCategoryByID(category_id: number): Category {
        const catList = this.DS.getAll(Category);
        catList.forEach(category => {
            if (category.id === category_id) {
                return category;
            }
        });
        return null;
    }

    /**
     * Updates a Categorys numbering
     * @param category the category it should be updated in
     * @param motionList the list of motions on this category
     */
    public updateCategoryNumbering(category: Category, motionList: Motion[]): Observable<object> {
        const categoryNumbering = new CategoryNumbering();
        categoryNumbering.setMotions(motionList);
        return this.sentCategoryNumbering(category, categoryNumbering);
    }

    /**
     * Save category in the server
     *
     * @return Observable from
     */
    protected sentCategoryNumbering(category: Category, categoryNumbering: CategoryNumbering): Observable<object> {
        const collectionString = 'rest/motions/category/' + category.id + '/numbering/';
        return this.httpService.create(collectionString, categoryNumbering);
    }
}
