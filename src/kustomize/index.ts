import { execFile } from 'node:child_process';
import * as util from 'util';

import { Resource } from '../resource';
import { KubeTarget } from '../target';

export class Kustomize {
  private readonly target: KubeTarget;

  constructor(target: KubeTarget) {
    this.target = target;
  };

  private buildParams(config: KustomizeOpts, params: string[]) {
    if (config.asCurrentUser === true) {
      params.push('--as-current-user');
    };

    if (config.enableAlphaPlugins === true) {
      params.push('--enable-alpha-plugins');
    };

    if (config.enableExec === true) {
      params.push('--enable-exec');
    };

    if (config.enableStar === true) {
      params.push('--enable-star');
    };

    if (config.env !== undefined) {
      params.push(
        Object.entries(config.env)
          .map(([k, v]) => `${k}=${v}`).join(','),
      );
    };

    if (config.helmCommand !== undefined) {
      params.push('--helm-command', config.helmCommand);
    };

    if (config.loadRestrictor !== undefined) {
      params.push('--load-restrictor', config.loadRestrictor);
    };

    if (config.mount !== undefined) {
      params.push('--mount', config.mount.join(','));
    };

    if (config.network === true) {
      params.push('--network');
    };

    if (config.networkName !== undefined) {
      params.push('--network-name', config.networkName);
    };

    if (config.reorder !== undefined) {
      params.push('--reorder', config.reorder);
    };
  };

  public async build(dir: string, config: KustomizeOpts = {}): Promise<Resource[]> {
    const params: string[] = [];

    // build operation
    params.push('build');
    params.push(dir);

    this.buildParams(config, params);

    const execFileAsync = util.promisify(execFile);
    const buf = await execFileAsync('kustomize', params, { maxBuffer: undefined });
    const resources = await this.target.loader.loadString(buf.stdout);
    return resources;
  };
};

export enum KustomizeLoadRestrictions {
  None = 'LoadRestrictionsNone',
  RootOnly = 'LoadRestrictionsRootOnly',
};

export enum KustomizeReorder {
  None = 'none',
  Legacy = 'legacy',
};

export interface KustomizeOpts {
  /**
   * use the uid and gid of the command executor to run the function in the container
   */
  asCurrentUser?: boolean;

  /**
   * enable kustomize plugins
   */
  enableAlphaPlugins?: boolean;

  /**
   * enable support for exec functions (raw executables); do not use for untrusted configs! (Alpha)
   */
  enableExec?: boolean;

  /**
   * Enable use of the Helm chart inflator generator.
   */
  enableHelm?: boolean;

  /**
   * helm command (path to executable)
   * @default helm
   */
  helmCommand?: string;

  /**
   * enable support for starlark functions. (Alpha)
   */
  enableStar?: boolean;

  /**
   * a list of environment variables to be used by functions
   */
  env?: Record<string, string>;

  /**
   * if set to 'LoadRestrictionsNone', local kustomizations may load files from outside their root. This does, however, break the relocatability of the kustomization.
   * @default LoadRestrictionsRootOnly
   */
  loadRestrictor?: KustomizeLoadRestrictions;

  /**
   * a list of storage options read from the filesystem
   */
  mount?: string[];

  /**
   * enable network access for functions that declare it
   */
  network?: boolean;

  /**
   * the docker network to run the container in
   * @default bridge
   */
  networkName?: string;

  /**
   * Reorder the resources just before output. Use 'legacy' to apply a legacy reordering (Namespaces first, Webhooks last, etc). Use 'none' to suppress a final reordering.
   * @default Legacy
   */
  reorder?: KustomizeReorder;
};
