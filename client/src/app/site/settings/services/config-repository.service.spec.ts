import { TestBed } from '@angular/core/testing';

import { ConfigRepositoryService } from './config-repository.service';

describe('SettingsRepositoryService', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('should be created', () => {
        const service: ConfigRepositoryService = TestBed.get(ConfigRepositoryService);
        expect(service).toBeTruthy();
    });
});
