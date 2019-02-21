import { MotionSlideModule } from './motion-slide.module';

describe('MotionSlideModule', () => {
    let motionSlideModule: MotionSlideModule;

    beforeEach(() => {
        motionSlideModule = new MotionSlideModule();
    });

    it('should create an instance', () => {
        expect(motionSlideModule).toBeTruthy();
    });
});
