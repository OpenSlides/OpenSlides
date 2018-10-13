import { AssignmentsModule } from './assignments.module';

describe('AssignmentsModule', () => {
    let assignmentsModule: AssignmentsModule;

    beforeEach(() => {
        assignmentsModule = new AssignmentsModule();
    });

    it('should create an instance', () => {
        expect(assignmentsModule).toBeTruthy();
    });
});
