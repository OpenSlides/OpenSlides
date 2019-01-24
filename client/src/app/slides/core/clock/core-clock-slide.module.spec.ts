import { CoreClockSlideModule } from './core-clock-slide.module';

describe('CoreClockSlideModule', () => {
    let coreClockSlideModule: CoreClockSlideModule;

    beforeEach(() => {
        coreClockSlideModule = new CoreClockSlideModule();
    });

    it('should create an instance', () => {
        expect(coreClockSlideModule).toBeTruthy();
    });
});
