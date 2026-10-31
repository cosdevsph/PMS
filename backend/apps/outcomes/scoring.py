"""
Server-side scoring. Only the fixed methods below exist; a definition cannot supply a formula.

  sum             total of the scored items
  mean            total divided by the number of items scored
  percent_of_max  total as a percentage of the largest total possible for the items scored
  external        the instrument is scored by its owner's service; nothing is computed here

Missing answers follow the definition's own rule: "invalid" (the score is not valid if any scored item is
missing) or "prorate_mean" (up to max_missing items are replaced by the mean of the answered ones).
"""
from decimal import Decimal

from .validation import _plain, item_bounds


def _item_value(item, answer, reverse):
    """Numeric value an answer contributes, with reverse scoring applied."""
    if item['type'] == 'yes_no':
        value = Decimal(1 if answer else 0)
    else:
        value = Decimal(str(answer))
    if reverse:
        low, high = item_bounds(item)
        value = low + high - value
    return value


def _score_group(item_ids, method, definition, answers, reverse_ids, missing):
    items = {i['id']: i for i in definition['items']}
    max_missing = missing.get('max_missing', 0)
    rule = missing.get('rule', 'invalid')

    values = {}
    for item_id in item_ids:
        if item_id in answers:
            values[item_id] = _item_value(items[item_id], answers[item_id], item_id in reverse_ids)
    absent = [i for i in item_ids if i not in values]

    result = {'answered': len(values), 'missing': len(absent), 'valid': True, 'score': None}
    if not values or len(absent) > max_missing or (absent and rule == 'invalid'):
        result['valid'] = False
        return result

    total = sum(values.values(), Decimal(0))
    counted = len(values)
    if absent:  # prorate_mean
        total = total / counted * len(item_ids)
        counted = len(item_ids)

    if method == 'sum':
        score = total
    elif method == 'mean':
        score = total / counted
    else:  # percent_of_max
        lows, highs = zip(*(item_bounds(items[i]) for i in item_ids))
        low, high = sum(lows, Decimal(0)), sum(highs, Decimal(0))
        score = (total - low) / (high - low) * 100 if high != low else Decimal(0)
    result['score'] = _plain(round(score, 2))
    return result


def score_assessment(definition, answers):
    """Return {'method', 'direction', 'total', 'subscales'} for validated answers."""
    scoring = definition['scoring']
    method = scoring['method']
    out = {'method': method, 'direction': scoring.get('direction'), 'total': None, 'subscales': {}}
    if method == 'external':
        return out

    missing = scoring.get('missing', {'max_missing': 0, 'rule': 'invalid'})
    reverse = set(scoring.get('reverse_items', []))
    out['total'] = _score_group(scoring['items'], method, definition, answers, reverse, missing)
    out['total']['range'] = scoring.get('range')
    for sub in scoring.get('subscales', []) or []:
        result = _score_group(sub['items'], sub.get('method', 'sum'), definition, answers, reverse, missing)
        result['name'] = sub['name']
        result['range'] = sub.get('range')
        out['subscales'][sub['id']] = result
    return out
