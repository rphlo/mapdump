from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _

from allauth.account.models import EmailAddress
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from routedb.models import RasterMap, Route, UserSettings
from utils.validators import validate_latitude, validate_longitude, custom_username_validators


class RelativeURLField(serializers.ReadOnlyField):
    """
    Field that returns a link to the relative url.
    """
    def to_representation(self, value):
        request = self.context.get('request')
        url = request and request.build_absolute_uri(value) or ''
        return url


class UserInfoSerializer(serializers.ModelSerializer):
    username = serializers.CharField(validators=custom_username_validators)
    class Meta:
        model = User
        fields = ('username', 'first_name', 'last_name')


class RouteSerializer(serializers.ModelSerializer):
    map_image = serializers.ImageField(source='raster_map.image', write_only=True, required=False)
    map_id = serializers.ChoiceField([], source='raster_map.uid', allow_blank=True, required=False)
    gpx_url = RelativeURLField()
    map_url = RelativeURLField(source='image_url')
    map_thumbnail_url = RelativeURLField(source='thumbnail_url')
    route_data = serializers.JSONField(source='route')
    map_bounds = serializers.JSONField(source='raster_map.bounds', required=False)
    id = serializers.ReadOnlyField(source='uid')
    athlete = UserInfoSerializer(read_only=True)
    country = serializers.ReadOnlyField()
    tz = serializers.ReadOnlyField()
    start_time = serializers.ReadOnlyField()
    distance = serializers.ReadOnlyField()
    duration = serializers.ReadOnlyField()
    map_size = serializers.ReadOnlyField(source='raster_map.size')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['map_id'].choices = [None] + list(RasterMap.objects.all().values_list('uid', flat=True))

    def validate_map_bounds(self, value):
        if not value:
            return None
        try:
            assert isinstance(value, dict)
            for x in 'top_left', 'top_right', 'bottom_right', 'bottom_left':
                assert x in value
                assert len(value[x]) == 2
                for i in (0, 1):
                    validate_latitude(value[x][0])
                    validate_longitude(value[x][1])
        except AssertionError:
            raise ValidationError('Invalid bounds')
        return value
    
    def validate_route_data(self, value):
        try:
            assert isinstance(value, list)
            assert len(value) > 0
            for x in value:
                assert 'time' in x
                assert isinstance(x['time'], (type(None), float, int))
                assert 'latlon' in x
                assert isinstance(x['latlon'], list)
                assert len(x['latlon']) == 2
                validate_latitude(x['latlon'][0])
                validate_longitude(x['latlon'][1])
        except AssertionError:
            raise ValidationError('Invalid route data')
        return value

    def validate(self, data):
        request = self.context.get("request")
        if request and request.method in ('PUT', 'PATCH'):
            if data.get('raster_map'):
                raise ValidationError('This method does not allow to update to map')
        else:   # Method is POST
            if not data.get('raster_map', {}).get('uid') and not data.get('raster_map', {}).get('image'):
                raise ValidationError('Either set map_image or map_id %r %r'%(request.method,data.get('raster_map') ))
            if data.get('raster_map', {}).get('uid') and data.get('raster_map', {}).get('image'):
                raise ValidationError('Either set map_image or map_id, not both')
            if not data.get('raster_map', {}).get('uid') and data.get('raster_map', {}).get('image') and not data.get('raster_map', {})['bounds']:
                raise ValidationError('You must define map_bounds fields along with map_image')
        return data

    def create(self, validated_data):
        user = None
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            user = request.user
        
        if validated_data.get('raster_map', {}).get('uid'):
            raster_map = RasterMap.objects.get(uid=validated_data['raster_map']['uid'])
        else:
            raster_map = RasterMap(
                uploader=user,
                image=validated_data['raster_map']['image'],
                mime_type=validated_data['raster_map']['image'].content_type
            )
            raster_map.bounds = validated_data['raster_map']['bounds']
            raster_map.prefetch_map_extras()
            raster_map.save()
        route = Route(
            athlete=user,
            raster_map=raster_map,
            name=validated_data['name'],
            comment=validated_data['comment'],
        )
        route.route = validated_data['route']
        route.prefetch_route_extras()
        route.save()
        return route

    class Meta:
        model = Route
        fields = ('id', 'athlete', 'name', 'start_time', 'tz', 'distance', 'duration', 'country', 'map_image', 'map_id', 'gpx_url', 'map_url', 'map_thumbnail_url', 'map_bounds', 'map_size', 'comment', 'route_data')

