import { CurrentListOfSpeakersSlideModule } from './current-list-of-speakers-slide.module';

describe('CurrentListOfSpeakersSlideModule', () => {
    let currentListOfSpeakersSlideModule: CurrentListOfSpeakersSlideModule;

    beforeEach(() => {
        currentListOfSpeakersSlideModule = new CurrentListOfSpeakersSlideModule();
    });

    it('should create an instance', () => {
        expect(currentListOfSpeakersSlideModule).toBeTruthy();
    });
});
