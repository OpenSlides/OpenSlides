import { SearchRepresentation } from 'app/core/ui-services/search.service';
import { MotionBlock } from 'app/shared/models/motions/motion-block';
import { TitleInformationWithAgendaItem } from 'app/site/base/base-view-model-with-agenda-item';
import { BaseViewModelWithAgendaItemAndListOfSpeakers } from 'app/site/base/base-view-model-with-agenda-item-and-list-of-speakers';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { Searchable } from 'app/site/base/searchable';
import { ViewMotion } from './view-motion';

export interface MotionBlockTitleInformation extends TitleInformationWithAgendaItem {
    title: string;
}

/**
 * ViewModel for motion blocks.
 * @ignore
 */
export class ViewMotionBlock
    extends BaseViewModelWithAgendaItemAndListOfSpeakers
    implements MotionBlockTitleInformation, Searchable {
    public static COLLECTIONSTRING = MotionBlock.COLLECTIONSTRING;
    protected _collectionString = MotionBlock.COLLECTIONSTRING;

    public get motionBlock(): MotionBlock {
        return this._model;
    }

    /**
     * A block is finished when all its motions are in a final state
     */
    public get isFinished(): boolean {
        return this.motions && this.motions.length && this.motions.every(motion => motion.isInFinalState());
    }

    /**
     * Formats the category for search
     *
     * @override
     */
    public formatForSearch(): SearchRepresentation {
        return { properties: [{ key: 'Title', value: this.getTitle() }], searchValue: [this.getTitle()] };
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

interface IMotionBLockRelations {
    motions?: ViewMotion[];
}
export interface ViewMotionBlock extends MotionBlock, IMotionBLockRelations {}
