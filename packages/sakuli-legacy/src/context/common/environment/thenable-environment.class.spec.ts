import {createTestExecutionContextMock} from "../../sahi/__mocks__";
import {Project, TestExecutionContext} from "@sakuli/core";
import {createThenableRegionClass, ThenableRegion, Region} from "../region";
import {mockPartial} from "sneer";
import {createThenableEnvironmentClass} from "./thenable-environment.class";
import {Environment} from "./environment.interface";
import {Type} from "@sakuli/commons";

describe('ThenableEnvironment', () => {

    let projectMock: Project;
    let ctx: TestExecutionContext;
    let ThenableRegion: Type<ThenableRegion>;
    let ThenableEnvironment: ReturnType<typeof createThenableEnvironmentClass>;
    let envMock: Environment;
    let regionMock: Region;

    beforeEach(() => {
        ctx = createTestExecutionContextMock();
        projectMock = mockPartial<Project>({});
        ThenableRegion = createThenableRegionClass(ctx, projectMock);
        regionMock = mockPartial<Region>({
            find: jest.fn(() => Promise.resolve(regionMock))
        });
        ThenableEnvironment = createThenableEnvironmentClass(ctx, mockPartial<Project>({}));
        envMock = mockPartial<Environment>({
            getRegionFromFocusedWindow: jest.fn(() => Promise.resolve(regionMock))

        });
    });

    it('should invoke', async () => {
        const r = new ThenableEnvironment(Promise.resolve(envMock));
        await r
            .getRegionFromFocusedWindow()
            .find('test');

        expect(envMock.getRegionFromFocusedWindow).toHaveBeenCalled();
        expect(regionMock.find).toHaveBeenCalledWith('test');

    });


});