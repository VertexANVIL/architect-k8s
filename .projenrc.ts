import { typescript } from 'projen';
import { NpmAccess } from 'projen/lib/javascript';

const project = new typescript.TypeScriptProject({
  authorName: 'Arctarus Limited',
  authorOrganization: true,
  authorEmail: 'info@arctarus.co.uk',
  authorUrl: 'https://www.arctarus.co.uk',

  defaultReleaseBranch: 'main',
  name: '@arctarus/architect-k8s',
  license: 'MIT',
  repository: 'https://github.com/ArctarusLimited/architect-k8s.git',

  stability: 'experimental',
  keywords: [
    'devops',
    'iac',
    'kubernetes',
    'project',
    'yaml',
  ],

  projenrcTs: true,
  releaseToNpm: true,
  npmAccess: NpmAccess.PUBLIC,

  // dependencies
  deps: [
    'commander@10.0.1',
    'kubernetes-models',
    'lodash',
    'projen',
    'uuid',
    'reflect-metadata',
    'fast-glob',
    'fast-safe-stringify',
    'js-yaml',
    'ts-node',
    'wildcard-match',
    'yargs',
    '@kubernetes-models/apimachinery',
    '@arctarus/architect@~0.0.14',
    '@arctarus/architect-k8s-crds@~0.0.0',
  ],

  devDeps: [
    '@types/node',
    '@types/lodash',
    '@types/uuid',
    '@types/semver',
    '@types/js-yaml',
    '@types/yargs',
    '@kubernetes-models/crd-generate',
    '@kubernetes-models/openapi-generate',
  ],

  peerDeps: [
    'semver@7.3.8',
    '@arctarus/architect@~0.0.14',
    '@arctarus/architect@-k8s-crds~0.0.0',
  ],

  // disable tests for now
  jest: false,
});

project.synth();
