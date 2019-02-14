import { CountdownSlideModule } from './countdown-slide.module';

describe('CountdownSlideModule', () => {
    let countdownSlideModule: CountdownSlideModule;

    beforeEach(() => {
        countdownSlideModule = new CountdownSlideModule();
    });

    it('should create an instance', () => {
        expect(countdownSlideModule).toBeTruthy();
    });
});
