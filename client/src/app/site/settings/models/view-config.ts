import { BaseViewModel } from '../../base/base-view-model';
import { BaseModel } from '../../../shared/models/base/base-model';
import { Config } from '../../../shared/models/core/config';

export class ViewConfig extends BaseViewModel {
    private _config: Config;

    public get config(): Config {
        return this._config;
    }

    public get id(): number {
        return this.config ? this.config.id : null;
    }

    public get key(): string {
        return this.config ? this.config.key : null;
    }

    public get value(): Object {
        return this.config ? this.config.value : null;
    }

    public constructor(config: Config) {
        super();
        this._config = config;
    }

    public getTitle(): string {
        return this.key;
    }

    public updateValues(update: BaseModel): void {
        if (update instanceof Config && this.id === update.id) {
            this._config = update;
        }
    }
}
