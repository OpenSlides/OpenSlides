import { Displayable } from 'app/site/base/displayable';
import { IdentifiableProjectorElement } from 'app/shared/models/core/projector';
import { SlideOptions } from './slide-options';

export function isProjectorElementBuildDeskriptor(obj: any): obj is ProjectorElementBuildDeskriptor {
    const deskriptor = <ProjectorElementBuildDeskriptor>obj;
    return (
        !!deskriptor &&
        deskriptor.slideOptions !== undefined &&
        deskriptor.getBasicProjectorElement !== undefined &&
        deskriptor.getTitle !== undefined
    );
}

export interface ProjectorElementBuildDeskriptor {
    slideOptions: SlideOptions;
    projectionDefaultName?: string;
    getBasicProjectorElement(): IdentifiableProjectorElement;

    /**
     * The title to show in the projection dialog
     */
    getTitle(): string;
}

export function isProjectable(obj: any): obj is Projectable {
    if (obj) {
        return (<Projectable>obj).getSlide !== undefined;
    } else {
        return false;
    }
}

/**
 * Interface for every model, that should be projectable.
 */
export interface Projectable extends Displayable {
    getSlide(): ProjectorElementBuildDeskriptor;
}
