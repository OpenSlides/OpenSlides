export interface SlideItem {
    item_number: string;
    title_information: object;
    collection: string;
    depth: number;
}

export interface ItemListSlideData {
    items: SlideItem[];
}
