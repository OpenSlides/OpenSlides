import { ModelConstructor, BaseModel } from '../../shared/models/base/base-model';
import { MainMenuEntry } from '../../core/services/main-menu.service';

/**
 * The configuration of an app.
 */
export interface AppConfig {
    /**
     * The name.
     */
    name: string;

    /**
     * All models, that should be registered.
     */
    models?: {
        collectionString: string;
        model: ModelConstructor<BaseModel>;
    }[];

    /**
     * Main menu entries.
     */
    mainMenuEntries?: MainMenuEntry[];
}
