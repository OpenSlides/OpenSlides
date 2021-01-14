import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { BaseModel } from 'app/shared/models/base/base-model';
import { ProjectionDefault } from 'app/shared/models/core/projection-default';
import {
    elementIdentifies,
    IdentifiableProjectorElement,
    Projector,
    ProjectorElement,
    ProjectorElements
} from 'app/shared/models/core/projector';
import { BaseProjectableViewModel } from 'app/site/base/base-projectable-view-model';
import {
    isProjectable,
    isProjectorElementBuildDeskriptor,
    Projectable,
    ProjectorElementBuildDeskriptor
} from 'app/site/base/projectable';
import { SlideManager } from 'app/slides/services/slide-manager.service';
import { ConfigService } from '../ui-services/config.service';
import { DataStoreService } from './data-store.service';
import { HttpService } from './http.service';
import { ProjectorDataService } from './projector-data.service';
import { ViewModelStoreService } from './view-model-store.service';

export interface ProjectorTitle {
    title: string;
    subtitle?: string;
}

/**
 * This service cares about Projectables being projected and manage all projection-related
 * actions.
 *
 * We cannot access the ProjectorRepository here, so we will deal with plain projector objects.
 */
@Injectable({
    providedIn: 'root'
})
export class ProjectorService {
    public constructor(
        private DS: DataStoreService,
        private http: HttpService,
        private slideManager: SlideManager,
        private viewModelStore: ViewModelStoreService,
        private translate: TranslateService,
        private configService: ConfigService,
        private projectorDataService: ProjectorDataService
    ) {}

    /**
     * Retusn the identifiable projector element from the given types of slides/elements/descriptors
     *
     * @param obj Something related to IdentifiableProjectorElement
     * @returns the identifiable projector element from obj.
     */
    private getProjectorElement(
        obj: Projectable | ProjectorElementBuildDeskriptor | IdentifiableProjectorElement
    ): IdentifiableProjectorElement {
        if (isProjectable(obj)) {
            return obj.getSlide(this.configService).getBasicProjectorElement({});
        } else if (isProjectorElementBuildDeskriptor(obj)) {
            return obj.getBasicProjectorElement({});
        } else {
            return obj;
        }
    }

    /**
     * Checks, if a given object is projected.
     *
     * @param obj The object in question
     * @returns true, if the object is projected on one projector.
     */
    public isProjected(obj: Projectable | ProjectorElementBuildDeskriptor | IdentifiableProjectorElement): boolean {
        const element = this.getProjectorElement(obj);
        if (element.getIdentifiers) {
            return this.DS.getAll<Projector>('core/projector').some(projector => {
                return projector.isElementShown(element);
            });
        }
        return false;
    }

    /**
     * Get all projectors where the object is prejected on.
     *
     * @param obj The object in question
     * @return All projectors, where this Object is projected on
     */
    public getProjectorsWhichAreProjecting(
        obj: Projectable | ProjectorElementBuildDeskriptor | IdentifiableProjectorElement
    ): Projector[] {
        const element = this.getProjectorElement(obj);
        return this.DS.getAll<Projector>('core/projector').filter(projector => {
            return projector.isElementShown(element);
        });
    }

    /**
     * Checks, if the object is projected on the given projector.
     *
     * @param obj The object
     * @param projector The projector to test
     * @returns true, if the object is projected on the projector.
     */
    public isProjectedOn(
        obj: Projectable | ProjectorElementBuildDeskriptor | IdentifiableProjectorElement,
        projector: Projector
    ): boolean {
        return projector.isElementShown(this.getProjectorElement(obj));
    }

    /**
     * Projects the given ProjectorElement on the given projectors. Removes the element
     * from all non-given projectors
     *
     * @param projectors All projectors where to add the element.
     * @param element The element in question.
     */
    public projectOnMultiple(projectors: Projector[], element: IdentifiableProjectorElement): void {
        this.DS.getAll<Projector>('core/projector').forEach(projector => {
            if (projectors.includes(projector)) {
                this.projectOn(projector, element);
            } else if (projector.isElementShown(element)) {
                this.removeFrom(projector, element);
            }
        });
    }

