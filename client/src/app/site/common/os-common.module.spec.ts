import { OsCommonModule } from './os-common.module';

describe('OsCommonModule', () => {
    let osCommonModule: OsCommonModule;

    beforeEach(() => {
        osCommonModule = new OsCommonModule();
    });

    it('should create an instance', () => {
        expect(osCommonModule).toBeTruthy();
    });
});
