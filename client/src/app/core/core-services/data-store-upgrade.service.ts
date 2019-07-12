import { Injectable } from '@angular/core';

import { take } from 'rxjs/operators';

import { ConstantsService } from './constants.service';
import { AutoupdateService } from './autoupdate.service';
import { StorageService } from './storage.service';

const DB_SCHEMA_VERSION = 'DbSchemaVersion';

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
        private autoupdateService: AutoupdateService,
        private constantsService: ConstantsService,
        private storageService: StorageService
    ) {
        this.checkForUpgrade();
    }

    public async checkForUpgrade(): Promise<boolean> {
        const version = await this.constantsService
            .get<string | number>(DB_SCHEMA_VERSION)
            .pipe(take(1))
            .toPromise();
        console.log('DB schema version:', version);
        const currentVersion = await this.storageService.get<string>(DB_SCHEMA_VERSION);
        await this.storageService.set(DB_SCHEMA_VERSION, version);
        const doUpgrade = version !== currentVersion;

        if (doUpgrade) {
            console.log(`DB schema version changed from ${currentVersion} to ${version}`);
            await this.autoupdateService.doFullUpdate();
        }

        return doUpgrade;
    }
}
