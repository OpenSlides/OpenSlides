import { _ } from 'app/core/translate/translation-marker';
import { BaseModel } from '../base/base-model';

/**
 * Iterable pre selection of genders (sexes)
 */
export const genders = [_('female'), _('male'), _('diverse')];

export const DEFAULT_AUTH_TYPE = 'default';
export type UserAuthType = 'default' | 'saml';

/**
 * Representation of a user in contrast to the operator.
 * @ignore
 */
export class User extends BaseModel<User> {
    public static COLLECTIONSTRING = 'users/user';

    public id: number;
    public username: string;
    public title: string;
    public first_name: string;
    public last_name: string;
    public gender?: string;
    public structure_level: string;
    public number: string;
    public about_me: string;
    public groups_id: number[];
    public is_present: boolean;
    public is_committee: boolean;
    public email?: string;
    public last_email_send?: string; // ISO datetime string
    public comment?: string;
    public is_active?: boolean;
    public default_password?: string;
    public auth_type?: UserAuthType;

    public constructor(input?: Partial<User>) {
        super(User.COLLECTIONSTRING, input);
    }
}
