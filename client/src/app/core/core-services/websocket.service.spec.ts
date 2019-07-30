import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../e2e-imports.module';
import { WebsocketService } from './websocket.service';

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
