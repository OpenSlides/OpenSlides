import { ItemListSlideModule } from './item-list-slide.module';

describe('ItemListSlideModule', () => {
    let itemListSlideModule: ItemListSlideModule;

    beforeEach(() => {
        itemListSlideModule = new ItemListSlideModule();
    });

    it('should create an instance', () => {
        expect(itemListSlideModule).toBeTruthy();
    });
});
