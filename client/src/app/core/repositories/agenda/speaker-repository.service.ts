import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { HttpService } from 'app/core/core-services/http.service';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { Item } from 'app/shared/models/agenda/item';
import { Speaker } from 'app/shared/models/agenda/speaker';
import { ViewSpeaker } from 'app/site/agenda/models/view-speaker';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { ViewItem } from 'app/site/agenda/models/view-item';
import { ViewUser } from 'app/site/users/models/view-user';

/**
 * Define what actions might occur on speaker lists
 */
type SpeakerAction = 'manage_speaker' | 'sort_speakers' | 'speak';

/**
 * Repository for speakers.
 *
 * Since speakers are no base models, normal repository methods do not apply here.
 */
@Injectable({
    providedIn: 'root'
})
export class SpeakerRepositoryService {
    /**
     * Constructor
     *
     * @param viewModelStoreService To get the view users
     * @param httpService make custom requests
     * @param translate translate
     */
    public constructor(
        private viewModelStoreService: ViewModelStoreService,
        private httpService: HttpService,
        private translate: TranslateService
    ) {}

    /**
     * Add a new speaker to an agenda item.
     * Sends the users ID to the server
     * Might need another repo
     *
     * @param speakerId {@link User} id of the new speaker
     * @param item the target agenda item
     */
    public async create(speakerId: number, item: ViewItem): Promise<void> {
        const restUrl = this.getRestUrl(item.id, 'manage_speaker');
        await this.httpService.post<Identifiable>(restUrl, { user: speakerId });
    }

    /**
     * Removes the given speaker for the agenda item
     *
     * @param item the target agenda item
     * @param speakerId (otional) the speakers id. If no id is given, the current operator
     * is removed.
     */
    public async delete(item: ViewItem, speakerId?: number): Promise<void> {
        const restUrl = this.getRestUrl(item.id, 'manage_speaker');
        await this.httpService.delete(restUrl, speakerId ? { speaker: speakerId } : null);
    }

    /**
     * Creates and returns a new ViewSpeaker out of a speaker model
     *
     * @param speaker speaker to transform
     * @return a new ViewSpeaker
     */
    private createViewModel(speaker: Speaker): ViewSpeaker {
        const user = this.viewModelStoreService.get(ViewUser, speaker.user_id);
        const viewSpeaker = new ViewSpeaker(speaker, user);
        viewSpeaker.getVerboseName = (plural: boolean = false) => {
            return this.translate.instant(plural ? 'Speakers' : 'Speaker');
        };
        return viewSpeaker;
    }

    /**
     * Generate viewSpeaker objects from a given agenda Item
     *
     * @param item agenda Item holding speakers
     * @returns the list of view speakers corresponding to the given item
     */
    public createSpeakerList(item: Item): ViewSpeaker[] {
        let viewSpeakers = [];
        const speakers = item.speakers;
        if (speakers && speakers.length > 0) {
            viewSpeakers = speakers.map(speaker => {
                return this.createViewModel(speaker);
            });
        }
        // sort speakers by their weight
        viewSpeakers = viewSpeakers.sort((a, b) => a.weight - b.weight);
        return viewSpeakers;
    }

    /**
     * Deletes all speakers of the given agenda item.
     *
     * @param item the target agenda item
     */
    public async deleteAllSpeakers(item: ViewItem): Promise<void> {
        const restUrl = this.getRestUrl(item.id, 'manage_speaker');
        await this.httpService.delete(restUrl, { speaker: item.speakers.map(speaker => speaker.id) });
    }

    /**
     * Posts an (manually) sorted speaker list to the server
     *
     * @param speakerIds array of speaker id numbers
     * @param Item the target agenda item
     */
    public async sortSpeakers(speakerIds: number[], item: Item): Promise<void> {
        const restUrl = this.getRestUrl(item.id, 'sort_speakers');
        await this.httpService.post(restUrl, { speakers: speakerIds });
    }

    /**
     * Marks the current speaker
     *
     * @param speakerId {@link User} id of the new speaker
     * @param mark determine if the user was marked or not
     * @param item the target agenda item
     */
    public async markSpeaker(speakerId: number, mark: boolean, item: ViewItem): Promise<void> {
        const restUrl = this.getRestUrl(item.id, 'manage_speaker');
        await this.httpService.patch(restUrl, { user: speakerId, marked: mark });
    }

    /**
     * Stops the current speaker
     *
     * @param item the target agenda item
     */
    public async stopCurrentSpeaker(item: ViewItem): Promise<void> {
        const restUrl = this.getRestUrl(item.id, 'speak');
        await this.httpService.delete(restUrl);
    }

    /**
     * Sets the given speaker ID to Speak
     *
     * @param speakerId the speakers id
     * @param item the target agenda item
     */
    public async startSpeaker(speakerId: number, item: ViewItem): Promise<void> {
        const restUrl = this.getRestUrl(item.id, 'speak');
        await this.httpService.put(restUrl, { speaker: speakerId });
    }

    /**
     * Helper function get the url to the speaker rest address
     *
     * @param itemId id of the agenda item
     * @param suffix the desired speaker action
     */
    private getRestUrl(itemId: number, suffix: SpeakerAction): string {
        return `/rest/agenda/item/${itemId}/${suffix}/`;
    }
}
