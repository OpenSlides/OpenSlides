import { AssignmentSlideModule } from './assignment-slide.module';

describe('UsersUserSlideModule', () => {
    let usersUserSlideModule: AssignmentSlideModule;

    beforeEach(() => {
        usersUserSlideModule = new AssignmentSlideModule();
    });

    it('should create an instance', () => {
        expect(usersUserSlideModule).toBeTruthy();
    });
});
