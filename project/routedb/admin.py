from django.contrib import admin, messages
from django.core.cache import cache
from django.utils.translation import ngettext
from routedb.models import RasterMap, Route, UserSettings


class RasterMapAdmin(admin.ModelAdmin):
    list_display = (
        "uploader",
        "creation_date",
        "uid",
    )
    fields = (
        "uploader",
        "image",
        "corners_coordinates",
    )


class RouteAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "start_time",
        "athlete",
    )
    fields = ("athlete", "name", "route_json", "raster_map")
    list_filter = ("athlete",)
    actions = ["clear_images"]

    @admin.action(description="Clear images")
    def clear_images(self, request, qs):
        for r in qs:
            cache.delete(f"route_{r.images_path}_h")
            cache.delete(f"route_{r.images_path}_r")
            cache.delete(f"route_{r.images_path}_h_r")
            cache.delete(f"route_{r.images_path}")
            cache.delete(f"map_{r.raster_map.image.name}_thumb")
        updated = qs.count()

        self.message_user(
            request,
            ngettext(
                "%d route images was cleared.",
                "%d routes images were cleared.",
                updated,
            )
            % updated,
            messages.SUCCESS,
        )


class UserSettingsAdmin(admin.ModelAdmin):
    list_display = ("user", "strava_access_token", "avatar")
    list_filter = ("user",)


admin.site.register(RasterMap, RasterMapAdmin)
admin.site.register(Route, RouteAdmin)
admin.site.register(UserSettings, UserSettingsAdmin)
