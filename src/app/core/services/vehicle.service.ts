import { inject, Injectable } from '@angular/core';
import {
  Coordinates,
  Vehicle,
  VehicleType,
} from '@dg-core/types/models/vehicle';
import {
  AbstractVehicleService,
  RemoveVehiclesWithFuelConsumptionMode,
} from '@dg-core/services/abstract-vehicle.service';
import { VehiclesGetRequest } from '@dg-core/types/request.types';
import { PaginatedResponse } from '@dg-core/types/response.types';
import { environment } from '@dg-environment';
import { map, mergeMap, Observable, toArray } from 'rxjs';
import { AuthService } from './auth.service';
import { VehicleGetDao } from '@dg-core/types/models/daos/vehicle.daos';

@Injectable({
  providedIn: 'root',
})
export class VehicleService extends AbstractVehicleService {
  protected readonly authService = inject(AuthService);

  override getVehiclesList$(
    requestParams: VehiclesGetRequest
  ): Observable<PaginatedResponse<Vehicle>> {
    const url = `${environment.apiUrl}/vehicles`;

    return this.http
      .get<VehicleGetDao[]>(url, { headers: this.authService.getAuthHeaders() })
      .pipe(
        map((daos) => {
          const data = daos.map((dao) => Vehicle.fromGetDao(dao));

          return this.processVehiclesList(data, requestParams);
        })
      );
  }

  override getCoordinatesList$(): Observable<Coordinates[]> {
    return this.getDependenciesList$('coordinates') as Observable<
      Coordinates[]
    >;
  }

  override createVehicle$(vehicle: Vehicle): Observable<void> {
    return this.http.post<void>(
      `${environment.apiUrl}/vehicles`,
      vehicle.asCreateDao(),
      {
        headers: this.authService.getAuthHeaders(),
      }
    );
  }

  override removeVehicle$(vehicle: Vehicle): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/vehicles/${vehicle.id}`,
      {
        headers: this.authService.getAuthHeaders(),
      }
    );
  }

  override updateVehicle$(updatedVehicle: Vehicle): Observable<void> {
    return this.http.patch<void>(
      `${environment.apiUrl}/vehicles/${updatedVehicle.id}`,
      updatedVehicle.asCreateDao(),
      { headers: this.authService.getAuthHeaders() }
    );
  }

  override removeVehiclesWithFuelConsumption$(
    fuelConsumption: number,
    mode: RemoveVehiclesWithFuelConsumptionMode
  ): Observable<void> {
    const url = `${environment.apiUrl}/vehicles/${
      mode === 'all'
        ? 'delete-by-fuel-consumption'
        : 'delete-one-by-fuel-consumption'
    }`;

    return this.http.delete<void>(url, {
      headers: this.authService.getAuthHeaders(),
      params: {
        fuelConsumption,
      },
    });
  }

  override getFuelConsumptionSet$(): Observable<number[]> {
    const url = `${environment.apiUrl}/vehicles/unique-fuel-consumption`;

    return this.http.get<number[]>(url, {
      headers: this.authService.getAuthHeaders(),
    });
  }

  override getVehiclesByType$(type: VehicleType | null): Observable<Vehicle[]> {
    const url = `${environment.apiUrl}/vehicles/find-by-type`;

    return this.http
      .post<VehicleGetDao[]>(
        url,
        { type },
        {
          headers: this.authService.getAuthHeaders(),
        }
      )
      .pipe(
        mergeMap((dao) => dao),
        map((dao) => Vehicle.fromGetDao(dao)),
        toArray()
      );
  }

  override addWheelsToVehicle$(id: number, wheels: number): Observable<void> {
    const url = `${environment.apiUrl}/vehicles/add-wheels/${id}`;

    return this.http.post<void>(
      url,
      {},
      {
        headers: this.authService.getAuthHeaders(),
        params: { additionalWheels: wheels },
      }
    );
  }
}
