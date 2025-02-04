import {By, Locator, ThenableWebDriver} from "selenium-webdriver";
import {RelationApi, relationsApi} from "./relations-api.function";
import {AccessorUtil} from "../accessor";
import {RelationsResolver} from "./relations-resolver.class";
import {SahiElementQuery, SahiElementQueryOrWebElement} from "../sahi-element.interface";
import {createTestEnv, createTestExecutionContextMock, mockHtml, TestEnvironment} from "../__mocks__";
import {getTestBrowserList} from "../__mocks__/get-browser-list.function";

jest.setTimeout(15_000);
describe('relations-api', () => {
    describe.each(getTestBrowserList())('%s', (browser: "firefox" | "chrome", local: boolean) => {
        const testExecutionContext = createTestExecutionContextMock();

        let env: TestEnvironment;
        let accessorUtil: AccessorUtil;
        let driver: ThenableWebDriver;
        let api: RelationApi;

        function createQuery(locator: Locator): SahiElementQueryOrWebElement {
            return ({
                locator,
                identifier: 0,
                relations: []
            })
        }

        beforeAll(async done => {
            env = createTestEnv(browser, local);
            await env.start();
            driver = (await env.getEnv()).driver;
            accessorUtil = new AccessorUtil(driver, testExecutionContext, new RelationsResolver(driver, testExecutionContext));
            api = relationsApi(driver, accessorUtil, testExecutionContext);
            done();
        });

        afterAll(async done => {
            await env.stop();
            done();
        });

        it('should locate by js', async () => {
            const {driver} = await env.getEnv();
            await driver.get(mockHtml(`
            <div id="d1"></div>
            <div id="d2"></div>
            <div id="d3"></div> 
        `));
            const elements = await driver.findElements(By.css('div'));

            const elementsByJs = await driver.findElements(By.js(`return arguments[0]`, elements));

            return expect(elementsByJs.length).toBe(3);
        });

        function createCssQuery(locator: Locator): SahiElementQuery {
            return ({locator, identifier: new RegExp('.*'), relations: []})
        }


        describe('dom', () => {

            describe('_in', () => {
                it('should find span in div', async done => {
                    await driver.get(mockHtml(`
                <span id="outside"></span>
                <div>
                  <span id="inside"></span>
                </div>
            `));
                    const inRel = api._in(createQuery(By.css('div')));
                    const relatedQuery = await inRel(createCssQuery(By.css('span')));
                    const related = await accessorUtil.fetchElements(relatedQuery);
                    expect(related.length).toBe(1);
                    await expect(related[0].getAttribute('id')).resolves.toBe('inside');
                    done();
                });

                it('should resolve within a table', async done => {
                    await driver.get(mockHtml(`
                <table style="width:300px" class="_in">
                  <tr>
                    <td>Name</td>
                    <td>Action</td>
                    <td>ID</td>
                  </tr>
                  <tr>
                    <td id="user-one">User One</td>
                    <td id="del1"><a href="/deleteUser?id=1" onclick="return false">delete user one</a></td>
                    <td>ID 1</td>
                  </tr>
                  <tr>
                    <td id="user-two">User Two</td>
                    <td id="del2"><a href="/deleteUser?id=2" onclick="return false">delete user two</a></td>
                    <td>ID 2</td>
                  </tr>
                </table>
            `));
                    const del2 = createQuery(By.css('#del2'));
                    const links = await driver.findElements(By.css('._in a'));
                    const relation = api._in(del2);
                    const relatedLinksQuery = await relation(createCssQuery(By.css('._in a')));
                    const relatedLinks = await accessorUtil.fetchElements(relatedLinksQuery);
                    expect(links.length).toBe(2);
                    expect(relatedLinks.length).toBe(1);
                    done();
                });

            });

            describe('_near', () => {
                it('should work', async () => {
                    const html = mockHtml(`                                
                    <table class="_in">
                      <tr>
                        <td>Name</td>
                        <td>Action</td>
                        <td>ID</td>
                      </tr>
                      <tr>
                        <td id="user-one">User One</td>
                        <td id="del1"><a href="/deleteUser?id=1" onclick="return false">delete user one</a></td>
                        <td>ID 1</td>
                      </tr>
                      <tr>
                        <td id="user-two">User Two</td>
                        <td id="del2"><a href="/deleteUser?id=2" onclick="return false">delete user two</a></td>
                        <td>ID 2</td>
                      </tr>
                    </table>
                `);
                    await driver.get(html);
                    const nearUserTwo = api._near(createQuery(By.css('#user-two')));
                    const linksNearUserTwoQuery = await nearUserTwo(createCssQuery(By.css('a')));
                    const linksNearUserTwo = await accessorUtil.fetchElements(linksNearUserTwoQuery);
                    return await expect(linksNearUserTwo[0].getText()).resolves.toEqual(expect.stringContaining('user two'));
                });

            });
        });

        type RelationFunctionWithOffsetKeys =
            "_leftOf"
            | "_rightOf"
            | "_under"
            | "_above"
            | "_leftOrRightOf"
            | "_underOrAbove";
        describe('position', () => {

            beforeAll(async () => {
                await driver.get(mockHtml(`
                    <table class="_left _right" style="width:100%">
                      <thead>
                      <tr>
                        <th>Name</th>
                        <th>Position</th>
                        <th>Office</th>
                        <th>Age</th>
                        <th>Start date</th>
                        <th>Salary</th>
                      </tr>
                      </thead>
                      <tbody>
                      <tr>
                        <td>Herrod Chandler</td>
                        <td>Sales Assistant</td>
                        <td>San Francisco</td>
                        <td>59</td>
                        <td>2012/08/06</td>
                        <td>$137,500</td>
                      </tr>
                      <tr>
                        <td>Rhona Davidson</td>
                        <td>Integration Specialist</td>
                        <td id="anchor">Tokyo</td>
                        <td>55</td>
                        <td>2010/10/14</td>
                        <td>$327,900</td>
                      </tr>                    
                      <tr>
                        <td>Donna Snider</td>
                        <td>Customer Support</td>
                        <td>New York</td>
                        <td>27</td>
                        <td>2011/01/25</td>
                        <td>$112,000</td>
                      </tr>
                      <tr>
                        <td>Colleen Hurst</td>
                        <td>Javascript Developer</td>
                        <td>San Francisco</td>
                        <td>39</td>
                        <td>2009/09/15</td>
                        <td>$205,500</td>
                     </tr>
                     </tbody>
                     <tfoot>
                     <tr>
                        <th>Name</th>
                        <th>Position</th>
                        <th>Office</th>
                        <th>Age</th>
                        <th>Start date</th>
                        <th>Salary</th>
                      </tr>
                      </tfoot>
                    </table>
                `));
            });

            type PositionMethod = Exclude<keyof RelationApi, "_parentNode" | "_near" | "_in">;
            it.each(<[number, PositionMethod, number, string[]][]>[
                [3, '_leftOf', 0, ["Rhona Davidson", "Integration Specialist", "Tokyo"]],
                [2, '_leftOf', 1, ["Integration Specialist", "Tokyo"]],
                [3, '_rightOf', 0, ["55", "2010/10/14", "$327,900"]],
                [2, '_rightOf', 1, ["2010/10/14", "$327,900"]],
                [6, '_leftOrRightOf', 0, ["Rhona Davidson", "Integration Specialist", "Tokyo", "55", "2010/10/14", "$327,900"]],
                [5, '_leftOrRightOf', 1, ["Integration Specialist", "Tokyo", "55", "2010/10/14", "$327,900"]],
                [1, '_above', 0, ["San Francisco"]],
                [2, '_under', 0, ["New York", "San Francisco"]],
                [1, '_under', 1, ["San Francisco"]],
                [3, '_underOrAbove', 0, ["San Francisco", "New York", "San Francisco"]],
                [1, '_underOrAbove', 2, ["San Francisco"]],
            ])(
                'should relate %i elements which are %s the #anchor with an offset of %i and contains %j',
                async (expected: number, method: PositionMethod, offset: number, text: string[]) => {
                    const anchor = await createQuery(By.css('#anchor'));
                    const leftOfQuery = await api[method](anchor, offset)(createCssQuery(By.css('td')));
                    const leftOf = await accessorUtil.fetchElements(leftOfQuery);
                    const content = await Promise.all(leftOf.map(e => e.getText()));
                    expect(content).toEqual(text);
                    return expect(leftOf.length).toBe(expected);
                }
            );
        });
    });
});