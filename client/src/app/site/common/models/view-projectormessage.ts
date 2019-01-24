import { BaseProjectableModel } from 'app/site/base/base-projectable-model';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { ProjectorMessage } from 'app/shared/models/core/projector-message';

export class ViewProjectorMessage extends BaseProjectableModel {
    private _message: ProjectorMessage;

    public get messaage(): ProjectorMessage {
        return this._message ? this._message : null;
    }

    public get id(): number {
        return this.messaage ? this.messaage.id : null;
    }

    public get message(): string {
        return this.messaage ? this.messaage.message : null;
    }

    public constructor(message?: ProjectorMessage) {
        super();
        this._message = message;
    }

    public getTitle(): string {
        return 'Message 1';
    }

    public updateValues(message: ProjectorMessage): void {
        console.log('Update message TODO with vals:', message);
    }

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
