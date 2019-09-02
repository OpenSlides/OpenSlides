export interface SlideSpeaker {
    user: string;
    marked: boolean;
}

export interface CommonListOfSpeakersSlideData {
    waiting?: SlideSpeaker[];
    current?: SlideSpeaker;
    finished?: SlideSpeaker[];
    title_information?: object;
    content_object_collection?: string;
}
