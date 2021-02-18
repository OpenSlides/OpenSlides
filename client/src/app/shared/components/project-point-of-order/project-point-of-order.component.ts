import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { OperatorService } from 'app/core/core-services/operator.service';
import { Projector } from 'app/shared/models/core/projector';
import { ProjectorMessageRepositoryService } from 'app/core/repositories/projector/projector-message-repository.service';
import { ProjectorDataService } from 'app/core/core-services/projector-data.service';
import { HttpService } from 'app/core/core-services/http.service';
import { ProjectorMessage } from 'app/shared/models/core/projector-message';
import { ConfigService } from 'app/core/ui-services/config.service';

@Component({
    selector: 'os-project-point-of-order',
    templateUrl: './project-point-of-order.component.html',
    styleUrls: ['./project-point-of-order.component.scss']
})
export class ProjectPointOfOrderComponent extends BaseViewComponentDirective implements OnInit {
    public PointOfOrderSent = false;
    public PointOfOrders: [] = [];
    public selectPointOfOrder: string = '';
    private ProjectorsToProjectTo: [] = [];

    /**
     * Constructor
     * @param title Title service. Required by parent
     * @param matSnackBar Required by parent
     * @param configService Read out config variables
     * @param translate Required by parent
     * @param formBuilder To build the form
     * @param data The mat dialog data, contains the values to display (if any)
     */
    public constructor(
        matSnackBar: MatSnackBar,
        title: Title,
        translate: TranslateService,
        private configService: ConfigService,
        private http: HttpService,
        private operator: OperatorService,
        private projectorDataService: ProjectorDataService,
        private projectorMessageRepositoryService: ProjectorMessageRepositoryService
    ) {
        super(title, translate, matSnackBar);
    }

    public ngOnInit(): void {
        this.configService.get<string>('agenda_point_of_orders').subscribe(val => {
            this.PointOfOrders = JSON.parse(val);
        });
        this.configService.get<string>('agenda_point_of_order_projectors').subscribe(val => {
            this.ProjectorsToProjectTo = JSON.parse(val);
        });
    }

    public async sendPointOfOrder() {
        const message: any = new ProjectorMessage({
            message: `<p style="font-size: 45px;">GO-Antrag</p>\n<p style="font-size: 35px;">auf ${this.PointOfOrders[this.selectPointOfOrder]}<br>von ${this.operator.user.first_name} ${this.operator.user.last_name} gestellt`
        });
        const repoElement: any = await this.projectorMessageRepositoryService.create(message);
        let requestElement = {"stable": false, "name": "core/projector-message", "id":repoElement.id};

        for(let ele in this.ProjectorsToProjectTo) {
            try {
                let requestData: any = {};
                requestData.elements = [];

                let projector: Projector = new Projector({id: this.ProjectorsToProjectTo[ele]}); 
                let projectorData = await this.projectorDataService.getAvailableProjectorData(projector);

                if (projectorData) {
                    projectorData.forEach(entry => {
                        if (!entry.data.error) {
                            requestData.elements.push(entry.element);
                        }
                    });
                }
                             
                requestData.elements.push(requestElement);

                await this.http.post(`/rest/core/projector/${this.ProjectorsToProjectTo[ele]}/project/`, requestData);
            } catch (e) {
                this.raiseError(e);
            }
        }

        this.PointOfOrderSent = true;

        setTimeout(() => {
            this.PointOfOrderSent = false;
        }, 3000);
    }
}