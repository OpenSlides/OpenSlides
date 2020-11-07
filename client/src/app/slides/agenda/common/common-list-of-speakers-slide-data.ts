export interface SlideSpeaker {
    user: string;
    marked: boolean;
    point_of_order: boolean;
}

export interface CommonListOfSpeakersSlideData {
    waiting?: SlideSpeaker[];
    current?: SlideSpeaker;
    finished?: SlideSpeaker[];
    title_information?: {
        _agenda_item_number: string;
        agend_item_number: () => string;
        [key: string]: any;
    };
    content_object_collection?: string;
    closed?: boolean;
}
