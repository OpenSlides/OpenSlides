import { SearchRepresentation } from 'app/core/ui-services/search.service';
import { MotionBlock } from 'app/shared/models/motions/motion-block';
import { TitleInformationWithAgendaItem } from 'app/site/base/base-view-model-with-agenda-item';
import { BaseViewModelWithAgendaItemAndListOfSpeakers } from 'app/site/base/base-view-model-with-agenda-item-and-list-of-speakers';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { Searchable } from 'app/site/base/searchable';

export interface MotionBlockTitleInformation extends TitleInformationWithAgendaItem {
    title: string;
}

/**
 * ViewModel for motion blocks.
 * @ignore
 */
export class ViewMotionBlock extends BaseViewModelWithAgendaItemAndListOfSpeakers
    implements MotionBlockTitleInformation, Searchable {
    public static COLLECTIONSTRING = MotionBlock.COLLECTIONSTRING;

    public get motionBlock(): MotionBlock {
        return this._model;
    }

    public get title(): string {
        return this.motionBlock.title;
    }

    public get internal(): boolean {
        return this.motionBlock.internal;
    }

    public constructor(motionBlock: MotionBlock) {
        super(MotionBlock.COLLECTIONSTRING, motionBlock);
    }

    /**
     * Formats the category for search
     *
     * @override
     */
    public formatForSearch(): SearchRepresentation {
        return [this.title];
    }

    /**
     * Get the URL to the motion block
     *
     * @returns the URL as string
     */
    public getDetailStateURL(): string {
        return `/motions/blocks/${this.id}`;
    }

    public getSlide(): ProjectorElementBuildDeskriptor {
        return {
            getBasicProjectorElement: options => ({
                name: MotionBlock.COLLECTIONSTRING,
                id: this.id,
                getIdentifiers: () => ['name', 'id']
            }),
            slideOptions: [],
            projectionDefaultName: 'motionBlocks',
            getDialogTitle: () => this.getTitle()
        };
    }
}
