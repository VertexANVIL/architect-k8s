import 'reflect-metadata';
import { BaseFact } from '@akim/architect/src';

interface ClusterClientSpec {
  context: string;
};

interface ClusterNamespaceSpec {
  features?: string;
  operators?: string;
  services?: string;
};

// "The physical cluster configuration has changed."
// "Do you want to update the metal spec before deploying? (--auto-update-metal to bypass check)"
interface ClusterMetalSpec {
  /**
     * Number of nodes in the physical cluster
     */
  nodes?: number;
};

export interface ClusterSpec {
  name: string;
  client: ClusterClientSpec;
  dns: string;
  platform?: string;
  version: string;
  metal?: ClusterMetalSpec;
  ns?: ClusterNamespaceSpec;
};

@Reflect.metadata('uuid', '6adbc9ab-fecc-4578-aede-1c61268bf13d')
export class ClusterFact extends BaseFact<ClusterSpec> {};
