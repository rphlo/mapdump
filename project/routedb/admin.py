from django.contrib import admin

from routedb.models import RasterMap, Route, UserSettings

class RasterMapAdmin(admin.ModelAdmin):
    list_display = (
        'uploader',
        'creation_date',
        'uid',
    )
    fields = (
        'uploader',
        'image',
        'corners_coordinates',
    )


class RouteAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'start_time',
        'athlete',
    )
    fields = (
        'athlete',
        'name',
        'route_json',
        'raster_map'
    )
    list_filter = ('athlete', )


class UserSettingsAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'strava_access_token'
    )
    list_filter = ('user', )


admin.site.register(RasterMap, RasterMapAdmin)
admin.site.register(Route, RouteAdmin)
admin.site.register(UserSettings, UserSettingsAdmin)