    /**
     * Projcets the given object on the projector. If the object is non-stable, all other non-stable
     * elements will be removed and added to the history.
     *
     * @param projector The projector to add the object to.
     * @param obj The object to project
     */
    public async projectOn(
        projector: Projector,
        obj: Projectable | ProjectorElementBuildDeskriptor | IdentifiableProjectorElement
    ): Promise<void> {
        const element = this.getProjectorElement(obj);

        if (element.stable) {
            // remove the same element, if it is currently projected
            projector.removeElements(element);
            // Add this stable element
            projector.addElement(element);
            await this.projectRequest(projector, projector.elements);
        } else {
            // For non-stable elements remove all other non-stable elements, add them to the history and
            // add the one new element to the projector.
            const removedElements = projector.removeAllNonStableElements();
            let changed = removedElements.length > 0;

            if (element) {
                projector.addElement(element);
                changed = true;
            }
            if (changed) {
                await this.projectRequest(projector, projector.elements, null, removedElements, false, true);
            }
        }
    }

    /**
     * Removes the given object from the projector. Non stable elements will be added to the history.
     *
     * @param projector The projector
     * @param obj the object to unproject
     */
    public async removeFrom(
        projector: Projector,
        obj: Projectable | ProjectorElementBuildDeskriptor | IdentifiableProjectorElement
    ): Promise<void> {
        const element = this.getProjectorElement(obj);

        const removedElements = projector.removeElements(element);
        if (removedElements.length > 0) {
            if (element.stable) {
                await this.projectRequest(projector, projector.elements);
            } else {
                // For non-stable elements: Add removed elements to the history.
                await this.projectRequest(projector, projector.elements, null, removedElements);
            }
        }
    }

    public async updateElement(
        projector: Projector,
        obj: Projectable | ProjectorElementBuildDeskriptor | IdentifiableProjectorElement
    ): Promise<void> {
        const element = this.getProjectorElement(obj);
        projector.replaceElements(element);
        await this.projectRequest(projector, projector.elements, projector.elements_preview);
    }

    /**
     * Executes the request to change projector elements.
     *
     * Note: Just one of `appendToHistory` and `deleteLastHistoryElement` can be given.
     *
     * @param projector The affected projector
     * @param elements (optional) Elements to set.
     * @param preview (optional) preview to set
     * @param appendToHistory (optional) Elements to be appended to the history
     * @param deleteLastHistroyElement (optional) If given, the last history element will be removed.
     */
    private async projectRequest(
        projector: Projector,
        elements?: ProjectorElements,
        preview?: ProjectorElements,
        appendToHistory?: ProjectorElements,
        deleteLastHistroyElement?: boolean,
        resetScroll?: boolean
    ): Promise<void> {
        const requestData: any = {};
        if (elements) {
            requestData.elements = this.cleanupElements(projector, elements);
        }
        if (preview) {
            requestData.preview = preview;
        }
        if (appendToHistory && appendToHistory.length) {
            requestData.append_to_history = appendToHistory;
        }
        if (deleteLastHistroyElement) {
            requestData.delete_last_history_element = true;
        }
        if (appendToHistory && appendToHistory.length && deleteLastHistroyElement) {
            throw new Error('You cannot append to the history and delete the last element at the same time');
        }
        if (resetScroll) {
            requestData.reset_scroll = resetScroll;
        }
        await this.http.post(`/rest/core/projector/${projector.id}/project/`, requestData);
    }

    /**
     * Cleans up stable elements with errors from the projector
     *
     * @param projector The projector
     * @param elements The elements to clean up
     * @reutns the cleaned up elements.
     */
    private cleanupElements(projector: Projector, elements: ProjectorElements): ProjectorElements {
        const projectorData = this.projectorDataService.getAvailableProjectorData(projector);

        if (projectorData) {
            projectorData.forEach(entry => {
                if (entry.data.error && entry.element.stable) {
                    // Remove this element
                    const idElementToRemove = this.slideManager.getIdentifiableProjectorElement(entry.element);
                    elements = elements.filter(element => {
                        return !elementIdentifies(idElementToRemove, element);
                    });
                }
            });
        }

        return elements;
    }

    /**
     * Given a projectiondefault, we want to retrieve the projector, that is assigned
     * to this default.
     *
     * @param projectiondefault The projection default
     * @return the projector associated to the given projectiondefault.
     */
    public getProjectorForDefault(projectiondefault: string): Projector | null {
        const pd = this.DS.find(ProjectionDefault, _pd => _pd.name === projectiondefault);
        if (pd) {
            return this.DS.get<Projector>(Projector, pd.projector_id);
        } else {
            return null;
        }
    }

