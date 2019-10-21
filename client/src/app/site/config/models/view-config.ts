import { Config, ConfigChoice, ConfigData, ConfigInputType } from 'app/shared/models/core/config';
import { BaseViewModel } from '../../base/base-view-model';

export interface ConfigTitleInformation {
    key: string;
}

/**
 * The view model for configs.
 */
export class ViewConfig extends BaseViewModel<Config> implements ConfigTitleInformation {
    public static COLLECTIONSTRING = Config.COLLECTIONSTRING;
    protected _collectionString = Config.COLLECTIONSTRING;

    public get config(): Config {
        return this._model;
    }

    public get key(): string {
        return this.config.key;
    }

    public get value(): any {
        return this.config.value;
    }

    public get data(): ConfigData | null {
        return this.config.data;
    }

    public get hidden(): boolean {
        return !this.data;
    }

    public get label(): string {
        return this.data.label;
    }

    public get inputType(): ConfigInputType | null {
        return this.data.inputType;
    }

    public get helpText(): string | null {
        return this.data.helpText;
    }

    public get choices(): ConfigChoice[] | null {
        return this.data.choices;
    }

    public get defaultValue(): any {
        return this.data.defaultValue;
    }

    public get weight(): number {
        return this.hidden ? 0 : this.data.weight;
    }

    public get group(): string {
        return this.data.group;
    }

    public get subgroup(): string | null {
        return this.data.subgroup;
    }

    /**
     * Returns the time this config field needs to debounce before sending a request to the server.
     * A little debounce time for all inputs is given here and is usefull, if inputs sends multiple onChange-events,
     * like the type="color" input...
     */
    public getDebouncingTimeout(): number {
        if (this.inputType === 'markupText' || this.inputType === 'translations') {
            return 2500;
        } else if (this.inputType === 'string' || this.inputType === 'text') {
            return 1000;
        } else {
            return 100;
        }
    }
}
