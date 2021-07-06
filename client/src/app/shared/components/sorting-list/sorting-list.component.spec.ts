import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { E2EImportsModule } from '../../../../e2e-imports.module';
import { EmptySelectable } from '../empty-selectable';
import { Selectable } from '../selectable';
import { SortingListComponent } from './sorting-list.component';

describe('SortingListComponent', () => {
    @Component({
        selector: 'os-host-component',
        template: '<os-sorting-list><os-sorting-list>'
    })
    class TestHostComponent {
        @ViewChild(SortingListComponent, { static: true })
        public sortingListCompononent: SortingListComponent;
    }

    let hostComponent: TestHostComponent;
    let hostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule],
                declarations: [TestHostComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        hostFixture = TestBed.createComponent(TestHostComponent);
        hostComponent = hostFixture.componentInstance;
    });

    it('should create', () => {
        const inputList: Selectable[] = [];
        for (let index = 0; index < 20; index++) {
            inputList.push(new EmptySelectable());
        }
        hostComponent.sortingListCompononent.input = inputList;

        hostFixture.detectChanges();
        expect(hostComponent.sortingListCompononent).toBeTruthy();
    });
});
