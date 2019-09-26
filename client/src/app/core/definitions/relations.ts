import { BaseModel } from 'app/shared/models/base/base-model';
import { BaseViewModel, ViewModelConstructor } from 'app/site/base/base-view-model';

// All "standard" relations.
export type RelationDefinition<VForeign extends BaseViewModel = BaseViewModel> =
    | NormalRelationDefinition<VForeign>
    | ReverseRelationDefinition<VForeign>
    | CustomRelationDefinition
    | GenericRelationDefinition<VForeign>;

interface BaseRelationDefinition<VForeign extends BaseViewModel> {
    /**
     * The name of the property, where the foreign view model should be accessable.
     * Note, that this must be a getter to a private variable `_<ownKey`!
     *
     * E.g. `category`. (private variable `_category`)
     */
    ownKey: string;

    /**
     * The model on the other side of the relation.
     */
    foreignViewModel: ViewModelConstructor<VForeign>;
}

export interface BaseOrderedRelation<VForeign extends BaseViewModel> extends BaseRelationDefinition<VForeign> {
    /**
     * Provide an extra key (holding a number) to order by.
     * If the value is equal or no order key is given, the models
     * will be sorted by id.
     */
    order?: string;
}

interface BaseNormalRelationDefinition<VForeign extends BaseViewModel> extends BaseRelationDefinition<VForeign> {
    /**
     * This is the key in the own model where the id(s) are given. Must be present in
     * the model and view model. E.g. `category_id` in a motion.
     */
    ownIdKey: string;
}

/**
 * These relations has to be read as in  an ER-model. The right side is always the
 * model where the relation is defined.
 * - M2O: From this model to another one, where this model is the right (many).
 *        E.g. motions<->categories: One motions has One category; One category has
 *        Many motions.
 * - O2M: Reverse relation to M2O. E.g. defined for categories: One category has
 *        Many motions and One motion has One category.
 * - M2M: M2M relation from this to another model.
 */

interface NormalM2MRelationDefinition<VForeign extends BaseViewModel>
    extends BaseNormalRelationDefinition<VForeign>,
        BaseOrderedRelation<VForeign> {
    type: 'M2M';
}

interface NormalO2MRelationDefinition<VForeign extends BaseViewModel>
    extends BaseNormalRelationDefinition<VForeign>,
        BaseOrderedRelation<VForeign> {
    type: 'O2M';
}

interface NormalM2ORelationDefinition<VForeign extends BaseViewModel> extends BaseNormalRelationDefinition<VForeign> {
    type: 'M2O';
}

export type NormalRelationDefinition<VForeign extends BaseViewModel = BaseViewModel> =
    | NormalM2MRelationDefinition<VForeign>
    | NormalO2MRelationDefinition<VForeign>
    | NormalM2ORelationDefinition<VForeign>;

export function isNormalRelationDefinition(obj: RelationDefinition): obj is NormalRelationDefinition<BaseViewModel> {
    const relation = obj as NormalRelationDefinition<BaseViewModel>;
    return (relation.type === 'M2O' || relation.type === 'O2M' || relation.type === 'M2M') && !!relation.ownIdKey;
}

interface BaseReverseRelationDefinition<VForeign extends BaseViewModel> {
    /**
     * The key with the id(s) is given in the foreign model. Must be present in
     * the model and view model. E.g. `category_id` from a motion but the relation is
     * defined for a category.
     */
    foreignIdKey: string;

    /**
     * The name of the property, where the foreign view model should be accessable.
     * Note, that this must be a getter to a private variable `_<ownKey`!
     *
     * E.g. `category`. (private variable `_category`)
     */
    ownKey: string;

    /**
     * The model on the other side of the relation.
     */
    foreignViewModel: ViewModelConstructor<VForeign>;
}

interface ReverseM2MRelationDefinition<VForeign extends BaseViewModel>
    extends BaseReverseRelationDefinition<VForeign>,
        BaseOrderedRelation<VForeign> {
    type: 'M2M';
}

interface ReverseO2MRelationDefinition<VForeign extends BaseViewModel>
    extends BaseReverseRelationDefinition<VForeign>,
        BaseOrderedRelation<VForeign> {
    type: 'O2M';
}

interface ReverseM2ORelationDefinition<VForeign extends BaseViewModel> extends BaseReverseRelationDefinition<VForeign> {
    type: 'M2O';
}

export type ReverseRelationDefinition<VForeign extends BaseViewModel = BaseViewModel> =
    | ReverseM2MRelationDefinition<VForeign>
    | ReverseO2MRelationDefinition<VForeign>
    | ReverseM2ORelationDefinition<VForeign>;

export function isReverseRelationDefinition(obj: RelationDefinition): obj is ReverseRelationDefinition<BaseViewModel> {
    const relation = obj as ReverseRelationDefinition<BaseViewModel>;
    return (relation.type === 'M2O' || relation.type === 'O2M' || relation.type === 'M2M') && !!relation.foreignIdKey;
}

interface GenericRelationDefinition<VForeign extends BaseViewModel = BaseViewModel> {
    type: 'generic';

    /**
     * The key where the model and view model holds the ContentObject (object with collection and id).
     * Similar to ownIdKey.
     */
    ownContentObjectDataKey: string;

    /**
     * The key where to but the content object.
     */
    ownKey: string;

    possibleModels: ViewModelConstructor<BaseViewModel>[];
    isVForeign: (obj: any) => obj is VForeign;
    VForeignVerbose: string;
}

export function isGenericRelationDefinition(obj: RelationDefinition): obj is GenericRelationDefinition<BaseViewModel> {
    return obj.type === 'generic';
}

/**
 * A custom relation with callbacks with things todo.
 */
interface CustomRelationDefinition {
    type: 'custom';

    /**
     * The key to access the custom relation.
     */
    ownKey: string;

    get: (model: BaseModel, viewModel: BaseViewModel) => any;

    getCacheObjectToCheck: (viewModel: BaseViewModel) => BaseViewModel | null;
}

export function isCustomRelationDefinition(obj: RelationDefinition): obj is CustomRelationDefinition {
    return obj.type === 'custom';
}
