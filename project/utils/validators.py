import re
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils.translation import ugettext_lazy as _


FLOAT_RE = re.compile(r'^(\-?[0-9]{1,3}(\.[0-9]+)?)$')


def validate_latitude(value):
    if isinstance(value, (float, int)):
        value = str(value)
    value = Decimal(value)
    if value < -90 or value > 90:
        raise ValidationError(_('latitude out of range -90.0 90.0'))


def validate_longitude(value):
    if isinstance(value, (float, int)):
        value = str(value)
    value = Decimal(value)
    if value < -180 or value > 180:
        raise ValidationError(_('longitude out of range -180.0 180.0'))


def validate_nice_slug(slug):
    if re.search('[^-a-zA-Z0-9_]', slug):
        raise ValidationError(_('Only alphanumeric characters, '
                                'hyphens and underscores are allowed.'))
    if len(slug) < 1:
        raise ValidationError(_('Too short. (min. 1 characters)'))
    elif len(slug) > 32:
        raise ValidationError(_('Too long. (max. 32 characters)'))
    if slug[0] in "_-":
        raise ValidationError(_('Must start with an alphanumeric character.'))
    if slug[-1] in "_-":
        raise ValidationError(_('Must end with an alphanumeric character.'))
    if '--' in slug or '__' in slug or '-_' in slug or '_-' in slug:
        raise ValidationError(_('Cannot include 2 non alphanumeric '
                                'character in a row.'))
    if slug in settings.SLUG_BLACKLIST:
        raise ValidationError(_('Forbidden slug.'))


def validate_image_data_uri(value):
    if not value:
        raise ValidationError(_('Data URI Can not be null'))
    data_matched = re.match(
        r'^data:image/(?P<format>jpeg|png|gif);base64,'
        r'(?P<data_b64>(?:[A-Za-z0-9+/]{4})*'
        r'(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?)$',
        value
    )
    if not data_matched:
        raise ValidationError(_('Not a base 64 encoded data URI of an image'))


def validate_corners_coordinates(val):
    cal_values = val.split(',')
    if len(cal_values) != 8:
        raise ValidationError(_('Corners coordinates must have 8 float values '
                                'separated by commas.'))
    for val in cal_values:
        if not FLOAT_RE.match(val):
            raise ValidationError(
                _('Corners coordinates must only contain float values.')
            )


custom_username_validators = [validate_nice_slug, ]
