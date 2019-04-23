import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PollSlideComponent } from './poll-slide.component';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('PollSlideComponent', () => {
    let component: PollSlideComponent;
    let fixture: ComponentFixture<PollSlideComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [PollSlideComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PollSlideComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
