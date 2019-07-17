import { ViewUser } from 'app/site/users/models/view-user';
import { Submitter } from 'app/shared/models/motions/submitter';
import { BaseViewModel } from 'app/site/base/base-view-model';

export class ViewSubmitter extends BaseViewModel<Submitter> {
    public static COLLECTIONSTRING = Submitter.COLLECTIONSTRING;
    private _user?: ViewUser;

    public get submitter(): Submitter {
        return this._model;
    }

    public get user(): ViewUser {
        return this._user;
    }

    public get id(): number {
        return this.submitter.id;
    }

    public get user_id(): number {
        return this.submitter.user_id;
    }

    public get motion_id(): number {
        return this.submitter.motion_id;
    }

    public get weight(): number {
        return this.submitter.weight;
    }

    public constructor(submitter: Submitter) {
        super(Submitter.COLLECTIONSTRING, submitter);
    }

    public getTitle = () => {
        return this.user ? this.user.getTitle() : '';
    };

    public getListTitle = () => {
        return this.getTitle();
    };
}
