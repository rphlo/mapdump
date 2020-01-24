from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _

from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from routedb.models import RasterMap, Route
from utils.validators import validate_latitude, validate_longitude


class RelativeURLField(serializers.ReadOnlyField):
    """
    Field that returns a link to the relative url.
    """
    def to_representation(self, value):
        request = self.context.get('request')
        url = request and request.build_absolute_uri(value) or ''
        return url

class RouteSerializer(serializers.ModelSerializer):
    map_image = serializers.ImageField(source='raster_map.image', allow_null=True)
    route_data = serializers.JSONField(source='route')
    map_bounds = serializers.JSONField(source='raster_map.bounds', allow_null=True)
    id = serializer.ReadOnlyField(source='uid')
    athlete = serializer.ReadOnlyField(source='athlete.username')

    def validate_map_bounds(self, value):
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
                assert isinstance(x['time'], (float, int))
                assert 'latlon' in x
                assert isinstance(x['latlon'], list)
                assert len(x['latlon']) == 2
                validate_latitude(x['latlon'][0])
                validate_longitude(x['latlon'][1])
        except AssertionError:
            raise ValidationError('Invalid route data')
        return value


    def create(self, validated_data):
        user = None
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            user = request.user
        
        raster_map = RasterMap(
            uploader=user,
            image=validated_data['raster_map']['image']
        )
        raster_map.bounds = validated_data['raster_map']['bounds']
        raster_map.save()
        route = Route(
            athlete=user,
            raster_map=raster_map,
            name=validated_data['name']
        )
        route.route = validated_data['route']
        route.save()
        return route

    class Meta:
        model = Route
        fields = ('id', 'athlete', 'name', 'route_data', 'map_image', 'map_bounds')

class RouteListSerializer(serializers.ModelSerializer):
    data_url = RelativeURLField(source='api_url')
    id = serializer.ReadOnlyField(source='uid')

    class Meta:
        model = Route
        fields = ('id', 'data_url', 'start_time', 'name')

class UserSerializer(serializers.ModelSerializer):
    routes = RouteListSerializer(many=True)
    class Meta:
        model = User
        fields = ('username', 'first_name', 'last_name', 'routes')
