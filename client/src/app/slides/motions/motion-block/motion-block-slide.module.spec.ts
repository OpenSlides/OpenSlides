import { MotionBlockSlideModule } from './motion-block-slide.module';

describe('MotionBlockSlideModule', () => {
    let motionBlockSlideModule: MotionBlockSlideModule;

    beforeEach(() => {
        motionBlockSlideModule = new MotionBlockSlideModule();
    });

    it('should create an instance', () => {
        expect(motionBlockSlideModule).toBeTruthy();
    });
});
