import { Injector } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { DataStoreService } from 'app/core/services/DS.service';

// provides functions that might be used by a lot of components
export abstract class BaseComponent {
    protected injector: Injector;
    protected dataStore: DataStoreService;
    private titleSuffix = ' - OpenSlides 3';

    constructor(protected titleService?: Title) {
        // throws a warning even tho it is the new syntax. Ignored for now.
        this.injector = Injector.create([{ provide: DataStoreService, useClass: DataStoreService, deps: [] }]);
    }

    setTitle(prefix: string) {
        this.titleService.setTitle(prefix + this.titleSuffix);
    }

    // static injection of DataStore (ds) in all child instancces of BaseComponent
    // use this.DS[...]
    get DS(): DataStoreService {
        if (this.dataStore == null) {
            this.dataStore = this.injector.get(DataStoreService);
        }
        return this.dataStore;
    }
}
