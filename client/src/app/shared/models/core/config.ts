import { BaseModel } from '../base/base-model';

export interface ConfigChoice {
    value: string;
    display_name: string;
}

/**
 * All valid input types for config variables.
 */
export type ConfigInputType =
    | 'text'
    | 'string'
    | 'boolean'
    | 'markupText'
    | 'integer'
    | 'choice'
    | 'datetimepicker'
    | 'colorpicker'
    | 'translations'
    | 'groups';

export interface ConfigData {
    defaultValue: any;
    inputType: ConfigInputType;
    label: string;
    helpText?: string;
    choices?: ConfigChoice[];
    weight: number;
    group: string;
    subgroup?: string;
}

/**
 * Representation of a config variable
 * @ignore
 */
export class Config extends BaseModel {
    public static COLLECTIONSTRING = 'core/config';
    public id: number;
    public key: string;
    public value: any;
    public data?: ConfigData;

    public constructor(input?: any) {
        super(Config.COLLECTIONSTRING, input);
    }
}
