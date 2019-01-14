import { ViewCreateMotion } from './view-create-motion';
import { CreateMotion } from './create-motion';

/**
 * Interface for correlating between strings representing BaseModels and existing
 * BaseModels.
 */
export interface CsvMapping {
    name: string;
    id?: number;
    multiId?: number[];
}

/**
 * Create motion class for the View. Its different to ViewMotion in fact that the submitter handling is different
 * on motion creation.
 *
 * @ignore
 */
export class ViewCsvCreateMotion extends ViewCreateMotion {
    protected _motion: CreateMotion;

    /**
     * Mapping for a new/existing category.
     */
    public csvCategory: CsvMapping;

    /**
     * Mapping for a new/existing motion block.
     */
    public csvMotionblock: CsvMapping;

    /**
     * Mapping for new/existing submitters.
     */
    public csvSubmitters: CsvMapping[];

    public constructor(motion?: CreateMotion) {
        super(motion);
    }

    /**
     * takes a list of motion block mappings to update the current csvMotionblock.
     * Returns the amount of entries that remain unmatched
     *
     * @param motionBlocks
     */
    public solveMotionBlocks(motionBlocks: CsvMapping[]): number {
        if (!this.csvMotionblock) {
            return 0;
        } else if (this.csvMotionblock.id) {
            this.motion.motion_block_id = this.csvMotionblock.id;
            return 0;
        } else {
            const newBlock = motionBlocks.find(newMotionBlock => newMotionBlock.name === this.csvMotionblock.name);
            if (newBlock) {
                this.csvMotionblock = newBlock;
                this.motion.motion_block_id = newBlock.id;
                return 0;
            } else {
                return 1;
            }
        }
    }

    /**
     * takes a list of category maps to update the current csv_category.
     * Returns the amount of entries that remain unmatched
     *
     * @param categories
     */
    public solveCategory(categories: CsvMapping[]): number {
        if (!this.csvCategory) {
            return 0;
        } else if (this.csvCategory.id) {
            this.motion.category_id = this.csvCategory.id;
            return 0;
        } else {
            const newCat = categories.find(newCategory => newCategory.name === this.csvCategory.name);
            if (newCat) {
                this.csvCategory = newCat;
                this.motion.category_id = newCat.id;
                return 0;
            } else {
                return 1;
            }
        }
    }

    /**
     * takes a list of solved submitter maps to update. Returns the amount of
     * entries that remain unmatched
     *
     * @param submitters
     */
    public solveSubmitters(submitters: CsvMapping[]): number {
        let open = 0;
        const ids: number[] = [];
        this.csvSubmitters.forEach(csvSubmitter => {
            if (csvSubmitter.id) {
                ids.push(csvSubmitter.id);
                return;
            }
            if (!submitters.length) {
                open += 1;
                return;
            }
            const mapped = submitters.find(newSubmitter => newSubmitter.name === csvSubmitter.name);
            if (mapped) {
                csvSubmitter.id = mapped.id;
                ids.push(mapped.id);
            } else {
                open += 1;
            }
        });
        this.motion.submitters_id = ids;
        return open;
    }
}
