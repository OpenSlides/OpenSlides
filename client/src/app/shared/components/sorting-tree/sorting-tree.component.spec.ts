import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';
import { BehaviorSubject } from 'rxjs';

import { Identifiable } from 'app/shared/models/base/identifiable';
import { Displayable } from 'app/site/base/displayable';
import { SortingTreeComponent } from './sorting-tree.component';

/**
 * A test model for the sorting
 */
class TestModel implements Identifiable, Displayable {
    public constructor(
        public id: number,
        public name: string,
        public weight: number,
        public parent_id: number | null
    ) {}

    public getTitle = () => this.name;

    public getListTitle = () => this.getTitle();
}

describe('SortingTreeComponent', () => {
    @Component({
        selector: 'os-host-component',
        template: '<os-sorting-tree><os-sorting-tree>'
    })
    class TestHostComponent {
        @ViewChild(SortingTreeComponent, { static: true })
        public sortingTreeCompononent: SortingTreeComponent<TestModel>;
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
        const models: TestModel[] = [];
        for (let i = 0; i < 10; i++) {
            models.push(new TestModel(i, `TOP${i}`, i, null));
        }
        const modelSubject = new BehaviorSubject<TestModel[]>(models);
        hostComponent.sortingTreeCompononent.model = modelSubject.asObservable();

        hostFixture.detectChanges();
        expect(hostComponent.sortingTreeCompononent).toBeTruthy();
    });
});
