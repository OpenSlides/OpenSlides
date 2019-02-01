import { TestBed, inject } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';
import { ChatMessageRepositoryService } from './chatmessage-repository.service';

describe('ChatMessageRepositoryService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [ChatMessageRepositoryService]
        });
    });

    it('should be created', inject([ChatMessageRepositoryService], (service: ChatMessageRepositoryService) => {
        expect(service).toBeTruthy();
    }));
});
