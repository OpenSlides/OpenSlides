import { ListOfSpeakersSlideModule } from './list-of-speakers-slide.module';

describe('ListOfSpeakersSlideModule', () => {
    let listOfSpeakersSlideModule: ListOfSpeakersSlideModule;

    beforeEach(() => {
        listOfSpeakersSlideModule = new ListOfSpeakersSlideModule();
    });

    it('should create an instance', () => {
        expect(listOfSpeakersSlideModule).toBeTruthy();
    });
});
