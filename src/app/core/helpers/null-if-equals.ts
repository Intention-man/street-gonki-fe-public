export function nullIfEquals<T>(value: T, willBeReplacedWithNull: T): T | null {
  return value === willBeReplacedWithNull ? null : value;
}
