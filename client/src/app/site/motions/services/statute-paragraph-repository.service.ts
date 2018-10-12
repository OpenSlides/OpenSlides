import { Injectable } from '@angular/core';
import { DataSendService } from '../../../core/services/data-send.service';
import { Observable } from 'rxjs';
import { DataStoreService } from '../../../core/services/data-store.service';
import { BaseRepository } from '../../base/base-repository';
import { ViewStatuteParagraph } from '../models/view-statute-paragraph';
import { StatuteParagraph } from '../../../shared/models/motions/statute-paragraph';

/**
 * Repository Services for statute paragraphs
 *
 * Rather than manipulating models directly, the repository is meant to
 * inform the {@link DataSendService} about changes which will send
 * them to the Server.
 */
@Injectable({
    providedIn: 'root'
})
export class StatuteParagraphRepositoryService extends BaseRepository<ViewStatuteParagraph, StatuteParagraph> {
    /**
     * Creates a StatuteParagraphRepository
     * Converts existing and incoming statute paragraphs to ViewStatuteParagraphs
     * Handles CRUD using an observer to the DataStore
     * @param DataSend
     */
    public constructor(protected DS: DataStoreService, private dataSend: DataSendService) {
        super(DS, StatuteParagraph);
    }

    protected createViewModel(statuteParagraph: StatuteParagraph): ViewStatuteParagraph {
        return new ViewStatuteParagraph(statuteParagraph);
    }

    public create(statuteParagraph: StatuteParagraph): Observable<any> {
        return this.dataSend.createModel(statuteParagraph);
    }

    public update(
        statuteParagraph: Partial<StatuteParagraph>,
        viewStatuteParagraph: ViewStatuteParagraph
    ): Observable<any> {
        const updateParagraph = viewStatuteParagraph.statuteParagraph;
        updateParagraph.patchValues(statuteParagraph);
        return this.dataSend.updateModel(updateParagraph, 'put');
    }

    public delete(viewStatuteParagraph: ViewStatuteParagraph): Observable<any> {
        return this.dataSend.delete(viewStatuteParagraph.statuteParagraph);
    }
}
