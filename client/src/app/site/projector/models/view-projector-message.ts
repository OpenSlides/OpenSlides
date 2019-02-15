import { BaseProjectableViewModel } from 'app/site/base/base-projectable-view-model';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { ProjectorMessage } from 'app/shared/models/core/projector-message';
import { BaseViewModel } from 'app/site/base/base-view-model';
import { stripHtmlTags } from 'app/shared/utils/strip-html-tags';

export class ViewProjectorMessage extends BaseProjectableViewModel {
    public static COLLECTIONSTRING = ProjectorMessage.COLLECTIONSTRING;

    private _message: ProjectorMessage;

    public get projectormessage(): ProjectorMessage {
        return this._message;
    }

    public get id(): number {
        return this.projectormessage.id;
    }

    public get message(): string {
        return this.projectormessage.message;
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
            getBasicProjectorElement: options => ({
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

    public getPreview(maxLength: number = 100): string {
        const html = stripHtmlTags(this.message);
        if (html.length > maxLength) {
            return html.substring(0, maxLength) + ' ...';
        } else {
            return html;
        }
    }
}
