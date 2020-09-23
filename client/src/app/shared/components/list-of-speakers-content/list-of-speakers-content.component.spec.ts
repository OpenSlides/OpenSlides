import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { ListOfSpeakersContentComponent } from './list-of-speakers-content.component';

describe('ListOfSpeakersContentComponent', () => {
    let component: ListOfSpeakersContentComponent;
    let fixture: ComponentFixture<ListOfSpeakersContentComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ListOfSpeakersContentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
