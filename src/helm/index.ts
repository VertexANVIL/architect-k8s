import { execFile } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'os';
import * as path from 'path';
import * as util from 'util';
import { cache, compositeHash } from '@arctarus/architect/lib';
import * as yaml from 'js-yaml';

import { Resource } from '../resource';
import { KubeTarget } from '../target';

export class Helm {
  private readonly target: KubeTarget;

  constructor(target: KubeTarget) {
    this.target = target;
  };

  private buildParams(config: HelmChartOpts, params: string[]) {
    // Helm parameters
    if (config.apiVersions !== undefined) {
      params.push('--api-versions', config.apiVersions.join(','));
    }

    if (config.caFile !== undefined) {
      params.push('--ca-file', config.caFile);
    }

    if (config.certFile !== undefined) {
      params.push('--cert-file', config.certFile);
    }

    if (config.includeCRDs === true) {
      params.push('--include-crds');
    }

    if (config.insecureSkipTLSVerify === true) {
      params.push('--insecure-skip-tls-verify');
    }

    if (config.isUpgrade === true) {
      params.push('--is-upgrade');
    }

    if (config.keyFile !== undefined) {
      params.push('--key-file', config.keyFile);
    }

    if (config.keyring !== undefined) {
      params.push('--keyring', config.keyring);
    }

    if (config.kubeVersion !== undefined) {
      params.push('--kube-version', config.kubeVersion);
    }

    if (config.noHooks === true) {
      params.push('--no-hooks');
    }

    if (config.passCredentials === true) {
      params.push('--pass-credentials');
    }

    if (config.password !== undefined) {
      params.push('--password', config.password);
    }

    if (config.renderSubchartNotes === true) {
      params.push('--render-subchart-notes');
    }

    if (config.skipCrds === true) {
      params.push('--skip-crds');
    }

    if (config.skipTests === true) {
      params.push('--skip-tests');
    }

    if (config.username !== undefined) {
      params.push('--username', config.username);
    }

    if (config.namespace !== undefined) {
      params.push('--namespace', config.namespace);
    }

    params.push('--disable-openapi-validation');
    params.push('--repo', config.repo);
    params.push('--version', config.version);
  };

  private async tryFetchCache(hash: string): Promise<Resource[] | null> {
    const bytes = await cache.get('helm', hash);
    if (!bytes) return null;

    const decoder = new util.TextDecoder();
    const data = decoder.decode(bytes);
    return this.target.loader.loadString(data);
  };

  private async storeCache(hash: string, data: string) {
    const encoder = new util.TextEncoder();
    const bytes = encoder.encode(data);
    await cache.set('helm', hash, bytes);
  };

  /**
   * Renders a Helm chart from parameters
   */
  public async template(chart: string, values: any, config: HelmChartOpts): Promise<Resource[]> {
    const params: string[] = [];

    // template operation
    params.push('template');

    // release name
    if (config.releaseName !== undefined) {
      params.push(config.releaseName);
    } else {
      params.push(chart);
    }

    // chart name
    params.push(chart);
    this.buildParams(config, params);

    // consult our cache for the input values plus the params
    const hash = compositeHash([values, params]);
    const cacheResult = await this.tryFetchCache(hash);
    if (cacheResult) return cacheResult;

    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'akim-'));
    const valuesFile = path.join(dir, 'values.yaml');

    try {
      await fs.writeFile(valuesFile, yaml.dump(values));
      const execFileAsync = util.promisify(execFile);

      const buf = await execFileAsync('helm', params.concat('--values', valuesFile), { maxBuffer: undefined });
      const resources = await this.target.loader.loadString(buf.stdout);

      // cache the result from the inputs
      await this.storeCache(hash, buf.stdout);
      return resources;
    } finally {
      await fs.rm(dir, {
        force: true,
        recursive: true,
      });
    }
  };
}

export interface HelmChartOpts {
  /**
   * Kubernetes api versions used for Capabilities.APIVersions
   */
  apiVersions?: string[];

  /**
   * verify certificates of HTTPS-enabled servers using this CA bundle
   */
  caFile?: string;

  /**
   * identify HTTPS client using this SSL certificate file
   */
  certFile?: string;

  /**
   * include CRDs in the templated output
   */
  includeCRDs?: boolean;

  /**
   * skip tls certificate checks for the chart download
   */
  insecureSkipTLSVerify?: boolean;

  /**
   * set .Release.IsUpgrade instead of .Release.IsInstall
   */
  isUpgrade?: boolean;

  /**
   * identify HTTPS client using this SSL key file
   */
  keyFile?: string;

  /**
   * location of public keys used for verification
   */
  keyring?: string;

  /**
   * Kubernetes version used for Capabilities.KubeVersion
   */
  kubeVersion?: string;

  /**
   * prevent hooks from running during install
   */
  noHooks?: boolean;

  /**
   * pass credentials to all domains
   */
  passCredentials?: boolean;

  /**
   * chart repository password where to locate the requested chart
   */
  password?: string;

  /**
   * if set, render subchart notes along with the parent
   */
  renderSubchartNotes?: boolean;

  /**
   * chart repository url where to locate the requested chart
   */
  repo: string;

  /**
   * if set, no CRDs will be installed. By default, CRDs are installed if not already present
   */
  skipCrds?: boolean;

  /**
   * skip tests from templated output
   */
  skipTests?: boolean;

  /**
   * chart repository username where to locate the requested chart
   */
  username?: string;

  /**
   * specify a version constraint for the chart version to use. This constraint can be a specific tag (e.g. 1.1.1) or it may reference a valid range (e.g. ^2.0.0). If this is not specified, the latest version is used
   */
  version: string;

  /**
   * namespace scope for this request
   */
  namespace?: string;

  /**
   * release name override for the chart
   */
  releaseName?: string;
}
