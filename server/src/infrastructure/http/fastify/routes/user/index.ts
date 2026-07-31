import type { IUserUseCases } from "@application/users/IUserUseCases";
import type { RegisterRouteFn } from "../../types";
import { registerUserAuthRoutes } from "./auth";
import { registerUserPermissionRoutes } from "./permissions";
import { registerUserAdminRoutes } from "./admin";

export interface UserRoutesDependencies {
    userUseCases: IUserUseCases;
}

export const registerUserRoutes: RegisterRouteFn<UserRoutesDependencies> = (app, prefixUrl, deps) => {
    registerUserAuthRoutes(app, prefixUrl, deps);
    registerUserPermissionRoutes(app, prefixUrl, deps);
    registerUserAdminRoutes(app, prefixUrl, deps);
};
