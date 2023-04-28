import 'reflect-metadata';
import { Capability } from '@arctarus/architect/lib';

/**
 * Represents an available cluster CSI driver
 */
@Reflect.metadata('uuid', '8d9f592c-ceaa-4b57-92a9-e621ee1312ee')
export class StorageCapability extends Capability<any> {};
