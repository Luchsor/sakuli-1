import {SakuliRunOptions} from "./sakuli-run-options.interface";
import {SakuliRunner} from "./runner";
import {SakuliPresetProvider} from "./sakuli-preset-provider.interface";
import {SakuliPresetRegistry} from "./sakuli-preset-registry.class";
import {CliArgsSource, EnvironmentSource, ifPresent, Maybe, SimpleLogger} from "@sakuli/commons";
import {Project} from "./loader";
import {SakuliExecutionContextProvider, TestExecutionContext} from "./runner/test-execution-context";
import {CommandModule} from "yargs";
import {connectForwarderToTestExecutionContext} from "./forwarder/connect-forwarder-to-test-execution-context.function";

let sakuliInstance: Maybe<SakuliClass>;

export function Sakuli(presetProvider: SakuliPresetProvider[] = []): SakuliInstance {
    sakuliInstance = ifPresent(sakuliInstance,
        i => i,
        () => new SakuliClass(presetProvider)
    );
    return sakuliInstance;
}

export class SakuliClass {

    private presetRegistry = new SakuliPresetRegistry();
    readonly logger = new SimpleLogger();
    readonly testExecutionContext = new TestExecutionContext(this.logger);

    constructor(
        readonly presetProvider: SakuliPresetProvider[] = []
    ) {
        this.presetProvider.forEach(provider => {
            provider(this.presetRegistry)
        })
    }

    get loader() {
        return this.presetRegistry.projectLoaders;
    }

    get forwarder() {
        return [
            ...this.presetRegistry.forwarders,
        ]
    }

    get lifecycleHooks() {
        return [
            new SakuliExecutionContextProvider(),
            ...this.presetRegistry.lifecycleHooks
        ];
    }

    get commandModules(): CommandModule[] {
        return this.presetRegistry.commandModules.map(cmp => cmp(this));
    }

    async run(_opts: string | SakuliRunOptions): Promise<TestExecutionContext> {
        const opts = typeof _opts === 'string' ? {path: _opts} : _opts;
        let project: Project = new Project(opts.path || process.cwd());
        await project.installPropertySource(new CliArgsSource(process.argv));
        await project.installPropertySource(new EnvironmentSource());
        for (let loader of this.loader) {
            project = (await loader.load(project)) || project;
        }
        const forwarderTearDown = await Promise.all(this.forwarder
            .map(forwarder => connectForwarderToTestExecutionContext(
                forwarder,
                this.testExecutionContext,
                project
            )));
        const runner = new SakuliRunner(
            this.lifecycleHooks,
            this.testExecutionContext
        );
        await runner.execute(project);

        await Promise.all(forwarderTearDown
            .map(teardown => teardown())
        );

        return this.testExecutionContext;
    }

}

export type SakuliInstance = SakuliClass;