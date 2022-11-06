import { typescript } from 'projen';

const project = new typescript.TypeScriptProject({
  authorName: 'Arctarus Limited',
  authorOrganization: true,
  authorEmail: 'info@arctarus.co.uk',
  authorUrl: 'https://www.arctarus.co.uk',

  defaultReleaseBranch: 'main',
  name: '@akim/architect-k8s',
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
    'fast-safe-stringify',
    'js-yaml',
    'yaml',
    '@kosko/require',
    '@kubernetes-models/apimachinery',
    '@akim/architect@link:../architect',
    '@akim/architect-k8s-crds@link:../architect-k8s-crds',
  ],

  devDeps: [
    '@types/node',
    '@types/lodash',
    '@types/uuid',
    '@types/semver',
    '@types/js-yaml',
    '@kubernetes-models/crd-generate',
    '@kubernetes-models/openapi-generate',
  ],

  // disable tests for now
  jest: false,
});

project.synth();
