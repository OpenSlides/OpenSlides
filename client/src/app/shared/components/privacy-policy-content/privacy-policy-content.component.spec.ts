import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivacyPolicyContentComponent } from './privacy-policy-content.component';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('PrivacyPolicyComponent', () => {
    let component: PrivacyPolicyContentComponent;
    let fixture: ComponentFixture<PrivacyPolicyContentComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PrivacyPolicyContentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
