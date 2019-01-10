import { BaseViewModel } from 'app/site/base/base-view-model';
import { MotionBlock } from 'app/shared/models/motions/motion-block';

/**
 * ViewModel for motion blocks.
 * @ignore
 */
export class ViewMotionBlock extends BaseViewModel {
    private _motionBlock: MotionBlock;

    public get motionBlock(): MotionBlock {
        return this._motionBlock;
    }

    public get id(): number {
        return this.motionBlock ? this.motionBlock.id : null;
    }

    public get title(): string {
        return this.motionBlock ? this.motionBlock.title : null;
    }

    public get agenda_item_id(): number {
        return this.motionBlock ? this.motionBlock.agenda_item_id : null;
    }

    public constructor(motionBlock: MotionBlock) {
        super();
        this._motionBlock = motionBlock;
    }

    public updateValues(update: MotionBlock): void {
        this._motionBlock = update;
    }

    public getTitle(): string {
        return this.title;
    }
}
