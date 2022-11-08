import 'reflect-metadata';
import { Capability } from '@akim/architect/src';

export enum IngressFlavor {
  Nginx = 'nginx',
  Istio = 'istio',
  Pomerium = 'pomerium',
};

export interface IngressCapabilitySpec {
  flavor: string | IngressFlavor;
};

@Reflect.metadata('uuid', '7d512c4f-530c-48b6-abfe-c8a575d845e6')
export class IngressCapability extends Capability<IngressCapabilitySpec> {};
