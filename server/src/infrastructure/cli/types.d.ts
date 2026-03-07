/** A CLI command. args = arguments already without feature or command name. */
export interface CliCommand {
    name: string;
    description?: string;
    run: (args: string[]) => Promise<void> | void;
}
  
  /** A CLI feature (module): name + list of commands. */
export interface CliFeature {
    name: string;
    description?: string;
    commands: CliCommand[];
}


export interface CliOptions {
  userUseCases: IUserUseCases;
}