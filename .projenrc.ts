import { typescript } from 'projen';

const project = new typescript.TypeScriptProject({
  authorName: 'Arctarus Limited',
  authorOrganization: true,
  authorEmail: 'info@arctarus.co.uk',
  authorUrl: 'https://www.arctarus.co.uk',

  defaultReleaseBranch: 'main',
  name: '@arctarus/architect-k8s',
  license: 'MIT',
  repository: 'https://github.com/ArctarusLimited/architect-k8s.git',

  projenrcTs: true,

  // dependencies
  deps: [
    'kubernetes-models',
    'lodash',
    'semver',
    'uuid',
    'reflect-metadata',
    'fast-glob',
    'fast-safe-stringify',
    'js-yaml',
    'ts-node',
    'wildcard-match',
    'yargs',
    '@kubernetes-models/apimachinery',
    '@arctarus/architect@link:../architect',
    '@arctarus/architect-k8s-crds@link:../architect-k8s-crds',
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

  // disable tests for now
  jest: false,
});

project.synth();
