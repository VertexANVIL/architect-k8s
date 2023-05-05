import 'reflect-metadata';
import { Capability } from '@arctarus/architect/src';

export enum LoadBalancerFlavor {
  MetalLB = 'metallb',
};

export interface LoadBalancerCapabilitySpec {
  flavor: string | LoadBalancerFlavor;
};

/**
 * Represents a cluster-wide load balancer, i.e. MetalLB
 */
@Reflect.metadata('uuid', '0eff2358-1251-448d-89bc-e924894576be')
export class LoadBalancerCapability extends Capability<LoadBalancerCapabilitySpec> {};
