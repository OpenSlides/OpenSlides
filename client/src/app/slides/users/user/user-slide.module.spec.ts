import { UserSlideModule } from './user-slide.module';

describe('UserSlideModule', () => {
    let userSlideModule: UserSlideModule;

    beforeEach(() => {
        userSlideModule = new UserSlideModule();
    });

    it('should create an instance', () => {
        expect(userSlideModule).toBeTruthy();
    });
});
