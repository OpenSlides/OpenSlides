import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { auditTime } from 'rxjs/operators';

import { Collection } from 'app/shared/models/base/collection';
import { BaseModel, ModelConstructor } from '../../shared/models/base/base-model';
import { BaseViewModel, TitleInformation, ViewModelConstructor } from '../../site/base/base-view-model';
import { CollectionStringMapperService } from '../core-services/collection-string-mapper.service';
import { DataSendService } from '../core-services/data-send.service';
import { DataStoreService } from '../core-services/data-store.service';
import { HasViewModelListObservable } from '../definitions/has-view-model-list-observable';
import { Identifiable } from '../../shared/models/base/identifiable';
import { OnAfterAppsLoaded } from '../definitions/on-after-apps-loaded';
import { RelationManagerService } from '../core-services/relation-manager.service';
import { RelationDefinition, ReverseRelationDefinition } from '../definitions/relations';
import { ViewModelStoreService } from '../core-services/view-model-store.service';

export interface ModelDescriptor<M extends BaseModel, V extends BaseViewModel> {
    relationDefinitionsByKey: { [key: string]: RelationDefinition };
    ownKey: string;
    foreignViewModel: ViewModelConstructor<V>;
    foreignModel: ModelConstructor<M>;
    order?: string;
    titles?: {
        [key: string]: (viewModel: V) => string;
    };
}

export interface NestedModelDescriptors {
    [collection: string]: ModelDescriptor<BaseModel, BaseViewModel>[];
}

