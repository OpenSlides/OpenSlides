import { MotionPollSlideModule } from './motion-poll-slide.module';

describe('MotionPollSlideModule', () => {
    let motionPollSlideModule: MotionPollSlideModule;

    beforeEach(() => {
        motionPollSlideModule = new MotionPollSlideModule();
    });

    it('should create an instance', () => {
        expect(motionPollSlideModule).toBeTruthy();
    });
});
