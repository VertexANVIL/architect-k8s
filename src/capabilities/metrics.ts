import 'reflect-metadata';
import { Capability } from '@arctarus/architect/lib';

/**
 * Represents the Kubernetes Metrics Server
 */
@Reflect.metadata('uuid', 'ec80dd8a-c8db-45e6-9c19-7b843f6b1553')
export class MetricsCapability extends Capability<any> {};
