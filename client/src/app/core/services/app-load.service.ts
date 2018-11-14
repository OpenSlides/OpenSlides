import { Injectable } from '@angular/core';
import { plugins } from '../../../plugins';
import { CommonAppConfig } from '../../site/common/common.config';
import { AppConfig } from '../../site/base/app-config';
import { CollectionStringModelMapperService } from './collectionStringModelMapper.service';
import { MediafileAppConfig } from '../../site/mediafiles/mediafile.config';
import { MotionsAppConfig } from '../../site/motions/motions.config';
import { ConfigAppConfig } from '../../site/config/config.config';
import { AgendaAppConfig } from '../../site/agenda/agenda.config';
import { AssignmentsAppConfig } from '../../site/assignments/assignments.config';
import { UsersAppConfig } from '../../site/users/users.config';
import { TagAppConfig } from '../../site/tags/tag.config';
import { MainMenuService } from './main-menu.service';

/**
 * A list of all app configurations of all delivered apps.
 */
const appConfigs: AppConfig[] = [
    CommonAppConfig,
    ConfigAppConfig,
    AgendaAppConfig,
    AssignmentsAppConfig,
    MotionsAppConfig,
    MediafileAppConfig,
    TagAppConfig,
    UsersAppConfig
];

/**
 * Handles all incoming and outgoing notify messages via {@link WebsocketService}.
 */
@Injectable({
    providedIn: 'root'
})
export class AppLoadService {
    public constructor(
        private modelMapper: CollectionStringModelMapperService,
        private mainMenuService: MainMenuService
    ) {}

    public async loadApps(): Promise<void> {
        if (plugins.length) {
            console.log('plugins: ', plugins);
        }
        /*for (const pluginName of plugins) {
            const plugin = await import('../../../../../plugins/' + pluginName + '/' + pluginName);
            plugin.main();
        }*/
        appConfigs.forEach((config: AppConfig) => {
            if (config.models) {
                config.models.forEach(entry => {
                    this.modelMapper.registerCollectionElement(entry.collectionString, entry.model);
                });
            }
            if (config.mainMenuEntries) {
                this.mainMenuService.registerEntries(config.mainMenuEntries);
            }
        });
    }
}
