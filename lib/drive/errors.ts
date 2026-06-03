export class DriveStreamError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "DriveStreamError";
    this.status = status;
    this.code = code;
  }
}
