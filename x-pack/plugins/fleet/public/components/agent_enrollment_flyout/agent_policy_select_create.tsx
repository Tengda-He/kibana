/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState, useCallback, useEffect } from 'react';

import {
  AgentPolicyCreatedCallOut,
  CREATE_STATUS,
} from '../../applications/fleet/sections/agents/components';
import { AgentPolicyCreateInlineForm } from '../../applications/fleet/sections/agent_policy/components';
import type { AgentPolicy } from '../../types';
import { incrementPolicyName } from '../../services';

import { EnrollmentStepAgentPolicy } from '.';

interface Props {
  agentPolicies: AgentPolicy[];
  excludeFleetServer?: boolean;
  onAgentPolicyChange: (key?: string, policy?: AgentPolicy) => void;
  withKeySelection: boolean;
  selectedApiKeyId?: string;
  onKeyChange?: (key?: string) => void;
  isFleetServerPolicy?: boolean;
  policyId?: string;
}

export const SelectCreateAgentPolicy: React.FC<Props> = ({
  agentPolicies,
  excludeFleetServer,
  onAgentPolicyChange,
  withKeySelection,
  selectedApiKeyId,
  onKeyChange,
  isFleetServerPolicy,
  policyId,
}) => {
  const [showCreatePolicy, setShowCreatePolicy] = useState(agentPolicies.length === 0);

  const [createStatus, setCreateStatus] = useState(CREATE_STATUS.INITIAL);

  const [newName, setNewName] = useState(incrementPolicyName(agentPolicies, isFleetServerPolicy));

  const [selectedAgentPolicy, setSelectedAgentPolicy] = useState<string | undefined>(policyId);

  useEffect(() => {
    setShowCreatePolicy(agentPolicies.length === 0);
    setNewName(incrementPolicyName(agentPolicies, isFleetServerPolicy));
  }, [agentPolicies, isFleetServerPolicy]);

  const onAgentPolicyCreated = useCallback(
    async (policy: AgentPolicy | null) => {
      if (!policy) {
        setCreateStatus(CREATE_STATUS.FAILED);
        return;
      }
      setShowCreatePolicy(false);
      setCreateStatus(CREATE_STATUS.CREATED);
      if (onAgentPolicyChange) {
        onAgentPolicyChange(policy.id, policy!);
      }
      setSelectedAgentPolicy(policy.id);
    },
    [onAgentPolicyChange]
  );

  return (
    <>
      {showCreatePolicy ? (
        <AgentPolicyCreateInlineForm
          updateAgentPolicy={onAgentPolicyCreated}
          isFleetServerPolicy={isFleetServerPolicy}
          agentPolicyName={newName}
        />
      ) : (
        <EnrollmentStepAgentPolicy
          agentPolicies={agentPolicies}
          withKeySelection={withKeySelection}
          selectedApiKeyId={selectedApiKeyId}
          onKeyChange={onKeyChange}
          onAgentPolicyChange={onAgentPolicyChange}
          excludeFleetServer={excludeFleetServer}
          onClickCreatePolicy={() => setShowCreatePolicy(true)}
          selectedAgentPolicy={selectedAgentPolicy}
          isFleetServerPolicy={isFleetServerPolicy}
        />
      )}
      {createStatus !== CREATE_STATUS.INITIAL && (
        <AgentPolicyCreatedCallOut createStatus={createStatus} />
      )}
    </>
  );
};
