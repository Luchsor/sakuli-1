import {PropertyMap} from "../model";
import {createPropertyMapMock, DecoratedTestClass} from "../__mocks__";
import {createPropertyObjectFactory} from "./create-property-object-factory.function";

describe('createPropertyMap', () => {

    let propertyMap: PropertyMap;
    let propertyFactory: ReturnType<typeof createPropertyObjectFactory>;
    beforeEach(() => {
        propertyMap = createPropertyMapMock({
            "my.property.path": "foo",
            "property.alt": "foobar",
            "read.as.number": '3',
            'my.little.list': "a, b, c",
            'my.real.list': ['a','b', 'c']
        });
        propertyFactory = createPropertyObjectFactory(propertyMap);
    });

    it('should create an object with all decorated props set', () => {
        const properties  = propertyFactory(DecoratedTestClass);

        expect(properties).toEqual(expect.objectContaining({
            property: 'foo',
            property2: 'foobar',
            simpleProperty: '',
            neverMapped: 'default',
            readAsNumber: 3,
            myLittleList: expect.arrayContaining(['a', 'b', 'c']),
            myRealList: expect.arrayContaining(['a', 'b', 'c'])
        }))
    });

});