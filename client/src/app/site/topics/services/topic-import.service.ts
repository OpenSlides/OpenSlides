import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TranslateService } from '@ngx-translate/core';
import { Papa } from 'ngx-papaparse';

import { TopicRepositoryService } from 'app/core/repositories/topics/topic-repository.service';
import { BaseImportService, NewEntry } from 'app/core/ui-services/base-import.service';
import { DurationService } from 'app/core/ui-services/duration.service';
import { ItemVisibilityChoices } from 'app/shared/models/agenda/item';
import { CreateTopic } from '../models/create-topic';

@Injectable({
    providedIn: 'root'
})
export class TopicImportService extends BaseImportService<CreateTopic> {
    /**
     * Helper for mapping the expected header in a typesafe way. Values will be passed to
     * {@link expectedHeader}
     */
    public headerMap: (keyof CreateTopic)[] = ['title', 'text', 'agenda_duration', 'agenda_comment', 'agenda_type'];

    /**
     * The minimimal number of header entries needed to successfully create an entry
     */
    public requiredHeaderLength = 1;

    /**
     * List of possible errors and their verbose explanation
     */
    public errorList = {
        NoTitle: 'A Topic needs a title',
        ParsingErrors: 'Some csv values could not be read correctly.'
    };

    /**
     * Constructor. Calls the abstract class and sets the expected header
     *
     * @param durationService: a service for converting time strings and numbers
     * @param repo: The Agenda repository service
     * @param translate A translation service for translating strings
     * @param papa Csv parser
     * @param matSnackBar MatSnackBar for displaying errors
     */
    public constructor(
        private durationService: DurationService,
        private repo: TopicRepositoryService,
        translate: TranslateService,
        papa: Papa,
        matSnackBar: MatSnackBar
    ) {
        super(translate, papa, matSnackBar);
        this.expectedHeader = this.headerMap;
    }

    /**
     * Clear all secondary import data. As agenda items have no secondary imports,
     * this is an empty function
     */
    public clearData(): void {}

    /**
     * Parses a string representing an entry
     *
     * @param line a line extracted by the CSV (without the header)
     * @returns a new entry for a Topic
     */
    public mapData(line: string): NewEntry<CreateTopic> {
        const newEntry = new CreateTopic();
        const headerLength = Math.min(this.expectedHeader.length, line.length);
        let hasErrors = false;
        for (let idx = 0; idx < headerLength; idx++) {
            switch (this.expectedHeader[idx]) {
                case 'agenda_duration':
                    try {
                        const duration = this.parseDuration(line[idx]);
                        if (duration > 0) {
                            newEntry.agenda_duration = duration;
                        }
                    } catch (e) {
                        if (e instanceof TypeError) {
                            hasErrors = true;
                            continue;
                        }
                    }
                    break;
                case 'agenda_type':
                    try {
                        newEntry.agenda_type = this.parseType(line[idx]);
                    } catch (e) {
                        if (e instanceof TypeError) {
                            hasErrors = true;
                            continue;
                        }
                    }
                    break;
                default:
                    newEntry[this.expectedHeader[idx]] = line[idx];
            }
        }

        // set type to 'public' if none is given in import
        if (!newEntry.agenda_type) {
            newEntry.agenda_type = 1;
        }
        const mappedEntry: NewEntry<CreateTopic> = {
            newEntry: newEntry,
            status: 'new',
            errors: []
        };
        if (hasErrors) {
            this.setError(mappedEntry, 'ParsingErrors');
        }
        if (!mappedEntry.newEntry.isValid) {
            this.setError(mappedEntry, 'NoTitle');
        }
        return mappedEntry;
    }

    /**
     * Executing the import. Parses all entries without errors and submits them
     * to the server. The entries will receive the status 'done' on success.
     */
    public async doImport(): Promise<void> {
        for (const entry of this.entries) {
            if (entry.status !== 'new') {
                continue;
            }
            await this.repo.create(entry.newEntry);
            entry.status = 'done';
        }
        this.updatePreview();
    }

    /**
     * Matching the duration string/number to the time model in use
     *
     * @param input
     * @returns duration as defined in durationService
     */
    public parseDuration(input: string): number {
        return this.durationService.stringToDuration(input);
    }

    /**
     * Converts information from 'item type' to a model-based type number.
     * Accepts either old syntax (numbers) or new visibility choice csv names;
     * both defined in {@link itemVisibilityChoices}
     * Empty values will be interpreted as default 'public' agenda topics
     *
     * @param input
     * @returns a number as defined for the itemVisibilityChoices
     */
    public parseType(input: string | number): number {
        if (!input) {
            return 1; // default, public item
        } else if (typeof input === 'string') {
            const visibility = ItemVisibilityChoices.find(choice => choice.csvName === input);
            if (visibility) {
                return visibility.key;
            }
        } else if (input === 1) {
            // Compatibility with the old client's isInternal column
            const visibility = ItemVisibilityChoices.find(choice => choice.name === 'Internal item');
            if (visibility) {
                return visibility.key;
            }
        } else {
            throw new TypeError('type could not be matched');
        }
    }

    /**
     * parses the data given by the textArea. Expects an agenda title per line
     *
     * @param data a string as produced by textArea input
     */
    public parseTextArea(data: string): void {
        const newEntries: NewEntry<CreateTopic>[] = [];
        this.clearData();
        this.clearPreview();
        const lines = data.split('\n');
        lines.forEach(line => {
            if (!line.length) {
                return;
            }
            const newTopic = new CreateTopic(
                new CreateTopic({
                    title: line,
                    agenda_type: 1 // set type to 'public item' by default
                })
            );
            const newEntry: NewEntry<CreateTopic> = {
                newEntry: newTopic,
                status: 'new',
                errors: []
            };
            newEntries.push(newEntry);
        });
        this.setParsedEntries(newEntries);
    }
}
