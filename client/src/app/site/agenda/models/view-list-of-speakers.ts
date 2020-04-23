import { ProjectorTitle } from 'app/core/core-services/projector.service';
import { ListOfSpeakers, ListOfSpeakersWithoutNestedModels } from 'app/shared/models/agenda/list-of-speakers';
import { ContentObject } from 'app/shared/models/base/content-object';
import { BaseViewModelWithContentObject } from 'app/site/base/base-view-model-with-content-object';
import { BaseViewModelWithListOfSpeakers } from 'app/site/base/base-view-model-with-list-of-speakers';
import { Projectable, ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { SpeakerState, ViewSpeaker } from './view-speaker';

export interface ListOfSpeakersTitleInformation {
    contentObject: BaseViewModelWithListOfSpeakers;
    contentObjectData: ContentObject;
    title_information: object;
}

/**
 * TODO: Resolve potential circular dependencies with {@link BaseViewModelWithListOfSpeakers}.
 */
export class ViewListOfSpeakers extends BaseViewModelWithContentObject<ListOfSpeakers, BaseViewModelWithListOfSpeakers>
    implements ListOfSpeakersTitleInformation, Projectable {
    public static COLLECTIONSTRING = ListOfSpeakers.COLLECTIONSTRING;
    protected _collectionString = ListOfSpeakers.COLLECTIONSTRING;

    public get listOfSpeakers(): ListOfSpeakers {
        return this._model;
    }

    public get finishedSpeakers(): ViewSpeaker[] {
        return this.speakers.filter(speaker => speaker.state === SpeakerState.FINISHED);
    }

    /**
     * Gets the amount of waiting speakers
     */
    public get waitingSpeakerAmount(): number {
        return this.waitingSpeakers.length;
    }

    public get waitingSpeakers(): ViewSpeaker[] {
        return this.speakers.filter(speaker => speaker.state === SpeakerState.WAITING);
    }

    public get listOfSpeakersUrl(): string {
        return `/agenda/speakers/${this.id}`;
    }

    public getProjectorTitle(): ProjectorTitle {
        return { title: this.getTitle() };
    }

    public getSlide(): ProjectorElementBuildDeskriptor {
        return {
            getBasicProjectorElement: options => ({
                name: 'agenda/list-of-speakers',
                id: this.id,
                getIdentifiers: () => ['name', 'id']
            }),
            slideOptions: [],
            projectionDefaultName: 'agenda_list_of_speakers',
            getDialogTitle: () => this.getTitle()
        };
    }

    public hasSpeakerSpoken(checkSpeaker: ViewSpeaker): boolean {
        return this.finishedSpeakers.findIndex(speaker => speaker.user_id === checkSpeaker.user_id) !== -1;
    }
}
interface IListOfSpeakersRelations {
    speakers: ViewSpeaker[];
}
export interface ViewListOfSpeakers extends ListOfSpeakersWithoutNestedModels, IListOfSpeakersRelations {}
