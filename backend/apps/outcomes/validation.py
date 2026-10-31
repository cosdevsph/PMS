"""
Validation of outcome-measure definitions (the master JSON) and of a patient's answers.

Definitions are data only: nothing in them is executed. Scoring uses the fixed methods in scoring.py.
"""
import re
from decimal import Decimal, InvalidOperation

SCHEMA = 'malasakit.outcome-definition/1'
ITEM_TYPES = ('single_choice', 'yes_no', 'numeric', 'nrs', 'slider')
NUMERIC_TYPES = ('numeric', 'nrs', 'slider')
SCORING_METHODS = ('sum', 'mean', 'percent_of_max', 'external')
SUBSCALE_METHODS = ('sum', 'mean', 'percent_of_max')
DIRECTIONS = ('higher_worse', 'higher_better')
LICENCE_CATEGORIES = ('A', 'B', 'C', 'D')
MISSING_RULES = ('invalid', 'prorate_mean')
CODE_RE = re.compile(r'^[A-Z0-9][A-Z0-9_-]{1,39}$')
VERSION_RE = re.compile(r'^\d+\.\d+\.\d+$')
ID_RE = re.compile(r'^[a-z][a-z0-9_]{0,39}$')


class DefinitionError(ValueError):
    """A definition is malformed. `errors` lists every problem found."""

    def __init__(self, errors):
        self.errors = list(errors)
        super().__init__('; '.join(self.errors))


def _num(value):
    if isinstance(value, bool) or not isinstance(value, (int, float, str, Decimal)):
        return None
    try:
        return Decimal(str(value))
    except InvalidOperation:
        return None


def item_bounds(item):
    """(min, max) a single item can contribute to a score, as Decimals."""
    if item['type'] == 'single_choice':
        values = [_num(o['value']) for o in item['options']]
        return min(values), max(values)
    if item['type'] == 'yes_no':
        return Decimal(0), Decimal(1)
    return _num(item['min']), _num(item['max'])


def _may_be_approved(licence):
    """Category A and D go through; B only with the owner's recorded permission; C never."""
    if licence['category'] in ('A', 'D'):
        return True
    note = licence.get('permission_note')
    return licence['category'] == 'B' and licence.get('permission_confirmed') is True and isinstance(note, str) and bool(note.strip())


def validate_definition(data):
    """Return the definition if valid, otherwise raise DefinitionError listing every problem."""
    errors = []
    if not isinstance(data, dict):
        raise DefinitionError(['The definition must be a JSON object.'])

    if data.get('schema') != SCHEMA:
        errors.append(f'schema must be "{SCHEMA}".')
    code = data.get('code')
    if not isinstance(code, str) or not CODE_RE.match(code):
        errors.append('code must be 2-40 characters: capital letters, digits, "_" or "-".')
    if not isinstance(data.get('version'), str) or not VERSION_RE.match(data['version']):
        errors.append('version must look like 1.0.0.')
    for key in ('name', 'category'):
        if not isinstance(data.get(key), str) or not data[key].strip():
            errors.append(f'{key} is required.')

    licence = data.get('licence')
    if not isinstance(licence, dict) or licence.get('category') not in LICENCE_CATEGORIES:
        errors.append('licence.category must be one of A, B, C, D.')
    elif not isinstance(licence.get('approved_for_production'), bool):
        errors.append('licence.approved_for_production must be true or false.')
    elif licence['approved_for_production'] and not _may_be_approved(licence):
        errors.append(
            'A category B or C instrument cannot be approved for production unless its permission is confirmed '
            '(category B with permission_confirmed true and a permission_note).'
        )

    if 'instructions' in data and not isinstance(data['instructions'], str):
        errors.append('instructions must be text.')

    items = data.get('items')
    ids = []
    if not isinstance(items, list) or not items:
        errors.append('items must be a non-empty list.')
        items = []
    for index, item in enumerate(items):
        label = f'items[{index}]'
        if not isinstance(item, dict):
            errors.append(f'{label} must be an object.')
            continue
        item_id = item.get('id')
        if not isinstance(item_id, str) or not ID_RE.match(item_id):
            errors.append(f'{label}.id must be lowercase letters, digits or "_".')
        elif item_id in ids:
            errors.append(f'{label}.id "{item_id}" is used twice.')
        else:
            ids.append(item_id)
        label = f'item "{item_id}"'
        if item.get('type') not in ITEM_TYPES:
            errors.append(f'{label}: type must be one of {", ".join(ITEM_TYPES)}.')
            continue
        if not isinstance(item.get('prompt'), str) or not item['prompt'].strip():
            errors.append(f'{label}: prompt is required.')
        if not isinstance(item.get('required', True), bool):
            errors.append(f'{label}: required must be true or false.')
        if item['type'] == 'single_choice':
            options = item.get('options')
            if not isinstance(options, list) or len(options) < 2:
                errors.append(f'{label}: at least two options are required.')
            else:
                seen = []
                for option in options:
                    value = _num(option.get('value')) if isinstance(option, dict) else None
                    if value is None or not isinstance(option.get('label'), str) or not option['label'].strip():
                        errors.append(f'{label}: every option needs a numeric value and a label.')
                    elif value in seen:
                        errors.append(f'{label}: option value {value} is used twice.')
                    else:
                        seen.append(value)
        elif item['type'] in NUMERIC_TYPES:
            low, high, step = _num(item.get('min')), _num(item.get('max')), _num(item.get('step', 1))
            if low is None or high is None or step is None:
                errors.append(f'{label}: min, max and step must be numbers.')
            elif low >= high:
                errors.append(f'{label}: min must be below max.')
            elif step <= 0:
                errors.append(f'{label}: step must be above zero.')
            elif (high - low) % step != 0:
                errors.append(f'{label}: max minus min must be a whole number of steps.')
            anchors = item.get('anchors')
            if anchors is not None and not (isinstance(anchors, dict) and all(isinstance(v, str) for v in anchors.values())):
                errors.append(f'{label}: anchors must map names to text.')

    scoring = data.get('scoring')
    if not isinstance(scoring, dict):
        errors.append('scoring is required.')
    else:
        _validate_scoring(scoring, items, ids, errors)

    if errors:
        raise DefinitionError(errors)
    return data


