import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { CallComponent } from './call.component';

describe('CallComponent', () => {
    let component: CallComponent;
    let fixture: ComponentFixture<CallComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [CallComponent],
            imports: [E2EImportsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CallComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
