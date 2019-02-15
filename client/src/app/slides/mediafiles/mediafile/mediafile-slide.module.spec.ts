import { MediafileSlideModule } from './mediafile-slide.module';

describe('MediafileSlideModule', () => {
    let usersUserSlideModule: MediafileSlideModule;

    beforeEach(() => {
        usersUserSlideModule = new MediafileSlideModule();
    });

    it('should create an instance', () => {
        expect(usersUserSlideModule).toBeTruthy();
    });
});
