/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { mount } from 'enzyme';
import { render, waitFor, screen } from '@testing-library/react';

import { EditConnector, EditConnectorProps } from './index';
import { TestProviders } from '../../common/mock';
import { connectorsMock } from '../../containers/configure/mock';
import { basicCase, basicPush, caseUserActions } from '../../containers/mock';
import { useKibana } from '../../common/lib/kibana';

jest.mock('../../common/lib/kibana');
const useKibanaMock = useKibana as jest.Mocked<typeof useKibana>;

const onSubmit = jest.fn();
const updateCase = jest.fn();
const caseServices = {
  '123': {
    ...basicPush,
    firstPushIndex: 0,
    lastPushIndex: 0,
    commentsToUpdate: [],
    hasDataToPush: true,
  },
};
const defaultProps: EditConnectorProps = {
  caseData: basicCase,
  caseServices,
  connectorName: connectorsMock[0].name,
  connectors: connectorsMock,
  hasDataToPush: true,
  isLoading: false,
  isValidConnector: true,
  onSubmit,
  updateCase,
  userActions: caseUserActions,
  userCanCrud: true,
};

describe('EditConnector ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useKibanaMock().services.triggersActionsUi.actionTypeRegistry.get = jest.fn().mockReturnValue({
      actionTypeTitle: '.servicenow',
      iconClass: 'logoSecurity',
    });
  });

  it('Renders servicenow connector from case initially', async () => {
    const serviceNowProps = {
      ...defaultProps,
      caseData: {
        ...defaultProps.caseData,
        connector: { ...defaultProps.caseData.connector, id: 'servicenow-1' },
      },
    };

    render(
      <TestProviders>
        <EditConnector {...serviceNowProps} />
      </TestProviders>
    );

    expect(await screen.findByText('My Connector')).toBeInTheDocument();
  });

  it('Renders no connector, and then edit', async () => {
    const wrapper = mount(
      <TestProviders>
        <EditConnector {...defaultProps} />
      </TestProviders>
    );
    expect(wrapper.find(`[data-test-subj="has-data-to-push-button"]`).exists()).toBeTruthy();
    wrapper.find('[data-test-subj="connector-edit"] button').simulate('click');

    expect(
      wrapper.find(`span[data-test-subj="dropdown-connector-no-connector"]`).last().exists()
    ).toBeTruthy();

    wrapper.find('button[data-test-subj="dropdown-connectors"]').simulate('click');
    wrapper.update();
    wrapper.find('button[data-test-subj="dropdown-connector-resilient-2"]').simulate('click');
    await waitFor(() => wrapper.update());

    expect(wrapper.find(`[data-test-subj="edit-connectors-submit"]`).last().exists()).toBeTruthy();
  });

  it('Edit external service on submit', async () => {
    const wrapper = mount(
      <TestProviders>
        <EditConnector {...defaultProps} />
      </TestProviders>
    );
    wrapper.find('[data-test-subj="connector-edit"] button').simulate('click');

    wrapper.find('button[data-test-subj="dropdown-connectors"]').simulate('click');
    wrapper.update();
    wrapper.find('button[data-test-subj="dropdown-connector-resilient-2"]').simulate('click');
    wrapper.update();

    expect(wrapper.find(`[data-test-subj="edit-connectors-submit"]`).last().exists()).toBeTruthy();

    wrapper.find(`[data-test-subj="edit-connectors-submit"]`).last().simulate('click');
    await waitFor(() => expect(onSubmit.mock.calls[0][0]).toBe('resilient-2'));
  });

  it('Revert to initial external service on error', async () => {
    onSubmit.mockImplementation((connector, onSuccess, onError) => {
      onError(new Error('An error has occurred'));
    });

    const props = {
      ...defaultProps,
      caseData: {
        ...defaultProps.caseData,
        connector: { ...defaultProps.caseData.connector, id: 'servicenow-1' },
      },
    };

    const wrapper = mount(
      <TestProviders>
        <EditConnector {...props} />
      </TestProviders>
    );

    wrapper.find('[data-test-subj="connector-edit"] button').simulate('click');
    wrapper.find('button[data-test-subj="dropdown-connectors"]').simulate('click');
    await waitFor(() => {
      wrapper.update();
      wrapper.find('button[data-test-subj="dropdown-connector-resilient-2"]').simulate('click');
      wrapper.update();
      expect(
        wrapper.find(`[data-test-subj="edit-connectors-submit"]`).last().exists()
      ).toBeTruthy();
      wrapper.find(`[data-test-subj="edit-connectors-submit"]`).last().simulate('click');
    });

    await waitFor(() => {
      wrapper.update();
      expect(wrapper.find(`[data-test-subj="edit-connectors-submit"]`).exists()).toBeFalsy();
    });

    /**
     * If an error is being throw on submit the selected connector should
     * be reverted to the initial one. In our test the initial one is the .servicenow-1
     * connector. The title of the .servicenow-1 connector is My Connector.
     */
    expect(wrapper.text().includes('My Connector')).toBeTruthy();
  });

  it('Resets selector on cancel', async () => {
    const props = {
      ...defaultProps,
      caseData: {
        ...defaultProps.caseData,
        connector: { ...defaultProps.caseData.connector, id: 'servicenow-1' },
      },
    };

    const wrapper = mount(
      <TestProviders>
        <EditConnector {...props} />
      </TestProviders>
    );

    wrapper.find('[data-test-subj="connector-edit"] button').simulate('click');
    wrapper.find('button[data-test-subj="dropdown-connectors"]').simulate('click');
    wrapper.update();
    wrapper.find('button[data-test-subj="dropdown-connector-resilient-2"]').simulate('click');
    wrapper.update();
    wrapper.find(`[data-test-subj="edit-connectors-cancel"]`).last().simulate('click');

    await waitFor(() => {
      wrapper.update();
      expect(wrapper.find(`[data-test-subj="edit-connectors-submit"]`).exists()).toBeFalsy();
    });

    expect(wrapper.text().includes('My Connector')).toBeTruthy();
  });

  it('Renders loading spinner', async () => {
    const props = { ...defaultProps, isLoading: true };
    const wrapper = mount(
      <TestProviders>
        <EditConnector {...props} />
      </TestProviders>
    );
    await waitFor(() =>
      expect(wrapper.find(`[data-test-subj="connector-loading"]`).last().exists()).toBeTruthy()
    );
  });

  it('does not allow the connector to be edited when the user does not have write permissions', async () => {
    const props = { ...defaultProps, userCanCrud: false };
    const wrapper = mount(
      <TestProviders>
        <EditConnector {...props} />
      </TestProviders>
    );
    await waitFor(() =>
      expect(wrapper.find(`[data-test-subj="connector-edit"]`).exists()).toBeFalsy()
    );

    expect(wrapper.find(`[data-test-subj="has-data-to-push-button"]`).exists()).toBeFalsy();
  });

  it('displays the permissions error message when one is provided', async () => {
    const props = { ...defaultProps, permissionsError: 'error message' };
    const wrapper = mount(
      <TestProviders>
        <EditConnector {...props} />
      </TestProviders>
    );

    await waitFor(() => {
      expect(
        wrapper.find(`[data-test-subj="edit-connector-permissions-error-msg"]`).exists()
      ).toBeTruthy();

      expect(
        wrapper.find(`[data-test-subj="edit-connector-no-connectors-msg"]`).exists()
      ).toBeFalsy();

      expect(wrapper.find(`[data-test-subj="has-data-to-push-button"]`).exists()).toBeFalsy();
    });
  });

  it('displays the callout message when none is selected', async () => {
    const props = { ...defaultProps, connectors: [] };
    const wrapper = mount(
      <TestProviders>
        <EditConnector {...props} />
      </TestProviders>
    );
    wrapper.update();
    await waitFor(() => {
      expect(true).toBeTruthy();
    });
    wrapper.update();
    await waitFor(() => {
      expect(wrapper.find(`[data-test-subj="push-callouts"]`).exists()).toEqual(true);
    });
  });
});
