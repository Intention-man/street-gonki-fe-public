import { FuelType, VehicleType } from '../vehicle';

export type VehicleCreateDao = {
  id: null;
  name: string;
  coordinates: CoordinatesCreateDao;
  type: VehicleType | null;
  enginePower: number | null;
  numberOfWheels: number | null;
  capacity: number;
  distanceTravelled: number | null;
  fuelConsumption: number | null;
  fuelType: FuelType | null;
  canBeEditedByAdmin: boolean;
};

export type VehicleGetDao = {
  id: number;
  creationDate: string;
  name: string;
  coordinates: CoordinatesGetDao;
  type: VehicleType | null;
  enginePower: number | null;
  numberOfWheels: number;
  capacity: number;
  distanceTravelled: number | null;
  fuelConsumption: number | null;
  fuelType: FuelType | null;
  owner: OwnerGetDao;
  canBeEditedByAdmin: boolean;
};

export type DependencyCreateDao = {
  id: number;
};

export type CoordinatesCreateDao = CoordinatesGetDao;

export type CoordinatesGetDao = {
  id: number;
  x: number;
  y: number;
};

export type OwnerGetDao = {
  id: number;
  username: string;
};
