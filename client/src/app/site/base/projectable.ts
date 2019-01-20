import { ProjectorOptions } from './projector-options';
import { Displayable } from 'app/shared/models/base/displayable';

/**
 * Interface for every model, that should be projectable.
 */
export interface Projectable extends Displayable {
    /**
     * All options for the slide
     */
    getProjectorOptions(): ProjectorOptions;

    /**
     * The projection default name for the slide
     */
    getProjectionDefaultName(): string;

    /**
     * The (optional) id for the slide
     */
    getIdForSlide(): number | null;

    /**
     * The slide's name
     */
    getNameForSlide(): string;

    /**
     * The stable attribute for the slide.
     */
    isStableSlide(): boolean;
}
