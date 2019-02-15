interface SlideSpeaker {
    user: string;
    marked: boolean;
}

export interface ListOfSpeakersSlideData {
    waiting: SlideSpeaker[];
    current: SlideSpeaker;
    finished: SlideSpeaker[];
    title_information: object;
    content_object_collection: string;
    item_number: string;
}
