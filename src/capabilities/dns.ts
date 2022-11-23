import 'reflect-metadata';
import { Capability } from '@akim/architect/src';

export enum DNSFlavor {
  CoreDNS = 'coredns',
};

export interface DNSCapabilitySpec {
  flavor: string | DNSFlavor;
};

@Reflect.metadata('uuid', '3d47a639-ffb6-4ed8-b580-3b4adf662181')
export class DNSCapability extends Capability<DNSCapabilitySpec> {};
