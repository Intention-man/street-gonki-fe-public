import { PaginatedResponse } from '@dg-core/types/response.types';
import {
  Coordinates,
  Vehicle,
  VehicleType,
} from '@dg-core/types/models/vehicle';
import {
  BehaviorSubject,
  distinct,
  map,
  mergeMap,
  Observable,
  toArray,
} from 'rxjs';
import {
  PaginatedRequest,
  SortedRequest,
  Filters,
  VehiclesGetRequest,
} from '@dg-core/types/request.types';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Model } from '@dg-core/types/models/model';

export type RemoveVehiclesWithFuelConsumptionMode = 'all' | 'any';

export abstract class AbstractVehicleService {
  protected readonly http = inject(HttpClient);

  readonly refreshVehicleList$ = new BehaviorSubject(null);

  abstract getVehiclesList$(
    requestParams: VehiclesGetRequest
  ): Observable<PaginatedResponse<Vehicle>>;

  abstract getCoordinatesList$(): Observable<Coordinates[]>;

  abstract createVehicle$(vehicle: Vehicle): Observable<void>;

  abstract updateVehicle$(updatedVehicle: Vehicle): Observable<void>;

  abstract removeVehicle$(vehicle: Vehicle): Observable<void>;

  abstract removeVehiclesWithFuelConsumption$(
    fuelConsumption: number,
    mode: RemoveVehiclesWithFuelConsumptionMode
  ): Observable<void>;

  abstract getFuelConsumptionSet$(): Observable<number[]>;

  abstract getVehiclesByType$(type: VehicleType | null): Observable<Vehicle[]>;

  abstract addWheelsToVehicle$(
    id: number,
    wheelsCount: number
  ): Observable<void>;

  protected paginate<T>(data: T[], pagination: PaginatedRequest): T[] {
    const start = pagination.page * pagination.pageSize;
    const end = Math.min(
      (pagination.page + 1) * pagination.pageSize,
      data.length
    );

    return data.slice(start, end);
  }

  protected sort<T>(data: T[], sort: SortedRequest<T>): T[] {
    return data.sort((a, b) => {
      const key = sort.field as keyof T;
      return (
        (a[key]?.toString() ?? '').localeCompare(b[key]?.toString() ?? '') *
        sort.direction
      );
    });
  }

  protected filter<T>(data: T[], filters: Filters<T>): T[] {
    return data.filter((item) => {
      return Object.entries(filters).every(([_key, _value]) => {
        const key = _key as keyof T;
        const value = _value as string | undefined;
        return (
          item[key]?.toString().includes(value ?? '') ?? value === undefined
        );
      });
    });
  }

  protected getDependenciesList$(
    dependencyName: keyof Vehicle
  ): Observable<Model[]> {
    return this.getVehiclesList$({}).pipe(
      map((response) => response.data),
      mergeMap((vehicles) => vehicles),
      map((vehicles) => vehicles[dependencyName]),
      distinct((dependency) => dependency?.toString()),
      map((dependency) => dependency as Model),
      toArray()
    );
  }

  protected processVehiclesList(
    vehicles: Vehicle[],
    requestParams: VehiclesGetRequest
  ): PaginatedResponse<Vehicle> {
    let data = vehicles;
    const total = data.length;

    if (requestParams.pagination) {
      data = this.paginate(data, requestParams.pagination);
    }

    if (requestParams.sort) {
      data = this.sort(data, requestParams.sort);
    }

    if (requestParams.filters) {
      data = this.filter(data, requestParams.filters);
    }

    return {
      total,
      data,
    };
  }
}
