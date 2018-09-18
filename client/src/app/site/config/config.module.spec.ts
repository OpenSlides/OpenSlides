import { ConfigModule } from './config.module';

describe('SettingsModule', () => {
    let settingsModule: ConfigModule;

    beforeEach(() => {
        settingsModule = new ConfigModule();
    });

    it('should create an instance', () => {
        expect(settingsModule).toBeTruthy();
    });
});
