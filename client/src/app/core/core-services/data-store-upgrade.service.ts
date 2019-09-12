import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { AutoupdateService } from './autoupdate.service';
import { ConstantsService } from './constants.service';
import { StorageService } from './storage.service';

interface SchemaVersion {
    db: string;
    config: number;
    migration: number;
}

function isSchemaVersion(obj: any): obj is SchemaVersion {
    if (!obj || typeof obj !== 'object') {
        return false;
    }
    return obj.db !== undefined && obj.config !== undefined && obj.migration !== undefined;
}

const SCHEMA_VERSION = 'SchemaVersion';

/**
 * Manages upgrading the DataStore, if the migration version from the server is higher than the current one.
 */
@Injectable({
    providedIn: 'root'
})
export class DataStoreUpgradeService {
    /**
     * Notify, when upgrade has checked.
     */
    public readonly upgradeChecked = new BehaviorSubject(false);

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
        // Prevent the schema version to be cleard. This is important
        // after a reset from OpenSlides, because the complete data is
        // queried from the server and we do not want also to trigger a reload
        // by changing the schema from null -> <schema>.
        this.storageService.addNoClearKey(SCHEMA_VERSION);

        this.constantsService
            .get<SchemaVersion>(SCHEMA_VERSION)
            .subscribe(serverVersion => this.checkForUpgrade(serverVersion));
    }

    public async checkForUpgrade(serverVersion: SchemaVersion): Promise<boolean> {
        this.upgradeChecked.next(false);
        console.log('Server schema version:', serverVersion);
        const clientVersion = await this.storageService.get<SchemaVersion>(SCHEMA_VERSION);
        await this.storageService.set(SCHEMA_VERSION, serverVersion);

        let doUpgrade = false;
        if (isSchemaVersion(clientVersion)) {
            if (clientVersion.db !== serverVersion.db) {
                console.log(`\tDB id changed from ${clientVersion.db} to ${serverVersion.db}`);
                doUpgrade = true;
            }
            if (clientVersion.config !== serverVersion.config) {
                console.log(`\tConfig changed from ${clientVersion.config} to ${serverVersion.config}`);
                doUpgrade = true;
            }
            if (clientVersion.migration !== serverVersion.migration) {
                console.log(`\tMigration changed from ${clientVersion.migration} to ${serverVersion.migration}`);
                doUpgrade = true;
            }
        } else {
            console.log('\tNo client schema version.');
            doUpgrade = true;
        }

        if (doUpgrade) {
            console.log('\t-> In result of a schema version change: Do full update.');
            await this.autoupdateService.doFullUpdate();
        } else {
            console.log('\t-> No upgrade needed.');
        }
        this.upgradeChecked.next(true);
        return doUpgrade;
    }
}
