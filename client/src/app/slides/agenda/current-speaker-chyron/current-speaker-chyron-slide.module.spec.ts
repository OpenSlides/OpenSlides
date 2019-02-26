import { CurrentSpeakerChyronSlideModule } from './current-speaker-chyron-slide.module';

describe('CurrentSpeakerChyronSlideModule', () => {
    let currentSpeakerChyronSlideModule: CurrentSpeakerChyronSlideModule;

    beforeEach(() => {
        currentSpeakerChyronSlideModule = new CurrentSpeakerChyronSlideModule();
    });

    it('should create an instance', () => {
        expect(currentSpeakerChyronSlideModule).toBeTruthy();
    });
});
