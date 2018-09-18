import { BaseViewModel } from '../../base/base-view-model';
import { Config } from '../../../shared/models/core/config';

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
    | 'majorityMethod'
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
    /**
     * The underlying config.
     */
    private _config: Config;

    /* This private members are set by setConstantsInfo. */
    private _helpText: string;
    private _inputType: ConfigInputType;
    private _label: string;
    private _choices: ConfigChoice[];

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
        return this.config ? this.config.id : null;
    }

    public get key(): string {
        return this.config ? this.config.key : null;
    }

    public get value(): Object {
        return this.config ? this.config.value : null;
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

    public constructor(config: Config) {
        super();
        this._config = config;
    }

    public getTitle(): string {
        return this.label;
    }

    public updateValues(update: Config): void {
        this._config = update;
    }

    /**
     * Returns the time this config field needs to debounce before sending a request to the server.
     * A little debounce time for all inputs is given here and is usefull, if inputs sends multiple onChange-events,
     * like the type="color" input...
     */
    public getDebouncingTimeout(): number {
        if (this.inputType === 'string' || this.inputType === 'text' || this.inputType === 'markupText') {
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
        this._hasConstantsInfo = true;
    }

    public copy(): ViewConfig {
        return new ViewConfig(this._config);
    }
}
