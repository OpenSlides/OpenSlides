import { Component, Input, OnInit } from '@angular/core';

/**
 * Describes, how one breadcrumb can look like.
 */
export interface Breadcrumb {
    label: string;
    action: () => any;
    active?: boolean;
}

@Component({
    selector: 'os-breadcrumb',
    templateUrl: './breadcrumb.component.html',
    styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent implements OnInit {
    /**
     * A list of all breadcrumbs, that should be rendered.
     *
     * @param labels A list of strings or the interface `Breadcrumb`.
     */
    @Input()
    public set breadcrumbs(labels: string[] | Breadcrumb[]) {
        this.breadcrumbList = [];

        // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-3.html#caveats
        for (const breadcrumb of labels) {
            if (typeof breadcrumb === 'string') {
                this.breadcrumbList.push({ label: breadcrumb, action: null });
            } else {
                this.breadcrumbList.push(breadcrumb);
            }
        }
    }

    /**
     * The current active index, if not the last one.
     *
     * @param index The index as number.
     */
    @Input()
    public set activeIndex(index: number) {
        for (const breadcrumb of this.breadcrumbList) {
            breadcrumb.active = false;
        }
        this.breadcrumbList[index].active = true;
    }

    /**
     * The list of the breadcrumbs built by the input.
     */
    public breadcrumbList: Breadcrumb[] = [];

    /**
     * Default constructor.
     */
    public constructor() {}

    /**
     * OnInit.
     * Sets the last breadcrumb as the active breadcrumb if not defined before.
     */
    public ngOnInit(): void {
        if (this.breadcrumbList.length && !this.breadcrumbList.some(breadcrumb => breadcrumb.active)) {
            this.breadcrumbList[this.breadcrumbList.length - 1].active = true;
        }
    }
}
