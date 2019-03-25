import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { BaseViewModel } from '../../site/base/base-view-model';
import { BaseModel, ModelConstructor } from '../../shared/models/base/base-model';
import { CollectionStringMapperService } from '../core-services/collectionStringMapper.service';
import { DataSendService } from '../core-services/data-send.service';
import { DataStoreService } from '../core-services/data-store.service';
import { Identifiable } from '../../shared/models/base/identifiable';
import { auditTime } from 'rxjs/operators';
import { ViewModelStoreService } from '../core-services/view-model-store.service';
import { OnAfterAppsLoaded } from '../onAfterAppsLoaded';
import { Collection } from 'app/shared/models/base/collection';

export abstract class BaseRepository<V extends BaseViewModel, M extends BaseModel>
    implements OnAfterAppsLoaded, Collection {
    /**
     * Stores all the viewModel in an object
     */
    protected viewModelStore: { [modelId: number]: V } = {};

    /**
     * Stores subjects to viewModels in a list
     */
    protected viewModelSubjects: { [modelId: number]: BehaviorSubject<V> } = {};

    /**
     * Observable subject for the whole list. These entries are unsorted an not piped through
     * autodTime. Just use this internally.
     *
     * It's used to debounce messages on the sortedViewModelListSubject
     */
    private readonly viewModelListSubject: BehaviorSubject<V[]> = new BehaviorSubject<V[]>([]);

    /**
     * Observable subject for the sorted view model list.
     *
     * All data is piped through an auditTime of 1ms. This is to prevent massive
     * updates, if e.g. an autoupdate with a lot motions come in. The result is just one
     * update of the new list instead of many unnecessary updates.
     */
    protected readonly sortedViewModelListSubject: BehaviorSubject<V[]> = new BehaviorSubject<V[]>([]);

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
        protected baseModelCtor: ModelConstructor<M>,
        protected depsModelCtors?: ModelConstructor<BaseModel>[]
    ) {
        this._collectionString = baseModelCtor.COLLECTIONSTRING;

        // All data is piped through an auditTime of 1ms. This is to prevent massive
        // updates, if e.g. an autoupdate with a lot motions come in. The result is just one
        // update of the new list instead of many unnecessary updates.
        this.viewModelListSubject.pipe(auditTime(1)).subscribe(models => {
            this.sortedViewModelListSubject.next(models.sort(this.viewModelSortFn));
        });

        this.languageCollator = new Intl.Collator(this.translate.currentLang);
    }

    public onAfterAppsLoaded(): void {
        this.DS.clearObservable.subscribe(() => this.clear());
        this.translate.onLangChange.subscribe(change => {
            this.languageCollator = new Intl.Collator(change.lang);
            this.updateViewModelListObservable();
        });

        // Populate the local viewModelStore with ViewModel Objects.
        this.DS.getAll(this.baseModelCtor).forEach((model: M) => {
            this.viewModelStore[model.id] = this.createViewModel(model);
        });

        // Update the list and then all models on their own
        this.updateViewModelListObservable();
        this.DS.getAll(this.baseModelCtor).forEach((model: M) => {
            this.updateViewModelObservable(model.id);
        });

        // Could be raise in error if the root injector is not known
        this.DS.primaryModelChangeSubject.subscribe(model => {
            if (model instanceof this.baseModelCtor) {
                // Add new and updated motions to the viewModelStore
                this.viewModelStore[model.id] = this.createViewModel(model as M);
                this.updateAllObservables(model.id);
            }
        });

        this.setupDependencyObservation();

        // Watch the Observables for deleting
        // TODO: What happens, if some related object was deleted?
        // My quess: This must trigger an autoupdate also for this model, because some IDs changed, so the
        // affected models will be newly created by the primaryModelChangeSubject.
        this.DS.deletedObservable.subscribe(model => {
            if (model.collection === this.collectionStringMapperService.getCollectionString(this.baseModelCtor)) {
                delete this.viewModelStore[model.id];
                this.updateAllObservables(model.id);
            }
        });
    }

    /**
     * Sets up the observation of dependency subjects.
     */
    protected setupDependencyObservation(): void {
        if (this.depsModelCtors) {
            this.DS.secondaryModelChangeSubject.subscribe(model => {
                const dependencyChanged: boolean = this.depsModelCtors.some(ctor => {
                    return model instanceof ctor;
                });
                if (dependencyChanged) {
                    const viewModel = this.viewModelStoreService.get(model.collectionString, model.id);
                    this.updateDependency(viewModel);
                }
            });
        }
    }

    /**
     * Updates all models with the provided `update` which is a dependency.
     *
     * @param update The dependency to update.
     */
    protected updateDependency(update: BaseViewModel): void {
        // if an domain object we need was added or changed, update viewModelStore
        this.getViewModelList().forEach(ownViewModel => {
            ownViewModel.updateDependencies(update);
            this.updateViewModelObservable(ownViewModel.id);
        });
        this.updateViewModelListObservable();
    }

    /**
     * Saves the (full) update to an existing model. So called "update"-function
     * Provides a default procedure, but can be overwritten if required
     *
     * @param update the update that should be created
     * @param viewModel the view model that the update is based on
     */
    public async update(update: Partial<M>, viewModel: V): Promise<void> {
        const sendUpdate = new this.baseModelCtor();
        sendUpdate.patchValues(viewModel.getModel());
        sendUpdate.patchValues(update);
        return await this.dataSend.updateModel(sendUpdate);
    }

    /**
     * patches an existing model with new data,
     * rather than sending a full update
     *
     * @param update the update to send
     * @param viewModel the motion to update
     */
    public async patch(update: Partial<M>, viewModel: V): Promise<void> {
        const patch = new this.baseModelCtor();
        patch.id = viewModel.id;
        patch.patchValues(update);
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
        const sendModel = new this.baseModelCtor();
        sendModel.patchValues(model);

        // Strips empty fields from the sending mode data.
        // required for i.e. users, since group list is mandatory
        Object.keys(sendModel).forEach(key => {
            if (!sendModel[key]) {
                delete sendModel[key];
            }
        });

        return await this.dataSend.createModel(sendModel);
    }

    /**
     * Creates a view model out of a base model.
     *
     * Should read all necessary objects from the datastore
     * that the viewmodel needs
     * @param model
     */
    protected abstract createViewModel(model: M): V;

    /**
     * Clears the repository.
     */
    protected clear(): void {
        this.viewModelStore = {};
    }
    /**
     * The function used for sorting the data of this repository. The defualt sorts by ID.
     */
    protected viewModelSortFn: (a: V, b: V) => number = (a: V, b: V) => a.id - b.id;

    /**
     * Setter for a sort function. Updates the sorting.
     *
     * @param fn a sort function
     */
    public setSortFunction(fn: (a: V, b: V) => number): void {
        this.viewModelSortFn = fn;
        this.updateViewModelListObservable();
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
        return this.sortedViewModelListSubject.getValue();
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
        return this.sortedViewModelListSubject.asObservable();
    }

    /**
     * Returns the ViewModelList as piped Behavior Subject.
     * Prevents unnecessary calls.
     *
     * @returns A subject that holds the model list
     */
    public getViewModelListBehaviorSubject(): BehaviorSubject<V[]> {
        return this.sortedViewModelListSubject;
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
    protected updateViewModelListObservable(): void {
        this.viewModelListSubject.next(this.getViewModelList());
    }

    /**
     * Triggers both the observable update routines
     */
    protected updateAllObservables(id: number): void {
        this.updateViewModelListObservable();
        this.updateViewModelObservable(id);
    }
}
