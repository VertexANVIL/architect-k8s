import 'reflect-metadata';
import { BaseFact } from '@arctarus/architect/lib';
import _ from 'lodash';
import { SemVer } from 'semver';

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

export enum ClusterFlavor {
  DockerDesktop = 'docker-desktop',
  Kind = 'kind',
  K3s = 'k3s',
  Talos = 'talos',
};

// TODO: potentially move the Client and Metal specs to their own Fact, for separation purposes
export interface ClusterSpec {
  name: string;
  client: ClusterClientSpec;
  dns: string;
  platform?: string;
  version: SemVer;
  metal: ClusterMetalSpec;
  ns?: ClusterNamespaceSpec;

  /**
   * The pod network configuration
   */
  podNetwork: {
    ipFamilies: string[];
  };

  flavor: ClusterFlavor;
};

@Reflect.metadata('uuid', '6adbc9ab-fecc-4578-aede-1c61268bf13d')
export class ClusterFact extends BaseFact<ClusterSpec> {
  constructor(instance: Partial<ClusterSpec>) {
    const defaults: Partial<ClusterSpec> = {
      ns: {
        features: 'infra-system',
        operators: 'operator-system',
        services: 'services',
      },

      podNetwork: {
        ipFamilies: ['IPv4'],
      },
    };

    instance = _.merge(defaults, instance);
    super(instance as ClusterSpec);
  };
};
