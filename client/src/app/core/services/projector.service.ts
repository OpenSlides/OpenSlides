import { Injectable } from '@angular/core';

import { OpenSlidesComponent } from 'app/openslides.component';
import { Projectable } from 'app/site/base/projectable';
import { DataStoreService } from './data-store.service';
import { Projector, ProjectorElement } from 'app/shared/models/core/projector';
import { DataSendService } from './data-send.service';

/**
 * This service cares about Projectables being projected and manage all projection-related
 * actions.
 *
 * We cannot access the ProjectorRepository here, so we will deal with plain projector objects.
 */
@Injectable({
    providedIn: 'root'
})
export class ProjectorService extends OpenSlidesComponent {
    /**
     * Constructor.
     *
     * @param DS
     * @param dataSend
     */
    public constructor(private DS: DataStoreService, private dataSend: DataSendService) {
        super();
    }

    /**
     * Checks, if a given object is projected.
     *
     * @param obj The object in question
     * @returns true, if the object is projected on one projector.
     */
    public isProjected(obj: Projectable): boolean {
        return this.DS.getAll<Projector>('core/projector').some(projector => {
            return projector.isElementShown(obj.getNameForSlide(), obj.getIdForSlide());
        });
    }

    /**
     * Get all projectors where the object is prejected on.
     *
     * @param obj The object in question
     * @return All projectors, where this Object is projected on
     */
    public getProjectorsWhichAreProjecting(obj: Projectable): Projector[] {
        return this.DS.getAll<Projector>('core/projector').filter(projector => {
            return projector.isElementShown(obj.getNameForSlide(), obj.getIdForSlide());
        });
    }

    /**
     * Checks, if the object is projected on the given projector.
     *
     * @param obj The object
     * @param projector The projector to test
     * @returns true, if the object is projected on the projector.
     */
    public isProjectedOn(obj: Projectable, projector: Projector): boolean {
        return projector.isElementShown(obj.getNameForSlide(), obj.getIdForSlide());
    }

    /**
     * Projects the given ProjectorElement on the given projectors.
     *
     * TODO: this does not care about the element being stable. Some more logic must be added later.
     *
     * On the given projectors: Delete all non-stable elements and add the given element.
     * On all other projectors: If the element (compared with name and id) is there, it will be deleted.
     *
     * @param projectors All projectors where to add the element.
     * @param element The element in question.
     */
    public projectOn<T extends ProjectorElement>(projectors: Projector[], element: T): void {
        const changedProjectors: Projector[] = [];
        this.DS.getAll<Projector>('core/projector').forEach(projector => {
            if (projectors.includes(projector)) {
                projector.removeAllNonStableElements();
                projector.addElement(element);
                changedProjectors.push(projector);
            } else if (projector.isElementShown(element.name, element.id)) {
                projector.removeElementByNameAndId(element.name, element.id);
                changedProjectors.push(projector);
            }
        });

        // TODO: Use new 'project' route.
        changedProjectors.forEach(projector => {
            this.dataSend.updateModel(projector);
        });
    }

    /**
     * Given a projectiondefault, we want to retrieve the projector, that is assigned
     * to this default.
     *
     * @param projectiondefault The projection default
     * @return the projector associated to the given projectiondefault.
     */
    public getProjectorForDefault(projectiondefault: string): Projector {
        return this.DS.getAll<Projector>('core/projector').find(projector => {
            return projector.projectiondefaults.map(pd => pd.name).includes(projectiondefault);
        });
    }
}