export abstract class BaseRepository<V extends BaseViewModel & T, M extends BaseModel, T extends TitleInformation>
    implements OnAfterAppsLoaded, Collection, HasViewModelListObservable<V> {
    /**
     * Stores all the viewModel in an object
     */
    protected viewModelStore: { [modelId: number]: V } = {};

    /**
     * Stores subjects to viewModels in a list
     */
    protected viewModelSubjects: { [modelId: number]: BehaviorSubject<V> } = {};

    /**
     * Observable subject for the whole list. These entries are unsorted and not piped through
     * auditTime. Just use this internally.
     *
     * It's used to debounce messages on the sortedViewModelListSubject
     */
    protected readonly unsafeViewModelListSubject: BehaviorSubject<V[]> = new BehaviorSubject<V[]>(null);

    /**
     * Observable subject for the sorted view model list.
     *
     * All data is piped through an auditTime of 1ms. This is to prevent massive
     * updates, if e.g. an autoupdate with a lot motions come in. The result is just one
     * update of the new list instead of many unnecessary updates.
     */
    protected readonly viewModelListSubject: BehaviorSubject<V[]> = new BehaviorSubject<V[]>([]);

    /**
     * Observable subject for any changes of view models.
     */
    protected readonly generalViewModelSubject: Subject<V> = new Subject<V>();

    /**
     * Can be used by the sort functions.
     */
    protected languageCollator: Intl.Collator;

    /**
     * The collection string of the managed model.
     */
    private _collectionString: string;

    public get collectionString(): string {
        return this._collectionString;
    }

    /**
     * Needed for the collectionStringMapper service to treat repositories the same as
     * ModelConstructors and ViewModelConstructors.
     */
    public get COLLECTIONSTRING(): string {
        return this._collectionString;
    }

    public abstract getVerboseName: (plural?: boolean) => string;
    public abstract getTitle: (titleInformation: T) => string;

    /**
     * Maps the given relations (`relationDefinitions`) to their affected collections. This means,
     * if a model of the collection updates, the relation needs to be updated.
     *
     * Attention: Some inherited repos might put other relations than RelationDefinition in here, so
     * *always* check the type of the relation.
     */
    protected relationsByCollection: { [collection: string]: RelationDefinition<BaseViewModel>[] } = {};

    protected reverseRelationsByCollection: { [collection: string]: ReverseRelationDefinition<BaseViewModel>[] } = {};

    protected relationsByKey: { [key: string]: RelationDefinition<BaseViewModel> } = {};

    /**
     * The view model ctor of the encapsulated view model.
     */
    protected baseViewModelCtor: ViewModelConstructor<V>;

    /**
     * Construction routine for the base repository
     *
     * @param DS: The DataStore
     * @param collectionStringMapperService Mapping strings to their corresponding classes
     * @param baseModelCtor The model constructor of which this repository is about.
     * @param depsModelCtors A list of constructors that are used in the view model.
     * If one of those changes, the view models will be updated.
     */
    public constructor(
        protected DS: DataStoreService,
        protected dataSend: DataSendService,
        protected collectionStringMapperService: CollectionStringMapperService,
        protected viewModelStoreService: ViewModelStoreService,
        protected translate: TranslateService,
        protected relationManager: RelationManagerService,
        protected baseModelCtor: ModelConstructor<M>,
        protected relationDefinitions: RelationDefinition<BaseViewModel>[] = [],
        protected nestedModelDescriptors: NestedModelDescriptors = {}
    ) {
        this._collectionString = baseModelCtor.COLLECTIONSTRING;

        this.extendRelations();

        this.relationDefinitions.forEach(relation => {
            this.relationsByKey[relation.ownKey] = relation;
        });

        // All data is piped through an auditTime of 1ms. This is to prevent massive
        // updates, if e.g. an autoupdate with a lot motions come in. The result is just one
        // update of the new list instead of many unnecessary updates.
        this.unsafeViewModelListSubject.pipe(auditTime(1)).subscribe(models => {
            if (models) {
                this.viewModelListSubject.next(models.sort(this.viewModelSortFn));
            }
        });

        this.languageCollator = new Intl.Collator(this.translate.currentLang);
    }

    protected extendRelations(): void {}

    public onAfterAppsLoaded(): void {
        this.baseViewModelCtor = this.collectionStringMapperService.getViewModelConstructor(this.collectionString);
        this.DS.clearObservable.subscribe(() => this.clear());
        this.translate.onLangChange.subscribe(change => {
            this.languageCollator = new Intl.Collator(change.lang);
            if (this.unsafeViewModelListSubject.value) {
                this.viewModelListSubject.next(this.unsafeViewModelListSubject.value.sort(this.viewModelSortFn));
            }
        });
    }

    public getListTitle: (titleInformation: T) => string = (titleInformation: T) => {
        return this.getTitle(titleInformation);
    };

    /**
     * Deletes all models from the repository (internally, no requests). Changes need
     * to be committed via `commitUpdate()`.
     *
     * @param ids All model ids
     */
    public deleteModels(ids: number[]): void {
        ids.forEach(id => {
            delete this.viewModelStore[id];
        });
    }

    /**
     * Updates or creates all given models in the repository (internally, no requests).
     * Changes need to be committed via `commitUpdate()`.
     *
     * @param ids All model ids.
     */
    public changedModels(ids: number[]): void {
        ids.forEach(id => {
            this.viewModelStore[id] = this.createViewModelWithTitles(this.DS.get(this.collectionString, id));
        });
    }

    /**
     * After creating a view model, all functions for models from the repo
     * are assigned to the new view model.
     */
    protected createViewModelWithTitles(model: M): V {
        const viewModel = this.relationManager.createViewModel(
            model,
            this.baseViewModelCtor,
            this.relationsByKey,
            this.nestedModelDescriptors
        );

        viewModel.getTitle = () => this.getTitle(viewModel);
        viewModel.getListTitle = () => this.getListTitle(viewModel);
        viewModel.getVerboseName = this.getVerboseName;
        return viewModel;
    }

    /**
     * Saves the (full) update to an existing model. So called "update"-function
     * Provides a default procedure, but can be overwritten if required
     *
     * @param update the update that should be created
     * @param viewModel the view model that the update is based on
     */
    public async update(update: Partial<M>, viewModel: V): Promise<void> {
        const data = viewModel.getUpdatedModel(update);
        return await this.dataSend.updateModel(data);
    }

    /**
     * patches an existing model with new data,
     * rather than sending a full update
     *
     * @param update the update to send
     * @param viewModel the motion to update
     */
    public async patch(update: Partial<M>, viewModel: V): Promise<void> {
        const patch = new this.baseModelCtor(update);
        patch.id = viewModel.id;
        return await this.dataSend.partialUpdateModel(patch);
    }

    /**
     * Deletes a given Model
     * Provides a default procedure, but can be overwritten if required
     *
     * @param viewModel the view model to delete
     */
    public async delete(viewModel: V): Promise<void> {
        return await this.dataSend.deleteModel(viewModel.getModel());
    }

    /**
     * Creates a new model.
     * Provides a default procedure, but can be overwritten if required
     *
     * @param model the model to create on the server
     */
    public async create(model: M): Promise<Identifiable> {
        // this ensures we get a valid base model, even if the view was just
        // sending an object with "as MyModelClass"
        const sendModel = new this.baseModelCtor(model);

        // Strips empty fields from the sending mode data (except false)
        // required for i.e. users, since group list is mandatory
        Object.keys(sendModel).forEach(key => {
            if (!sendModel[key] && sendModel[key] !== false) {
                delete sendModel[key];
            }
        });

        return await this.dataSend.createModel(sendModel);
    }

    /**
     * Clears the repository.
     */
    protected clear(): void {
        this.viewModelStore = {};
    }
    /**
     * The function used for sorting the data of this repository. The default sorts by ID.
     */
    protected viewModelSortFn: (a: V, b: V) => number = (a: V, b: V) => a.id - b.id;

    /**
     * Setter for a sort function. Updates the sorting.
     *
     * @param fn a sort function
     */
    public setSortFunction(fn: (a: V, b: V) => number): void {
        this.viewModelSortFn = fn;
        this.commitUpdate(Object.keys(this.viewModelSubjects).map(x => +x));
    }

    /**
     * helper function to return one viewModel
     */
    public getViewModel(id: number): V {
        return this.viewModelStore[id];
    }

    /**
     * @returns all view models stored in this repository. Sorting is not guaranteed
     */
    public getViewModelList(): V[] {
        return Object.values(this.viewModelStore);
    }

    /**
     * Get a sorted ViewModelList. This passes through a (1ms short) delay,
     * thus may not be accurate, especially on application loading.
     *
     * @returns all sorted view models stored in this repository.
     */
    public getSortedViewModelList(): V[] {
        return this.viewModelListSubject.getValue();
    }

    /**
     * @returns the current observable for one viewModel
     */
    public getViewModelObservable(id: number): Observable<V> {
        if (!this.viewModelSubjects[id]) {
            this.viewModelSubjects[id] = new BehaviorSubject<V>(this.viewModelStore[id]);
        }
        return this.viewModelSubjects[id].asObservable();
    }

    /**
     * @returns the (sorted) Observable of the whole store.
     */
    public getViewModelListObservable(): Observable<V[]> {
        return this.viewModelListSubject.asObservable();
    }

    /**
     * Returns the ViewModelList as piped Behavior Subject.
     * Prevents unnecessary calls.
     *
     * @returns A subject that holds the model list
     */
    public getViewModelListBehaviorSubject(): BehaviorSubject<V[]> {
        return this.viewModelListSubject;
    }

    /**
     * This observable fires every time an object is changed in the repository.
     */
    public getGeneralViewModelObservable(): Observable<V> {
        return this.generalViewModelSubject.asObservable();
    }

    /**
     * Updates the ViewModel observable using a ViewModel corresponding to the id
     */
    protected updateViewModelObservable(id: number): void {
        if (this.viewModelSubjects[id]) {
            this.viewModelSubjects[id].next(this.viewModelStore[id]);
        }
        this.generalViewModelSubject.next(this.viewModelStore[id]);
    }

    /**
     * update the observable of the list. Also updates the sorting of the view model list.
     */
    public commitUpdate(modelIds: number[]): void {
        this.unsafeViewModelListSubject.next(this.getViewModelList());
        modelIds.forEach(id => {
            this.updateViewModelObservable(id);
        });
    }
}
