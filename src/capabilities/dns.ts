import 'reflect-metadata';
import { Capability } from '@akim/architect/src';

export enum DNSFlavor {
  CoreDNS = 'coredns',
};

export interface DNSCapabilitySpec {
  flavor: string | DNSFlavor;
};

@Reflect.metadata('uuid', '97167668-f7bf-486a-bcda-f4780ea5586b')
export class DNSCapability extends Capability<DNSCapabilitySpec> {};
