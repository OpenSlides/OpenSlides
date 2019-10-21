import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';

import { BaseViewComponent } from 'app/site/base/base-view';

/**
 * Component to have a card-like container with optional title, content and actions.
 *
 * It dynamically checks, if the children have child-nodes and know, if they should be displayed.
 */
@Component({
    selector: 'os-meta-text-block',
    templateUrl: './meta-text-block.component.html',
    styleUrls: ['./meta-text-block.component.scss']
})
export class MetaTextBlockComponent extends BaseViewComponent implements OnDestroy, OnInit, AfterViewInit {
    /**
     * Reference to the actions in the header.
     */
    @ViewChild('actionRow', { static: false })
    public actions: ElementRef<HTMLElement>;

    /**
     * Reference to the content-part of the card.
     */
    @ViewChild('contentBox', { static: false })
    public content: ElementRef<HTMLElement>;

    /**
     * Reference to the footer-part of the card.
     */
    @ViewChild('footer', { static: false })
    public footer: ElementRef<HTMLElement>;

    /**
     * The title for the card.
     */
    @Input()
    public title: string;

    /**
     * An optional subtitle.
     */
    @Input()
    public subtitle: string;

    /**
     * Optional text.
     * If this is given, the component renders automatically a text-editor and sends save-events
     * with the new value.
     */
    @Input()
    public text: string;

    /**
     * Optional placeholder.
     * If the component can edit text, this is displayed, if the text is empty.
     */
    @Input()
    public placeholder: string;

    /**
     * Whether a divider should separate the title-part and the content-part.
     */
    @Input()
    public hasDivider = true;

    /**
     * Optional boolean to explicitly decide, if the content should always be expanded.
     */
    @Input()
    public canExpand = true;

    /**
     * Optional boolean to explicitly decide, if the content cannot be edited.
     */
    @Input()
    public canEdit = true;

    /**
     * Indicates, whether the content should be expandable or always expanded.
     *
     * If `true`, it resets the flag `isExpanded`. This prevents an error -
     * when the given element is expanded and the control was disabled, the
     * subscription is deleted.
     */
    @Input()
    public set disableExpandControl(disableControl: boolean) {
        this._disableExpandControl = disableControl;
        if (disableControl) {
            this.isExpanded = false;
            this.cd.detectChanges();
        }
    }

    /**
     * Returns the flag `disableExpandControl`.
     */
    public get disableExpandControl(): boolean {
        return this._disableExpandControl;
    }

    /**
     * Boolean, whether the control to expand the element should be disabled or not.
     */
    private _disableExpandControl = false;

    /**
     * Sends the changed text, if available.
     */
    @Output()
    public textChange = new EventEmitter<string>();

    /**
     * The form-group for the text-content.
     */
    public contentForm: FormGroup;

    /**
     * Subject to receive changes of the component's height.
     */
    public resizeSubject = new Subject<number>();

    /**
     *
     */
    public onlyText = false;

    /**
     * Check, whether the component is expanded or not.
     */
    public isExpanded = false;

    /**
     * Whether the component has actions at all.
     */
    public hasActions = true;

    /**
     * Whether the component has any content at all.
     */
    public hasContent = true;

    /**
     * Whether the component has a footer at all.
     */
    public hasFooter = true;

    /**
     * Whether the component is in editing mode, if the text-property is given.
     */
    public editMode = false;

    /**
     * Whether inline-mode for the text-editor is active.
     */
    public isInlineMode = false;

    /**
     * Constructor.
     *
     * @param title
     * @param translate
     * @param matSnackBar
     * @param cd
     * @param fb
     */
    public constructor(
        title: Title,
        protected translate: TranslateService,
        matSnackBar: MatSnackBar,
        private cd: ChangeDetectorRef,
        private fb: FormBuilder
    ) {
        super(title, translate, matSnackBar);
    }

    /**
     * Subscribes to the resize-observable.
     */
    public ngOnInit(): void {
        this.subscriptions.push(this.resizeSubject.subscribe(nextHeight => this.calcExpansionControl(nextHeight)));
    }

    /**
     * Destroy-method.
     */
    public ngOnDestroy(): void {
        super.ngOnDestroy();
        this.cd.detach();
    }

    /**
     * Hook on `afterViewInit`.
     *
     * Checks, if there are child-nodes for the action-part, the content-part or the footer-part.
     */
    public ngAfterViewInit(): void {
        this.hasActions = this.checkParentHasChildren(this.actions);
        this.hasContent = this.checkParentHasChildren(this.content);
        this.hasFooter = this.checkParentHasChildren(this.footer);
        this.cd.detectChanges();
    }

    /**
     * This method activates the inline-mode for the editor.
     */
    public enterInlineMode(): void {
        this.isInlineMode = true;
        this.changeEditMode();
    }

    /**
     * Saves the changed text and send the new value to the parent component.
     */
    public save(): void {
        const text = this.contentForm.get('editor').value;
        this.text = text;
        this.textChange.emit(text);
        this.changeEditMode();
    }

    /**
     * Changes the editing mode.
     * If the user was already in editing mode, the form is deleted, otherwise it is created.
     */
    public changeEditMode(): void {
        if (!this.editMode) {
            this.contentForm = this.fb.group({
                editor: this.text || ''
            });
        } else {
            delete this.contentForm;
            this.isInlineMode = false;
        }
        this.editMode = !this.editMode;
        this.disableExpandControl = this.editMode;
    }

    public getTinyMceSettings(): object {
        return Object.assign(this.tinyMceSettings, { inline: this.isInlineMode });
    }

    /**
     * Function to check, if the new height of the element
     * is greater than the limit of `200px`.
     *
     * @param height The new height as `number` of the linked element.
     */
    private calcExpansionControl(height: number): void {
        this.canExpand = height > 200;
    }

    /**
     * This will check, whether the given parent-element has any child-nodes.
     *
     * @param parent The parent-element.
     *
     * @returns `True`, if there are child-nodes.
     */
    private checkParentHasChildren(parent: ElementRef<HTMLElement>): boolean {
        if (!parent) {
            return false;
        }
        return Array.from(parent.nativeElement.childNodes).some(node => node.nodeType !== 8);
    }
}
