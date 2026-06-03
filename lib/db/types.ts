export interface D1Result<T> {
  success: boolean;
  result?: Array<{ results: T[] }>;
  errors?: Array<{ message: string }>;
}
