import z from "zod";

export const RegionSchema = z.enum([
  "ap-southeast-1",
  "ap-northeast-1",
  "eu-central-1",
  "eu-west-3",
  "us-east-1",
  "us-west-1",
]);

export type RegionId = z.infer<typeof RegionSchema>;

export interface UserLocation {
  country: string;
  continent: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
}

export interface PartialUserLocation {
  latitude?: number | string;
  longitude?: number | string;
}

export interface RegionCoordinates {
  lat: number;
  lng: number;
}

export interface Region {
  id: string;
  name?: string;
  status: string;
}

export interface DatabaseResult {
  success: true;
  connectionString: string | null;
  claimUrl: string;
  deletionDate: string;
  region: string;
  name: string;
  projectId: string;
  userAgent?: string;
}

export interface DatabaseError {
  success: false;
  error: string;
  message: string;
  raw?: string;
  details?: unknown;
  status?: number;
}

export type CreateDatabaseResult = DatabaseResult | DatabaseError;

export function isDatabaseError(
  result: CreateDatabaseResult
): result is DatabaseError {
  return !result.success;
}

export function isDatabaseSuccess(
  result: CreateDatabaseResult
): result is DatabaseResult {
  return result.success;
}

export interface ApiResponseData {
  id?: string;
  database?: DatabaseRecord;
}

export interface DatabaseRecord {
  name?: string;
  region?: {
    id?: string;
  };
  apiKeys?: ApiKey[];
}

export interface ApiKey {
  directConnection?: ConnectionDetails;
  ppgDirectConnection?: ConnectionDetails;
}

export interface ConnectionDetails {
  user?: string;
  pass?: string;
  host?: string;
  port?: number | string;
  database?: string;
}

export interface ApiResponse {
  data?: ApiResponseData;
  databases?: DatabaseRecord[];
  id?: string;
  error?: ApiErrorInfo;
}

export interface ApiErrorInfo {
  message?: string;
  status?: number;
}

export interface GeoLocationResponse {
  country_code: string;
  continent_code: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
}

export interface RegionsApiResponse {
  data?: Region[];
}

export type RegionsResponse = Region[] | RegionsApiResponse;

export interface ProgrammaticCreateOptions {
  region?: RegionId;
  userAgent?: string;
}
