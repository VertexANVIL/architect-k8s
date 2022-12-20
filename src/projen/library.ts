import { typescript } from 'projen';
import { addSharedOptions } from './shared';

export class ArchitectK8sTypeScriptLibrary extends typescript.TypeScriptProject {
  constructor(options: typescript.TypeScriptProjectOptions) {
    super(options);
    addSharedOptions(this, false);
  };
};
