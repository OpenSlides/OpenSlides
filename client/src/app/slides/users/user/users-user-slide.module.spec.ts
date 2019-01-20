import { UsersUserSlideModule } from './users-user-slide.module';

describe('UsersUserSlideModule', () => {
    let usersUserSlideModule: UsersUserSlideModule;

    beforeEach(() => {
        usersUserSlideModule = new UsersUserSlideModule();
    });

    it('should create an instance', () => {
        expect(usersUserSlideModule).toBeTruthy();
    });
});
