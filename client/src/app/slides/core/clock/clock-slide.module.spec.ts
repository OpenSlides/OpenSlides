import { ClockSlideModule } from './clock-slide.module';

describe('ClockSlideModule', () => {
    let clockSlideModule: ClockSlideModule;

    beforeEach(() => {
        clockSlideModule = new ClockSlideModule();
    });

    it('should create an instance', () => {
        expect(clockSlideModule).toBeTruthy();
    });
});
