import { InjectionToken } from '@angular/core';
import { AbstractVehicleService } from '@dg-core/services/abstract-vehicle.service';
import { environment } from '@dg-environment';
import { VehicleService } from '@dg-core/services/vehicle.service';

export const VEHICLE_SERVICE = new InjectionToken<AbstractVehicleService>(
  'VehicleService'
);

export const vehicleServiceFactory = (): AbstractVehicleService | null => {
  return environment.mockVehicles
    ? new VehicleService() // watafak здесь происходит
    : new VehicleService();
};