    /**
     * Asserts, that the given element is mappable to a model or view model.
     * Throws an error, if this assertion fails.
     *
     * @param element The element to check
     */
    private assertElementIsMappable(element: IdentifiableProjectorElement): void {
        if (!this.slideManager.canSlideBeMappedToModel(element.name)) {
            throw new Error('This projector element cannot be mapped to a model');
        }
        const identifiers = element.getIdentifiers();
        if (!identifiers.includes('name') || !identifiers.includes('id')) {
            throw new Error('To map this element to a model, a name and id is needed.');
        }
    }

    /**
     * Returns a model associated with the identifiable projector element. Throws an error,
     * if the element is not mappable.
     *
     * @param element The projector element
     * @returns the model from the projector element
     */
    public getModelFromProjectorElement<T extends BaseModel>(element: IdentifiableProjectorElement): T {
        this.assertElementIsMappable(element);
        return this.DS.get<T>(element.name, element.id);
    }

    /**
     * Returns a view model associated with the identifiable projector element. Throws an error,
     * if the element is not mappable.
     *
     * @param element The projector element
     * @returns the view model from the projector element
     */
    public getViewModelFromIdentifiableProjectorElement<T extends BaseProjectableViewModel>(
        element: IdentifiableProjectorElement
    ): T {
        this.assertElementIsMappable(element);
        const viewModel = this.viewModelStore.get<T>(element.name, element.id);
        if (viewModel && !isProjectable(viewModel)) {
            console.error('The view model is not projectable', viewModel, element);
        }
        return viewModel;
    }

    public getViewModelFromProjectorElement<T extends BaseProjectableViewModel>(element: ProjectorElement): T {
        const idElement = this.slideManager.getIdentifiableProjectorElement(element);
        return this.getViewModelFromIdentifiableProjectorElement(idElement);
    }

    /**
     */
    public getSlideTitle(element: ProjectorElement): ProjectorTitle {
        if (this.slideManager.canSlideBeMappedToModel(element.name)) {
            const viewModel = this.getViewModelFromProjectorElement(element);
            if (viewModel) {
                return viewModel.getProjectorTitle();
            }
        }
        const configuration = this.slideManager.getSlideConfiguration(element.name);
        if (configuration.getSlideTitle) {
            return configuration.getSlideTitle(element, this.translate, this.viewModelStore);
        }

        return { title: this.translate.instant(this.slideManager.getSlideVerboseName(element.name)) };
    }

    /**
     * Projects the next slide in the queue. Moves all currently projected
     * non-stable slides to the history.
     *
     * @param projector The projector
     */
    public async projectNextSlide(projector: Projector): Promise<void> {
        await this.projectPreviewSlide(projector, 0);
    }

    /**
     * Projects one slide (given by the index of the preview) on the given projector. Moves
     * all current projected non-stable elements to the history.
     *
     * @param projector The projector
     * @param previewIndex The index in the `elements_preview` array.
     */
    public async projectPreviewSlide(projector: Projector, previewIndex: number): Promise<void> {
        if (projector.elements_preview.length === 0 || previewIndex >= projector.elements_preview.length) {
            return;
        }

        const removedElements = projector.removeAllNonStableElements();
        projector.addElement(projector.elements_preview.splice(previewIndex, 1)[0]);
        await this.projectRequest(
            projector,
            projector.elements,
            projector.elements_preview,
            removedElements,
            false,
            true
        );
    }

    /**
     * Projects the last slide of the history. This slide will be removed from the history.
     *
     * @param projector The projector
     */
    public async projectPreviousSlide(projector: Projector): Promise<void> {
        if (projector.elements_history.length === 0) {
            return;
        }
        // Get the last element from the history
        const lastElements: ProjectorElements = projector.elements_history[projector.elements_history.length - 1];
        let lastElement: ProjectorElement = null;
        if (lastElements.length > 0) {
            lastElement = lastElements[0];
        }

        // Add all current elements to the preview.
        const removedElements = projector.removeAllNonStableElements();
        removedElements.forEach(e => projector.elements_preview.unshift(e));

        // Add last element
        if (lastElement) {
            projector.addElement(lastElement);
        }
        await this.projectRequest(projector, projector.elements, projector.elements_preview, null, true, true);
    }

    /**
     * Saves the preview of the projector
     *
     * @param projector The projector to save the preview.
     */
    public async savePreview(projector: Projector): Promise<void> {
        await this.projectRequest(projector, null, projector.elements_preview);
    }

    /**
     * Appends the given element to the preview.
     *
     * @param projector The projector
     * @param element The element to add to the preview.
     */
    public async addElementToPreview(projector: Projector, element: ProjectorElement): Promise<void> {
        projector.elements_preview.push(element);
        await this.projectRequest(projector, null, projector.elements_preview);
    }
}
