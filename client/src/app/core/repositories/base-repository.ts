import { BehaviorSubject, Observable, Subject } from 'rxjs';

import { BaseViewModel } from '../../site/base/base-view-model';
import { BaseModel, ModelConstructor } from '../../shared/models/base/base-model';
import { CollectionStringMapperService } from '../core-services/collectionStringMapper.service';
import { DataStoreService } from '../core-services/data-store.service';
import { Identifiable } from '../../shared/models/base/identifiable';
import { auditTime } from 'rxjs/operators';
import { ViewModelStoreService } from '../core-services/view-model-store.service';
import { OnAfterAppsLoaded } from '../onAfterAppsLoaded';

export abstract class BaseRepository<V extends BaseViewModel, M extends BaseModel> implements OnAfterAppsLoaded {
    /**
     * Stores all the viewModel in an object
     */
    protected viewModelStore: { [modelId: number]: V } = {};

    /**
     * Stores subjects to viewModels in a list
     */
    protected viewModelSubjects: { [modelId: number]: BehaviorSubject<V> } = {};

    /**
     * Observable subject for the whole list
     */
    protected readonly viewModelListSubject: BehaviorSubject<V[]> = new BehaviorSubject<V[]>([]);

    /**
     * Observable subject for any changes of view models.
     */
    protected readonly generalViewModelSubject: Subject<V> = new Subject<V>();

    private _name: string;

    public get name(): string {
        return this._name;
    }

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
        protected collectionStringMapperService: CollectionStringMapperService,
        protected viewModelStoreService: ViewModelStoreService,
        protected baseModelCtor: ModelConstructor<M>,
        protected depsModelCtors?: ModelConstructor<BaseModel>[]
    ) {
        this._name = baseModelCtor.name;
    }

    public onAfterAppsLoaded(): void {
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

        if (this.depsModelCtors) {
            this.DS.secondaryModelChangeSubject.subscribe(model => {
                const dependencyChanged: boolean = this.depsModelCtors.some(ctor => {
                    return model instanceof ctor;
                });
                if (dependencyChanged) {
                    const viewModel = this.viewModelStoreService.get(model.collectionString, model.id);

                    // if an domain object we need was added or changed, update viewModelStore
                    this.getViewModelList().forEach(ownViewModel => {
                        ownViewModel.updateDependencies(viewModel);
                    });
                    this.updateAllObservables(model.id);
                }
            });
        }

        // Watch the Observables for deleting
        // TODO: What happens, if some related object was deleted?
        // My quess: This must trigger an autoupdate also for this model, because some IDs changed, so the
        // affected models will be newly created by the primaryModelChangeSubject.
        this.DS.deletedObservable.subscribe(model => {
            if (
                model.collection ===
                this.collectionStringMapperService.getCollectionStringFromModelConstructor(this.baseModelCtor)
            ) {
                delete this.viewModelStore[model.id];
                this.updateAllObservables(model.id);
            }
        });
    }

    /**
     * Saves the update to an existing model. So called "update"-function
     * @param update the update that should be created
     * @param viewModel the view model that the update is based on
     */
    public abstract async update(update: Partial<M>, viewModel: V): Promise<void>;

    /**
     * Deletes a given Model
     * @param update the update that should be created
     * @param viewModel the view model that the update is based on
     */
    public abstract async delete(viewModel: V): Promise<void>;

    /**
     * Creates a new model
     * @param update the update that should be created
     * @param viewModel the view model that the update is based on
     * TODO: remove the viewModel
     */
    public abstract async create(update: M): Promise<Identifiable>;

    /**
     * Creates a view model out of a base model.
     *
     * Should read all necessary objects from the datastore
     * that the viewmodel needs
     * @param model
     */
    protected abstract createViewModel(model: M): V;

    /**
     * helper function to return one viewModel
     */
    public getViewModel(id: number): V {
        return this.viewModelStore[id];
    }

    /**
     * helper function to return the viewModel as array
     */
    public getViewModelList(): V[] {
        return Object.values(this.viewModelStore);
    }

    /**
     * returns the current observable for one viewModel
     */
    public getViewModelObservable(id: number): Observable<V> {
        if (!this.viewModelSubjects[id]) {
            this.viewModelSubjects[id] = new BehaviorSubject<V>(this.viewModelStore[id]);
        }
        return this.viewModelSubjects[id].asObservable();
    }

    /**
     * Return the Observable of the whole store.
     *
     * All data is piped through an auditTime of 1ms. This is to prevent massive
     * updates, if e.g. an autoupdate with a lot motions come in. The result is just one
     * update of the new list instead of many unnecessary updates.
     */
    public getViewModelListObservable(): Observable<V[]> {
        return this.viewModelListSubject.asObservable().pipe(auditTime(1));
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
            this.generalViewModelSubject.next(this.viewModelStore[id]);
        }
    }

    /**
     * update the observable of the list
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
