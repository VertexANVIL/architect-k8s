import { JsonPatch, typescript } from 'projen';
import { addSharedOptions } from './shared';

export class ArchitectK8sTypeScriptApp extends typescript.TypeScriptAppProject {
  constructor(options: typescript.TypeScriptProjectOptions) {
    super(options);
    addSharedOptions(this, true);

    // const tsconfig = this.tryFindObjectFile('tsconfig.json');
    // tsconfig?.patch(JsonPatch.add('/ts-node', { compiler: 'ttypescript' }));
    // tsconfig?.patch(JsonPatch.add('/compilerOptions', {
    //   plugins: [{ transform: 'tst-reflect-transformer' }],
    // }));

    // we use an IIFE to invoke main asynchronously in index.ts, so ensure we ignore this
    const eslint = this.tryFindObjectFile('.eslintrc.json');
    eslint?.patch(JsonPatch.add('/rules/@typescript-eslint~1no-floating-promises/-', {
      ignoreIIFE: true,
    }));
  };
};
