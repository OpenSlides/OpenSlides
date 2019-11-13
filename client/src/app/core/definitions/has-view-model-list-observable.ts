import { Observable } from 'rxjs';

export interface HasViewModelListObservable<V> {
    getViewModelListObservable(): Observable<V[]>;
}
