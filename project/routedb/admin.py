from django.contrib import admin

from routedb.models import RasterMap, Route

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



admin.site.register(RasterMap, RasterMapAdmin)
admin.site.register(Route, RouteAdmin)
