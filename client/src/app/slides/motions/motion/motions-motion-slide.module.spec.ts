import { MotionsMotionSlideModule } from './motions-motion-slide.module';

describe('MotionsMotionSlideModule', () => {
    let motionsMotionSlideModule: MotionsMotionSlideModule;

    beforeEach(() => {
        motionsMotionSlideModule = new MotionsMotionSlideModule();
    });

    it('should create an instance', () => {
        expect(motionsMotionSlideModule).toBeTruthy();
    });
});
