import { Injector } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { DataStoreService } from 'app/core/services/DS.service';
// import { TranslateService } from '@ngx-translate/core';

// provides functions that might be used by a lot of components
export abstract class BaseComponent {
    protected injector: Injector;
    protected dataStore: DataStoreService;
    // would die in every scope change. disabled for now
    // protected _translateService: TranslateService;
    private titleSuffix = ' - OpenSlides 3';

    constructor(protected titleService?: Title) {
        // throws a warning even tho it is the new syntax. Ignored for now.
        this.injector = Injector.create([{ provide: DataStoreService, useClass: DataStoreService, deps: [] }]);
        // this._injector = Injector.create([{ provide: TranslateService, useClass: TranslateService, deps: [] }]);
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

    // get translate(): TranslateService {
    //     if (this._translateService == null) {
    //         this._translateService = this._injector.get(TranslateService);
    //     }
    //     return this._translateService;
    // }
}
