from sqladmin import ModelView, filters

from app.models import (
    Forecast,
    Spot,
    Surfboard,
    SurfForecast,
    SurfSession,
    SurfSessionReview,
    Tide,
    User,
)


class UserAdmin(ModelView, model=User):
    name = "User"
    name_plural = "Users"
    column_list = [User.id, User.email, User.is_admin, User.created_at]
    column_searchable_list = [User.email]
    column_sortable_list = [User.id, User.created_at]
    form_excluded_columns = ["hashed_password", "surf_sessions", "surfboards", "created_at"]
    column_details_exclude_list = ["hashed_password"]


class SpotAdmin(ModelView, model=Spot):
    name = "Spot"
    name_plural = "Spots"
    can_delete = True
    column_list = [
        Spot.id,
        Spot.name,
        Spot.latitude,
        Spot.longitude,
        Spot.difficulty,
        Spot.surf_forecast_name,
    ]
    column_searchable_list = [Spot.name]
    column_sortable_list = [Spot.id, Spot.name]


class SurfboardAdmin(ModelView, model=Surfboard):
    name = "Surfboard"
    name_plural = "Surfboards"
    column_list = [
        Surfboard.id,
        Surfboard.name,
        Surfboard.brand,
        Surfboard.model,
        Surfboard.length_ft,
        Surfboard.width_in,
        Surfboard.thickness_in,
        Surfboard.volume_liters,
        Surfboard.owner_id,
    ]
    column_searchable_list = [Surfboard.name, Surfboard.brand, Surfboard.model]
    column_sortable_list = [Surfboard.id, Surfboard.length_ft]


class SurfSessionAdmin(ModelView, model=SurfSession):
    name = "Surf Session"
    name_plural = "Surf Sessions"
    column_list = [
        SurfSession.id,
        SurfSession.user_id,
        SurfSession.spot_id,
        SurfSession.datetime,
        SurfSession.duration_minutes,
        SurfSession.wave_height_m,
        SurfSession.wave_period,
        SurfSession.wind_speed_kmh,
        SurfSession.energy,
        SurfSession.rating,
        SurfSession.created_at,
    ]
    column_sortable_list = [SurfSession.datetime, SurfSession.created_at]
    column_filters = [
        filters.OperationColumnFilter(SurfSession.spot_id),
        filters.OperationColumnFilter(SurfSession.user_id),
        filters.OperationColumnFilter(SurfSession.datetime),
    ]
    form_excluded_columns = ["created_at"]


class SurfSessionReviewAdmin(ModelView, model=SurfSessionReview):
    name = "Surf Session Review"
    name_plural = "Surf Session Reviews"
    column_list = [
        SurfSessionReview.id,
        SurfSessionReview.surf_session_id,
        SurfSessionReview.spot_id,
        SurfSessionReview.user_id,
        SurfSessionReview.observed_at,
        SurfSessionReview.quality,
        SurfSessionReview.crowded_level,
        SurfSessionReview.wave_height_index,
        SurfSessionReview.short_long_index,
        SurfSessionReview.wind_index,
        SurfSessionReview.created_at,
    ]
    column_sortable_list = [SurfSessionReview.observed_at, SurfSessionReview.created_at]
    column_filters = [
        filters.OperationColumnFilter(SurfSessionReview.spot_id),
        filters.OperationColumnFilter(SurfSessionReview.user_id),
        filters.OperationColumnFilter(SurfSessionReview.observed_at),
    ]
    form_excluded_columns = ["created_at"]


class ForecastAdmin(ModelView, model=Forecast):
    name = "Forecast"
    name_plural = "Forecasts"
    column_list = [
        Forecast.id,
        Forecast.spot_id,
        Forecast.timestamp,
        Forecast.wave_height_min,
        Forecast.wave_height_max,
        Forecast.period,
        Forecast.energy,
        Forecast.wind_speed,
        Forecast.wind_direction,
        Forecast.rating,
    ]
    column_sortable_list = [Forecast.timestamp]
    column_filters = [
        filters.OperationColumnFilter(Forecast.spot_id),
        filters.OperationColumnFilter(Forecast.timestamp),
    ]


class SurfForecastAdmin(ModelView, model=SurfForecast):
    name = "Surf Forecast"
    name_plural = "Surf Forecasts"
    column_list = [
        SurfForecast.id,
        SurfForecast.spot_id,
        SurfForecast.timestamp,
        SurfForecast.wave_height,
        SurfForecast.wave_direction,
        SurfForecast.period,
        SurfForecast.energy,
        SurfForecast.wind_speed,
        SurfForecast.wind_direction,
        SurfForecast.rating,
        SurfForecast.updated_at,
    ]
    column_sortable_list = [SurfForecast.timestamp, SurfForecast.updated_at]
    column_filters = [
        filters.OperationColumnFilter(SurfForecast.spot_id),
        filters.OperationColumnFilter(SurfForecast.timestamp),
    ]
    form_excluded_columns = []


class TideAdmin(ModelView, model=Tide):
    name = "Tide"
    name_plural = "Tides"
    column_list = [
        Tide.id,
        Tide.spot_id,
        Tide.timestamp,
        Tide.height,
        Tide.tide_type,
    ]
    column_sortable_list = [Tide.timestamp]
    column_filters = [
        filters.OperationColumnFilter(Tide.spot_id),
        filters.StaticValuesFilter(
            column=Tide.tide_type,
            values=[("HIGH", "HIGH"), ("LOW", "LOW")],
        ),
        filters.OperationColumnFilter(Tide.timestamp),
    ]
