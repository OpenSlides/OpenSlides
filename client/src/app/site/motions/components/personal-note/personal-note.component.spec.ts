import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalNoteComponent } from './personal-note.component';
import { E2EImportsModule } from 'e2e-imports.module';
import { MetaTextBlockComponent } from '../meta-text-block/meta-text-block.component';

describe('PersonalNoteComponent', () => {
    let component: PersonalNoteComponent;
    let fixture: ComponentFixture<PersonalNoteComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [MetaTextBlockComponent, PersonalNoteComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PersonalNoteComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
