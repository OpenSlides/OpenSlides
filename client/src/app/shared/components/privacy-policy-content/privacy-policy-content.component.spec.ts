import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { E2EImportsModule } from '../../../../e2e-imports.module';
import { PrivacyPolicyContentComponent } from './privacy-policy-content.component';

describe('PrivacyPolicyComponent', () => {
    let component: PrivacyPolicyContentComponent;
    let fixture: ComponentFixture<PrivacyPolicyContentComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(PrivacyPolicyContentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
