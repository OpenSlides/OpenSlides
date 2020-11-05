import { BaseModelWithListOfSpeakers } from '../base/base-model-with-list-of-speakers';

export class Poster extends BaseModelWithListOfSpeakers<Poster> {
    public static COLLECTIONSTRING = 'posters/poster';

    public id: number;
    public title: string;
    public xml: string;
    public published: boolean;

    public constructor(input?: any) {
        super(Poster.COLLECTIONSTRING, input);
    }
}
