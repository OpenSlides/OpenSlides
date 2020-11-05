import { SearchRepresentation } from 'app/core/ui-services/search.service';
import { Poster } from 'app/shared/models/posters/poster';
import { BaseViewModelWithListOfSpeakers } from 'app/site/base/base-view-model-with-list-of-speakers';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { Searchable } from 'app/site/base/searchable';

export interface PosterTitleInformation {
    title: string;
}

export class ViewPoster extends BaseViewModelWithListOfSpeakers<Poster> implements PosterTitleInformation, Searchable {
    public static COLLECTIONSTRING = Poster.COLLECTIONSTRING;
    protected _collectionString = Poster.COLLECTIONSTRING;

    public get poster(): Poster {
        return this._model;
    }

    public formatForSearch(): SearchRepresentation {
        return { properties: [{ key: 'Name', value: this.title }], searchValue: [this.title] };
    }

    public getDetailStateURL(): string {
        return `/posters/${this.id}`;
    }

    public getSlide(): ProjectorElementBuildDeskriptor {
        return {
            getBasicProjectorElement: options => ({
                name: Poster.COLLECTIONSTRING,
                id: this.id,
                getIdentifiers: () => ['name', 'id']
            }),
            slideOptions: [],
            projectionDefaultName: 'posters',
            getDialogTitle: () => this.getTitle()
        };
    }
}

export interface ViewPoster extends Poster {}
