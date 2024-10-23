import { interval, merge, switchMap } from 'rxjs';
import {
  TuiInputModule,
  TuiInputNumberModule,
  TuiTextfieldControllerModule,
} from '@taiga-ui/legacy';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  INJECTOR,
  input,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  TuiReorder,
  TuiTable,
  TuiTableFilters,
  TuiTablePagination,
} from '@taiga-ui/addon-table';
import { TuiLet, tuiTakeUntilDestroyed } from '@taiga-ui/cdk';
import {
  TuiButton,
  TuiDialogService,
  TuiDropdown,
  TuiLoader,
  TuiTextfield,
} from '@taiga-ui/core';
import { TuiAccordion, TuiChevron, TuiStatus } from '@taiga-ui/kit';
import { Vehicle } from '@dg-core/types/models/vehicle';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { AuthService } from '@dg-core/services/auth.service';
import { AccountType } from '@dg-core/types/models/user';
import {
  VEHICLE_SERVICE,
  vehicleServiceFactory,
} from '@dg-core/di/vehicle-service';
import { ActionWithVehicle } from '@dg-core/types/action-with-vehicle.types';
import {
  VehicleFormComponent,
  VehicleFormDialogContext,
} from '@dg-shared/components/vehicle-form/vehicle-form.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    TuiTableFilters,
    AsyncPipe,
    FormsModule,
    NgForOf,
    NgIf,
    ReactiveFormsModule,
    TuiButton,
    TuiChevron,
    TuiDropdown,
    TuiInputModule,
    TuiInputNumberModule,
    TuiLet,
    TuiLoader,
    TuiReorder,
    TuiTable,
    TuiTablePagination,
    TuiTextfieldControllerModule,
    TuiTextfield,
    TuiAccordion,
    TuiStatus,
    TuiButton,
  ],
  providers: [
    {
      provide: VEHICLE_SERVICE,
      useFactory: vehicleServiceFactory,
    },
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly vehicleService = inject(VEHICLE_SERVICE);
  private readonly dialogService = inject(TuiDialogService);
  private readonly injector = inject(INJECTOR);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);

  private readonly VEHICLES_LIST_REFRESH_INTERVAL_MS = 5000;

  readonly inputData = input<Vehicle[] | null>(null);

  readonly filterableColumns = [
    'id',
    'name',
    'coordinates',
    'type',
    'enginePower',
    'numberOfWheels',
    'capacity',
    'distanceTravelled',
    'fuelConsumption',
    'fuelType',
  ] as const;
  readonly filtersForm = new FormGroup<
    Partial<Record<keyof Vehicle, FormControl>>
  >(
    this.filterableColumns.reduce(
      (prev, curr) => ({
        ...prev,
        [curr]: new FormControl(''),
      }),
      {}
    )
  );
  readonly filterFn = (item: object, value: object | null): boolean =>
    !value ||
    item.toString().toLowerCase().includes(value.toString().toLowerCase());
  readonly isLoading = signal(false);
  readonly page = signal(0);
  readonly totalItems = signal(0);
  readonly data = signal<Vehicle[]>([]);
  readonly pageSize = 5;
  readonly vehicleColumns = [
    'id',
    'name',
    'coordinates',
    'creationDate',
    'type',
    'enginePower',
    'numberOfWheels',
    'capacity',
    'distanceTravelled',
    'fuelConsumption',
    'fuelType',
  ] as const;
  readonly columns = [...this.vehicleColumns, 'actions'] as const;
  readonly columnNames = {
    id: 'ID',
    name: 'Name',
    coordinates: 'Coordinates',
    creationDate: 'Creation Date',
    type: 'Type',
    enginePower: 'Engine power',
    numberOfWheels: 'Number of wheels',
    capacity: 'Capacity',
    distanceTravelled: 'Distance travelled',
    fuelConsumption: 'Fuel consumption',
    fuelType: 'Fuel type',
    actions: 'Actions',
  };
  readonly actionWithVehicle = ActionWithVehicle;

  constructor() {
    effect(
      (onCleanup) => {
        const inputData = this.inputData();
        if (inputData) {
          this.data.set(inputData);
          this.totalItems.set(inputData.length);
          return;
        }

        this.isLoading.set(true);

        const getVehicleListSubscription = merge(
          interval(this.VEHICLES_LIST_REFRESH_INTERVAL_MS),
          this.vehicleService.refreshVehicleList$
        )
          .pipe(
            switchMap(() =>
              this.vehicleService.getVehiclesList$({
                filters: {}, // TODO: implement real filters and sorting
                pagination: {
                  page: this.page(),
                  pageSize: this.pageSize,
                },
              })
            ),
            tuiTakeUntilDestroyed(this.destroyRef)
          )
          .subscribe((response) => {
            this.data.set(response.data);
            this.totalItems.set(response.total);
            this.isLoading.set(false);
          });

        onCleanup(() => {
          getVehicleListSubscription.unsubscribe();
        });
      },
      { allowSignalWrites: true }
    );
  }

  edit(item: Vehicle): void {
    this.dialogService
      .open<{ item: Vehicle; mode: ActionWithVehicle }>(
        new PolymorpheusComponent(VehicleFormComponent, this.injector),
        {
          data: {
            item,
            mode: ActionWithVehicle.Update,
          } as VehicleFormDialogContext,
          dismissible: true,
          label: 'Edit vehicle',
        }
      )
      .pipe(tuiTakeUntilDestroyed(this.destroyRef))
      .subscribe({
        complete: () => this.vehicleService.refreshVehicleList$.next(null),
      });
  }

  remove(item: Vehicle): void {
    this.vehicleService.removeVehicle$(item).subscribe({
      complete: () => this.vehicleService.refreshVehicleList$.next(null),
    });
  }

  view(item: Vehicle): void {
    this.dialogService
      .open<{ item: Vehicle; mode: ActionWithVehicle }>(
        new PolymorpheusComponent(VehicleFormComponent, this.injector),
        {
          data: {
            item,
            mode: ActionWithVehicle.Read,
          },
          dismissible: true,
          label: 'View vehicle',
        }
      )
      .pipe(tuiTakeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  checkUserCanPerformActionWithVehicle(
    action: ActionWithVehicle,
    vehicle: Vehicle
  ): boolean {
    const user = this.authService.currentUser!;
    const isOwnVehicle = vehicle.owner.username === user.username;

    switch (action) {
      case ActionWithVehicle.Update:
        return isOwnVehicle;
      case ActionWithVehicle.Delete:
        return (
          (user.accountType === AccountType.Admin &&
            vehicle.canBeEditedByAdmin) ||
          isOwnVehicle
        );
      default:
        return true;
    }
  }
}
