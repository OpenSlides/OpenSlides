import { BaseViewModel } from '../../base/base-view-model';
import { Config } from 'app/shared/models/core/config';

interface ConfigChoice {
    value: string;
    displayName: string;
}

/**
 * All valid input types for config variables.
 */
type ConfigInputType =
    | 'text'
    | 'string'
    | 'boolean'
    | 'markupText'
    | 'integer'
    | 'choice'
    | 'datetimepicker'
    | 'colorpicker'
    | 'translations';

/**
 * Represents all information that is given in the constant.
 */
interface ConfigConstant {
    default_value?: string;
    help_text?: string;
    input_type: ConfigInputType;
    key: string;
    label: string;
    choices?: ConfigChoice[];
}

/**
 * The view model for configs.
 */
export class ViewConfig extends BaseViewModel {
    public static COLLECTIONSTRING = Config.COLLECTIONSTRING;

    /**
     * The underlying config.
     */
    private _config: Config;

    /* This private members are set by setConstantsInfo. */
    private _helpText: string;
    private _inputType: ConfigInputType;
    private _label: string;
    private _choices: ConfigChoice[];
    private _defaultValue: any;

    /**
     * Saves, if this config already got constants information.
     */
    private _hasConstantsInfo = false;

    public get hasConstantsInfo(): boolean {
        return this._hasConstantsInfo;
    }

    public get config(): Config {
        return this._config;
    }

    public get id(): number {
        return this.config.id;
    }

    public get key(): string {
        return this.config.key;
    }

    public get value(): Object {
        return this.config.value;
    }

    public get label(): string {
        return this._label;
    }

    public get inputType(): ConfigInputType {
        return this._inputType;
    }

    public get helpText(): string {
        return this._helpText;
    }

    public get choices(): Object {
        return this._choices;
    }

    public get defaultValue(): any {
        return this._defaultValue;
    }

    /**
     * This is set by the repository
     */
    public getVerboseName;

    public constructor(config: Config) {
        super(Config.COLLECTIONSTRING);
        this._config = config;
    }

    public getTitle = () => {
        return this.label;
    };

    public updateDependencies(update: BaseViewModel): void {}

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

    /**
     * This should be called, if the constants are loaded, so all extra info can be updated.
     * @param constant The constant info
     */
    public setConstantsInfo(constant: ConfigConstant): void {
        this._label = constant.label;
        this._helpText = constant.help_text;
        this._inputType = constant.input_type;
        this._choices = constant.choices;
        if (constant.default_value !== undefined) {
            this._defaultValue = constant.default_value;
        }
        this._hasConstantsInfo = true;
    }
}
