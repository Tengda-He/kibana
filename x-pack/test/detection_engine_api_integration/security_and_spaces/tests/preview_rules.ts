/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';

import { DETECTION_ENGINE_RULES_PREVIEW } from '../../../../plugins/security_solution/common/constants';
import { FtrProviderContext } from '../../common/ftr_provider_context';
import { deleteAllAlerts, getSimplePreviewRule, getSimpleRulePreviewOutput } from '../../utils';
import { ROLES } from '../../../../plugins/security_solution/common/test';
import { createUserAndRole, deleteUserAndRole } from '../../../common/services/security_solution';

// eslint-disable-next-line import/no-default-export
export default ({ getService }: FtrProviderContext) => {
  const esArchiver = getService('esArchiver');
  const supertest = getService('supertest');
  const supertestWithoutAuth = getService('supertestWithoutAuth');
  const log = getService('log');

  describe('create_rules', () => {
    describe('creating rules', () => {
      before(async () => {
        await esArchiver.load('x-pack/test/functional/es_archives/auditbeat/hosts');
      });

      after(async () => {
        await esArchiver.unload('x-pack/test/functional/es_archives/auditbeat/hosts');
      });

      afterEach(async () => {
        await deleteAllAlerts(supertest, log);
      });

      describe('elastic admin preview', () => {
        it('should create a single preview rule', async () => {
          const { body } = await supertest
            .post(DETECTION_ENGINE_RULES_PREVIEW)
            .set('kbn-xsrf', 'true')
            .send(getSimplePreviewRule())
            .expect(200);
          expect(body).to.eql(getSimpleRulePreviewOutput(body.previewId, body.logs));
        });

        it("shouldn't cause a 409 conflict if we attempt to create the same rule_id twice", async () => {
          await supertest
            .post(DETECTION_ENGINE_RULES_PREVIEW)
            .set('kbn-xsrf', 'true')
            .send(getSimplePreviewRule())
            .expect(200);

          await supertest
            .post(DETECTION_ENGINE_RULES_PREVIEW)
            .set('kbn-xsrf', 'true')
            .send(getSimplePreviewRule())
            .expect(200);
        });

        it('should throw an error if an invalid invocation count is used', async () => {
          const { body } = await supertest
            .post(DETECTION_ENGINE_RULES_PREVIEW)
            .set('kbn-xsrf', 'true')
            .send(getSimplePreviewRule('', 3))
            .expect(200);
          const { logs } = getSimpleRulePreviewOutput(undefined, [
            { errors: ['Invalid invocation count'], warnings: [] },
          ]);
          expect(body).to.eql({ logs });
        });
      });

      describe('t1_analyst', () => {
        const role = ROLES.t1_analyst;

        beforeEach(async () => {
          await createUserAndRole(getService, role);
        });

        afterEach(async () => {
          await deleteUserAndRole(getService, role);
        });

        it('should NOT be able to preview a rule', async () => {
          await supertestWithoutAuth
            .post(DETECTION_ENGINE_RULES_PREVIEW)
            .auth(role, 'changeme')
            .set('kbn-xsrf', 'true')
            .send(getSimplePreviewRule())
            .expect(403);
        });
      });
    });
  });
};
