import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LegalNoticeContentComponent } from './legal-notice-content.component';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('LegalNoticeComponent', () => {
    let component: LegalNoticeContentComponent;
    let fixture: ComponentFixture<LegalNoticeContentComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(LegalNoticeContentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
