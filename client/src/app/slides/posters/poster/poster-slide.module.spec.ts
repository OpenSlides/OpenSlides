import { PosterSlideModule } from './poster-slide.module';

describe('TopicSlideModule', () => {
    let posterSlideModule: PosterSlideModule;

    beforeEach(() => {
        posterSlideModule = new PosterSlideModule();
    });

    it('should create an instance', () => {
        expect(posterSlideModule).toBeTruthy();
    });
});
