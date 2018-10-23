import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TopicDetailComponent } from './topic-detail.component';
import { E2EImportsModule } from '../../../../../e2e-imports.module';

describe('TopicComponent', () => {
    let component: TopicDetailComponent;
    let fixture: ComponentFixture<TopicDetailComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [TopicDetailComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TopicDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
