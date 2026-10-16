import type { Home, Profile } from "../types/api";
import { apiRequest } from "./api";

export const getProfile = (token: string, signal?: AbortSignal) =>
  apiRequest<Profile>("/v1/me", token, { signal });

export const getHome = (token: string, signal?: AbortSignal) =>
  apiRequest<Home>("/v1/home", token, { signal });
