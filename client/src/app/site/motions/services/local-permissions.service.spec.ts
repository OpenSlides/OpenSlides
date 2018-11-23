import { TestBed } from '@angular/core/testing';

import { LocalPermissionsService } from './local-permissions.service';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('LocalPermissionsService', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [E2EImportsModule] }));

  it('should be created', () => {
    const service: LocalPermissionsService = TestBed.get(LocalPermissionsService);
    expect(service).toBeTruthy();
  });
});
