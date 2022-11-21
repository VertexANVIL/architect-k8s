import 'reflect-metadata';
import { BaseFact } from '@akim/architect/src';
import _ from 'lodash';

interface ClusterClientSpec {
  context: string;
};

interface ClusterNamespaceSpec {
  /**
   * The default namespace defined for cluster infrastructure
   */
  features?: string;

  /**
   * The default namespace defined for cluster operators
   */
  operators?: string;

  /**
   * The default namespace defined for cluster services
   */
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

// TODO: potentially move the Client and Metal specs to their own Fact, for separation purposes
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
export class ClusterFact extends BaseFact<ClusterSpec> {
  constructor(instance: ClusterSpec) {
    const defaults: Partial<ClusterSpec> = {
      ns: {
        features: 'infra-system',
        operators: 'operator-system',
        services: 'services',
      },
    };

    instance = _.merge(defaults, instance);
    super(instance);
  };
};
