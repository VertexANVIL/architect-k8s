# Kubernetes module for Architect

<p align="center">
  <img src="https://img.shields.io/npm/v/@arctarus/architect-k8s" />
</p>

This is an extension to the [Architect framework](https://github.com/ArctarusLimited/architect) which allows you to define, validate, and deploy Kubernetes resources in TypeScript. It can scale to hundreds of thousand of resources and allows you to manage entire fleets of clusters in a DRY fashion.

`architect-k8s` is currently in Alpha and the **API surface may change without warning** so usage in production is strongly advised against (unless you're crazy, like me).

## Features

- **GitOps support** (FluxCD implemented, ArgoCD planned)
- **Typed CRDs for in-editor and compile-time validation** - never watch your CI fail again! (Thanks to Tommy Chen ([@tommy351](https://github.com/tommy351)) for their [Kubernetes models](https://github.com/tommy351/kubernetes-models-ts) library)
- **Helm, Kustomize, and Jsonnet support**, including caching - a feature not found on other frameworks - which intelligently caches builds based on their input values, significantly reducing compile time
- **Component system** - define your cluster resources in logical units
  - Declare relationships between resources as dependencies which are respected when applying via FluxCD
  - Highly flexible lazy configuration system allows components to be highly customisable and reusable

## FAQ

- **Why TypeScript?** JavaScript/TypeScript is the home of JSON, the language that YAML extends from. It provided the best working experience as WYSIWYG.
- **Aren't there other frameworks that do the same thing?** Architect was built specifically to address significant shortfalls in other JavaScript/TypeScript-based frameworks. For example:
  - **Pulumi** is stateful; is slow, and has too much overhead
  - **CDK8s** has a lot of overhead with how it manages resources as individual constructs and no caching for build processes
  - **Tanka** is slow when building thousands of resources with differing configuration, and doesn't support granular caching
  - **Kosko** is too opinionated and offers no caching support

## Example

Require `architect-k8s` from your module, then declare an entry point:

```typescript
import path from 'path';
import { Sequencer } from '@arctarus/architect/lib';

async function main() {
  const sequencer = new Sequencer();
  await sequencer.loadFolder(path.join(__dirname, 'targets'));
  await sequencer.run(path.join(__dirname, '../build'));
};

(async () => { await main(); })();
```

Create a simple component that extends `KubeComponent`:
```typescript
import 'reflect-metadata';
import * as k8s from '@arctarus/architect-k8s/lib';
import * as api from 'kubernetes-models';

interface ExampleComponentResources {
  configMap?: api.v1.ConfigMap;
};

@Reflect.metadata('name', 'example')
@Reflect.metadata('uuid', '<your-uuid-here>')
export class ExampleComponent extends k8s.KubeComponent {
  public async build(resources: ExampleComponentResources) {
    resources.configMap = new api.v1.ConfigMap({
      metadata: { name: 'example' },
      data: {
        foo: 'bar',
      },
    });

    return super.build(resources);
  };
};
```

Declare a target in the `targets` subfolder and enable your component:

```typescript
import { KubeTarget, ClusterFlavor } from '@arctarus/architect-k8s/lib';
import { SemVer } from 'semver';
import { ExampleComponent } from './../component';

const cluster = new KubeTarget({
  name: 'dev-test1',
  version: new SemVer('v1.25.2'),
  flavor: ClusterFlavor.DockerDesktop,
});

cluster.enable(ExampleComponent);

export default cluster;
```

Invoke the entry point and you should see your resources appear in the `build` folder:

```bash
node -r ts-node/register index.ts
```
