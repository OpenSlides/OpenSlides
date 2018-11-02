import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MotionCommentsComponent } from './motion-comments.component';
import { E2EImportsModule } from '../../../../../e2e-imports.module';
import { MetaTextBlockComponent } from '../meta-text-block/meta-text-block.component';

describe('MotionCommentsComponent', () => {
    let component: MotionCommentsComponent;
    let fixture: ComponentFixture<MotionCommentsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [MetaTextBlockComponent, MotionCommentsComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MotionCommentsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
