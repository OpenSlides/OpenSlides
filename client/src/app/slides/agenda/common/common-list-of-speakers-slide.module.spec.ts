import { CommonListOfSpeakersSlideModule } from './common-list-of-speakers-slide.module';

describe('CommonListOfSpeakersSlideModule', () => {
    let commonListOfSpeakersSlideModule: CommonListOfSpeakersSlideModule;

    beforeEach(() => {
        commonListOfSpeakersSlideModule = new CommonListOfSpeakersSlideModule();
    });

    it('should create an instance', () => {
        expect(commonListOfSpeakersSlideModule).toBeTruthy();
    });
});
