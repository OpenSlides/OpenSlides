import { OpenSlidesComponent } from '../openslides.component';
import { BehaviorSubject, Observable } from 'rxjs';
import { BaseViewModel } from './base-view-model';
import { BaseModel, ModelConstructor } from '../shared/models/base.model';
import { CollectionStringModelMapperService } from '../core/services/collectionStringModelMapper.service';

export abstract class BaseRepository<V extends BaseViewModel, M extends BaseModel> extends OpenSlidesComponent {
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
    protected viewModelListSubject: BehaviorSubject<V[]> = new BehaviorSubject<V[]>(null);

    /**
     *
     * @param baseModelCtor The model constructor of which this repository is about.
     * @param depsModelCtors A list of constructors that are used in the view model.
     * If one of those changes, the view models will be updated.
     */
    public constructor(
        protected baseModelCtor: ModelConstructor<M>,
        protected depsModelCtors: ModelConstructor<BaseModel>[]
    ) {
        super();

        // Populate the local viewModelStore with ViewModel Objects.
        this.DS.getAll(baseModelCtor).forEach((model: M) => {
            this.viewModelStore[model.id] = this.createViewModel(model);
            this.updateViewModelObservable(model.id);
        });
        this.updateViewModelListObservable();

        // Could be raise in error if the root injector is not known
        this.DS.changeObservable.subscribe(model => {
            if (model instanceof this.baseModelCtor) {
                // Add new and updated motions to the viewModelStore
                this.viewModelStore[model.id] = this.createViewModel(model as M);
                this.updateAllObservables(model.id);
            } else {
                const dependencyChanged: boolean = this.depsModelCtors.some(ctor => {
                    return model instanceof ctor;
                });
                if (dependencyChanged) {
                    // if an domain object we need was added or changed, update viewModelStore
                    this.getViewModelList().forEach(viewModel => {
                        viewModel.updateValues(model);
                    });
                    this.updateAllObservables(model.id);
                }
            }
        });

        // Watch the Observables for deleting
        this.DS.deletedObservable.subscribe(model => {
            if (model.collection === CollectionStringModelMapperService.getCollectionString(baseModelCtor)) {
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
    public abstract save(update: M, viewModel: V): Observable<M>;

    /**
     * Deletes a given Model
     * @param update the update that should be created
     * @param viewModel the view model that the update is based on
     */
    public abstract delete(viewModel: V): Observable<M>;

    /**
     * Creates a new model
     * @param update the update that should be created
     * @param viewModel the view model that the update is based on
     * TODO: remove the viewModel
     */
    public abstract create(update: M, viewModel: V): Observable<M>;

    protected abstract createViewModel(model: M): V;

    /**
     * helper function to return one viewModel
     */
    protected getViewModel(id: number): V {
        return this.viewModelStore[id];
    }

    /**
     * helper function to return the viewModel as array
     */
    protected getViewModelList(): V[] {
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
     * return the Observable of the whole store
     */
    public getViewModelListObservable(): Observable<V[]> {
        return this.viewModelListSubject.asObservable();
    }

    /**
     * Updates the ViewModel observable using a ViewModel corresponding to the id
     */
    protected updateViewModelObservable(id: number): void {
        if (this.viewModelSubjects[id]) {
            this.viewModelSubjects[id].next(this.viewModelStore[id]);
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
