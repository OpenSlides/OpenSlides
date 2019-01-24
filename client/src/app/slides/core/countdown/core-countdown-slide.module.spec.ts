import { CoreCountdownSlideModule } from './core-countdown-slide.module';

describe('CoreCountdownSlideModule', () => {
    let coreCountdownSlideModule: CoreCountdownSlideModule;

    beforeEach(() => {
        coreCountdownSlideModule = new CoreCountdownSlideModule();
    });

    it('should create an instance', () => {
        expect(CoreCountdownSlideModule).toBeTruthy();
    });
});
