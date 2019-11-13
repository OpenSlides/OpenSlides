export interface SlideItem {
    title_information: {
        collection: string;
        depth: number;
        _agenda_item_number: string;
        agenda_item_number: () => string;
    };
    collection: string;
    depth: number;
}

export interface ItemListSlideData {
    items: SlideItem[];
}
