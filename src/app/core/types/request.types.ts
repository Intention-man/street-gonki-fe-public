import { Vehicle } from './models/vehicle';

export type Filters<TEntity> = Partial<Record<keyof TEntity, string>>;

export type SortedRequest<TEntity> = {
  field: keyof TEntity;
  direction: SortDirection;
};

export type PaginatedRequest = {
  page: number;
  pageSize: number;
};

export type VehiclesGetRequest = {
  filters?: Filters<Vehicle>;
  sort?: SortedRequest<Vehicle>;
  pagination?: PaginatedRequest;
};

export enum SortDirection {
  Ascending = 1,
  Descending = -1,
}