def _validate_scoring(scoring, items, ids, errors):
    method = scoring.get('method')
    if method not in SCORING_METHODS:
        errors.append(f'scoring.method must be one of {", ".join(SCORING_METHODS)}.')
        return
    if scoring.get('direction') not in DIRECTIONS:
        errors.append('scoring.direction must be "higher_worse" or "higher_better".')

    def check_items(listed, where):
        if not isinstance(listed, list) or not listed:
            errors.append(f'{where}.items must be a non-empty list.')
            return
        unknown = [i for i in listed if i not in ids]
        if unknown:
            errors.append(f'{where}.items refers to unknown items: {", ".join(map(str, unknown))}.')

    if method == 'external':
        if scoring.get('subscales') or scoring.get('items'):
            errors.append('scoring.method "external" cannot list items or subscales.')
        return

    check_items(scoring.get('items'), 'scoring')
    reverse = scoring.get('reverse_items', [])
    if not isinstance(reverse, list) or any(r not in (scoring.get('items') or []) for r in reverse):
        errors.append('scoring.reverse_items must be a subset of scoring.items.')

    missing = scoring.get('missing', {'max_missing': 0, 'rule': 'invalid'})
    max_missing = missing.get('max_missing') if isinstance(missing, dict) else None
    rule = missing.get('rule') if isinstance(missing, dict) else None
    if not isinstance(max_missing, int) or isinstance(max_missing, bool) or max_missing < 0:
        errors.append('scoring.missing.max_missing must be a whole number, 0 or more.')
    elif rule not in MISSING_RULES:
        errors.append(f'scoring.missing.rule must be one of {", ".join(MISSING_RULES)}.')
    elif max_missing > 0 and rule == 'invalid':
        errors.append('scoring.missing.rule "invalid" cannot allow missing answers; use max_missing 0.')

    for sub in scoring.get('subscales', []) or []:
        where = f'subscale "{sub.get("id") if isinstance(sub, dict) else sub}"'
        if not isinstance(sub, dict) or not isinstance(sub.get('id'), str) or not isinstance(sub.get('name'), str):
            errors.append('every subscale needs an id and a name.')
            continue
        if sub.get('method', 'sum') not in SUBSCALE_METHODS:
            errors.append(f'{where}: method must be one of {", ".join(SUBSCALE_METHODS)}.')
        check_items(sub.get('items'), where)


def validate_answers(definition, answers):
    """
    Check a patient's answers against the definition. Returns the cleaned answers (Decimal-free JSON values)
    or raises DefinitionError. Missing required items are reported; optional items may be left out.
    """
    errors = []
    if not isinstance(answers, dict):
        raise DefinitionError(['answers must be an object keyed by item id.'])
    items = {i['id']: i for i in definition['items']}
    cleaned = {}

    for key in answers:
        if key not in items:
            errors.append(f'"{key}" is not an item of this measure.')

    for item_id, item in items.items():
        value = answers.get(item_id)
        if value is None or value == '':
            if item.get('required', True):
                errors.append(f'"{item_id}" needs an answer.')
            continue
        kind = item['type']
        if kind == 'yes_no':
            if not isinstance(value, bool):
                errors.append(f'"{item_id}" must be yes or no.')
            else:
                cleaned[item_id] = value
        elif kind == 'single_choice':
            number = _num(value)
            allowed = [_num(o['value']) for o in item['options']]
            if number is None or number not in allowed:
                errors.append(f'"{item_id}" is not one of the available options.')
            else:
                cleaned[item_id] = _plain(number)
        else:
            number = _num(value)
            low, high, step = _num(item['min']), _num(item['max']), _num(item.get('step', 1))
            if number is None:
                errors.append(f'"{item_id}" must be a number.')
            elif not (low <= number <= high):
                errors.append(f'"{item_id}" must be between {_plain(low)} and {_plain(high)}.')
            elif (number - low) % step != 0:
                errors.append(f'"{item_id}" must move in steps of {_plain(step)} from {_plain(low)}.')
            else:
                cleaned[item_id] = _plain(number)

    if errors:
        raise DefinitionError(errors)
    return cleaned


def _plain(number):
    """Decimal -> int when whole, else float, so JSON stays readable."""
    return int(number) if number == number.to_integral_value() else float(number)
