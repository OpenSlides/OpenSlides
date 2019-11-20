import { AssignmentPollSlideModule } from './assignment-poll-slide.module';

describe('AssignmentPollSlideModule', () => {
    let assignmentPollSlideModule: AssignmentPollSlideModule;

    beforeEach(() => {
        assignmentPollSlideModule = new AssignmentPollSlideModule();
    });

    it('should create an instance', () => {
        expect(assignmentPollSlideModule).toBeTruthy();
    });
});
