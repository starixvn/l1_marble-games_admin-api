import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { ObjectId } from 'mongodb';

export function IsMongoObjectId(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsMongoObjectId',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any, _: ValidationArguments) {
          return ObjectId.isValid(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} should be mongo object id format (24 hex character string)`;
        }
      }
    });
  };
}