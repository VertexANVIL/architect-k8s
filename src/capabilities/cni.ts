import 'reflect-metadata';
import { Capability } from '@akim/architect/src';

export enum CNIFlavor {
  Calico = 'calico',
  Canal = 'canal',
  Cilium = 'cilium',
  Flannel = 'flannel',
  Multus = 'multus',
  Weave = 'weave',
};

export interface CNICapabilitySpec {
  /**
   * Vendor of the CNI
   */
  flavor: string | CNIFlavor;
};

@Reflect.metadata('uuid', '97167668-f7bf-486a-bcda-f4780ea5586b')
export class CNICapability extends Capability<CNICapabilitySpec> {};
