import { TestBed, inject } from '@angular/core/testing';

import { WebsocketService } from './websocket.service';
import { E2EImportsModule } from '../../../e2e-imports.module';

describe('WebsocketService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [WebsocketService]
        });
    });

    it('should be created', inject([WebsocketService], (service: WebsocketService) => {
        expect(service).toBeTruthy();
    }));
});
