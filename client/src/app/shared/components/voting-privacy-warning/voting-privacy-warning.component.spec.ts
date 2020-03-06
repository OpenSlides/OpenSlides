import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { VotingPrivacyWarningComponent } from './voting-privacy-warning.component';

describe('VotingPrivacyWarningComponent', () => {
    let component: VotingPrivacyWarningComponent;
    let fixture: ComponentFixture<VotingPrivacyWarningComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(VotingPrivacyWarningComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
