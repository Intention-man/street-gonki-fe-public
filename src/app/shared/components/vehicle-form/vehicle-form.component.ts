import { toSignal } from '@angular/core/rxjs-interop';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  VEHICLE_SERVICE,
  vehicleServiceFactory,
} from '@dg-core/di/vehicle-service';
import { Vehicle, Owner } from '@dg-core/types/models/vehicle';
import {
  TuiButton,
  TuiDataList,
  TuiDialogContext,
  TuiError,
  TuiLabel,
  TuiLoader,
  TuiTextfield,
} from '@taiga-ui/core';
import {
  TUI_VALIDATION_ERRORS,
  TuiCheckbox,
  TuiDataListWrapper,
  TuiFieldErrorPipe,
} from '@taiga-ui/kit';
import {
  TuiInputDateModule,
  TuiInputNumberModule,
  TuiSelectModule,
} from '@taiga-ui/legacy';
import { injectContext } from '@taiga-ui/polymorpheus';
import { AuthService } from '@dg-core/services/auth.service';
import { AsyncPipe } from '@angular/common';
import { ActionWithVehicle } from '@dg-core/types/action-with-vehicle.types';

export type VehicleFormDialogContext = {
  mode: ActionWithVehicle;
  item?: Vehicle;
};

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [
    TuiTextfield,
    ReactiveFormsModule,
    TuiLabel,
    TuiInputDateModule,
    TuiSelectModule,
    TuiDataListWrapper,
    TuiDataList,
    TuiButton,
    TuiLoader,
    TuiError,
    TuiFieldErrorPipe,
    AsyncPipe,
    TuiInputNumberModule,
    TuiCheckbox,
  ],
  providers: [
    {
      provide: VEHICLE_SERVICE,
      useFactory: vehicleServiceFactory,
    },
    {
      provide: TUI_VALIDATION_ERRORS,
      useValue: {
        minlength: ({ requiredLength }: { requiredLength: string }): string =>
          `At least ${requiredLength} characters`,
        required: 'Required',
        min: 'Should be bigger than 0',
      },
    },
  ],
  templateUrl: './vehicle-form.component.html',
  styleUrl: './vehicle-form.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehicleFormComponent {
  protected readonly context =
    injectContext<TuiDialogContext<void, VehicleFormDialogContext>>();
  protected readonly fb = inject(FormBuilder);
  protected readonly VehicleService = inject(VEHICLE_SERVICE);
  protected readonly authService = inject(AuthService);

  vehicleForm?: FormGroup;

  coordinates = toSignal(this.VehicleService.getCoordinatesList$());
  isLoading = signal(true);

  get isEditable(): boolean {
    return [ActionWithVehicle.Update, ActionWithVehicle.Create].includes(
      this.context.data.mode
    );
  }

  constructor() {
    effect(
      () => {
        const dependencies = {
          coordinates: this.coordinates()!,
          owner: this.authService.currentUser!,
        };

        if (Object.values(dependencies).some((dependency) => !dependency)) {
          return;
        }

        const vehicle: Vehicle =
          this.context.data.item ?? Vehicle.createBlank(dependencies);

        this.vehicleForm = this.fb.group({
          id: [vehicle.id], // Assuming default id starts from 0
          name: [vehicle.name, [Validators.required, Validators.minLength(1)]], // Vehicle name is required
          coordinates: this.fb.group({
            existing: [vehicle.coordinates],
            x: [vehicle.coordinates.x, Validators.required], // X and Y coordinates
            y: [vehicle.coordinates.y, Validators.required],
          }),
          creationDate: [vehicle.creationDate, Validators.required], // Default to current date
          type: [vehicle.type],
          enginePower: [vehicle.enginePower, Validators.min(1)],
          numberOfWheels: [vehicle.numberOfWheels, Validators.min(1)],
          capacity: [vehicle.capacity, Validators.min(1)],
          distanceTravelled: [vehicle.distanceTravelled, Validators.min(1)],
          fuelConsumption: [vehicle.fuelConsumption, Validators.min(0.1)],
          fuelType: [vehicle.fuelType, Validators.required],
          canBeEditedByAdmin: [false],
        });

        if (this.context.data.mode === ActionWithVehicle.Read) {
          this.vehicleForm.disable();
        } else {
          this.vehicleForm.markAllAsTouched();
        }

        this.isLoading.set(false);
      },
      { allowSignalWrites: true }
    );
  }

  save(): void {
    const formValues = this.vehicleForm!.value;
    const owner = new Owner(this.authService.currentUser!.username, null);
    const vehicle: Vehicle = new Vehicle(
      formValues.name,
      formValues.coordinates.existing,
      formValues.type,
      parseInt(formValues.enginePower),
      parseInt(formValues.numberOfWheels),
      parseInt(formValues.capacity),
      parseInt(formValues.distanceTravelled),
      parseFloat(formValues.fuelConsumption),
      formValues.fuelType.existing,
      owner,
      formValues.canBeEditedByAdmin,
      null,
      new Date()
    );

    switch (this.context.data.mode) {
      case ActionWithVehicle.Create:
        this.VehicleService.createVehicle$(vehicle).subscribe({
          complete: () => this.context.completeWith(),
        });
        break;
      case ActionWithVehicle.Update:
        vehicle.id = formValues.id;
        this.VehicleService.updateVehicle$(vehicle).subscribe({
          complete: () => this.context.completeWith(),
        });
        break;
    }
  }

  cancel(): void {
    this.context.completeWith();
  }
}
