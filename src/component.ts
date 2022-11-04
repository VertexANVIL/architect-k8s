import _ from 'lodash';

import { Component } from '@akim/architect/src';
import { Resource } from './resource';
import { defaultNamespace, fixupResource } from './utils';
import { Helm, HelmChartOpts } from './helm';
import { ClusterFact, ClusterSpec } from './cluster';

export abstract class KubeComponent extends Component {
    /**
     * Returns the default namespace for all resources within this Component.
     * If not set, this will default to the "default" namespace.
     */
    public get namespace(): string {
        return "default";
    }

    public abstract build(): Promise<Resource[]>

    public postBuild(data: Resource[]) {
        // apply the default namespace to all our objects
        data = data.map(obj => {
            obj = defaultNamespace(obj, this.namespace);
            obj = fixupResource(obj);
            return obj;
        });

        return super.postBuild(data);
    }

    protected get cluster(): ClusterSpec {
        return this.target.facts.request(ClusterFact).instance;
    };

    /**
     * Wrapper for Helm.template that inserts our default namespace and configuration
     */
    protected async helmTemplate(chart: string, values: any, config: HelmChartOpts): Promise<Resource[]> {
        config = _.merge({
            namespace: this.namespace,
            kubeVersion: this.cluster.version,
            skipTests: true
        }, config);

        return await Helm.template(chart, values, config);
    };
};
