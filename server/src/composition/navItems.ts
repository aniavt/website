import type { INavItemsUseCases } from "@application/navItems/INavItemsUseCases";
import { CreateNavItemsUseCase } from "@application/navItems/use-cases/CreateNavItems";
import { UpdateNavItemsUseCase } from "@application/navItems/use-cases/UpdateNavItems";
import { DeleteNavItemsUseCase } from "@application/navItems/use-cases/DeleteNavItems";
import { RestoreNavItemsUseCase } from "@application/navItems/use-cases/RestoreNavItems";
import { ListNavItemsUseCase } from "@application/navItems/use-cases/ListNavItems";
import { GetNavItemsByIdUseCase } from "@application/navItems/use-cases/GetNavItemsById";
import { MongoDbNavItemsRepository } from "@infrastructure/NavItemsRepository/MongoDb";

import { mongoClient, idGenerator } from "./infra";
import { userRepository } from "./users";

const navItemsRepository = new MongoDbNavItemsRepository(mongoClient);

export const navItemsUseCases: INavItemsUseCases = {
    createNavItems: new CreateNavItemsUseCase(userRepository, idGenerator, navItemsRepository),
    updateNavItems: new UpdateNavItemsUseCase(userRepository, navItemsRepository),
    deleteNavItems: new DeleteNavItemsUseCase(userRepository, navItemsRepository),
    restoreNavItems: new RestoreNavItemsUseCase(userRepository, navItemsRepository),
    listNavItemss: new ListNavItemsUseCase(userRepository, navItemsRepository),
    getNavItemsById: new GetNavItemsByIdUseCase(navItemsRepository),
};
