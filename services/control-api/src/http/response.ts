export interface ApiErrorBody {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
}

export interface ApiDataBody<T> {
  readonly data: T;
}

export interface ApiListBody<T> {
  readonly data: readonly T[];
  readonly count: number;
}

export function data<T>(value: T): ApiDataBody<T> {
  return {
    data: value,
  };
}

export function list<T>(values: readonly T[]): ApiListBody<T> {
  return {
    data: values,
    count: values.length,
  };
}

export function fail(
  set: { status?: number | string },
  status: number,
  code: string,
  message: string,
  details?: unknown,
): ApiErrorBody {
  set.status = status;

  return {
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
  };
}
