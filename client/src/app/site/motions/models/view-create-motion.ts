import { ViewUser } from 'app/site/users/models/view-user';
import { CreateMotion } from './create-motion';
import { ViewMotion } from './view-motion';

/**
 * Create motion class for the View. Its different to ViewMotion in fact that the submitter handling is different
 * on motion creation.
 *
 * @ignore
 */
export class ViewCreateMotion extends ViewMotion {
    protected _model: CreateMotion;

    protected _submitterUsers: ViewUser[];

    public get motion(): CreateMotion {
        return this._model;
    }

    public get submittersAsUsers(): ViewUser[] {
        return this._submitterUsers;
    }

    public set submittersAsUsers(users: ViewUser[]) {
        this._submitterUsers = users;
        this._model.submitters_id = users.map(user => user.id);
    }

    public constructor(motion: CreateMotion) {
        super(motion);
    }

    public getVerboseName = () => {
        throw new Error('This should not be used');
    };
}
