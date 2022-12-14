import { kustomizeToolkitFluxcdIo } from '@arctarus/architect-k8s-crds/lib';
import { Component } from '@arctarus/architect/lib';
import { ResolvedComponent } from '@arctarus/architect/lib/result';
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
  public readonly target: KubeTarget;

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
        path: `./components/${rid}`,
        prune: true,
        sourceRef: mode.sourceRef,
        wait: true,
      },
    });
  };
};
