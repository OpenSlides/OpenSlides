import { Injectable } from '@angular/core';

import { BaseRepository } from '../../base/base-repository';
import { ViewMediafile } from '../models/view-mediafile';
import { Mediafile } from '../../../shared/models/mediafiles/mediafile';
import { User } from '../../../shared/models/users/user';
import { DataStoreService } from '../../../core/services/data-store.service';
import { Identifiable } from '../../../shared/models/base/identifiable';
import { CollectionStringModelMapperService } from '../../../core/services/collectionStringModelMapper.service';
import { DataSendService } from 'app/core/services/data-send.service';
import { HttpService } from 'app/core/services/http.service';
import { HttpHeaders } from '@angular/common/http';

/**
 * Repository for MediaFiles
 */
@Injectable({
    providedIn: 'root',
})
export class MediafileRepositoryService extends BaseRepository<ViewMediafile, Mediafile> {
    /**
     * Constructor for the mediafile repository
     * @param DS Data store
     * @param mapperService OpenSlides class mapping service
     * @param dataSend sending data to the server
     * @param httpService OpenSlides own http service
     */
    public constructor(
        DS: DataStoreService,
        mapperService: CollectionStringModelMapperService,
        private dataSend: DataSendService,
        private httpService: HttpService,
    ) {
        super(DS, mapperService, Mediafile, [User]);
    }

    /**
     * Alter a given mediaFile
     * Usually just i.e change the name and the hidden flag.
     *
     * @param file contains the new values
     * @param viewFile the file that should be updated
     */
    public async update(file: Partial<Mediafile>, viewFile: ViewMediafile): Promise<void> {
        const updateFile = new Mediafile();
        updateFile.patchValues(viewFile.mediafile);
        updateFile.patchValues(file);
        await this.dataSend.updateModel(updateFile);
    }

    /**
     * Deletes the given file from the server
     *
     * @param file the file to delete
     */
    public async delete(file: ViewMediafile): Promise<void> {
        return await this.dataSend.deleteModel(file.mediafile);
    }

    /**
     * Mediafiles are uploaded using FormData objects and (usually) not created locally.
     *
     * @param file a new mediafile
     * @returns the ID as a promise
     */
    public async create(file: Mediafile): Promise<Identifiable> {
        return await this.dataSend.createModel(file);
    }

    /**
     * Uploads a file to the server.
     * The HttpHeader should be Application/FormData, the empty header will
     * set the the required boundary automatically
     *
     * @param file created UploadData, containing a file
     * @returns the promise to a new mediafile.
     */
    public async uploadFile(file: FormData): Promise<Identifiable> {
        const restPath = `rest/mediafiles/mediafile/`;
        const emptyHeader = new HttpHeaders();
        return this.httpService.post<Identifiable>(restPath, file, {}, emptyHeader);
    }

    /**
     * Creates mediafile ViewModels out of given mediafile objects
     *
     * @param file mediafile to convert
     * @returns a new mediafile ViewModel
     */
    public createViewModel(file: Mediafile): ViewMediafile {
        const uploader = this.DS.get(User, file.uploader_id);
        return new ViewMediafile(file, uploader);
    }
}
