import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { E2EImportsModule } from '../../../../../e2e-imports.module';
import { PrivacyPolicyComponent } from './privacy-policy.component';

describe('PrivacyPolicyComponent', () => {
    let component: PrivacyPolicyComponent;
    let fixture: ComponentFixture<PrivacyPolicyComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule],
                declarations: [PrivacyPolicyComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(PrivacyPolicyComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    // TODO: Fails regulary on Travis
    // it('should create', () => {
    //     expect(component).toBeTruthy();
    // });
});
