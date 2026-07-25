import type { CreateNavItemsUseCase } from "./use-cases/CreateNavItems";
import type { UpdateNavItemsUseCase } from "./use-cases/UpdateNavItems";
import type { DeleteNavItemsUseCase } from "./use-cases/DeleteNavItems";
import type { RestoreNavItemsUseCase } from "./use-cases/RestoreNavItems";
import type { ListNavItemsUseCase } from "./use-cases/ListNavItems";
import type { GetNavItemsByIdUseCase } from "./use-cases/GetNavItemsById";

export interface INavItemsUseCases {
   createNavItems: CreateNavItemsUseCase;
   updateNavItems: UpdateNavItemsUseCase;
   deleteNavItems: DeleteNavItemsUseCase;
   restoreNavItems: RestoreNavItemsUseCase;
   listNavItemss: ListNavItemsUseCase;
   getNavItemsById: GetNavItemsByIdUseCase;
}
