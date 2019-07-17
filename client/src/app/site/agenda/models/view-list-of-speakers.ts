import { Item } from 'app/shared/models/agenda/item';
import { ProjectorElementBuildDeskriptor, Projectable } from 'app/site/base/projectable';
import { ListOfSpeakers } from 'app/shared/models/agenda/list-of-speakers';
import { ViewSpeaker, SpeakerState } from './view-speaker';
import { BaseViewModelWithListOfSpeakers } from 'app/site/base/base-view-model-with-list-of-speakers';
import { BaseViewModelWithContentObject } from 'app/site/base/base-view-model-with-content-object';
import { ContentObject } from 'app/shared/models/base/content-object';

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

    private _speakers?: ViewSpeaker[];

    public get listOfSpeakers(): ListOfSpeakers {
        return this._model;
    }

    public get speakers(): ViewSpeaker[] {
        return this._speakers || [];
    }

    public get title_information(): object {
        return this.listOfSpeakers.title_information;
    }

    /**
     * Gets the amount of waiting speakers
     */
    public get waitingSpeakerAmount(): number {
        return this.speakers.filter(speaker => speaker.state === SpeakerState.WAITING).length;
    }

    public get closed(): boolean {
        return this.listOfSpeakers.closed;
    }

    public get listOfSpeakersUrl(): string {
        return `/agenda/speakers/${this.id}`;
    }

    public constructor(listOfSpeakers: ListOfSpeakers) {
        super(Item.COLLECTIONSTRING, listOfSpeakers);
    }

    public getProjectorTitle(): string {
        return this.getTitle();
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
}
