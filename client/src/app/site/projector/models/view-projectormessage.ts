import { BaseProjectableViewModel } from 'app/site/base/base-projectable-view-model';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { ProjectorMessage } from 'app/shared/models/core/projector-message';
import { BaseViewModel } from 'app/site/base/base-view-model';

export class ViewProjectorMessage extends BaseProjectableViewModel {
    private _message: ProjectorMessage;

    public get projctormessage(): ProjectorMessage {
        return this._message;
    }

    public get id(): number {
        return this.projctormessage.id;
    }

    public get message(): string {
        return this.projctormessage.message;
    }

    /**
     * This is set by the repository
     */
    public getVerboseName;

    public constructor(message: ProjectorMessage) {
        super(ProjectorMessage.COLLECTIONSTRING);
        this._message = message;
    }

    public getTitle = () => {
        return 'Message';
    };

    public updateDependencies(update: BaseViewModel): void {}

    public getSlide(): ProjectorElementBuildDeskriptor {
        return {
            getBasicProjectorElement: () => ({
                stable: true,
                name: ProjectorMessage.COLLECTIONSTRING,
                id: this.id,
                getIdentifiers: () => ['name', 'id']
            }),
            slideOptions: [],
            projectionDefaultName: 'messages',
            getTitle: () => this.getTitle()
        };
    }
}
