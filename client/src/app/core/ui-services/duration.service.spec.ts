import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { DurationService } from './duration.service';

describe('DurationService', () => {
    let service: DurationService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [DurationService]
        }),
            (service = TestBed.inject(DurationService));
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return a valid duration', () => {
        expect(service.durationToString(1, 'm')).toBe('0:01 m');
        expect(service.durationToString(23, 'm')).toBe('0:23 m');
        expect(service.durationToString(60, 'm')).toBe('1:00 m');
        expect(service.durationToString(65, 'm')).toBe('1:05 m');
        expect(service.durationToString(0, 'm')).toBe('0:00 m');
        expect(service.durationToString(-23, 'm')).toBe('-0:23 m');
        expect(service.durationToString(-65, 'm')).toBe('-1:05 m');
        expect(service.durationToString(null, null)).toBe('');
        expect(service.durationToString(NaN, 'h')).toBe('');
        expect(service.durationToString(Infinity, 'h')).toBe('');
        expect(service.durationToString(-Infinity, 'h')).toBe('');
    });
});
