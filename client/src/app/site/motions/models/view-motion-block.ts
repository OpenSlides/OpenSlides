import { MotionBlock } from 'app/shared/models/motions/motion-block';
import { BaseAgendaViewModel } from 'app/site/base/base-agenda-view-model';
import { SearchRepresentation } from 'app/core/ui-services/search.service';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { Searchable } from 'app/site/base/searchable';
import { ViewItem } from 'app/site/agenda/models/view-item';
import { BaseViewModel } from 'app/site/base/base-view-model';

/**
 * ViewModel for motion blocks.
 * @ignore
 */
export class ViewMotionBlock extends BaseAgendaViewModel implements Searchable {
    private _motionBlock: MotionBlock;
    private _agendaItem: ViewItem;

    public get motionBlock(): MotionBlock {
        return this._motionBlock;
    }

    public get agendaItem(): ViewItem {
        return this._agendaItem;
    }

    public get id(): number {
        return this.motionBlock.id;
    }

    public get title(): string {
        return this.motionBlock.title;
    }

    public get agenda_item_id(): number {
        return this.motionBlock.agenda_item_id;
    }

    public constructor(motionBlock: MotionBlock, agendaItem?: ViewItem) {
        super('Motion block');
        this._motionBlock = motionBlock;
        this._agendaItem = agendaItem;
    }

    /**
     * Formats the category for search
     *
     * @override
     */
    public formatForSearch(): SearchRepresentation {
        return [this.title];
    }

    public getAgendaItem(): ViewItem {
        return this.agendaItem;
    }

    /**
     * Get the URL to the motion block
     *
     * @returns the URL as string
     */
    public getDetailStateURL(): string {
        return `/motions/blocks/${this.id}`;
    }

    public updateDependencies(update: BaseViewModel): void {
        if (update instanceof ViewItem && this.agenda_item_id === update.id) {
            this._agendaItem = update;
        }
    }

    public getTitle(): string {
        return this.title;
    }

    public getSlide(): ProjectorElementBuildDeskriptor {
        throw new Error('todo');
    }
}
