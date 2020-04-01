import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { TopicImportService } from './topic-import.service';

describe('TopicImportService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: TopicImportService = TestBed.inject(TopicImportService);
        expect(service).toBeTruthy();
    });
});
