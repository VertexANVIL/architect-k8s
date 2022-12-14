import 'reflect-metadata';
import { Capability } from '@arctarus/architect/lib';

export enum LoadBalancerFlavor {
  MetalLB = 'metallb',
};

export interface LoadBalancerCapabilitySpec {
  flavor: string | LoadBalancerFlavor;
};

@Reflect.metadata('uuid', '0eff2358-1251-448d-89bc-e924894576be')
export class LoadBalancerCapability extends Capability<LoadBalancerCapabilitySpec> {};
