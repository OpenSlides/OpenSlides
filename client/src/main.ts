import { enableProdMode, NgModuleRef } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { RootInjector } from 'app/core/rootInjector';

if (environment.production) {
    enableProdMode();
}

platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .then((moduleRef: NgModuleRef<AppModule>) => {
        RootInjector.injector = moduleRef.injector;
    })
    .catch(err => console.log(err));
