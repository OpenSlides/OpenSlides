import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TopicsTopicSlideComponent } from './topics-topic-slide.component';
import { E2EImportsModule } from 'e2e-imports.module';

describe('TopicsTopicSlideComponent', () => {
    let component: TopicsTopicSlideComponent;
    let fixture: ComponentFixture<TopicsTopicSlideComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [TopicsTopicSlideComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TopicsTopicSlideComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
