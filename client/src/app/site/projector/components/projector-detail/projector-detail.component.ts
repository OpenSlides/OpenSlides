import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';

import { ProjectorRepositoryService, ScrollScaleDirection } from '../../services/projector-repository.service';
import { ViewProjector } from '../../models/view-projector';
import { BaseViewComponent } from 'app/site/base/base-view';

/**
 * The projector detail view.
 */
@Component({
    selector: 'os-projector-detail',
    templateUrl: './projector-detail.component.html',
    styleUrls: ['./projector-detail.component.scss']
})
export class ProjectorDetailComponent extends BaseViewComponent implements OnInit {
    /**
     * The projector to show.
     */
    public projector: ViewProjector;

    public scrollScaleDirection = ScrollScaleDirection;

    /**
     * @param titleService
     * @param translate
     * @param matSnackBar
     * @param repo
     * @param route
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private repo: ProjectorRepositoryService,
        private route: ActivatedRoute
    ) {
        super(titleService, translate, matSnackBar);
    }

    /**
     * Gets the projector and subscribes to it.
     */
    public ngOnInit(): void {
        super.setTitle('Projector');
        this.route.params.subscribe(params => {
            const projectorId = parseInt(params.id, 10) || 1;
            this.repo.getViewModelObservable(projectorId).subscribe(projector => (this.projector = projector));
        });
    }

    /**
     * Change the scroll
     * @param direction The direction to send.
     */
    public scroll(direction: ScrollScaleDirection): void {
        this.repo.scroll(this.projector, direction).then(null, this.raiseError);
    }

    /**
     * Change the scale
     * @param direction The direction to send.
     */
    public scale(direction: ScrollScaleDirection): void {
        this.repo.scale(this.projector, direction).then(null, this.raiseError);
    }
}
