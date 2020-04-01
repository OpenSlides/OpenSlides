import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';

import { E2EImportsModule } from 'e2e-imports.module';

import { AgendaContentObjectFormComponent } from './agenda-content-object-form.component';

describe('AgendaContentObjectFormComponent', () => {
    let component: AgendaContentObjectFormComponent;
    let fixture: ComponentFixture<AgendaContentObjectFormComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AgendaContentObjectFormComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        const formBuilder: FormBuilder = TestBed.inject(FormBuilder);
        component.form = formBuilder.group({
            agenda_create: [''],
            agenda_parent_id: [],
            agenda_type: ['']
        });
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });
});
