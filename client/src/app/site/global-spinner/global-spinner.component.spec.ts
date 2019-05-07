import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GlobalSpinnerComponent } from './global-spinner.component';

describe('GlobalSpinnerComponent', () => {
    let component: GlobalSpinnerComponent;
    let fixture: ComponentFixture<GlobalSpinnerComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [GlobalSpinnerComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(GlobalSpinnerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
