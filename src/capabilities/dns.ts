import 'reflect-metadata';
import { Capability } from '@arctarus/architect/src';

export enum DNSFlavor {
  CoreDNS = 'coredns',
};

export interface DNSCapabilitySpec {
  flavor: string | DNSFlavor;
};

/**
 * Represents a cluster-wide DNS server, generally CoreDNS
 */
@Reflect.metadata('uuid', '3d47a639-ffb6-4ed8-b580-3b4adf662181')
export class DNSCapability extends Capability<DNSCapabilitySpec> {};
