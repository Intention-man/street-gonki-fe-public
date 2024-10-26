import { Model } from './model';
import {
  CoordinatesCreateDao,
  CoordinatesGetDao,
  VehicleCreateDao,
  VehicleGetDao,
  OwnerGetDao,
} from './daos/vehicle.daos';
import { User } from './user';

export class Vehicle extends Model {
  constructor(
    public name: string,
    public coordinates: Coordinates,
    public type: VehicleType | null,
    public enginePower: number | null,
    public numberOfWheels: number,
    public capacity: number,
    public distanceTravelled: number | null,
    public fuelConsumption: number | null,
    public fuelType: FuelType | null,
    public owner: Owner,
    public canBeEditedByAdmin: boolean,
    override id: number | null,
    override creationDate: Date
  ) {
    super(id, creationDate);
  }

  override asCreateDao(): VehicleCreateDao {
    return {
      id: null,
      name: this.name,
      coordinates: this.coordinates.asCreateDao(),
      type: this.type,
      distanceTravelled: this.distanceTravelled,
      enginePower: this.enginePower,
      fuelConsumption: this.fuelConsumption,
      fuelType: this.fuelType,
      numberOfWheels: this.numberOfWheels,
      capacity: this.capacity,
      canBeEditedByAdmin: this.canBeEditedByAdmin,
    };
  }

  static createBlank(dependencies: {
    coordinates: Coordinates[];
    owner: User;
  }): Vehicle {
    return new Vehicle(
      '',
      dependencies.coordinates[0],
      null,
      null,
      4,
      1,
      null,
      null,
      FuelType.Alcohol,
      Owner.fromUser(dependencies.owner),
      false,
      null,
      new Date()
    );
  }

  static override fromGetDao(dao: VehicleGetDao): Vehicle {
    return new Vehicle(
      dao.name,
      Coordinates.fromGetDao!(dao.coordinates) as Coordinates,
      dao.type,
      dao.enginePower,
      dao.numberOfWheels,
      dao.capacity,
      dao.distanceTravelled,
      dao.fuelConsumption,
      dao.fuelType,
      Owner.fromGetDao!(dao.owner) as Owner,
      dao.canBeEditedByAdmin,
      dao.id,
      new Date(dao.creationDate)
    );
  }
}

export class Coordinates extends Model {
  constructor(public x: number, public y: number, override id: number | null) {
    super();
  }

  override asCreateDao(): CoordinatesCreateDao {
    return {
      id: this.id!,
      x: this.x,
      y: this.y,
    };
  }

  static override fromGetDao(dao: CoordinatesGetDao): Coordinates {
    return new Coordinates(dao.x, dao.y, dao.id);
  }

  override toString(): string {
    return `(${this.x.toFixed(2)}; ${this.y})`;
  }
}

export enum VehicleType {
  Plane = 'PLANE',
  Submarine = 'SUBMARINE',
  Motorcycle = 'MOTORCYCLE',
  Spaceship = 'SPACESHIP',
}

export enum FuelType {
  Gasoline = 'GASOLINE',
  Alcohol = 'ALCOHOL',
  Nuclear = 'NUCLEAR',
}

export class Owner extends Model {
  constructor(public username: string, override id: number | null) {
    super();
  }

  static override fromGetDao(dao: OwnerGetDao): Owner {
    return new Owner(dao.username, dao.id);
  }

  static fromUser(user: User, id: number | null = null): Owner {
    return new Owner(user.username, id);
  }

  override toString(): string {
    return this.username;
  }
}
