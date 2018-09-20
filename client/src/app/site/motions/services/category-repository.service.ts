import { Injectable } from '@angular/core';
import { Category } from '../../../shared/models/motions/category';
import { ViewCategory } from '../models/view-category';
import { DataSendService } from '../../../core/services/data-send.service';
import { Observable } from 'rxjs';
import { DataStoreService } from '../../../core/services/data-store.service';
import { BaseRepository } from '../../base/base-repository';

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
    public constructor(protected DS: DataStoreService, private dataSend: DataSendService) {
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
            return this.dataSend.saveModel(viewCategory.category);
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
        return this.dataSend.saveModel(updateCategory);
    }

    public delete(viewCategory: ViewCategory): Observable<any> {
        const category = viewCategory.category;
        return this.dataSend.delete(category);
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
}
