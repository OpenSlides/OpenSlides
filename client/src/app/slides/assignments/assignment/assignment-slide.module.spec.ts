import { AssignmentSlideModule } from './assignment-slide.module';

describe('AssignmentSlideModule', () => {
    let assignmentSlideModule: AssignmentSlideModule;

    beforeEach(() => {
        assignmentSlideModule = new AssignmentSlideModule();
    });

    it('should create an instance', () => {
        expect(assignmentSlideModule).toBeTruthy();
    });
});
