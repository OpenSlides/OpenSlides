import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { BaseComponent } from 'app/base.component';
import { ConfigGroup, ConfigRepositoryService } from 'app/core/repositories/config/config-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { CanComponentDeactivate } from 'app/shared/utils/watch-for-changes.guard';

/**
 * Key-value-pair to set a setting with its associated value.
 */
export interface ConfigItem {
    /**
     * The key has to be a string.
     */
    key: string;

    /**
     * The value can be any.
     */
    value: any;
}

/**
 * List view for the global settings
 */
@Component({
    selector: 'os-config-list',
    templateUrl: './config-list.component.html',
    styleUrls: ['./config-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigListComponent extends BaseComponent implements CanComponentDeactivate, OnInit, OnDestroy {
    public configGroup: ConfigGroup;

    public configGroupSubscription: Subscription | null = null;

    /**
     * Object containing all errors.
     */
    public errors = {};

    /**
     * Array of all changed settings.
     */
    private configItems: ConfigItem[] = [];

    public constructor(
        protected titleService: Title,
        protected translate: TranslateService,
        private cd: ChangeDetectorRef,
        private repo: ConfigRepositoryService,
        private route: ActivatedRoute,
        private promptDialog: PromptService
    ) {
        super(titleService, translate);
    }

    /**
     * Sets the title, inits the table and calls the repo
     */
    public ngOnInit(): void {
        const settings = this.translate.instant('Settings');
        this.route.params.subscribe(params => {
            this.clearSubscription();
            this.configGroupSubscription = this.repo.getConfigGroupOberservable(params.group).subscribe(configGroup => {
                if (configGroup) {
                    const groupName = this.translate.instant(configGroup.name);
                    super.setTitle(`${settings} - ${groupName}`);
                    this.configGroup = configGroup;
                    this.cd.markForCheck();
                }
            });
        });
    }

    /**
     * Updates the specified config-item indicated by the given key.
     *
     * @param key The key of the config-item.
     * @param value The next value the config-item has.
     */
    public updateConfigGroup(update: ConfigItem): void {
        const { key, value }: ConfigItem = update;
        const index = this.configItems.findIndex(item => item.key === key);
        if (index === -1) {
            this.configItems.push({ key, value });
        } else {
            this.configItems[index] = { key, value };
        }
        this.cd.markForCheck();
    }

    /**
     * Saves every field in this config-group.
     */
    public saveAll(): void {
        this.cd.detach();
        this.repo.bulkUpdate(this.configItems).then(result => {
            this.errors = result.errors;
            if (Object.keys(result.errors).length === 0) {
                this.configItems = [];
                this.cd.reattach();
                this.cd.markForCheck();
            }
        });
    }

    /**
     * This resets all values to their defaults.
     */
    public async resetAll(): Promise<void> {
        const title = this.translate.instant(
            'Are you sure you want to reset all options to factory defaults? All changes of this settings group will be lost!'
        );
        if (await this.promptDialog.open(title)) {
            await this.repo.resetGroups([this.configGroup.name]);
        }
    }

    /**
     * Returns, if there are changes depending on the `configMap`.
     *
     * @returns True, if the array `configMap` has at least one member.
     */
    public hasChanges(): boolean {
        return !!this.configItems.length;
    }

    private clearSubscription(): void {
        if (this.configGroupSubscription) {
            this.configGroupSubscription.unsubscribe();
            this.configGroupSubscription = null;
        }
    }

    public ngOnDestroy(): void {
        this.clearSubscription();
    }

    /**
     * Lifecycle-hook to hook into, before the route changes.
     *
     * @returns The answer of the user, if he made changes, `true` otherwise.
     */
    public async canDeactivate(): Promise<boolean> {
        if (this.hasChanges()) {
            const title = this.translate.instant('Do you really want to exit this page?');
            const content = this.translate.instant('You made changes.');
            return await this.promptDialog.open(title, content);
        }
        return true;
    }
}
