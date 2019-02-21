import { CurrentListOfSpeakersOverlaySlideModule } from './current-list-of-speakers-overlay-slide.module';

describe('CurrentListOfSpeakersOverlaySlideModule', () => {
    let currentListOfSpeakersOverlaySlideModule: CurrentListOfSpeakersOverlaySlideModule;

    beforeEach(() => {
        currentListOfSpeakersOverlaySlideModule = new CurrentListOfSpeakersOverlaySlideModule();
    });

    it('should create an instance', () => {
        expect(currentListOfSpeakersOverlaySlideModule).toBeTruthy();
    });
});
