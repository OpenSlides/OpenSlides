import { ProjectorMessage } from 'app/shared/models/core/projector-message';
import { stripHtmlTags } from 'app/shared/utils/strip-html-tags';
import { BaseProjectableViewModel } from 'app/site/base/base-projectable-view-model';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';

export type ProjectorMessageTitleInformation = object;

export class ViewProjectorMessage
    extends BaseProjectableViewModel<ProjectorMessage>
    implements ProjectorMessageTitleInformation {
    public static COLLECTIONSTRING = ProjectorMessage.COLLECTIONSTRING;
    protected _collectionString = ProjectorMessage.COLLECTIONSTRING;

    public get projectormessage(): ProjectorMessage {
        return this._model;
    }

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
            getDialogTitle: () => this.getTitle()
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
export interface ViewProjectorMessage extends ProjectorMessage {}