class UserRouteListSerializer(serializers.ModelSerializer):
    url = RelativeURLField(source='api_url')
    id = serializers.ReadOnlyField(source='uid')
    country = serializers.ReadOnlyField()
    map_url = RelativeURLField(source='image_url')
    map_thumbnail_url = RelativeURLField(source='thumbnail_url')
    tz = serializers.ReadOnlyField()
    start_time = serializers.ReadOnlyField()
    distance = serializers.ReadOnlyField()
    duration = serializers.ReadOnlyField()

    class Meta:
        model = Route
        fields = ('id', 'url', 'map_url', 'map_thumbnail_url', 'start_time', 'tz', 'distance', 'duration', 'country', 'name')

class LatestRouteListSerializer(serializers.ModelSerializer):
    url = RelativeURLField(source='api_url')
    id = serializers.ReadOnlyField(source='uid')
    country = serializers.ReadOnlyField()
    map_url = RelativeURLField(source='image_url')
    map_thumbnail_url = RelativeURLField(source='thumbnail_url')
    tz = serializers.ReadOnlyField()
    start_time = serializers.ReadOnlyField()
    distance = serializers.ReadOnlyField()
    duration = serializers.ReadOnlyField()
    athlete = UserInfoSerializer(read_only=True)
    
    class Meta:
        model = Route
        fields = ('id', 'url', 'map_url', 'map_thumbnail_url', 'start_time', 'tz', 'distance', 'duration', 'country', 'name',  'athlete')


class UserMainSerializer(serializers.ModelSerializer):
    #latest_routes = serializers.SerializerMethodField()
    routes = UserRouteListSerializer(many=True)
    class Meta:
        model = User
        fields = ('username', 'first_name', 'last_name', 'routes')
    
    #def get_latest_routes(self, obj):
    #    return UserRouteListSerializer(instance=obj.routes.all()[:5], many=True, context=self.context).data


class EmailSerializer(serializers.ModelSerializer):
    class Meta(object):
        fields = ('email', 'primary', 'verified')
        model = EmailAddress
        read_only_fields = ('verified',)

    def create(self, validated_data):
        email = super(EmailSerializer, self).create(validated_data)
        email.send_confirmation()
        user = validated_data.get('user')
        query = EmailAddress.objects.filter(
            primary=True, user=user
        )
        if not query.exists():
            email.set_as_primary()
        return email

    def update(self, instance, validated_data):
        primary = validated_data.pop('primary', False)
        instance = super(EmailSerializer, self).update(
            instance, validated_data
        )
        if primary:
            instance.set_as_primary()
        return instance

    def validate_email(self, email):
        user, domain = email.rsplit("@", 1)
        email = "@".join([user, domain.lower()])

        if self.instance and email and self.instance.email != email:
            raise serializers.ValidationError(
                _(
                    "Existing emails may not be edited. Create a new one "
                    "instead."
                )
            )

        return email

    def validate_primary(self, primary):
        # TODO: Setting 'is_primary' to 'False' should probably not be
        #       allowed.
        if primary and not (self.instance and self.instance.verified):
            raise serializers.ValidationError(
                _(
                    "Unverified email addresses may not be used as the "
                    "primary address."
                )
            )
        return primary

class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    def save(self):
        try:
            email = EmailAddress.objects.get(
                email__iexact=self.validated_data['email'],
                verified=False
            )
            email.send_confirmation()
        except EmailAddress.DoesNotExist:
            # email does not exists in db, just ignore
            pass



class MapListSerializer(serializers.ModelSerializer):
    id = serializers.ReadOnlyField(source='uid')
    image_url = RelativeURLField()
    bounds = serializers.JSONField()
    routes = LatestRouteListSerializer(source='route_set', many=True)
    class Meta:
        model = RasterMap
        fields = ('id', 'image_url', 'country', 'bounds', 'routes')