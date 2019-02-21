import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListOfSpeakersSlideComponent } from './list-of-speakers-slide.component';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('ListOfSpeakersSlideComponent', () => {
    let component: ListOfSpeakersSlideComponent;
    let fixture: ComponentFixture<ListOfSpeakersSlideComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [ListOfSpeakersSlideComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ListOfSpeakersSlideComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
