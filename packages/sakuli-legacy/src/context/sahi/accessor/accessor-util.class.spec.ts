import {By, ThenableWebDriver} from "selenium-webdriver";
import {createTestEnv, mockHtml, TestEnvironment} from "../__mocks__";
import {AccessorUtil} from "./accessor-util.class";
import {mockPartial} from "sneer";
import {TestExecutionContext} from "@sakuli/core";
import {RelationsResolver} from "../relations";

describe('AccessorUtil', () => {

    let env: TestEnvironment;
    beforeEach(async done => {
        env = createTestEnv();
        await env.start();
        done();
    });

    afterEach(async done => {
        await env.stop();
        done();
    });

    const testExecutionContext = mockPartial<TestExecutionContext>({});
    function createApi(driver: ThenableWebDriver) {
        return new AccessorUtil(driver, testExecutionContext, new RelationsResolver(driver, testExecutionContext))
    }

    it('should fetch fuzzy matching identifiers from element', async done => {
        const {driver, url} = await env.getEnv();
        await driver.get(`${url}/accessor/get-string-identifiers-for-element.html`);
        const api = createApi(driver);
        const element = await driver.findElement(By.id('element-to-test'));
        const identifiers = await api.getStringIdentifiersForElement(element);
        await expect(identifiers).toEqual([
            'aria', 'my-name-is-earl', 'element-to-test', 'so many names', 'Some Text content'
        ]);
        done();
    });

    it('should filter non displayed elements', async done => {
        const {driver, url} = await env.getEnv();
        await driver.get(mockHtml(`
          <div id="visibility-hidden" style="visibility: hidden">ABC</div>
          <div id="display-none" style="display: none;">ABC</div>
          <div id="normal">ABC</div>
          <div id="out-of-viewport" style="position: absolute; top: 1000px; right: 10px">ABC</div>
          <div id="no-content-not-displayed"></div>
        `));
        const api = createApi(driver);
        const divs = await api.findElements(By.css('div'));
        //expect(divs.length).toBe(2);
        await expect(Promise.all(divs.map(e => e.getAttribute('id')))).resolves.toEqual([
            'normal', 'out-of-viewport'
        ]);
        done();
    });


});