import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { perf } from 'perf';

if (environment.production) {
    enableProdMode();
}

perf("platformBrowserDynamic");

platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .then(() => perf("bootstrap done"))
    .catch(err => console.log(err));
