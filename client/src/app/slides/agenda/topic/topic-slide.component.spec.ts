import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TopicSlideComponent } from './topic-slide.component';
import { E2EImportsModule } from 'e2e-imports.module';

describe('TopicSlideComponent', () => {
    let component: TopicSlideComponent;
    let fixture: ComponentFixture<TopicSlideComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [TopicSlideComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TopicSlideComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
