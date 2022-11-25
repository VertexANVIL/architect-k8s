import { kustomizeToolkitFluxcdIo } from '@akim/architect-k8s-crds/src';
import { Component } from '@akim/architect/src';
import { ResolvedComponent } from '@akim/architect/src/result';
import { KubeTarget } from '../../target';

interface FluxCDSourceRef {
  apiVersion?: string | undefined;
  kind: 'GitRepository' | 'Bucket';
  name: string;
  namespace?: string | undefined;
};

export interface FluxCDMode {
  sourceRef: FluxCDSourceRef;
};

export class FluxCDController {
  private readonly target: KubeTarget;

  constructor(target: KubeTarget) {
    this.target = target;
  };

  private componentName(component: Component): string {
    return `ark-c-${component.rid}`;
  };

  public componentObject(resolved: ResolvedComponent, mode: FluxCDMode): kustomizeToolkitFluxcdIo.v1beta2.Kustomization {
    const rid = resolved.component.rid;

    return new kustomizeToolkitFluxcdIo.v1beta2.Kustomization({
      metadata: {
        name: this.componentName(resolved.component),
        namespace: 'flux-system',
      },
      spec: {
        dependsOn: resolved.dependencies.map(d => {
          return { name: this.componentName(d) };
        }),
        interval: '10m0s',
        path: `./${this.target.cluster.name}/components/${rid}`,
        prune: true,
        sourceRef: mode.sourceRef,
        wait: true,
      },
    });
  };
};
