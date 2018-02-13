import "reflect-metadata";
import {
  graphql,
  introspectionQuery,
  IntrospectionSchema,
  IntrospectionObjectType,
  IntrospectionInputObjectType,
  IntrospectionField,
  GraphQLID,
  IntrospectionNamedTypeRef,
  IntrospectionNonNullTypeRef,
  GraphQLScalarType,
  GraphQLSchema,
} from "graphql";

import {
  GraphQLObjectType,
  GraphQLArgumentType,
  GraphQLInputType,
  GraphQLResolver,
  Field,
  Query,
  Mutation,
  Arg,
  Args,
  buildSchema,
  ID,
  Float,
  Int,
  GraphQLISODateScalar,
  GraphQLTimestampScalar,
} from "../../src";
import { getSchemaInfo } from "../helpers/getSchemaInfo";
import { CustomScalar, CustomType } from "../helpers/customScalar";
import { getSampleObjectFieldType } from "../helpers/getSampleObjectFieldType";
import { MetadataStorage } from "../../src/metadata/metadata-storage";

describe("Scalars", () => {
  let schemaIntrospection: IntrospectionSchema;
  let sampleObject: IntrospectionObjectType;
  let schema: GraphQLSchema;

  let argScalar: string | undefined;
  let argDate: Date | undefined;
  beforeEach(() => {
    argScalar = undefined;
    argDate = undefined;
  });

  beforeAll(async () => {
    // create sample definitions

    @GraphQLObjectType()
    class SampleObject {
      @Field(type => ID)
      idField: any;

      @Field() implicitFloatField: number;

      @Field(type => Float)
      explicitFloatField: any;

      @Field(type => Int)
      intField: any;

      @Field() implicitStringField: string;

      @Field(type => String)
      explicitStringField: any;

      @Field() implicitBooleanField: boolean;

      @Field(type => Boolean)
      explicitBooleanField: any;

      // @Field()
      // implicitDateField: Date;

      @Field(type => Date)
      explicitDateField: any;

      @Field(type => GraphQLISODateScalar)
      ISODateField: any;

      @Field(type => GraphQLTimestampScalar)
      timestampField: any;

      @Field(type => CustomScalar)
      customScalarField: any;
    }

    @GraphQLResolver(() => SampleObject)
    class SampleResolver {
      @Query()
      mainQuery(): SampleObject {
        return {} as any;
      }

      @Query(returnType => CustomScalar)
      returnScalar(): string {
        return "returnScalar";
      }

      @Query(returnType => Boolean)
      argScalar(
        @Arg("scalar", type => CustomScalar)
        scalar: any,
      ): any {
        argScalar = scalar;
        return true;
      }

      @Query(returnType => Date)
      returnDate(): any {
        return new Date();
      }

      @Query()
      argDate(
        @Arg("date", type => Date)
        date: any,
      ): boolean {
        argDate = date;
        return true;
      }
    }

    // get builded schema info from retrospection
    const schemaInfo = await getSchemaInfo({
      resolvers: [SampleResolver],
    });

    schema = schemaInfo.schema;
    schemaIntrospection = schemaInfo.schemaIntrospection;
    sampleObject = schemaIntrospection.types.find(
      field => field.name === "SampleObject",
    ) as IntrospectionObjectType;
  });

  describe("Schema", () => {
    function getFieldType(name: string) {
      const field = sampleObject.fields.find(it => it.name === name)!;
      const fieldType = (field.type as IntrospectionNonNullTypeRef)
        .ofType as IntrospectionNamedTypeRef;
      return fieldType;
    }

    it("should generate ID scalar field type", async () => {
      const idFieldType = getFieldType("idField");

      expect(idFieldType.kind).toEqual("SCALAR");
      expect(idFieldType.name).toEqual("ID");
    });

    it("should generate Float scalar field type", async () => {
      const explicitFloatFieldType = getFieldType("explicitFloatField");

      expect(explicitFloatFieldType.kind).toEqual("SCALAR");
      expect(explicitFloatFieldType.name).toEqual("Float");
    });

    it("should generate Float scalar field type when prop type is number", async () => {
      const implicitFloatFieldType = getFieldType("implicitFloatField");

      expect(implicitFloatFieldType.kind).toEqual("SCALAR");
      expect(implicitFloatFieldType.name).toEqual("Float");
    });

    it("should generate Int scalar field type", async () => {
      const intFieldType = getFieldType("intField");

      expect(intFieldType.kind).toEqual("SCALAR");
      expect(intFieldType.name).toEqual("Int");
    });

    it("should generate String scalar field type", async () => {
      const explicitStringFieldType = getFieldType("explicitStringField");

      expect(explicitStringFieldType.kind).toEqual("SCALAR");
      expect(explicitStringFieldType.name).toEqual("String");
    });

    it("should generate String scalar field type when prop type is string", async () => {
      const implicitStringFieldType = getFieldType("implicitStringField");

      expect(implicitStringFieldType.kind).toEqual("SCALAR");
      expect(implicitStringFieldType.name).toEqual("String");
    });

    it("should generate Date scalar field type", async () => {
      const explicitDateFieldType = getFieldType("explicitDateField");

      expect(explicitDateFieldType.kind).toEqual("SCALAR");
      expect(explicitDateFieldType.name).toEqual("Date");
    });

    // TODO: uncomment after ts-jest fix

    // it("should generate Date scalar field type when prop type is Date", async () => {
    //   const implicitStringFieldType = getFieldType("implicitDateField");

    //   expect(implicitStringFieldType.kind).toEqual("SCALAR");
    //   expect(implicitStringFieldType.name).toEqual("Date");
    // });

    it("should generate ISODate scalar field type", async () => {
      const ISODateFieldType = getFieldType("ISODateField");

      expect(ISODateFieldType.kind).toEqual("SCALAR");
      expect(ISODateFieldType.name).toEqual("Date");
    });

    it("should generate Timestamp scalar field type", async () => {
      const timestampFieldType = getFieldType("timestampField");

      expect(timestampFieldType.kind).toEqual("SCALAR");
      expect(timestampFieldType.name).toEqual("Timestamp");
    });

    it("should generate custom scalar field type", async () => {
      const customScalarFieldType = getFieldType("customScalarField");

      expect(customScalarFieldType.kind).toEqual("SCALAR");
      expect(customScalarFieldType.name).toEqual("Custom");
    });
  });

  describe("Custom scalar", () => {
    it("should properly serialize data", async () => {
      const query = `query {
        returnScalar
      }`;
      const result = await graphql(schema, query);
      const returnScalar = result.data!.returnScalar;

      expect(returnScalar).toEqual("TypeGraphQL serialize");
    });

    it("should properly parse args", async () => {
      const query = `query {
        argScalar(scalar: "test")
      }`;
      await graphql(schema, query);

      expect(argScalar!).toEqual("TypeGraphQL parseLiteral");
    });
  });

  describe("Bulit-in date", () => {
    it("should properly serialize date", async () => {
      const query = `query {
        returnDate
      }`;
      const beforeQuery = Date.now();
      const result = await graphql(schema, query);
      const afterQuery = Date.now();
      const returnDate = Date.parse(result.data!.returnDate);

      expect(returnDate).toBeLessThanOrEqual(afterQuery);
      expect(returnDate).toBeGreaterThanOrEqual(beforeQuery);
    });

    it("should properly parse date", async () => {
      const now = new Date();
      const query = `query {
        argDate(date: "${now.toISOString()}")
      }`;
      await graphql(schema, query);

      expect(now.getTime()).toEqual(argDate!.getTime());
    });
  });

  describe("Settings", () => {
    let sampleResolver: any;

    beforeEach(() => {
      MetadataStorage.clear();

      @GraphQLObjectType()
      class SampleObject {
        @Field(type => Date)
        dateField: any;
      }

      @GraphQLResolver(() => SampleObject)
      class SampleResolver {
        @Query()
        mainQuery(): SampleObject {
          return {} as any;
        }
      }
      sampleResolver = SampleResolver;
    });

    it("should generate iso date scalar field type by default", async () => {
      const schemaInfo = await getSchemaInfo({
        resolvers: [sampleResolver],
      });
      const dateFieldType = getSampleObjectFieldType(schemaInfo.schemaIntrospection)("dateField");

      expect(dateFieldType.kind).toEqual("SCALAR");
      expect(dateFieldType.name).toEqual("Date");
    });

    it("should generate date scalar field type when dateScalarMode is isoDate", async () => {
      const schemaInfo = await getSchemaInfo({
        resolvers: [sampleResolver],
        dateScalarMode: "isoDate",
      });
      const dateFieldType = getSampleObjectFieldType(schemaInfo.schemaIntrospection)("dateField");

      expect(dateFieldType.kind).toEqual("SCALAR");
      expect(dateFieldType.name).toEqual("Date");
    });

    it("should generate timestamp scalar field type when dateScalarMode is timestamp", async () => {
      const schemaInfo = await getSchemaInfo({
        resolvers: [sampleResolver],
        dateScalarMode: "timestamp",
      });
      const dateFieldType = getSampleObjectFieldType(schemaInfo.schemaIntrospection)("dateField");

      expect(dateFieldType.kind).toEqual("SCALAR");
      expect(dateFieldType.name).toEqual("Timestamp");
    });

    it("should generate custom scalar field type when defined in scalarMap", async () => {
      MetadataStorage.clear();

      @GraphQLObjectType()
      class SampleObject {
        @Field() customField: CustomType;
      }

      @GraphQLResolver(() => SampleObject)
      class SampleResolver {
        @Query()
        mainQuery(): SampleObject {
          return {} as any;
        }
      }

      const schemaInfo = await getSchemaInfo({
        resolvers: [SampleResolver],
        scalarsMap: [{ type: CustomType, scalar: CustomScalar }],
      });
      const dateFieldType = getSampleObjectFieldType(schemaInfo.schemaIntrospection)("customField");

      expect(dateFieldType.kind).toEqual("SCALAR");
      expect(dateFieldType.name).toEqual("Custom");
    });

    it("should generate custom scalar field type when overwriteDate in scalarMap", async () => {
      MetadataStorage.clear();

      @GraphQLObjectType()
      class SampleObject {
        @Field(type => Date)
        dateField: any;
      }

      @GraphQLResolver(() => SampleObject)
      class SampleResolver {
        @Query()
        mainQuery(): SampleObject {
          return {} as any;
        }
      }

      const schemaInfo = await getSchemaInfo({
        resolvers: [SampleResolver],
        scalarsMap: [{ type: Date, scalar: CustomScalar }],
      });
      const dateFieldType = getSampleObjectFieldType(schemaInfo.schemaIntrospection)("dateField");

      expect(dateFieldType.kind).toEqual("SCALAR");
      expect(dateFieldType.name).toEqual("Custom");
    });
  });
});
