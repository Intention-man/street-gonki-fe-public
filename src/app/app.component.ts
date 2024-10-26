import { Component, DestroyRef, inject, INJECTOR, signal } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterModule,
} from '@angular/router';
import { KeyValuePipe, NgForOf } from '@angular/common';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TuiRepeatTimes, tuiTakeUntilDestroyed } from '@taiga-ui/cdk';
import {
  TuiAlertService,
  TuiAppearance,
  TuiButton,
  TuiDataList,
  TuiDialogContext,
  TuiDialogOptions,
  TuiDialogService,
  TuiDropdown,
  TuiIcon,
  TuiRoot,
  TuiSurface,
  TuiTextfield,
  TuiTitle,
} from '@taiga-ui/core';
import {
  TuiAvatar,
  TuiBadge,
  TuiBadgeNotification,
  TuiChevron,
  TuiDataListDropdownManager,
  TuiDataListWrapper,
  TuiFade,
  TuiSwitch,
  TuiTabs,
} from '@taiga-ui/kit';
import { TuiCardLarge, TuiHeader, TuiNavigation } from '@taiga-ui/layout';
import { appRoutes } from './app.routes';
import { VehicleFormComponent } from '@dg-shared/components/vehicle-form/vehicle-form.component';
import {
  PolymorpheusComponent,
  PolymorpheusContent,
} from '@taiga-ui/polymorpheus';
import {
  VEHICLE_SERVICE,
  vehicleServiceFactory,
} from '@dg-core/di/vehicle-service';
import { switchMap, tap } from 'rxjs';
import { Vehicle, VehicleType } from '@dg-core/types/models/vehicle';
import { HomeComponent } from './pages/home/home.component';
import { ActionWithVehicle } from '@dg-core/types/action-with-vehicle.types';
import { AuthService } from '@dg-core/services/auth.service';
import { RemoveVehiclesWithFuelConsumptionMode } from '@dg-core/services/abstract-vehicle.service';
import { nullIfEquals } from '@dg-core/helpers/null-if-equals';
import {
  TuiSelectModule,
  TuiTextfieldControllerModule,
} from '@taiga-ui/legacy';

@Component({
  standalone: true,
  imports: [
    RouterModule,
    TuiRoot,
    TuiButton,
    FormsModule,
    KeyValuePipe,
    NgForOf,
    RouterLink,
    RouterLinkActive,
    TuiAppearance,
    TuiAvatar,
    TuiBadge,
    TuiBadgeNotification,
    TuiButton,
    TuiCardLarge,
    TuiChevron,
    TuiDataList,
    TuiDataListDropdownManager,
    TuiDropdown,
    TuiFade,
    TuiHeader,
    TuiIcon,
    TuiNavigation,
    TuiRepeatTimes,
    TuiSurface,
    TuiSwitch,
    TuiTabs,
    TuiTitle,
    TuiTextfield,
    ReactiveFormsModule,
    HomeComponent,
    TuiDataList,
    TuiDataListWrapper,
    TuiSelectModule,
    TuiTextfieldControllerModule,
  ],
  providers: [
    {
      provide: VEHICLE_SERVICE,
      useFactory: vehicleServiceFactory,
    },
  ],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.less',
})
export class AppComponent {
  protected readonly dialogService = inject(TuiDialogService);
  protected readonly injector = inject(INJECTOR);
  protected readonly destroyRef = inject(DestroyRef);
  protected readonly vehicleService = inject(VEHICLE_SERVICE);
  protected readonly alertService = inject(TuiAlertService);
  protected readonly authService = inject(AuthService);
  protected readonly router = inject(Router);

  protected expanded = false;
  protected open = false;
  protected switch = false;
  protected readonly routes = appRoutes;
  protected readonly foundVehiclesByType = signal<Vehicle[]>([]);
  protected readonly removeVehicleByFuelMode =
    signal<RemoveVehiclesWithFuelConsumptionMode>('all');

  protected readonly fuelConsumptionControl = new FormControl<number>(0);
  protected readonly vehicleIdControl = new FormControl<number>(
    1,
    Validators.required
  );
  protected readonly wheelsCountControl = new FormControl<number>(
    0,
    Validators.required
  );
  protected readonly vehicleTypeControl = new FormControl<VehicleType | '-'>(
    VehicleType.Motorcycle
  );

  createNewVehicle(): void {
    this.dialogService
      .open<{ mode: ActionWithVehicle }>(
        new PolymorpheusComponent(VehicleFormComponent, this.injector),
        {
          data: {
            mode: ActionWithVehicle.Create,
          },
          dismissible: true,
          label: 'Create vehicle',
        }
      )
      .pipe(tuiTakeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.vehicleService.refreshVehicleList$.next(null), // TODO: не работает
      });
  }

  removeVehiclesWithFuelConsumption(): void {
    const mode = this.removeVehicleByFuelMode();
    const query = this.fuelConsumptionControl.value!;

    this.vehicleService
      .removeVehiclesWithFuelConsumption$(query, mode)
      .pipe(
        switchMap(() => this.alertService.open('Removed')),
        tuiTakeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  showFuelConsumptionsSet(): void {
    this.vehicleService
      .getFuelConsumptionSet$()
      .pipe(
        switchMap((set) =>
          this.dialogService.open(set.toString(), {
            label: 'Fuel consumptions set',
          })
        ),
        tuiTakeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  findVehiclesByType(
    vehiclesTable: PolymorpheusContent<TuiDialogContext>
  ): void {
    const query = nullIfEquals(this.vehicleTypeControl.value, '-');

    this.vehicleService
      .getVehiclesByType$(query as VehicleType | null)
      .pipe(
        tap((vehicles) => this.foundVehiclesByType.set(vehicles)),
        switchMap(() => this.dialogService.open(vehiclesTable)),
        tuiTakeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  openDialog(
    dialogTemplate: PolymorpheusContent<TuiDialogContext>,
    label: string,
    options?: Partial<TuiDialogOptions<Record<string, unknown>>>
  ): void {
    this.dialogService
      .open(dialogTemplate, {
        label,
        ...options,
      })
      .pipe(tuiTakeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  addWheelsToVehicleWithId() {
    const id = this.vehicleIdControl.value!;
    const wheelsCount = this.wheelsCountControl.value!;

    this.vehicleService
      .addWheelsToVehicle$(id, wheelsCount)
      .pipe(
        switchMap(() => this.alertService.open('Added')),
        tuiTakeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  logout(): void {
    this.authService
      .logout()
      .pipe(tuiTakeUntilDestroyed(this.destroyRef))
      .subscribe({ complete: void this.router.navigate(['/login']) });
  }
}
