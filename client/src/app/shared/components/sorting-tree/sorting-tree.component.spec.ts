import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { E2EImportsModule } from '../../../../e2e-imports.module';
import { SortingTreeComponent } from './sorting-tree.component';
import { Component, ViewChild } from '@angular/core';
import { Displayable } from 'app/shared/models/base/displayable';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { BehaviorSubject } from 'rxjs';

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

    public getTitle(): string {
        return this.name;
    }

    public getListTitle(): string {
        return this.getTitle();
    }
}

describe('SortingTreeComponent', () => {
    @Component({
        selector: 'os-host-component',
        template: '<os-sorting-tree><os-sorting-tree>'
    })
    class TestHostComponent {
        @ViewChild(SortingTreeComponent)
        public sortingTreeCompononent: SortingTreeComponent<TestModel>;
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
        const models: TestModel[] = [];
        for (let i = 0; i < 10; i++) {
            models.push(new TestModel(i, `TOP${i}`, i, null));
        }
        const modelSubject = new BehaviorSubject<TestModel[]>(models);
        hostComponent.sortingTreeCompononent.modelsObservable = modelSubject.asObservable();

        hostFixture.detectChanges();
        expect(hostComponent.sortingTreeCompononent).toBeTruthy();
    });
});
