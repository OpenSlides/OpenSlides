import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchValueSelectorComponent, Selectable } from './search-value-selector.component';
import { E2EImportsModule } from '../../../../e2e-imports.module';
import { ViewChild, Component } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FormControl, FormBuilder } from '@angular/forms';

describe('SearchValueSelectorComponent', () => {
    @Component({
        selector: 'os-host-component',
        template: '<os-search-value-selector></os-search-value-selector>'
    })
    class TestHostComponent {
        @ViewChild(SearchValueSelectorComponent)
        public searchValueSelectorComponent: SearchValueSelectorComponent;
    }

    let hostComponent: TestHostComponent;
    let hostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [TestHostComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        hostFixture = TestBed.createComponent(TestHostComponent);
        hostComponent = hostFixture.componentInstance;
    });

    it('should create', () => {
        const subject: BehaviorSubject<Selectable[]> = new BehaviorSubject([]);
        hostComponent.searchValueSelectorComponent.InputListValues = subject;

        const formBuilder: FormBuilder = TestBed.get(FormBuilder);
        const formGroup = formBuilder.group({
            testArray: []
        });
        hostComponent.searchValueSelectorComponent.form = formGroup;
        hostComponent.searchValueSelectorComponent.formControl = <FormControl>formGroup.get('testArray');

        hostFixture.detectChanges();
        expect(hostComponent.searchValueSelectorComponent).toBeTruthy();
    });
});
