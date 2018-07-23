import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MotionListComponent } from './motion-list.component';

describe('MotionListComponent', () => {
    let component: MotionListComponent;
    let fixture: ComponentFixture<MotionListComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [MotionListComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MotionListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
