import { Injectable } from '@angular/core';

import { ConstantsService } from './constants.service';
import { AutoupdateService } from './autoupdate.service';
import { StorageService } from './storage.service';

const MIGRATIONVERSION = 'MigrationVersion';

/**
 * Manages upgrading the DataStore, if the migration version from the server is higher than the current one.
 */
@Injectable({
    providedIn: 'root'
})
export class DataStoreUpgradeService {
    /**
     * @param autoupdateService
     * @param constantsService
     * @param storageService
     */
    public constructor(
        autoupdateService: AutoupdateService,
        constantsService: ConstantsService,
        storageService: StorageService
    ) {
        constantsService.get<number>(MIGRATIONVERSION).subscribe(async version => {
            const currentVersion = await storageService.get<number>(MIGRATIONVERSION);
            await storageService.set(MIGRATIONVERSION, version);
            if (currentVersion && currentVersion !== version) {
                autoupdateService.doFullUpdate();
            }
        });
    }
}
