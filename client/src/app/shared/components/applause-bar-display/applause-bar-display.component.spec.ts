import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { ApplauseBarDisplayComponent } from './applause-bar-display.component';

describe('ApplauseDisplayComponent', () => {
    let component: ApplauseBarDisplayComponent;
    let fixture: ComponentFixture<ApplauseBarDisplayComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ApplauseBarDisplayComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
