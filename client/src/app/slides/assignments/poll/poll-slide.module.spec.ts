import { PollSlideModule } from './poll-slide.module';

describe('PollSlideModule', () => {
    let pollSlideModule: PollSlideModule;

    beforeEach(() => {
        pollSlideModule = new PollSlideModule();
    });

    it('should create an instance', () => {
        expect(pollSlideModule).toBeTruthy();
    });
});
