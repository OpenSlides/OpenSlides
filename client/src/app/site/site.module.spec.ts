import { SiteModule } from './site.module';

describe('SiteModule', () => {
    let siteModule: SiteModule;

    beforeEach(() => {
        siteModule = new SiteModule();
    });

    it('should create an instance', () => {
        expect(siteModule).toBeTruthy();
    });
});
