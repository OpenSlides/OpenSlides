import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MotionBlockListComponent } from './motion-block-list.component';
import { E2EImportsModule } from 'e2e-imports.module';

describe('MotionBlockListComponent', () => {
    let component: MotionBlockListComponent;
    let fixture: ComponentFixture<MotionBlockListComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [MotionBlockListComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MotionBlockListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
