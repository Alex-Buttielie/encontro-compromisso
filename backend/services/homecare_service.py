"""Home care and logistics service."""
from logger import get_logger
from domain.exceptions import DomainError, HomeCareError
from repositories.phase6_repository import ServiceAreaRepository
from models import haversine_distance, estimate_travel_time


class HomeCareService:
    def __init__(self, area_repo=None):
        self.area_repo = area_repo or ServiceAreaRepository()
        self.logger = get_logger(self.__class__.__name__)

    def create_service_area(self, data):
        from models import ServiceArea
        try:
            area = ServiceArea.create(
                user_id=data['userId'],
                radius_km=data.get('radiusKm'),
                base_lat=data.get('baseLat'),
                base_lng=data.get('baseLng'),
                travel_fee=data.get('travelFee', 0.0),
                fee_per_km=data.get('feePerKm', 0.0),
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.area_repo.add(area)
        return {'success': True, 'serviceArea': area.to_dict()}

    def get_service_area(self, user_id):
        area = self.area_repo.find_by_user_id(user_id)
        if not area:
            return None
        return area.to_dict()

    def check_coverage(self, user_id, lat, lng):
        """Check if a location is within the provider's service area."""
        area = self.area_repo.find_by_user_id(user_id)
        if not area:
            return {'within': False, 'reason': 'no_service_area'}
        within = area.is_within_coverage(lat, lng)
        if not within:
            dist = haversine_distance(area.base_lat, area.base_lng, lat, lng)
            return {
                'within': False,
                'distance_km': round(dist, 2),
                'radius_km': area.radius_km,
                'reason': 'outside_coverage',
            }
        travel = area.estimate_travel(lat, lng)
        return {'within': True, **travel}

    def estimate_travel(self, user_id, lat, lng):
        area = self.area_repo.find_by_user_id(user_id)
        if not area:
            return {'success': False, 'errors': ['Área de atendimento não configurada']}
        return {'success': True, **area.estimate_travel(lat, lng)}

    def check_schedule_conflict(self, user_id, appointments, new_location):
        """Check if travel time between appointments creates a conflict."""
        area = self.area_repo.find_by_user_id(user_id)
        if not area:
            return {'conflict': False}
        conflicts = []
        for i in range(len(appointments) - 1):
            curr = appointments[i]
            next_appt = appointments[i + 1]
            curr_end = curr.get('endTime')
            next_start = next_appt.get('startTime')
            if not curr_end or not next_start:
                continue
            curr_loc = curr.get('location', {})
            next_loc = next_appt.get('location', {})
            if not curr_loc or not next_loc:
                continue
            dist = haversine_distance(
                curr_loc.get('lat', area.base_lat),
                curr_loc.get('lng', area.base_lng),
                next_loc.get('lat', area.base_lat),
                next_loc.get('lng', area.base_lng),
            )
            travel_min = estimate_travel_time(dist)
            # Parse times and check gap
            from datetime import datetime
            try:
                end_dt = datetime.fromisoformat(curr_end)
                start_dt = datetime.fromisoformat(next_start)
                gap_min = (start_dt - end_dt).total_seconds() / 60
                if gap_min < travel_min:
                    conflicts.append({
                        'fromAppointment': curr.get('id'),
                        'toAppointment': next_appt.get('id'),
                        'travelTimeMin': travel_min,
                        'gapMin': int(gap_min),
                    })
            except (ValueError, TypeError):
                continue
        return {'conflict': len(conflicts) > 0, 'conflicts': conflicts}
